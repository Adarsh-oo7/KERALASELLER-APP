import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../navigation/types';
import { BrandMark, Button, Card, Input, Screen } from '../../components';
import { APP_DISPLAY_NAME, PRIVACY_POLICY_URL, TERMS_URL } from '../../config/legal';
import { useAuth } from '../../context/AuthContext';
import { persistSellerSession, type SellerAuthResponse } from '../../lib/session';
import { postUser } from '../../lib/userApi';
import { fieldErrorsFromApi, loginFailureMessage } from '../../lib/format';
import { isNetworkError } from '../../lib/offlineWindow';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string }>({});

  const handleLogin = async () => {
    const nextErrors: { phone?: string; password?: string } = {};
    if (!phone.trim()) nextErrors.phone = 'Enter your 10-digit seller phone.';
    if (!password.trim()) nextErrors.password = 'Enter your password.';
    const phoneClean = phone.replace(/\D/g, '');
    if (phone.trim() && (phoneClean.length !== 10 || !phoneClean.match(/^[6-9]/))) {
      nextErrors.phone = 'Use a valid 10-digit Indian mobile starting with 6–9.';
    }
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});

    setLoading(true);

    try {
      const response = await postUser<SellerAuthResponse>('login/', {
        phone: phoneClean,
        password: password.trim(),
      });

      const data = response.data;

      if (data.access_token) {
        await persistSellerSession(data, phoneClean);
        await login(data.access_token);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: unknown) {
      const fields = fieldErrorsFromApi(error);
      if (fields.phone || fields.password) {
        setFieldErrors({
          phone: fields.phone || fields.phone_number,
          password: fields.password,
        });
      }
      Alert.alert(
        'Could not sign in',
        loginFailureMessage(
          error,
          isNetworkError(error)
            ? 'Sign in needs the internet. Check your connection and try again.'
            : 'Check the phone number and password, then try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) setPhone(cleaned);
  };

  return (
    <Screen scroll keyboardAvoiding>
      <BrandMark tagline={`${APP_DISPLAY_NAME} seller dashboard`} />

      <View style={styles.body}>
        <Card>
          <Text style={styles.formTitle} maxFontSizeMultiplier={FONT_SCALE.heading}>
            Sign in
          </Text>
          <Text style={styles.formSubtitle} maxFontSizeMultiplier={FONT_SCALE.body}>
            Use your seller phone and password
          </Text>

          <Input
            label="Phone Number"
            error={fieldErrors.phone}
            prefix="+91"
            placeholder="9876543210"
            value={phone}
            onChangeText={(text) => { formatPhoneNumber(text); setFieldErrors((prev) => ({ ...prev, phone: undefined })); }}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
            autoComplete="tel"
          />

          <Input
            label="Password"
            helper="At least 8 characters. Mix letters and numbers. Avoid common passwords."
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => { setPassword(text); setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
            error={fieldErrors.password}
            secure
            autoCapitalize="none"
            editable={!loading}
            autoComplete="password"
          />

          <Button
            label="Sign in"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />

          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.keralasellers.in/forgot-password/seller')}
            disabled={loading}
            style={styles.linkWrap}
            accessibilityRole="link"
            accessibilityLabel="Forgot password"
          >
            <Text style={styles.signUpText} maxFontSizeMultiplier={FONT_SCALE.body}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
            style={styles.linkWrap}
            accessibilityRole="link"
            accessibilityLabel="Register your shop"
            accessibilityHint="Opens the seller registration screen"
          >
            <Text style={styles.signUpText} maxFontSizeMultiplier={FONT_SCALE.body}>
              New seller? <Text style={styles.signUpLink}>Register your shop</Text>
            </Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerWebsite} maxFontSizeMultiplier={FONT_SCALE.caption}>
            keralasellers.in
          </Text>
          <Text
            style={styles.footerLink}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            accessibilityRole="link"
            maxFontSizeMultiplier={FONT_SCALE.caption}
          >
            Privacy policy
          </Text>
          <Text
            style={styles.footerLink}
            onPress={() => Linking.openURL(TERMS_URL)}
            accessibilityRole="link"
            maxFontSizeMultiplier={FONT_SCALE.caption}
          >
            Terms and conditions
          </Text>
          <Text style={styles.footerTagline} maxFontSizeMultiplier={FONT_SCALE.caption}>
            After login, local billing works offline for 3 days
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: SPACING.lg,
    flex: 1,
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
  linkWrap: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  signUpText: {
    ...TYPOGRAPHY.callout,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  signUpLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
  },
  footerWebsite: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
  },
  footerLink: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  footerTagline: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});
