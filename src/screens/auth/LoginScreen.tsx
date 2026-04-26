import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../App';
import { API_BASE_URL } from '../../config/api';

// Apple HIG System Colors
const C = {
  bg:           '#F2F2F7', // systemGroupedBackground
  surface:      '#FFFFFF', // secondarySystemGroupedBackground
  elevated:     '#FFFFFF',
  label:        '#000000',
  secondLabel:  '#3C3C43',
  tertiaryLabel:'#3C3C4399',
  separator:    '#3C3C4349',
  fill:         '#78788033',
  blue:         '#007AFF',
  green:        '#34C759',
  red:          '#FF3B30',
  brand:        '#2B4B39', // Kerala Sellers brand
  brandMid:     '#3A5D47',
  placeholder:  '#3C3C4399',
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'> & {
  onLoginSuccess: () => void;
};

export default function LoginScreen({ navigation, onLoginSuccess }: Props) {
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [focused, setFocused]     = useState<string | null>(null);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter your phone number and password.');
      return;
    }
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 10 || !phoneClean.match(/^[6-9]/)) {
      Alert.alert('Invalid Phone Number', 'Enter a valid 10-digit number starting with 6–9.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone: phoneClean, password: password.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!data) { Alert.alert('Error', 'Server returned an invalid response.'); return; }
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
        throw new Error(data.error || data.detail || data.message || 'Incorrect phone or password.');
      }
    } catch (e: any) {
      const msg = e.message?.includes('Network request failed')
        ? 'Cannot connect to server. Check your internet connection.'
        : e.message || 'Sign in failed.';
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => ([
    styles.inputField,
    focused === field && styles.inputFocused,
  ]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
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

          {/* ── Brand mark ── */}
          <View style={styles.brandSection}>
            <View style={styles.logoMark}>
              <Text style={styles.logoK}>K</Text>
            </View>
            <Text style={styles.brandName}>Kerala Sellers</Text>
            <Text style={styles.brandCaption}>Seller Dashboard</Text>
          </View>

          {/* ── Title ── */}
          <Text style={styles.pageTitle}>Sign In</Text>

          {/* ── Grouped input card ── */}
          <View style={styles.inputGroup}>
            {/* Phone row */}
            <View style={styles.inputRow}>
              <View style={styles.inputIconWrap}>
                <Text style={styles.inputEmoji}>📱</Text>
              </View>
              <View style={styles.inputInner}>
                <Text style={styles.inputLabel}>Phone</Text>
                <View style={styles.phoneRow}>
                  <Text style={styles.dialCode}>+91</Text>
                  <TextInput
                    style={inputStyle('phone')}
                    placeholder="9876543210"
                    placeholderTextColor={C.placeholder}
                    value={phone}
                    onChangeText={t => { const c = t.replace(/\D/g,''); if(c.length<=10) setPhone(c); }}
                    keyboardType="number-pad"
                    maxLength={10}
                    returnKeyType="next"
                    onFocus={() => setFocused('phone')}
                    onBlur={() => setFocused(null)}
                    editable={!loading}
                  />
                </View>
              </View>
            </View>

            <View style={styles.rowSeparator} />

            {/* Password row */}
            <View style={styles.inputRow}>
              <View style={styles.inputIconWrap}>
                <Text style={styles.inputEmoji}>🔒</Text>
              </View>
              <View style={styles.inputInner}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.phoneRow}>
                  <TextInput
                    style={[inputStyle('password'), styles.flex]}
                    placeholder="Enter your password"
                    placeholderTextColor={C.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.eyeLabel}>{showPass ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* ── Primary CTA ── */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.82}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnLabel}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* ── Register link ── */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* ── Legal note ── */}
          <Text style={styles.legalNote}>
            By signing in you agree to the Kerala Sellers{' '}
            <Text style={styles.legalLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.bg },
  flex:  { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Brand
  brandSection: { alignItems: 'center', paddingTop: 52, paddingBottom: 32 },
  logoMark: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: C.brand,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  logoK:       { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  brandName:   { fontSize: 22, fontWeight: '700', color: C.label, letterSpacing: -0.3 },
  brandCaption:{ fontSize: 13, color: C.secondLabel, marginTop: 2, fontWeight: '400' },

  // Title
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: C.label,
    letterSpacing: 0.37,
    marginBottom: 28,
  },

  // Grouped input card (iOS settings style)
  inputGroup: {
    backgroundColor: C.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    minHeight: 56,
  },
  inputIconWrap: { width: 28, alignItems: 'center', marginRight: 10 },
  inputEmoji:   { fontSize: 18 },
  inputInner:   { flex: 1, paddingRight: 16, paddingVertical: 8 },
  inputLabel:   { fontSize: 11, fontWeight: '500', color: C.tertiaryLabel, marginBottom: 2 },
  phoneRow:     { flexDirection: 'row', alignItems: 'center' },
  dialCode:     { fontSize: 16, color: C.label, fontWeight: '500', marginRight: 6 },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: C.label,
    paddingVertical: 0,
    fontWeight: '400',
  },
  inputFocused: { color: C.label }, // focus handled by group card
  eyeBtn:  { marginLeft: 8 },
  eyeLabel:{ fontSize: 14, color: C.blue, fontWeight: '500' },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.separator,
    marginLeft: 54,
  },

  // Primary button
  primaryBtn: {
    backgroundColor: C.brand,
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.2,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 28,
  },
  footerText: { fontSize: 15, color: C.secondLabel },
  footerLink: { fontSize: 15, color: C.blue, fontWeight: '500' },

  // Legal
  legalNote: {
    fontSize: 12,
    color: C.tertiaryLabel,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  legalLink: { color: C.blue },
});
