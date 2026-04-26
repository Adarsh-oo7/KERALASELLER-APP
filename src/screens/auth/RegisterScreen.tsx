import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, SafeAreaView, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../App';
import { API_BASE_URL } from '../../config/api';

const C = {
  bg:            '#F2F2F7',
  surface:       '#FFFFFF',
  label:         '#000000',
  secondLabel:   '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator:     '#3C3C4349',
  placeholder:   '#3C3C4399',
  blue:          '#007AFF',
  green:         '#34C759',
  red:           '#FF3B30',
  brand:         '#2B4B39',
  brandMid:      '#3A5D47',
  orange:        '#FF9500',
};

type Step = 'form' | 'otp' | 'success';
type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [step, setStep]       = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [form, setForm]       = useState({
    phone: '', name: '', shopName: '', email: '',
    password: '', confirmPassword: '', otp: '',
  });
  const [showPass, setShowPass]           = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  const validate = (): string | null => {
    const { phone, name, shopName, email, password, confirmPassword } = form;
    if (!phone || !name || !shopName || !email || !password || !confirmPassword)
      return 'Please fill in all fields.';
    if (phone.length !== 10 || !phone.match(/^[6-9]/))
      return 'Enter a valid 10-digit phone number starting with 6–9.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'Enter a valid email address.';
    if (password.length < 8)
      return 'Password must be at least 8 characters.';
    if (password !== confirmPassword)
      return 'Passwords do not match.';
    return null;
  };

  const sendOTP = async () => {
    const err = validate();
    if (err) { Alert.alert('Check Your Details', err); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStep('otp');
        Alert.alert('Code Sent', `A 6-digit code was sent to +91 ${form.phone}.`);
      } else {
        throw new Error(data.error || data.detail || 'Failed to send code.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    if (!form.otp || form.otp.length !== 6) {
      Alert.alert('Enter Code', 'Enter the 6-digit code sent to your phone.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          name: form.name.trim(),
          shop_name: form.shopName.trim(),
          email: form.email.toLowerCase().trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          otp: form.otp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStep('success');
      } else {
        const fields = ['phone','email','password','otp','name','shop_name','confirmPassword'];
        const msgs = fields
          .filter(f => data[f])
          .map(f => `${f}: ${Array.isArray(data[f]) ? data[f].join(', ') : data[f]}`);
        throw new Error(msgs.length ? msgs.join('\n') : (data.error || data.detail || 'Registration failed.'));
      }
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── FORM STEP ─────────────────────────────────────────────────
  if (step === 'form') return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backLabel}>{'<'} Sign In</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.pageTitle}>Create Account</Text>
          <Text style={styles.pageSubtitle}>Register your shop on Kerala Sellers</Text>

          {/* Personal info */}
          <Text style={styles.sectionHeader}>YOUR DETAILS</Text>
          <View style={styles.inputGroup}>
            <InputRow label="Full Name" emoji="👤" focused={focused === 'name'}
              onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}>
              <TextInput style={styles.inputField} placeholder="Ravi Kumar" placeholderTextColor={C.placeholder}
                value={form.name} onChangeText={v => set('name', v)}
                autoCapitalize="words" returnKeyType="next" editable={!loading} />
            </InputRow>
            <Sep />
            <InputRow label="Phone" emoji="📱" focused={focused === 'phone'}
              onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}>
              <Text style={styles.dialCode}>+91</Text>
              <TextInput style={styles.inputField} placeholder="9876543210" placeholderTextColor={C.placeholder}
                value={form.phone} onChangeText={v => { const c=v.replace(/\D/g,''); if(c.length<=10) set('phone',c); }}
                keyboardType="number-pad" maxLength={10} returnKeyType="next" editable={!loading} />
            </InputRow>
            <Sep />
            <InputRow label="Email" emoji="✉️" focused={focused === 'email'}
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}>
              <TextInput style={styles.inputField} placeholder="you@example.com" placeholderTextColor={C.placeholder}
                value={form.email} onChangeText={v => set('email', v)}
                keyboardType="email-address" autoCapitalize="none" returnKeyType="next" editable={!loading} />
            </InputRow>
          </View>

          {/* Shop info */}
          <Text style={styles.sectionHeader}>YOUR SHOP</Text>
          <View style={styles.inputGroup}>
            <InputRow label="Shop Name" emoji="🏪" focused={focused === 'shop'}
              onFocus={() => setFocused('shop')} onBlur={() => setFocused(null)}>
              <TextInput style={styles.inputField} placeholder="My Kerala Store" placeholderTextColor={C.placeholder}
                value={form.shopName} onChangeText={v => set('shopName', v)}
                autoCapitalize="words" returnKeyType="next" editable={!loading} />
            </InputRow>
          </View>

          {/* Security */}
          <Text style={styles.sectionHeader}>SECURITY</Text>
          <View style={styles.inputGroup}>
            <InputRow label="Password" emoji="🔒" focused={focused === 'pass'}
              onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}>
              <TextInput style={[styles.inputField, styles.flex]} placeholder="Min. 8 characters" placeholderTextColor={C.placeholder}
                value={form.password} onChangeText={v => set('password', v)}
                secureTextEntry={!showPass} autoCapitalize="none" returnKeyType="next" editable={!loading} />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Text style={styles.eyeLabel}>{showPass ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </InputRow>
            <Sep />
            <InputRow label="Confirm Password" emoji="🔑" focused={focused === 'confirm'}
              onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}>
              <TextInput style={[styles.inputField, styles.flex]} placeholder="Re-enter password" placeholderTextColor={C.placeholder}
                value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)}
                secureTextEntry={!showConfirm} autoCapitalize="none" returnKeyType="done" editable={!loading} />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Text style={styles.eyeLabel}>{showConfirm ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </InputRow>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={sendOTP} disabled={loading} activeOpacity={0.82}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnLabel}>Continue</Text>
            }
          </TouchableOpacity>

          <Text style={styles.legalNote}>
            By continuing you agree to Kerala Sellers{' '}
            <Text style={styles.legalLink}>Terms</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // ── OTP STEP ──────────────────────────────────────────────────
  if (step === 'otp') return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[styles.scroll, styles.otpScroll]} keyboardShouldPersistTaps="handled">

          <TouchableOpacity onPress={() => setStep('form')} style={styles.backBtn}>
            <Text style={styles.backLabel}>{'<'} Back</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.otpIconWrap}>
            <Text style={styles.otpIconEmoji}>💬</Text>
          </View>

          <Text style={styles.pageTitle}>Verify Phone</Text>
          <Text style={styles.pageSubtitle}>
            We sent a 6-digit code to{' \n'}
            <Text style={styles.boldPhone}>+91 {form.phone}</Text>
          </Text>

          {/* OTP group */}
          <View style={[styles.inputGroup, { marginTop: 32 }]}>
            <InputRow label="Verification Code" emoji="🔢" focused={focused === 'otp'}
              onFocus={() => setFocused('otp')} onBlur={() => setFocused(null)}>
              <TextInput
                style={[styles.inputField, styles.otpField]}
                placeholder="000000"
                placeholderTextColor={C.placeholder}
                value={form.otp}
                onChangeText={v => set('otp', v.replace(/\D/g,'').slice(0,6))}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={submitRegister}
                editable={!loading}
                autoFocus
              />
            </InputRow>
          </View>

          {/* Verify CTA */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={submitRegister} disabled={loading} activeOpacity={0.82}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnLabel}>Create Account</Text>
            }
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Didn't get a code? </Text>
            <TouchableOpacity onPress={() => { set('otp',''); sendOTP(); }} disabled={loading}>
              <Text style={styles.footerLink}>Resend</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // ── SUCCESS STEP ──────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={styles.successWrap}>
        <View style={styles.successIconWrap}>
          <Text style={styles.successEmoji}>✅</Text>
        </View>
        <Text style={styles.successTitle}>You're all set!</Text>
        <Text style={styles.successSub}>
          Your shop has been registered.{' \n'}Sign in to access your dashboard.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.82}
        >
          <Text style={styles.primaryBtnLabel}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Shared sub-components ─────────────────────────────────────
