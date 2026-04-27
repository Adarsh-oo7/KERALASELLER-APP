import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar, ScrollView,
  Animated, Image, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../App';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, ENDPOINTS } from '../../config/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const STEPS = [
  { label: 'Account',  icon: '👤' },
  { label: 'Shop',     icon: '🏪' },
  { label: 'Location', icon: '📍' },
];

export default function RegisterScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [step, setStep] = useState(0);

  const [name, setName]           = useState('');
  const [company, setCompany]     = useState('');  // ← NEW: company name
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [shopName, setShopName]   = useState('');
  const [shopDesc, setShopDesc]   = useState('');
  const [category, setCategory]   = useState('');
  const [city, setCity]           = useState('');
  const [address, setAddress]     = useState('');
  const [pincode, setPincode]     = useState('');
  const [whatsapp, setWhatsapp]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [focused, setFocused]     = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    fadeAnim.setValue(0); slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 5,  duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -5, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
  ]).start();

  const fail = (msg: string) => { setError(msg); shake(); return false; };

  const validateStep = (): boolean => {
    setError('');
    if (step === 0) {
      if (!name.trim())                           return fail('Full name is required');
      if (phone.replace(/\D/g,'').length !== 10)  return fail('Enter a valid 10-digit phone number');
      if (email && !/\S+@\S+\.\S+/.test(email))   return fail('Enter a valid email address');
      if (password.length < 6)                    return fail('Password must be at least 6 characters');
      if (password !== confirm)                   return fail('Passwords do not match');
    }
    if (step === 1) {
      if (!shopName.trim()) return fail('Shop name is required');
      if (!category.trim()) return fail('Category is required');
    }
    if (step === 2) {
      if (!city.trim())                                         return fail('City is required');
      if (pincode && pincode.length !== 6)                      return fail('Enter a valid 6-digit pincode');
      if (whatsapp && whatsapp.replace(/\D/g,'').length !== 10) return fail('Enter a valid WhatsApp number');
    }
    return true;
  };

  const goNext = () => { if (validateStep()) { animateIn(); setStep(s => s + 1); } };
  const goBack = () => { setError(''); animateIn(); setStep(s => s - 1); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(), phone: phone.replace(/\D/g,''),
        password, shop_name: shopName.trim(),
        category: category.trim(), city: city.trim(),
      };
      if (email)    payload.email            = email.trim();
      if (company)  payload.company_name     = company.trim();  // ← NEW: send company_name to API
      if (shopDesc) payload.shop_description = shopDesc.trim();
      if (address)  payload.address          = address.trim();
      if (pincode)  payload.pincode          = pincode;
      if (whatsapp) payload.whatsapp_number  = whatsapp.replace(/\D/g,'');

      const res  = await fetch(`${API_BASE_URL}${ENDPOINTS.register}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}

      if (res.ok && (data.access_token || data.access || data.id)) {
        if (data.access_token || data.access) {
          await signIn({ accessToken: data.access_token || data.access, refreshToken: data.refresh_token || data.refresh || '' });
        } else {
          Alert.alert('Account Created! 🎉', `Welcome ${name}!\nPlease sign in.`, [
            { text: 'Sign In', onPress: () => navigation.navigate('Login') },
          ]);
        }
      } else {
        let msg = data.error || data.detail || data.message;
        if (!msg) msg = Object.entries(data).map(([k,v]) => `${k}: ${Array.isArray(v)?v[0]:v}`).join('\n');
        fail(msg || 'Registration failed. Please try again.');
      }
    } catch (e: any) {
      fail(e.message?.includes('Network') || e.message?.includes('fetch')
        ? 'Cannot connect to server. Check your internet.'
        : e.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const Field = ({ id, label, value, onChange, placeholder, keyboard = 'default' as any,
                   secure = false, multiline = false, suffix = null as any }) => (
    <View style={S.fg}>
      <Text style={S.fl}>{label}</Text>
      <View style={[S.fw, focused === id && S.ff, multiline && { height: 84, alignItems: 'flex-start' as any }]}>
        <TextInput
          style={[S.fi, multiline && { height: 72, textAlignVertical: 'top' as any, paddingTop: 4 }]}
          placeholder={placeholder} placeholderTextColor="#AEAEB2"
          value={value} onChangeText={onChange} keyboardType={keyboard}
          secureTextEntry={secure} multiline={multiline}
          autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
          onFocus={() => setFocused(id)} onBlur={() => setFocused(null)}
          editable={!loading}
        />
        {suffix}
      </View>
    </View>
  );

  const steps = [
    // ─── Step 0 : Account ─────────────────────────────────────────────────────
    <React.Fragment key="0">
      <Field id="name"    label="Full Name"           value={name}     onChange={setName}     placeholder="Your full name" />
      {/* ── NEW: Company Name field ── */}
      <Field id="company" label="Company Name (optional)" value={company} onChange={setCompany} placeholder="e.g. Riya Enterprises Pvt. Ltd." />
      <Field id="phone"   label="Phone Number"        value={phone}    onChange={(t:string)=>setPhone(t.replace(/\D/g,'').slice(0,10))} placeholder="9876543210" keyboard="numeric" />
      <Field id="email"   label="Email (optional)"    value={email}    onChange={setEmail}    placeholder="your@email.com" keyboard="email-address" />
      <Field id="pass"    label="Password"            value={password} onChange={setPassword} placeholder="Min 6 characters" secure={!showPass}
        suffix={<TouchableOpacity onPress={()=>setShowPass(p=>!p)} hitSlop={{top:10,bottom:10,left:10,right:10}}><Text style={{fontSize:18,color:'#AEAEB2'}}>{showPass?'👁':'🙈'}</Text></TouchableOpacity>}
      />
      <Field id="cnf"     label="Confirm Password"   value={confirm}  onChange={setConfirm}  placeholder="Repeat password" secure />
    </React.Fragment>,

    // ─── Step 1 : Shop ────────────────────────────────────────────────────────
    <React.Fragment key="1">
      <Field id="shop"    label="Shop Name"              value={shopName} onChange={setShopName} placeholder="e.g. Riya Textiles" />
      <Field id="cat"     label="Category"               value={category} onChange={setCategory} placeholder="e.g. Clothing, Grocery" />
      <Field id="desc"    label="Description (optional)" value={shopDesc} onChange={setShopDesc} placeholder="Brief shop description" multiline />
    </React.Fragment>,

    // ─── Step 2 : Location ────────────────────────────────────────────────────
    <React.Fragment key="2">
      <Field id="city"    label="City"                   value={city}     onChange={setCity}     placeholder="e.g. Kochi" />
      <Field id="addr"    label="Address (optional)"     value={address}  onChange={setAddress}  placeholder="Street / area" />
      <Field id="pin"     label="Pincode"                value={pincode}  onChange={(t:string)=>setPincode(t.replace(/\D/g,'').slice(0,6))} placeholder="682001" keyboard="numeric" />
      <Field id="wa"      label="WhatsApp (optional)"    value={whatsapp} onChange={(t:string)=>setWhatsapp(t.replace(/\D/g,'').slice(0,10))} placeholder="10-digit number" keyboard="numeric" />
    </React.Fragment>,
  ];

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView style={S.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={S.header}>
            <View style={S.logoWrap}>
              <Image
                source={{ uri: 'https://raw.githubusercontent.com/Adarsh-oo7/KERALASELLER-APP/master/assets/icon.png' }}
                style={S.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={S.appName}>Kerala Sellers</Text>
            <Text style={S.appTag}>Create your seller account</Text>
          </View>

          {/* Step bar */}
          <View style={S.stepRow}>
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <View style={S.stepItem}>
                  <View style={[S.stepCircle, i < step && S.stepDone, i === step && S.stepActive]}>
                    <Text style={[S.stepNum, i <= step && S.stepNumActive]}>{i < step ? '✓' : s.icon}</Text>
                  </View>
                  <Text style={[S.stepLbl, i === step && S.stepLblActive]}>{s.label}</Text>
                </View>
                {i < STEPS.length - 1 && <View style={[S.stepLine, i < step && S.stepLineDone]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Form card */}
          <Animated.View style={[S.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }]}>
            <Text style={S.cardTitle}>{STEPS[step].label} Details</Text>
            {steps[step]}
          </Animated.View>

          {!!error && (
            <View style={S.errorBox}>
              <Text style={S.errorDot}>•</Text>
              <Text style={S.errorText}>{error}</Text>
            </View>
          )}

          <View style={S.btnRow}>
            {step > 0 && (
              <TouchableOpacity style={S.backBtn} onPress={goBack} disabled={loading}>
                <Text style={S.backText}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[S.nextBtn, step > 0 && { marginLeft: 12 }, loading && S.nextOff]}
              onPress={step === STEPS.length - 1 ? handleSubmit : goNext}
              disabled={loading} activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={S.nextText}>{step === STEPS.length - 1 ? 'Create Account' : 'Continue  →'}</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={S.footer}>
            <Text style={S.footerMuted}>Already have an account?  </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={S.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={S.domain}>keralasellers.in</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },
  header: { alignItems: 'center', paddingTop: 52, paddingBottom: 24 },
  logoWrap: { width: 80, height: 80, borderRadius: 18, overflow: 'hidden', marginBottom: 14, backgroundColor: '#F2F2F7' },
  logo:   { width: 80, height: 80 },
  appName:{ fontSize: 24, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3 },
  appTag: { fontSize: 13, color: '#8E8E93', marginTop: 4 },

  stepRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepItem:     { alignItems: 'center', width: 72 },
  stepCircle:   { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepActive:   { backgroundColor: '#1C1C1E' },
  stepDone:     { backgroundColor: '#30D158' },
  stepNum:      { fontSize: 18 },
  stepNumActive:{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  stepLbl:      { fontSize: 11, color: '#AEAEB2', fontWeight: '500' },
  stepLblActive:{ color: '#1C1C1E', fontWeight: '600' },
  stepLine:     { flex: 1, height: 2, backgroundColor: '#F2F2F7', marginBottom: 20 },
  stepLineDone: { backgroundColor: '#30D158' },

  card:      { backgroundColor: '#F9F9F9', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 8 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E', marginBottom: 18 },

  fg: { marginBottom: 14 },
  fl: { fontSize: 13, fontWeight: '600', color: '#3C3C43', marginBottom: 6, marginLeft: 2 },
  fw: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5EA', paddingHorizontal: 14, height: 50 },
  ff: { borderColor: '#1C1C1E' },
  fi: { flex: 1, fontSize: 16, color: '#1C1C1E', paddingVertical: 0 },

  errorBox:  { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF2F2', borderRadius: 10, padding: 12, marginBottom: 8, gap: 6 },
  errorDot:  { fontSize: 16, color: '#FF3B30', lineHeight: 20 },
  errorText: { flex: 1, fontSize: 13, color: '#FF3B30', fontWeight: '500', lineHeight: 20 },

  btnRow:   { flexDirection: 'row', marginTop: 4 },
  backBtn:  { height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E5EA', paddingHorizontal: 22, backgroundColor: '#FFFFFF' },
  backText: { fontSize: 16, color: '#1C1C1E', fontWeight: '500' },
  nextBtn:  { flex: 1, height: 54, borderRadius: 14, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 4 },
  nextOff:  { opacity: 0.55 },
  nextText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },

  footer:      { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerMuted: { fontSize: 15, color: '#8E8E93' },
  footerLink:  { fontSize: 15, color: '#007AFF', fontWeight: '500' },
  domain:      { textAlign: 'center', fontSize: 12, color: '#C7C7CC', marginTop: 32 },
});
