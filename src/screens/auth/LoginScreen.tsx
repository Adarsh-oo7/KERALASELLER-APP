import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthStackParamList } from '../../navigation/types';
import { BrandMark, Button, Card, Input, Screen } from '../../components';
import { APP_DISPLAY_NAME, PRIVACY_POLICY_URL, TERMS_URL } from '../../config/legal';
import { useAuth } from '../../context/AuthContext';
import { persistSellerSession, type SellerAuthResponse } from '../../lib/session';
import { postUser } from '../../lib/userApi';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter both phone number and password');
      return;
    }

    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 10 || !phoneClean.match(/^[6-9]/)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number starting with 6-9');
      return;
    }

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
      const response = (error as { response?: { data?: { error?: string; detail?: string } }; message?: string })
        ?.response?.data;
      const errorMessage =
        response?.error ||
        response?.detail ||
        ((error as { message?: string })?.message?.includes('Network')
          ? 'Sign in needs the internet. After login, walk-in billing still works offline for 3 days.'
          : 'Login failed. Please try again.');

      Alert.alert('Login Error', errorMessage);
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
            helper="10-digit mobile number starting with 6–9"
            prefix="+91"
            placeholder="9876543210"
            value={phone}
            onChangeText={formatPhoneNumber}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
            autoComplete="tel"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
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
