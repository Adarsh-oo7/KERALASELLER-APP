import React, { useCallback, useRef, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ConfirmationResult } from 'firebase/auth';

import { AuthStackParamList } from '../../navigation/types';
import { BrandMark, Button, Card, Input, Notice, Screen } from '../../components';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../../config/legal';
import { useAuth } from '../../context/AuthContext';
import { firebaseConfig } from '../../lib/firebase';
import FirebaseRecaptchaVerifierModal from '../../lib/FirebaseRecaptchaVerifierModal';
import {
  confirmFirebasePhoneOtp,
  firebaseAuthMessage,
  sendFirebasePhoneOtp,
} from '../../lib/phoneAuth';
import { persistSellerSession, type SellerAuthResponse } from '../../lib/session';
import { markOpenSetupAfterRegister } from '../../lib/setupFlow';
import { postUser } from '../../lib/userApi';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type CheckExistsResponse = {
  exists?: boolean;
  field?: 'phone' | 'email';
  message?: string;
  error?: string;
};

export default function RegisterScreen({ navigation }: Props) {
  const { login } = useAuth();
  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    shopName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    otp: '',
  });

  const updateField = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  }, []);

  const formatPhoneNumber = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: cleaned }));
    setError('');
  }, []);

  const validateForm = (): string | null => {
    const { phone, name, shopName, email, password, confirmPassword } = formData;

    if (!phone.trim() || !name.trim() || !shopName.trim() || !email.trim() || !password.trim()) {
      return 'Please fill in all required fields';
    }
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (shopName.trim().length < 2) return 'Shop name must be at least 2 characters';

    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 10 || !phoneClean.match(/^[6-9]/)) {
      return 'Please enter a valid 10-digit phone number starting with 6-9';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (password !== confirmPassword) return 'Passwords do not match';

    return null;
  };

  const handleSendOtp = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const verifier = recaptchaRef.current;
    if (!verifier) {
      setError('Security check is not ready. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const check = await postUser<CheckExistsResponse>('check-exists/', {
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });

      if (check.data.exists) {
        setError(check.data.message || 'This phone or email is already registered. Please sign in.');
        return;
      }

      const result = await sendFirebasePhoneOtp(formData.phone, verifier);
      setConfirmation(result);
      setStep(2);
    } catch (err: unknown) {
      setError(
        axiosMessage(err) || firebaseAuthMessage(err, 'Failed to send OTP. Please try again.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!formData.otp || formData.otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP sent to your phone');
      return;
    }
    if (!confirmation) {
      setError('OTP was not sent. Go back and request a new code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const firebaseIdToken = await confirmFirebasePhoneOtp(confirmation, formData.otp);
      const phoneClean = formData.phone.replace(/\D/g, '');

      const response = await postUser<SellerAuthResponse>('register/', {
        phone: phoneClean,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        name: formData.name.trim(),
        shop_name: formData.shopName.trim(),
        email: formData.email.trim(),
        address: formData.address.trim() || undefined,
        firebase_id_token: firebaseIdToken,
      });

      const data = response.data;
      if (!data.access_token) {
        throw new Error(data && 'error' in data ? String((data as { error?: string }).error) : 'Registration failed');
      }

      await persistSellerSession(data, phoneClean);
      await markOpenSetupAfterRegister();
      await login(data.access_token);
    } catch (err: unknown) {
      setError(
        axiosMessage(err) || firebaseAuthMessage(err, 'Registration failed. Please try again.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const verifier = recaptchaRef.current;
    if (!verifier) {
      setError('Security check is not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await sendFirebasePhoneOtp(formData.phone, verifier);
      setConfirmation(result);
      Alert.alert('OTP sent', 'A new verification code was sent to your phone.');
    } catch (err: unknown) {
      setError(
        axiosMessage(err) || firebaseAuthMessage(err, 'Failed to resend OTP. Please try again.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding>
      <FirebaseRecaptchaVerifierModal ref={recaptchaRef} firebaseConfig={firebaseConfig} />
      <BrandMark compact tagline="Create your Kerala Sellers shop" />

      <View style={styles.body}>
        {error ? (
          <Notice tone="warning" title="Check these details" message={error} />
        ) : step === 1 ? (
          <Notice
            tone="info"
            title="Phone verification"
            message="We will send a Firebase OTP to +91 and the same number becomes your seller login."
          />
        ) : (
          <Notice
            tone="success"
            title={`OTP sent to +91 ${formData.phone}`}
            message="Enter the 6-digit code from SMS to create your shop."
          />
        )}

        <Card>
          {step === 1 ? (
            <>
              <Text style={styles.formTitle} maxFontSizeMultiplier={FONT_SCALE.heading}>
                Shop details
              </Text>
              <Text style={styles.formSubtitle} maxFontSizeMultiplier={FONT_SCALE.body}>
                Same Firebase phone verification as keralasellers.in
              </Text>

              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                autoCapitalize="words"
                editable={!loading}
                autoComplete="name"
              />

              <Input
                label="Shop Name"
                placeholder="Enter your shop/business name"
                value={formData.shopName}
                onChangeText={(text) => updateField('shopName', text)}
                autoCapitalize="words"
                editable={!loading}
              />

              <Input
                label="Email Address"
                placeholder="your@email.com"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                autoComplete="email"
              />

              <Input
                label="Phone Number"
                helper="10-digit mobile number for OTP verification"
                prefix="+91"
                placeholder="9876543210"
                value={formData.phone}
                onChangeText={formatPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
                autoComplete="tel"
              />

              <Input
                label="Password"
                helper="Minimum 8 characters"
                placeholder="Create a strong password"
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                secure
                autoCapitalize="none"
                editable={!loading}
              />

              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                secure
                autoCapitalize="none"
                editable={!loading}
              />

              <Input
                label="Business address (optional)"
                placeholder="Street, city, pincode"
                value={formData.address}
                onChangeText={(text) => updateField('address', text)}
                editable={!loading}
                multiline
              />

              <Text style={styles.legal} maxFontSizeMultiplier={FONT_SCALE.caption}>
                By sending OTP you agree to the{' '}
                <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
                  Terms
                </Text>
                {' '}and{' '}
                <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
                  Privacy policy
                </Text>
                .
              </Text>

              <Button
                label="Send OTP"
                onPress={handleSendOtp}
                loading={loading}
                disabled={loading}
              />
            </>
          ) : (
            <>
              <Text style={styles.formTitle} maxFontSizeMultiplier={FONT_SCALE.heading}>
                Enter OTP
              </Text>
              <Text style={styles.formSubtitle} maxFontSizeMultiplier={FONT_SCALE.body}>
                Verification SMS sent to +91 {formData.phone}
              </Text>

              <Input
                label="6-digit code"
                placeholder="123456"
                value={formData.otp}
                onChangeText={(text) => updateField('otp', text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
              />

              <Button
                label="Verify and create shop"
                onPress={handleVerifyAndRegister}
                loading={loading}
                disabled={loading}
              />

              <Button
                label="Resend OTP"
                onPress={handleResendOtp}
                variant="secondary"
                disabled={loading}
                style={styles.resend}
              />

              <TouchableOpacity
                onPress={() => {
                  setStep(1);
                  setFormData((prev) => ({ ...prev, otp: '' }));
                  setConfirmation(null);
                  setError('');
                }}
                disabled={loading}
                style={styles.linkWrap}
                accessibilityRole="button"
                accessibilityLabel="Change phone number"
              >
                <Text style={styles.loginText}>Change phone number</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            style={styles.linkWrap}
            accessibilityRole="link"
            accessibilityLabel="Sign in"
            accessibilityHint="Goes back to the seller sign-in screen"
          >
            <Text style={styles.loginText} maxFontSizeMultiplier={FONT_SCALE.body}>
              Already have an account? <Text style={styles.loginLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </Card>
      </View>
    </Screen>
  );
}

function axiosMessage(error: unknown): string {
  const response = (error as { response?: { data?: { error?: string; detail?: string; message?: string } } })
    ?.response?.data;
  return response?.error || response?.detail || response?.message || '';
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  formTitle: {
    ...TYPOGRAPHY.heading,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  formSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  resend: { marginTop: SPACING.sm },
  linkWrap: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  loginText: {
    ...TYPOGRAPHY.callout,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  legal: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  legalLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
