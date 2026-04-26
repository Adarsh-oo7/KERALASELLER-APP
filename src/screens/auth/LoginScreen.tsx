import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../App';
import { API_BASE_URL, ENDPOINTS } from '../../config/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const C = {
  bg:           '#F2F2F7',   // iOS system grouped background
  surface:      '#FFFFFF',
  surfaceGroup: '#F2F2F7',
  separator:    '#C6C6C8',
  label:        '#000000',
  label2:       '#3C3C43CC',
  label3:       '#3C3C4399',
  tint:         '#007AFF',   // iOS blue
  green:        '#34C759',   // iOS green
  red:          '#FF3B30',
  brand:        '#2B4B39',   // Kerala green
};

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState('');
  const [focusedInput, setFocused]  = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Enter a valid 10-digit phone number');
      shake();
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      shake();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}${ENDPOINTS.login}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password: password.trim() }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* non-json */ }

      if (res.ok && (data.access_token || data.access)) {
        const accessToken  = data.access_token  || data.access;
        const refreshToken = data.refresh_token || data.refresh || '';
        await AsyncStorage.multiSet([
          ['accessToken',  accessToken],
          ['refreshToken', refreshToken],
          ['userPhone',    cleanPhone],
          ['userType',     'seller'],
          ...(data.seller ? [['sellerId', String(data.seller.id)]] : []) as [string, string][],
        ]);
        // Navigate to main app — replace so back doesn't return to login
        (navigation as any).replace?.('Main') || navigation.navigate('Register'); // fallback
      } else {
        const msg = data.error || data.detail || data.message || data.non_field_errors?.[0] || 'Invalid phone or password';
        setError(msg);
        shake();
      }
    } catch (e: any) {
      setError(
        e.message?.includes('Network') || e.message?.includes('fetch')
          ? 'Cannot connect to server. Check your internet connection.'
          : e.message || 'Something went wrong'
      );
      shake();
    } finally {
      setLoading(false);
    }
  };

  const borderColor = (name: string) =>
    focusedInput === name ? C.tint : C.separator;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ── */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetter}>K</Text>
            </View>
            <Text style={styles.brandName}>Kerala Sellers</Text>
            <Text style={styles.brandSub}>Seller Dashboard</Text>
          </View>

          {/* ── Form card ── */}
          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>

            {/* Phone */}
            <View style={[styles.row, { borderBottomColor: C.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={styles.rowLabel}>Phone</Text>
              <View style={styles.phoneRow}>
                <Text style={styles.dialCode}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  placeholderTextColor={C.label3}
                  value={phone}
                  onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onFocus={() => setFocused('phone')}
                  onBlur={() =>  setFocused(null)}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Password</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter password"
                placeholderTextColor={C.label3}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                onFocus={() => setFocused('pass')}
                onBlur={() =>  setFocused(null)}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.signInBtn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.signInText}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* Register link */}
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>New seller? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
              <Text style={styles.footerLink}>Create account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.domain}>keralasellers.in</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 36,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#2B4B39',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#2B4B39',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoLetter: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.2,
  },
  brandSub: {
    fontSize: 13,
    color: '#3C3C4399',
    marginTop: 3,
    fontWeight: '400',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  rowLabel: {
    fontSize: 17,
    color: '#000',
    width: 90,
    fontWeight: '400',
  },
  phoneRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dialCode: {
    fontSize: 17,
    color: '#000',
    marginRight: 6,
    fontWeight: '400',
  },
  input: {
    fontSize: 17,
    color: '#000',
    flex: 1,
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorBox: {
    backgroundColor: '#FFF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FF3B3033',
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '500',
  },
  signInBtn: {
    backgroundColor: '#2B4B39',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2B4B39',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  signInText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerLabel: {
    fontSize: 15,
    color: '#3C3C4399',
  },
  footerLink: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  domain: {
    textAlign: 'center',
    fontSize: 12,
    color: '#3C3C4360',
    marginTop: 32,
  },
});
