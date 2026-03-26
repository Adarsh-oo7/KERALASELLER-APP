// src/screens/auth/LoginScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthService from '../../services/AuthService';

type Props = {
  navigation: StackNavigationProp<any>;
  onLoginSuccess?: () => void;
};

// ── Error helpers ─────────────────────────────────────────────────────────────

const getErrorMessage = (error: any): string => {
  if (error.message === 'Network Error') return 'No internet connection. Check your network.';
  switch (error.response?.status) {
    case 401: return 'Incorrect phone number or password.';
    case 404: return 'Account not found. Please register first.';
    case 429: return 'Too many attempts. Please wait and try again.';
    default:
      if (error.response?.status >= 500) return 'Server error. Please try again shortly.';
      return error.response?.data?.message ?? error.response?.data?.error ?? 'Login failed. Please try again.';
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: 'shield-checkmark-outline', text: 'Zero commission fees',           color: '#10b981' },
  { icon: 'globe-outline',            text: 'Reach customers across Kerala',  color: '#3b82f6' },
  { icon: 'phone-portrait-outline',   text: 'Easy mobile store management',   color: '#8b5cf6' },
  { icon: 'trending-up-outline',      text: 'SEO-optimized store pages',      color: '#f59e0b' },
] as const;

const LoginScreen: React.FC<Props> = ({ navigation, onLoginSuccess }) => {
  const insets = useSafeAreaInsets();

  const [phone,         setPhone]         = useState('');
  const [password,      setPassword]      = useState('');
  const [loading,       setLoading]       = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);
  const [phoneError,    setPhoneError]    = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError,     setFormError]     = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const passwordRef = useRef<TextInput>(null);

  // ── Validation ──────────────────────────────────────────────────────────

  const validatePhone = (val: string): boolean => {
    if (!val) { setPhoneError('Phone number is required'); return false; }
    if (val.length !== 10) { setPhoneError('Must be 10 digits'); return false; }
    if (!/^[6-9]/.test(val)) { setPhoneError('Must start with 6, 7, 8, or 9'); return false; }
    setPhoneError(''); return true;
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    setFormError('');
    if (cleaned.length > 0) validatePhone(cleaned);
    else setPhoneError('');
  };

  // ── Shake animation on error ────────────────────────────────────────────

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    setFormError('');
    const phoneOk = validatePhone(phone);
    if (!password) setPasswordError('Password is required');
    if (!phoneOk || !password) { shake(); return; }

    setLoading(true);
    try {
      const response = await AuthService.login(phone, password);
      onLoginSuccess?.();

      if (response.store_exists && response.store_profile_complete) {
        navigation.replace('Dashboard');
      } else {
        navigation.replace('CreateShop');
      }
    } catch (error: any) {
      setFormError(getErrorMessage(error));
      shake();
    } finally {
      setLoading(false);
    }
  };

  const phoneComplete  = phone.length === 10 && !phoneError;
  const formReady      = phoneComplete && password.length >= 1;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Brand ── */}
          <View style={s.brand}>
            <View style={s.logoWrap}>
              <View style={s.logoBg}>
                <Text style={s.logoK}>K</Text>
              </View>
              <View>
                <Text style={s.logoLine1}>KERALA</Text>
                <Text style={s.logoLine2}>SELLERS</Text>
              </View>
            </View>
            <Text style={s.tagline}>Your store, your rules.</Text>
          </View>

          {/* ── Form card ── */}
          <Animated.View style={[s.card, { transform: [{ translateX: shakeAnim }] }]}>

            <Text style={s.cardTitle}>Welcome back 👋</Text>
            <Text style={s.cardSub}>Sign in to manage your store</Text>

            {/* Global error */}
            {!!formError && (
              <View style={s.formError}>
                <Ionicons name="alert-circle" size={15} color="#991b1b" />
                <Text style={s.formErrorText}>{formError}</Text>
              </View>
            )}

            {/* Phone */}
            <View style={s.field}>
              <Text style={s.label}>Phone Number</Text>
              <View style={[s.inputRow, !!phoneError && s.inputRowError, phoneComplete && s.inputRowOk]}>
                <View style={s.prefixWrap}>
                  <Text style={s.prefix}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={s.input}
                  placeholder="98765 43210"
                  placeholderTextColor="#9ca3af"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="number-pad"
                  maxLength={10}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                {phoneComplete && (
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" style={s.fieldIcon} />
                )}
              </View>
              {!!phoneError && (
                <View style={s.fieldError}>
                  <Ionicons name="alert-circle-outline" size={12} color="#ef4444" />
                  <Text style={s.fieldErrorText}>{phoneError}</Text>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <View style={[s.inputRow, !!passwordError && s.inputRowError]}>
                <TextInput
                  ref={passwordRef}
                  style={s.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={t => { setPassword(t); setPasswordError(''); setFormError(''); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  style={s.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={19}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              {!!passwordError && (
                <View style={s.fieldError}>
                  <Ionicons name="alert-circle-outline" size={12} color="#ef4444" />
                  <Text style={s.fieldErrorText}>{passwordError}</Text>
                </View>
              )}
            </View>

            {/* Forgot */}
            <TouchableOpacity
              style={s.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
            >
              <Text style={s.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity
              style={[s.loginBtn, (!formReady || loading) && s.loginBtnDim]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <><ActivityIndicator color="white" size="small" /><Text style={s.loginBtnText}>Signing in…</Text></>
              ) : (
                <><Ionicons name="log-in-outline" size={19} color="white" /><Text style={s.loginBtnText}>Sign In</Text></>
              )}
            </TouchableOpacity>

            {/* Register */}
            <View style={s.registerRow}>
              <Text style={s.registerPrompt}>New to Kerala Sellers? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
                <Text style={s.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>

          {/* ── Benefits ── */}
          <View style={s.benefitsCard}>
            <Text style={s.benefitsTitle}>Why sellers love us</Text>
            <View style={s.benefitsGrid}>
              {BENEFITS.map(b => (
                <View key={b.text} style={s.benefitItem}>
                  <View style={[s.benefitIconWrap, { backgroundColor: b.color + '18' }]}>
                    <Ionicons name={b.icon as any} size={20} color={b.color} />
                  </View>
                  <Text style={s.benefitText}>{b.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <Text style={s.footer}>Kerala Sellers · Built for local businesses</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#f8fafc' },
  scroll:         { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  // Brand
  brand:          { alignItems: 'center', paddingTop: 44, paddingBottom: 32 },
  logoWrap:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  logoBg:         { width: 54, height: 54, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center',
                    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8 },
  logoK:          { fontSize: 30, fontWeight: '900', color: 'white' },
  logoLine1:      { fontSize: 22, fontWeight: '900', color: '#1f2937', letterSpacing: 4 },
  logoLine2:      { fontSize: 15, fontWeight: '700', color: '#3b82f6', letterSpacing: 5, marginTop: -2 },
  tagline:        { fontSize: 14, color: '#9ca3af', fontWeight: '400', letterSpacing: 0.3 },

  // Card
  card:           { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 20,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  cardTitle:      { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  cardSub:        { fontSize: 14, color: '#6b7280', marginBottom: 22 },

  // Form error banner
  formError:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12, marginBottom: 16 },
  formErrorText:  { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '500' },

  // Fields
  field:          { marginBottom: 16 },
  label:          { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 7 },
  inputRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, minHeight: 52 },
  inputRowError:  { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  inputRowOk:     { borderColor: '#10b981' },
  prefixWrap:     { marginRight: 10, paddingRight: 10, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  prefix:         { fontSize: 14, fontWeight: '600', color: '#374151' },
  input:          { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500', paddingVertical: 0 },
  fieldIcon:      { marginLeft: 6 },
  eyeBtn:         { padding: 4, marginLeft: 4 },
  fieldError:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  fieldErrorText: { fontSize: 12, color: '#ef4444' },

  // Forgot
  forgotBtn:      { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText:     { fontSize: 13, color: '#3b82f6', fontWeight: '600' },

  // Login button
  loginBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 14, marginBottom: 18,
                    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  loginBtnDim:    { backgroundColor: '#93c5fd', shadowOpacity: 0, elevation: 0 },
  loginBtnText:   { fontSize: 16, fontWeight: '700', color: 'white' },

  // Register
  registerRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerPrompt: { fontSize: 14, color: '#6b7280' },
  registerLink:   { fontSize: 14, color: '#3b82f6', fontWeight: '700' },

  // Benefits
  benefitsCard:   { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 20,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  benefitsTitle:  { fontSize: 14, fontWeight: '700', color: '#6b7280', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  benefitsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  benefitItem:    { width: '46%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12 },
  benefitIconWrap:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  benefitText:    { flex: 1, fontSize: 12, color: '#374151', fontWeight: '500', lineHeight: 16 },

  // Footer
  footer:         { textAlign: 'center', fontSize: 12, color: '#d1d5db', marginBottom: 8 },
});

export default LoginScreen;