function InputRow({ label, emoji, focused, onFocus, onBlur, children }: {
  label: string; emoji: string; focused: boolean;
  onFocus: () => void; onBlur: () => void; children: React.ReactNode;
}) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.iconWrap}>
        <Text style={rowStyles.emoji}>{emoji}</Text>
      </View>
      <View style={rowStyles.inner}>
        <Text style={rowStyles.label}>{label}</Text>
        <View style={rowStyles.fields}>{children}</View>
      </View>
    </View>
  );
}
function Sep() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#3C3C4349', marginLeft: 54 }} />;
}
const rowStyles = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, minHeight: 56 },
  iconWrap:{ width: 28, alignItems: 'center', marginRight: 10 },
  emoji:   { fontSize: 18 },
  inner:   { flex: 1, paddingRight: 16, paddingVertical: 8 },
  label:   { fontSize: 11, fontWeight: '500', color: '#3C3C4399', marginBottom: 2 },
  fields:  { flexDirection: 'row', alignItems: 'center' },
});

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.bg },
  flex:  { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 48 },
  otpScroll: { justifyContent: 'flex-start', paddingTop: 8 },

  backBtn:   { marginTop: 12, marginBottom: 8, alignSelf: 'flex-start' },
  backLabel: { fontSize: 17, color: C.blue, fontWeight: '400' },

  pageTitle:   { fontSize: 34, fontWeight: '700', color: C.label, letterSpacing: 0.37, marginBottom: 6 },
  pageSubtitle:{ fontSize: 15, color: C.secondLabel, marginBottom: 28, lineHeight: 20 },
  boldPhone:   { fontWeight: '600', color: C.label },

  sectionHeader: {
    fontSize: 12, fontWeight: '500', color: C.secondLabel,
    letterSpacing: 0.6, marginBottom: 8, marginLeft: 4,
  },

  inputGroup: {
    backgroundColor: C.surface,
    borderRadius: 12, overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  inputField: {
    fontSize: 16, color: C.label, fontWeight: '400',
    paddingVertical: 0, flex: 1,
  },
  dialCode: { fontSize: 16, color: C.label, fontWeight: '500', marginRight: 6 },
  eyeBtn:   { marginLeft: 8 },
  eyeLabel: { fontSize: 14, color: C.blue, fontWeight: '500' },

  otpField: { fontSize: 24, fontWeight: '600', letterSpacing: 8, textAlign: 'left' },

  primaryBtn: {
    backgroundColor: C.brand, borderRadius: 14,
    height: 54, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32, shadowRadius: 10, elevation: 5,
  },
  btnDisabled:    { opacity: 0.6 },
  primaryBtnLabel:{ fontSize: 17, fontWeight: '600', color: '#fff', letterSpacing: -0.2 },

  footerRow:   { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  footerText:  { fontSize: 15, color: C.secondLabel },
  footerLink:  { fontSize: 15, color: C.blue, fontWeight: '500' },

  legalNote:  { fontSize: 12, color: C.tertiaryLabel, textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 },
  legalLink:  { color: C.blue },

  otpIconWrap: { alignItems: 'center', marginTop: 24, marginBottom: 16 },
  otpIconEmoji:{ fontSize: 64 },

  // Success
  successWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  successIconWrap:{ marginBottom: 24 },
  successEmoji:   { fontSize: 72 },
  successTitle:   { fontSize: 30, fontWeight: '700', color: C.label, marginBottom: 12, textAlign: 'center' },
  successSub:     { fontSize: 16, color: C.secondLabel, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
});
