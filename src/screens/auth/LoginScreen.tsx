import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar, ScrollView,
  Animated, Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../App';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, ENDPOINTS } from '../../config/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { signIn }              = useAuth();
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [focused, setFocused]   = useState<'phone' | 'pass' | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 6,  duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
  ]).start();

  const handleLogin = async () => {
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) { setError('Enter a valid 10-digit phone number'); shake(); return; }
    if (!password.trim())         { setError('Password is required');                shake(); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}${ENDPOINTS.login}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password: password.trim() }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}
      if (res.ok && (data.access_token || data.access)) {
        await signIn({
          accessToken:  data.access_token  || data.access,
          refreshToken: data.refresh_token || data.refresh || '',
          sellerId:     data.seller?.id ? String(data.seller.id) : undefined,
        });
      } else {
        setError(data.error || data.detail || data.message || data.non_field_errors?.[0] || 'Invalid phone or password');
        shake();
      }
    } catch (e: any) {
      setError(e.message?.includes('Network') || e.message?.includes('fetch')
        ? 'Cannot connect to server. Check your internet.'
        : e.message || 'Something went wrong');
      shake();
    } finally { setLoading(false); }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView style={S.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <Animated.View style={[S.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={S.logoWrap}>
              <Image
                source={{ uri: 'https://raw.githubusercontent.com/Adarsh-oo7/KERALASELLER-APP/master/assets/icon.png' }}
                style={S.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={S.appName}>Kerala Sellers</Text>
            <Text style={S.appTag}>Seller Portal</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[S.formWrap, { opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }]}>
            <Text style={S.sectionTitle}>Sign in to your account</Text>

            <Text style={S.fieldLabel}>Phone Number</Text>
            <View style={[S.fieldWrap, focused === 'phone' && S.fieldFocused]}>
              <Text style={S.fieldIcon}>📱</Text>
              <Text style={S.dialCode}>+91</Text>
              <View style={S.vDivider} />
              <TextInput
                style={S.fieldInput}
                placeholder="10-digit number"
                placeholderTextColor="#AEAEB2"
                value={phone}
                onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="numeric"
                returnKeyType="next"
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
                editable={!loading}
              />
              {phone.length === 10 && <Text style={S.check}>✓</Text>}
            </View>

            <Text style={S.fieldLabel}>Password</Text>
            <View style={[S.fieldWrap, focused === 'pass' && S.fieldFocused]}>
              <Text style={S.fieldIcon}>🔒</Text>
              <TextInput
                style={[S.fieldInput, { flex: 1 }]}
                placeholder="Your password"
                placeholderTextColor="#AEAEB2"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused(null)}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={{ fontSize: 18, color: '#AEAEB2' }}>{showPass ? '👁' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            {!!error && (
              <View style={S.errorBox}>
                <Text style={S.errorDot}>•</Text>
                <Text style={S.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={[S.cta, loading && S.ctaOff]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={S.ctaText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={S.orRow}>
              <View style={S.orLine} />
              <Text style={S.orText}>or</Text>
              <View style={S.orLine} />
            </View>

            <TouchableOpacity style={S.outlineBtn} onPress={() => navigation.navigate('Register')} disabled={loading} activeOpacity={0.7}>
              <Text style={S.outlineBtnText}>Create a new account</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={S.domain}>keralasellers.in</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },

  hero:     { alignItems: 'center', paddingTop: 64, paddingBottom: 36 },
  logoWrap: { width: 88, height: 88, borderRadius: 20, overflow: 'hidden', marginBottom: 16, backgroundColor: '#F2F2F7' },
  logo:     { width: 88, height: 88 },
  appName:  { fontSize: 26, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3 },
  appTag:   { fontSize: 14, color: '#8E8E93', marginTop: 4 },

  formWrap: {
    backgroundColor: '#F9F9F9', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 20, letterSpacing: -0.2 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#3C3C43', marginBottom: 6, marginLeft: 2 },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5EA',
    paddingHorizontal: 14, marginBottom: 16, height: 54,
  },
  fieldFocused: { borderColor: '#1C1C1E' },
  fieldIcon:    { fontSize: 17, marginRight: 8 },
  dialCode:     { fontSize: 16, color: '#1C1C1E', fontWeight: '500', marginRight: 8 },
  vDivider:     { width: 1, height: 22, backgroundColor: '#E5E5EA', marginRight: 10 },
  fieldInput:   { flex: 1, fontSize: 16, color: '#1C1C1E', paddingVertical: 0 },
  check:        { fontSize: 16, color: '#30D158', fontWeight: '700' },

  errorBox:  { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF2F2', borderRadius: 10, padding: 12, marginBottom: 12, gap: 6 },
  errorDot:  { fontSize: 16, color: '#FF3B30', lineHeight: 20 },
  errorText: { flex: 1, fontSize: 13, color: '#FF3B30', fontWeight: '500', lineHeight: 20 },

  cta: { backgroundColor: '#1C1C1E', borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 4 },
  ctaOff:   { opacity: 0.55 },
  ctaText:  { color: '#FFFFFF', fontSize: 17, fontWeight: '600', letterSpacing: 0.2 },

  orRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  orLine: { flex: 1, height: 1, backgroundColor: '#E5E5EA' },
  orText: { fontSize: 13, color: '#AEAEB2', marginHorizontal: 12, fontWeight: '500' },

  outlineBtn:     { borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E5EA', backgroundColor: '#FFFFFF' },
  outlineBtnText: { fontSize: 16, color: '#1C1C1E', fontWeight: '500' },

  domain: { textAlign: 'center', fontSize: 12, color: '#C7C7CC', marginTop: 32 },
});
