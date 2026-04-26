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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const STEPS = ['Account', 'Shop', 'Location'];

export default function RegisterScreen({ navigation }: Props) {
  // Step
  const [step, setStep] = useState(0);

  // Step 1 — Account
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);

  // Step 2 — Shop
  const [shopName, setShopName]   = useState('');
  const [shopDesc, setShopDesc]   = useState('');
  const [category, setCategory]   = useState('');

  // Step 3 — Location
  const [address, setAddress]     = useState('');
  const [city, setCity]           = useState('');
  const [pincode, setPincode]     = useState('');
  const [whatsapp, setWhatsapp]   = useState('');

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
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

  const err = (msg: string) => { setError(msg); shake(); };

  const validateStep = () => {
    setError('');
    if (step === 0) {
      if (!name.trim())                              return err('Full name is required');
      if (phone.replace(/\D/g,'').length !== 10)     return err('Enter a valid 10-digit phone number');
      if (email && !/\S+@\S+\.\S+/.test(email))      return err('Enter a valid email address');
      if (password.length < 6)                       return err('Password must be at least 6 characters');
      if (password !== confirm)                      return err('Passwords do not match');
      return true;
    }
    if (step === 1) {
      if (!shopName.trim())  return err('Shop name is required');
      if (!category.trim())  return err('Category is required');
      return true;
    }
    if (step === 2) {
      if (!city.trim())                               return err('City is required');
      if (pincode && pincode.length !== 6)            return err('Enter a valid 6-digit pincode');
      const wp = whatsapp.replace(/\D/g,'');
      if (whatsapp && wp.length !== 10)               return err('Enter a valid WhatsApp number');
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.replace(/\D/g,''),
        email: email.trim() || undefined,
        password,
        shop_name: shopName.trim(),
        shop_description: shopDesc.trim() || undefined,
        category: category.trim(),
        address: address.trim() || undefined,
        city: city.trim(),
        pincode: pincode || undefined,
        whatsapp_number: whatsapp.replace(/\D/g,'') || undefined,
      };

      const res = await fetch(`${API_BASE_URL}${ENDPOINTS.register}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* non-json */ }

      if (res.ok && (data.access_token || data.access || data.id)) {
        if (data.access_token || data.access) {
          await AsyncStorage.multiSet([
            ['accessToken',  data.access_token || data.access],
            ['refreshToken', data.refresh_token || data.refresh || ''],
            ['userPhone',    phone.replace(/\D/g,'')],
            ['userType',     'seller'],
          ]);
        }
        Alert.alert(
          'Registration Successful! 🎉',
          `Welcome ${name}!\n\nYour seller account has been created.`,
          [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        // Django often returns field-level errors as objects
        let msg = data.error || data.detail || data.message;
        if (!msg) {
          const fieldErrors = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
            .join('\n');
          msg = fieldErrors || 'Registration failed. Please try again.';
        }
        err(msg);
      }
    } catch (e: any) {
      err(
        e.message?.includes('Network') || e.message?.includes('fetch')
          ? 'Cannot connect to server. Check your internet connection.'
          : e.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Field rows helper ──────────────────────────────────────────
  const Field = ({
    label, value, onChange, placeholder, keyboard = 'default',
    secure = false, multiline = false, last = false,
    suffix = null as React.ReactNode,
  }: any) => (
    <View style={[styles.row, !last && { borderBottomColor: '#C6C6C8', borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 72, textAlignVertical: 'top', paddingTop: 8 }]}
        placeholder={placeholder}
        placeholderTextColor="#3C3C4399"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        secureTextEntry={secure}
        multiline={multiline}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
        editable={!loading}
      />
      {suffix}
    </View>
  );

  // ── Step content ───────────────────────────────────────────────
  const renderStep = () => {
    if (step === 0) return (
      <>
        <Field label="Full Name"  value={name}     onChange={setName}     placeholder="Your full name" />
        <Field label="Phone"      value={phone}    onChange={(t: string) => setPhone(t.replace(/\D/g,'').slice(0,10))} placeholder="9876543210" keyboard="numeric" />
        <Field label="Email"      value={email}    onChange={setEmail}    placeholder="Optional" keyboard="email-address" />
        <Field label="Password"   value={password} onChange={setPassword} placeholder="Min 6 characters" secure={!showPass}
          suffix={
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          }
        />
        <Field label="Confirm"    value={confirm}  onChange={setConfirm}  placeholder="Repeat password" secure last />
      </>
    );
    if (step === 1) return (
      <>
        <Field label="Shop Name"  value={shopName} onChange={setShopName} placeholder="Your shop name" />
        <Field label="Category"   value={category} onChange={setCategory} placeholder="e.g. Grocery, Clothing" />
        <Field label="Description" value={shopDesc} onChange={setShopDesc} placeholder="Brief description (optional)" multiline last />
      </>
    );
    return (
      <>
        <Field label="City"     value={city}    onChange={setCity}    placeholder="e.g. Kochi" />
        <Field label="Address"  value={address} onChange={setAddress} placeholder="Street / area (optional)" />
        <Field label="Pincode"  value={pincode} onChange={(t: string) => setPincode(t.replace(/\D/g,'').slice(0,6))} placeholder="682001" keyboard="numeric" />
        <Field label="WhatsApp" value={whatsapp} onChange={(t: string) => setWhatsapp(t.replace(/\D/g,'').slice(0,10))} placeholder="10-digit number" keyboard="numeric" last />
      </>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#F2F2F7' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetter}>K</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Register as a seller on Kerala Sellers</Text>
          </View>

          {/* Step pills */}
          <View style={styles.stepPills}>
            {STEPS.map((label, i) => (
              <View key={i} style={styles.pillWrap}>
                <View style={[
                  styles.pill,
                  i < step  && styles.pillDone,
                  i === step && styles.pillActive,
                ]}>
                  <Text style={[
                    styles.pillText,
                    (i <= step) && styles.pillTextActive,
                  ]}>{i < step ? '✓' : String(i + 1)}</Text>
                </View>
                <Text style={[styles.pillLabel, i === step && { color: '#2B4B39', fontWeight: '600' }]}>{label}</Text>
                {i < STEPS.length - 1 && <View style={[styles.pillLine, i < step && styles.pillLineDone]} />}
              </View>
            ))}
          </View>

          {/* Form card */}
          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            {renderStep()}
          </Animated.View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.btnRow}>
            {step > 0 && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => { setError(''); setStep(s => s - 1); }}
                disabled={loading}
              >
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, loading && { opacity: 0.6 }, step > 0 && { flex: 1, marginLeft: 10 }]}
              onPress={step === STEPS.length - 1 ? handleSubmit : handleNext}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.nextBtnText}>
                    {step === STEPS.length - 1 ? 'Create Account' : 'Continue'}
                  </Text>
              }
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.footerLink}>Sign In</Text>
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
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 28,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#2B4B39',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#2B4B39',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  logoLetter: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: '#3C3C4399',
    marginTop: 4,
    fontWeight: '400',
    textAlign: 'center',
  },
  // Step pills
  stepPills: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 0,
  },
  pillWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  pill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pillActive: {
    backgroundColor: '#2B4B39',
  },
  pillDone: {
    backgroundColor: '#34C759',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  pillTextActive: {
    color: '#fff',
  },
  pillLabel: {
    fontSize: 11,
    color: '#8E8E93',
    position: 'absolute',
    top: 32,
    width: 60,
    textAlign: 'center',
    marginLeft: -16,
  },
  pillLine: {
    width: 48,
    height: 2,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 2,
    marginBottom: 4,
  },
  pillLineDone: {
    backgroundColor: '#34C759',
  },
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 24,
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
  input: {
    flex: 1,
    fontSize: 17,
    color: '#000',
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
  btnRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  backBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  backBtnText: {
    fontSize: 17,
    color: '#2B4B39',
    fontWeight: '500',
  },
  nextBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#2B4B39',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2B4B39',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
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
