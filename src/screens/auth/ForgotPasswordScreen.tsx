// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import apiClient from '../../services/ApiClient';

type Props = { navigation: StackNavigationProp<any> };

// ── Password strength (reused from RegisterScreen) ────────────────────────────

const getStrength = (pw: string) => {
  if (!pw)         return { label: '',       color: '#e5e7eb', width: '0%'   };
  if (pw.length < 6)                              return { label: 'Weak',   color: '#ef4444', width: '25%'  };
  if (pw.length < 8)                              return { label: 'Fair',   color: '#f59e0b', width: '50%'  };
  if (/[A-Z]/.test(pw) && /\d/.test(pw))          return { label: 'Strong', color: '#10b981', width: '100%' };
  return { label: 'Good', color: '#3b82f6', width: '75%' };
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [step,            setStep]            = useState<1 | 2 | 3>(1);
  const [loading,         setLoading]         = useState(false);
  const [phone,           setPhone]           = useState('');
  const [otp,             setOtp]             = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw,          setShowPw]          = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [formError,       setFormError]       = useState('');
  const [phoneError,      setPhoneError]      = useState('');
  const [resendCooldown,  setResendCooldown]  = useState(0);

  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const otpRef      = useRef<TextInput>(null);
  const pwRef       = useRef<TextInput>(null);
  const confirmRef  = useRef<TextInput>(null);

  const pwStrength = getStrength(newPassword);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const startCooldown = (secs = 60) => {
    setResendCooldown(secs);
    const id = setInterval(() => {
      setResendCooldown(v => { if (v <= 1) { clearInterval(id); return 0; } return v - 1; });
    }, 1000);
  };

  const validatePhone = () => {
    if (!phone)              { setPhoneError('Phone number is required'); return false; }
    if (phone.length !== 10) { setPhoneError('Must be 10 digits'); return false; }
    if (!/^[6-9]/.test(phone)) { setPhoneError('Must start with 6, 7, 8 or 9'); return false; }
    setPhoneError(''); return true;
  };

  // ── Step 1 — send OTP ────────────────────────────────────────────────────

  const sendOtp = async () => {
    setFormError('');
    if (!validatePhone()) { shake(); return; }

    setLoading(true);
    try {
      await apiClient.post('/user/seller/password-reset/send-otp/', { phone });
      setStep(2);
      startCooldown(60);
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? 'Failed to send OTP. Please try again.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    setFormError('');
    setLoading(true);
    try {
      await apiClient.post('/user/seller/password-reset/send-otp/', { phone });
      startCooldown(60);
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? 'Failed to resend OTP.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 — verify OTP + reset ──────────────────────────────────────────

  const resetPassword = async () => {
    setFormError('');

    if (!otp || otp.length !== 6)            { setFormError('Enter the 6-digit OTP'); shake(); return; }
    if (!newPassword || newPassword.length < 8) { setFormError('Password must be at least 8 characters'); shake(); return; }
    if (newPassword !== confirmPassword)      { setFormError('Passwords do not match'); shake(); return; }

    setLoading(true);
    try {
      await apiClient.post('/user/seller/password-reset/verify/', {
        phone,
        otp,
        new_password:     newPassword,
        confirm_password: confirmPassword,
      });
      setStep(3);
      setTimeout(() => navigation.replace('Login'), 3000);
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? 'Invalid OTP or request expired. Try again.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3 — success ─────────────────────────────────────────────────────

  if (step === 3) return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={s.successWrap}>
        <View style={s.successIconWrap}>
          <Ionicons name="checkmark-circle" size={64} color="#10b981" />
        </View>
        <Text style={s.successTitle}>Password Reset!</Text>
        <Text style={s.successSub}>
          Your password has been updated successfully.{'\n'}Redirecting to login…
        </Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.replace('Login')}>
          <Ionicons name="log-in-outline" size={18} color="white" />
          <Text style={s.primaryBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Steps 1 & 2 ──────────────────────────────────────────────────────────

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Back + brand */}
          <View style={s.topRow}>
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>

            <View style={s.brand}>
              <View style={s.logoBg}>
                <Text style={s.logoK}>K</Text>
              </View>
              <View>
                <Text style={s.logoLine1}>KERALA</Text>
                <Text style={s.logoLine2}>SELLERS</Text>
              </View>
            </View>
          </View>

          {/* Progress */}
          <View style={s.progressWrap}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
            </View>
            <Text style={s.stepText}>Step {step} of 2</Text>
          </View>

          {/* Card */}
          <Animated.View style={[s.card, { transform: [{ translateX: shakeAnim }] }]}>

            <Text style={s.cardTitle}>
              {step === 1 ? 'Forgot password?' : 'Reset your password'}
            </Text>
            <Text style={s.cardSub}>
              {step === 1
                ? 'Enter your registered phone number to receive an OTP'
                : `Enter the code sent to +91 ${phone}`}
            </Text>

            {/* Global error */}
            {!!formError && (
              <View style={s.formError}>
                <Ionicons name="alert-circle" size={15} color="#991b1b" />
                <Text style={s.formErrorText}>{formError}</Text>
              </View>
            )}

            {step === 1 ? (
              /* ── Step 1 ── */
              <>
                <View style={s.field}>
                  <Text style={s.label}>Phone Number</Text>
                  <View style={[
                    s.inputRow,
                    !!phoneError && s.inputRowError,
                    !phoneError && phone.length === 10 && s.inputRowOk,
                  ]}>
                    <View style={s.prefixWrap}>
                      <Text style={s.prefix}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={s.input}
                      value={phone}
                      onChangeText={t => {
                        setPhone(t.replace(/\D/g, '').slice(0, 10));
                        setPhoneError('');
                        setFormError('');
                      }}
                      placeholder="98765 43210"
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                      maxLength={10}
                      editable={!loading}
                      returnKeyType="done"
                      onSubmitEditing={sendOtp}
                    />
                    {!phoneError && phone.length === 10 && (
                      <Ionicons name="checkmark-circle" size={17} color="#10b981" style={{ marginLeft: 6 }} />
                    )}
                  </View>
                  {!!phoneError && (
                    <View style={s.fieldErrRow}>
                      <Ionicons name="alert-circle-outline" size={12} color="#ef4444" />
                      <Text style={s.fieldErrText}>{phoneError}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[s.primaryBtn, loading && s.primaryBtnDim]}
                  onPress={sendOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <><ActivityIndicator color="white" size="small" /><Text style={s.primaryBtnText}>Sending…</Text></>
                    : <><Ionicons name="phone-portrait-outline" size={18} color="white" /><Text style={s.primaryBtnText}>Send OTP</Text></>
                  }
                </TouchableOpacity>
              </>
            ) : (
              /* ── Step 2 ── */
              <>
                {/* OTP */}
                <View style={s.field}>
                  <Text style={s.label}>Verification Code</Text>
                  <View style={[s.inputRow, otp.length === 6 && s.inputRowOk]}>
                    <TextInput
                      ref={otpRef}
                      style={[s.input, s.otpInput]}
                      value={otp}
                      onChangeText={t => { setOtp(t.replace(/\D/g, '').slice(0, 6)); setFormError(''); }}
                      placeholder="● ● ● ● ● ●"
                      placeholderTextColor="#d1d5db"
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!loading}
                      returnKeyType="next"
                      onSubmitEditing={() => pwRef.current?.focus()}
                      autoFocus
                    />
                    {otp.length === 6 && (
                      <Ionicons name="checkmark-circle" size={17} color="#10b981" style={{ marginLeft: 6 }} />
                    )}
                  </View>
                </View>

                {/* Resend */}
                <TouchableOpacity
                  onPress={resendOtp}
                  disabled={resendCooldown > 0 || loading}
                  style={s.resendBtn}
                >
                  <Text style={[s.resendText, resendCooldown > 0 && s.resendTextDim]}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>

                {/* New password */}
                <View style={s.field}>
                  <Text style={s.label}>New Password</Text>
                  <View style={[s.inputRow, newPassword.length >= 8 && s.inputRowOk]}>
                    <TextInput
                      ref={pwRef}
                      style={s.input}
                      value={newPassword}
                      onChangeText={t => { setNewPassword(t); setFormError(''); }}
                      placeholder="Min 8 characters"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPw}
                      autoCapitalize="none"
                      editable={!loading}
                      returnKeyType="next"
                      onSubmitEditing={() => confirmRef.current?.focus()}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPw(v => !v)}
                      style={s.eyeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name={showPw ? 'eye-outline' : 'eye-off-outline'} size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  {newPassword.length > 0 && (
                    <View style={s.strengthWrap}>
                      <View style={s.strengthTrack}>
                        <View style={[s.strengthFill, { width: pwStrength.width, backgroundColor: pwStrength.color }]} />
                      </View>
                      <Text style={[s.strengthLabel, { color: pwStrength.color }]}>{pwStrength.label}</Text>
                    </View>
                  )}
                </View>

                {/* Confirm password */}
                <View style={s.field}>
                  <Text style={s.label}>Confirm Password</Text>
                  <View style={[
                    s.inputRow,
                    confirmPassword.length > 0 && confirmPassword !== newPassword && s.inputRowError,
                    confirmPassword.length > 0 && confirmPassword === newPassword && s.inputRowOk,
                  ]}>
                    <TextInput
                      ref={confirmRef}
                      style={s.input}
                      value={confirmPassword}
                      onChangeText={t => { setConfirmPassword(t); setFormError(''); }}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      editable={!loading}
                      returnKeyType="done"
                      onSubmitEditing={resetPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirm(v => !v)}
                      style={s.eyeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  {confirmPassword.length > 0 && confirmPassword === newPassword && (
                    <View style={s.fieldOkRow}>
                      <Ionicons name="checkmark-circle-outline" size={12} color="#10b981" />
                      <Text style={s.fieldOkText}>Passwords match</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[s.primaryBtn, loading && s.primaryBtnDim]}
                  onPress={resetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <><ActivityIndicator color="white" size="small" /><Text style={s.primaryBtnText}>Resetting…</Text></>
                    : <><Ionicons name="lock-closed-outline" size={18} color="white" /><Text style={s.primaryBtnText}>Reset Password</Text></>
                  }
                </TouchableOpacity>
              </>
            )}

            {/* Back to login */}
            <TouchableOpacity style={s.loginLink} onPress={() => navigation.navigate('Login')}>
              <Text style={s.loginLinkText}>Back to Login</Text>
            </TouchableOpacity>

          </Animated.View>

          <Text style={s.footer}>Kerala Sellers · Built for local businesses</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#f8fafc' },
  scroll:           { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  topRow:           { flexDirection: 'row', alignItems: 'center', paddingTop: 16, marginBottom: 20 },
  backBtn:          { width: 38, height: 38, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2, marginRight: 16 },

  brand:            { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBg:           { width: 42, height: 42, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center',
                      shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 6, elevation: 5 },
  logoK:            { fontSize: 22, fontWeight: '900', color: 'white' },
  logoLine1:        { fontSize: 16, fontWeight: '900', color: '#1f2937', letterSpacing: 3 },
  logoLine2:        { fontSize: 11, fontWeight: '700', color: '#3b82f6', letterSpacing: 4, marginTop: -1 },

  progressWrap:     { marginBottom: 20 },
  progressTrack:    { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 6 },
  progressFill:     { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2 },
  stepText:         { fontSize: 11, color: '#9ca3af', textAlign: 'right' },

  card:             { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 20,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 4 },
  cardTitle:        { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  cardSub:          { fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 19 },

  formError:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12, marginBottom: 16 },
  formErrorText:    { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '500' },

  field:            { marginBottom: 14 },
  label:            { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, minHeight: 50 },
  inputRowError:    { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  inputRowOk:       { borderColor: '#10b981' },
  prefixWrap:       { marginRight: 10, paddingRight: 10, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  prefix:           { fontSize: 13, fontWeight: '600', color: '#374151' },
  input:            { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500', paddingVertical: 0 },
  eyeBtn:           { padding: 4, marginLeft: 4 },
  otpInput:         { textAlign: 'center', letterSpacing: 10, fontSize: 20, fontWeight: '700' },
  fieldErrRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  fieldErrText:     { fontSize: 12, color: '#ef4444' },
  fieldOkRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  fieldOkText:      { fontSize: 12, color: '#10b981' },

  strengthWrap:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 2 },
  strengthTrack:    { flex: 1, height: 3, backgroundColor: '#e5e7eb', borderRadius: 2 },
  strengthFill:     { height: '100%', borderRadius: 2 },
  strengthLabel:    { fontSize: 11, fontWeight: '700', width: 44, textAlign: 'right' },

  resendBtn:        { alignSelf: 'flex-end', marginBottom: 12, marginTop: -4 },
  resendText:       { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  resendTextDim:    { color: '#9ca3af' },

  primaryBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                      backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 14, marginBottom: 10,
                      shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  primaryBtnDim:    { backgroundColor: '#93c5fd', shadowOpacity: 0, elevation: 0 },
  primaryBtnText:   { fontSize: 15, fontWeight: '700', color: 'white' },

  loginLink:        { alignItems: 'center', paddingVertical: 12, marginTop: 6 },
  loginLinkText:    { fontSize: 14, color: '#6b7280', fontWeight: '500' },

  successWrap:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  successIconWrap:  { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle:     { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 10 },
  successSub:       { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },

  footer:           { textAlign: 'center', fontSize: 12, color: '#d1d5db', marginTop: 4, marginBottom: 8 },
});
