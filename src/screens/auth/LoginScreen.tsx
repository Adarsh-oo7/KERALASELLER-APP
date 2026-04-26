import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, SafeAreaView, ScrollView, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../App';
import { API_BASE_URL, IS_PRODUCTION } from '../../config/api';

// ─── Apple system color tokens ───────────────────────────────────────────────
const C = {
  systemBg:        '#000000',          // true black OLED bg (dark mode feel)
  surface:         '#1C1C1E',          // systemBackground dark
  surface2:        '#2C2C2E',          // secondarySystemBackground
  surface3:        '#3A3A3C',          // tertiarySystemBackground
  label:           '#FFFFFF',
  labelSecondary:  '#EBEBF599',        // secondaryLabel
  labelTertiary:   '#EBEBF54D',        // tertiaryLabel
  separator:       '#38383A',
  blue:            '#0A84FF',          // systemBlue dark
  green:           '#30D158',          // systemGreen dark
  brand:           '#2B4B39',
  brandLight:      '#4A7A5A',
  placeholder:     '#EBEBF54D',
  fill:            '#787880',
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'> & {
  onLoginSuccess: () => void;
};

export default function LoginScreen({ navigation, onLoginSuccess }: Props) {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [activeField, setActive] = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      shake();
      Alert.alert('Missing Info', 'Enter your phone number and password.');
      return;
    }
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 10 || !phoneClean.match(/^[6-9]/)) {
      shake();
      Alert.alert('Invalid Phone', 'Enter a valid 10-digit number (starts with 6–9).');
      return;
    }

    setLoading(true);
    try {
      const url = `${API_BASE_URL}/user/login/`;
      console.log('🔏 Connecting to:', url);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone: phoneClean, password: password.trim() }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* ignore */ }

      const accessToken = data.access_token || data.access;
      if (res.ok && accessToken) {
        await AsyncStorage.multiSet([
          ['accessToken',  accessToken],
          ['refreshToken', data.refresh_token || data.refresh || ''],
          ['apiToken',     data.api_token || ''],
          ['userPhone',    phoneClean],
          ['userType',     'seller'],
          ['sellerId',     String(data.seller?.id || '')],
          ['sellerName',   data.seller?.name || ''],
          ['shopName',     data.seller?.shop_name || ''],
        ]);
        onLoginSuccess();
      } else {
        throw new Error(data.error || data.detail || data.message || 'Wrong phone or password.');
      }
    } catch (e: any) {
      shake();
      let msg = e.message || 'Sign in failed.';
      if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
        msg = IS_PRODUCTION
          ? 'Cannot connect to server. Check your internet.'
          : `Cannot reach local server.\n\nCheck:\n• Django is running (python manage.py runserver)\n• Phone & PC on same WiFi\n• IP in src/config/api.ts is correct\n\nCurrent IP: ${API_BASE_URL}`;
      }
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.systemBg} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ─ Brand ─ */}
          <View style={styles.brandWrap}>
            <View style={styles.logoRound}>
              <Text style={styles.logoLetter}>K</Text>
            </View>
            <Text style={styles.brandTitle}>Kerala Sellers</Text>
            <Text style={styles.brandSub}>Seller Portal</Text>
          </View>

          {/* ─ Title ─ */}
          <Text style={styles.pageTitle}>Sign In</Text>
          <Text style={styles.pageCaption}>to your seller account</Text>

          {/* ─ Input card ─ */}
          <Animated.View style={[styles.inputCard, { transform: [{ translateX: shakeAnim }] }]}>

            {/* Phone */}
            <View style={[
              styles.inputRow,
              activeField === 'phone' && styles.inputRowActive
            ]}>
              <Text style={styles.inputIcon}>📱</Text>
              <View style={styles.inputBody}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.rowInline}>
                  <Text style={styles.dialCode}>+91</Text>
                  <TextInput
                    style={styles.textField}
                    placeholder="9876543210"
                    placeholderTextColor={C.placeholder}
                    value={phone}
                    onChangeText={t => { const c=t.replace(/\D/g,''); if(c.length<=10) setPhone(c); }}
                    keyboardType="number-pad"
                    maxLength={10}
                    returnKeyType="next"
                    onFocus={() => setActive('phone')}
                    onBlur={() => setActive(null)}
                    editable={!loading}
                    selectionColor={C.blue}
                  />
                </View>
              </View>
            </View>

            <View style={styles.hairline} />

            {/* Password */}
            <View style={[
              styles.inputRow,
              activeField === 'password' && styles.inputRowActive
            ]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <View style={styles.inputBody}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.rowInline}>
                  <TextInput
                    style={[styles.textField, styles.flex]}
                    placeholder="Enter password"
                    placeholderTextColor={C.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    onFocus={() => setActive('password')}
                    onBlur={() => setActive(null)}
                    editable={!loading}
                    selectionColor={C.blue}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass(p => !p)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.showHide}>{showPass ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </Animated.View>

          {/* ─ Sign In button ─ */}
          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaLabel}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* ─ Dev info (dev only) ─ */}
          {!IS_PRODUCTION && (
            <Text style={styles.devHint}>
              Dev mode • {API_BASE_URL}
            </Text>
          )}

          {/* ─ Register ─ */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>New seller? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
              <Text style={styles.bottomLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>
            By signing in you agree to{' '}
            <Text style={styles.legalLink}>Terms</Text> &amp;{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.systemBg },
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },

  // Brand
  brandWrap:  { alignItems: 'center', paddingTop: 56, paddingBottom: 36 },
  logoRound:  {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: C.brand,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: C.brandLight,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20,
    elevation: 12,
  },
  logoLetter: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  brandTitle: { fontSize: 20, fontWeight: '700', color: C.label, letterSpacing: -0.3 },
  brandSub:   { fontSize: 13, color: C.labelSecondary, marginTop: 2 },

  // Title
  pageTitle:   { fontSize: 34, fontWeight: '700', color: C.label, letterSpacing: 0.37 },
  pageCaption: { fontSize: 16, color: C.labelSecondary, marginTop: 4, marginBottom: 32 },

  // Input card
  inputCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.separator,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    minHeight: 64,
    backgroundColor: C.surface,
  },
  inputRowActive: {
    backgroundColor: '#232325',
  },
  inputIcon: { fontSize: 18, width: 28, textAlign: 'center', marginRight: 12 },
  inputBody: { flex: 1, paddingRight: 16, paddingVertical: 10 },
  inputLabel:{ fontSize: 11, fontWeight: '500', color: C.labelTertiary, marginBottom: 3, letterSpacing: 0.2 },
  rowInline: { flexDirection: 'row', alignItems: 'center' },
  dialCode:  { fontSize: 16, color: C.labelSecondary, fontWeight: '500', marginRight: 6 },
  textField: { fontSize: 16, color: C.label, fontWeight: '400', flex: 1, paddingVertical: 0 },
  showHide:  { fontSize: 14, color: C.blue, fontWeight: '500', marginLeft: 8 },
  hairline:  { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 56 },

  // CTA
  cta: {
    backgroundColor: C.brand,
    height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 12, marginBottom: 20,
    shadowColor: C.brandLight,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14,
    elevation: 8,
  },
  ctaDisabled: { opacity: 0.55 },
  ctaLabel:    { fontSize: 17, fontWeight: '600', color: '#fff', letterSpacing: -0.2 },

  // Dev
  devHint: {
    textAlign: 'center', fontSize: 11,
    color: C.labelTertiary, marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Footer
  bottomRow:  { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  bottomText: { fontSize: 15, color: C.labelSecondary },
  bottomLink: { fontSize: 15, color: C.blue, fontWeight: '500' },
  legal:      { fontSize: 12, color: C.labelTertiary, textAlign: 'center', lineHeight: 18 },
  legalLink:  { color: C.blue },
});
