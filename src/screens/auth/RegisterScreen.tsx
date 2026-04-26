
// // src/screens/auth/RegisterScreen.tsx
// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity, StyleSheet,
//   ActivityIndicator, ScrollView, KeyboardAvoidingView,
//   Platform, StatusBar, Animated,
// } from 'react-native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import FirebaseAuthService from '../../services/FirebaseAuthService';
// import AuthService from '../../services/AuthService';

// type Props = { navigation: StackNavigationProp<any> };

// interface FormData {
//   name:            string;
//   shop_name:       string;
//   phone:           string;
//   email:           string;
//   password:        string;
//   confirmPassword: string;
//   otp:             string;
// }

// interface FieldErrors {
//   name?:            string;
//   shop_name?:       string;
//   phone?:           string;
//   email?:           string;
//   password?:        string;
//   confirmPassword?: string;
// }

// const EMPTY_FORM: FormData = {
//   name: '', shop_name: '', phone: '', email: '',
//   password: '', confirmPassword: '', otp: '',
// };

// const validators = {
//   name:            (v: string) => !v.trim() ? 'Full name is required' : v.trim().length < 2 ? 'At least 2 characters' : '',
//   shop_name:       (v: string) => !v.trim() ? 'Shop name is required' : v.trim().length < 2 ? 'At least 2 characters' : '',
//   phone:           (v: string) => !v ? 'Phone number is required' : !/^[6-9]\d{9}$/.test(v) ? 'Enter a valid 10-digit number' : '',
//   email:           (v: string) => !v.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email' : '',
//   password:        (v: string) => !v ? 'Password is required' : v.length < 8 ? 'Minimum 8 characters' : '',
//   confirmPassword: (v: string, pw: string) => !v ? 'Please confirm your password' : v !== pw ? 'Passwords do not match' : '',
// };

// const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
//   if (!pw)           return { label: '',       color: '#e5e7eb', width: '0%'   };
//   if (pw.length < 6) return { label: 'Weak',   color: '#ef4444', width: '25%'  };
//   if (pw.length < 8) return { label: 'Fair',   color: '#f59e0b', width: '50%'  };
//   if (/[A-Z]/.test(pw) && /\d/.test(pw)) return { label: 'Strong', color: '#10b981', width: '100%' };
//   return { label: 'Good', color: '#3b82f6', width: '75%' };
// };

// const RegisterScreen: React.FC<Props> = ({ navigation }) => {
//   const insets = useSafeAreaInsets();

//   // step: 1 = form, 2 = recap, 3 = OTP
//   const [step,           setStep]           = useState<1 | 2 | 3>(1);
//   const [loading,        setLoading]        = useState(false);
//   const [formError,      setFormError]      = useState('');
//   const [fieldErrors,    setFieldErrors]    = useState<FieldErrors>({});
//   const [showPassword,   setShowPassword]   = useState(false);
//   const [showConfirm,    setShowConfirm]    = useState(false);
//   const [verificationId, setVerificationId] = useState<any>(null);
//   const [resendCooldown, setResendCooldown] = useState(0);
//   const [form,           setForm]           = useState<FormData>(EMPTY_FORM);

//   const shakeAnim       = useRef(new Animated.Value(0)).current;
//   const cooldownRef     = useRef<ReturnType<typeof setInterval> | null>(null);
//   const isSubmittingRef = useRef(false);

//   const shopRef     = useRef<TextInput>(null);
//   const emailRef    = useRef<TextInput>(null);
//   const phoneRef    = useRef<TextInput>(null);
//   const passwordRef = useRef<TextInput>(null);
//   const confirmRef  = useRef<TextInput>(null);
//   const otpRef      = useRef<TextInput>(null);

//   const pwStrength = getPasswordStrength(form.password);

//   useEffect(() => {
//     return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
//   }, []);

//   const shake = () => {
//     Animated.sequence([
//       Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: 5,  duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: -5, duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
//     ]).start();
//   };

//   const update = (key: keyof FormData, value: string) => {
//     const cleaned = key === 'phone'
//       ? value.replace(/\D/g, '').slice(0, 10)
//       : key === 'otp'
//         ? value.replace(/\D/g, '').slice(0, 6)
//         : value;
//     setForm(prev => ({ ...prev, [key]: cleaned }));
//     setFormError('');
//     if (fieldErrors[key as keyof FieldErrors])
//       setFieldErrors(prev => ({ ...prev, [key]: undefined }));
//   };

//   const setFieldError = (key: keyof FieldErrors, msg: string) =>
//     setFieldErrors(prev => ({ ...prev, [key]: msg }));

//   const validateAll = (): boolean => {
//     const errs: FieldErrors = {};
//     errs.name            = validators.name(form.name)                                      || undefined;
//     errs.shop_name       = validators.shop_name(form.shop_name)                            || undefined;
//     errs.phone           = validators.phone(form.phone)                                    || undefined;
//     errs.email           = validators.email(form.email)                                    || undefined;
//     errs.password        = validators.password(form.password)                              || undefined;
//     errs.confirmPassword = validators.confirmPassword(form.confirmPassword, form.password) || undefined;
//     const cleaned = Object.fromEntries(Object.entries(errs).filter(([, v]) => v));
//     setFieldErrors(cleaned);
//     return Object.keys(cleaned).length === 0;
//   };

//   const startCooldown = (secs = 60) => {
//     if (cooldownRef.current) clearInterval(cooldownRef.current);
//     setResendCooldown(secs);
//     cooldownRef.current = setInterval(() => {
//       setResendCooldown(v => {
//         if (v <= 1) { clearInterval(cooldownRef.current!); cooldownRef.current = null; return 0; }
//         return v - 1;
//       });
//     }, 1000);
//   };

//   // Step 1 → Step 2 (recap)
//   const handleShowRecap = () => {
//     setFormError('');
//     if (!validateAll()) { shake(); return; }
//     setStep(2);
//   };

//   // Step 2 recap → Step 3 (send OTP)
//   const handleSendOtp = async () => {
//     if (isSubmittingRef.current) return;
//     isSubmittingRef.current = true;
//     setFormError('');
//     setLoading(true);
//     try {
//       const check = await AuthService.checkSellerExists(form.phone, form.email.trim());
//       if (check.exists) {
//         setStep(1); // go back to form to show error
//         if (check.field === 'phone') setFieldError('phone', check.message ?? 'Already registered');
//         if (check.field === 'email') setFieldError('email', check.message ?? 'Already registered');
//         shake();
//         return;
//       }

//       const confirmation = await FirebaseAuthService.sendOTP(`+91${form.phone}`);
//       setVerificationId(confirmation);
//       setStep(3);
//       startCooldown(60);
//     } catch (err: any) {
//       const msg = err.message ?? '';
//       if (msg.includes('reCAPTCHA') || msg.includes('captcha'))
//         setFormError('Verification blocked. Ensure SHA-1 & SHA-256 are added in Firebase Console, then rebuild.');
//       else if (msg.includes('Too many') || msg.includes('too-many'))
//         setFormError('Too many attempts. Please wait a few minutes before trying again.');
//       else if (msg.includes('not authorized') || msg.includes('app-not-authorized'))
//         setFormError('App not authorized. Check SHA fingerprints in Firebase Console.');
//       else
//         setFormError(msg || 'Failed to send OTP. Please try again.');
//       shake();
//     } finally {
//       setLoading(false);
//       isSubmittingRef.current = false;
//     }
//   };

//   const handleVerifyAndRegister = async () => {
//     if (isSubmittingRef.current) return;
//     isSubmittingRef.current = true;
//     setFormError('');
//     if (!form.otp || form.otp.length !== 6) {
//       setFormError('Enter the 6-digit code sent to your phone');
//       shake();
//       isSubmittingRef.current = false;
//       return;
//     }
//     setLoading(true);
//     try {
//       const firebaseResult = await FirebaseAuthService.verifyOTP(verificationId, form.otp.trim());
//       await AuthService.registerWithFirebase({
//         name:              form.name.trim(),
//         shop_name:         form.shop_name.trim(),
//         phone:             form.phone,
//         email:             form.email.trim(),
//         password:          form.password,
//         confirmPassword:   form.confirmPassword,
//         firebase_id_token: firebaseResult.idToken,
//       });
//       navigation.replace('Login');
//     } catch (err: any) {
//       setFormError(err.message ?? 'Verification failed. Please try again.');
//       shake();
//     } finally {
//       setLoading(false);
//       isSubmittingRef.current = false;
//     }
//   };

//   const handleResend = async () => {
//     if (resendCooldown > 0 || isSubmittingRef.current) return;
//     isSubmittingRef.current = true;
//     setLoading(true);
//     setForm(p => ({ ...p, otp: '' }));
//     setFormError('');
//     try {
//       const confirmation = await FirebaseAuthService.sendOTP(`+91${form.phone}`, true);
//       setVerificationId(confirmation);
//       startCooldown(60);
//     } catch (err: any) {
//       setFormError(err.message ?? 'Failed to resend OTP.');
//     } finally {
//       setLoading(false);
//       isSubmittingRef.current = false;
//     }
//   };

//   const renderField = ({
//     fieldKey, label, placeholder, keyboard = 'default', secure = false,
//     showToggle, onToggle, maxLen, nextRef, inputRef, autoCapitalize = 'words',
//   }: {
//     fieldKey:        keyof FormData;
//     label:           string;
//     placeholder:     string;
//     keyboard?:       any;
//     secure?:         boolean;
//     showToggle?:     boolean;
//     onToggle?:       () => void;
//     maxLen?:         number;
//     nextRef?:        React.RefObject<TextInput>;
//     inputRef?:       React.RefObject<TextInput>;
//     autoCapitalize?: any;
//   }) => {
//     const err  = fieldErrors[fieldKey as keyof FieldErrors];
//     const val  = form[fieldKey];
//     const isOk = !err && val.length > 0;
//     return (
//       <View style={s.field} key={fieldKey}>
//         <Text style={s.label}>{label}</Text>
//         <View style={[s.inputRow, !!err && s.inputRowError, isOk && s.inputRowOk]}>
//           <TextInput
//             ref={inputRef}
//             style={s.input}
//             value={val}
//             onChangeText={v => update(fieldKey, v)}
//             placeholder={placeholder}
//             placeholderTextColor="#9ca3af"
//             keyboardType={keyboard}
//             secureTextEntry={secure}
//             autoCapitalize={autoCapitalize}
//             autoCorrect={false}
//             editable={!loading}
//             maxLength={maxLen}
//             returnKeyType={nextRef ? 'next' : 'done'}
//             onSubmitEditing={() => nextRef?.current?.focus()}
//           />
//           {showToggle && onToggle && (
//             <TouchableOpacity onPress={onToggle} style={s.eyeBtn}
//               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
//               <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
//             </TouchableOpacity>
//           )}
//           {isOk && !showToggle && (
//             <Ionicons name="checkmark-circle" size={17} color="#10b981" style={{ marginLeft: 6 }} />
//           )}
//         </View>
//         {!!err && (
//           <View style={s.fieldErrRow}>
//             <Ionicons name="alert-circle-outline" size={12} color="#ef4444" />
//             <Text style={s.fieldErrText}>{err}</Text>
//           </View>
//         )}
//       </View>
//     );
//   };

//   // ── Step progress labels ──────────────────────────────────────────────────
//   const stepTitles = {
//     1: 'Create your account',
//     2: 'Review your details',
//     3: 'Verify your phone',
//   };
//   const stepSubs = {
//     1: 'Join Kerala Sellers and start selling today',
//     2: 'Please confirm your information below',
//     3: `Code sent to +91 ${form.phone}`,
//   };
//   const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';
//   const totalSteps = 3;

//   return (
//     <View style={[s.root, { paddingTop: insets.top }]}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
//       <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//         <ScrollView
//           contentContainerStyle={s.scroll}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Brand */}
//           <View style={s.brand}>
//             <View style={s.logoBg}>
//               <Text style={s.logoK}>K</Text>
//             </View>
//             <View>
//               <Text style={s.logoLine1}>KERALA</Text>
//               <Text style={s.logoLine2}>SELLERS</Text>
//             </View>
//           </View>

//           {/* Card */}
//           <Animated.View style={[s.card, { transform: [{ translateX: shakeAnim }] }]}>

//             <Text style={s.cardTitle}>{stepTitles[step]}</Text>
//             <Text style={s.cardSub}>{stepSubs[step]}</Text>

//             {/* Progress */}
//             <View style={s.progressWrap}>
//               <View style={s.progressTrack}>
//                 <View style={[s.progressFill, { width: progressWidth }]} />
//               </View>
//               <Text style={s.stepText}>Step {step} of {totalSteps}</Text>
//             </View>

//             {/* Global error */}
//             {!!formError && (
//               <View style={s.formError}>
//                 <Ionicons name="alert-circle" size={15} color="#991b1b" />
//                 <Text style={s.formErrorText}>{formError}</Text>
//               </View>
//             )}

//             {/* ── STEP 1: Form ── */}
//             {step === 1 && (
//               <>
//                 {renderField({ fieldKey: 'name',      label: 'Full Name',  placeholder: 'Ravi Kumar',       nextRef: shopRef,  inputRef: undefined, autoCapitalize: 'words' })}
//                 {renderField({ fieldKey: 'shop_name', label: 'Shop Name',  placeholder: 'Ravi Electronics', nextRef: emailRef, inputRef: shopRef,   autoCapitalize: 'words' })}
//                 {renderField({ fieldKey: 'email',     label: 'Email',      placeholder: 'ravi@gmail.com',   nextRef: phoneRef, inputRef: emailRef,  autoCapitalize: 'none', keyboard: 'email-address' })}

//                 {/* Phone with +91 prefix */}
//                 <View style={s.field}>
//                   <Text style={s.label}>Phone Number</Text>
//                   <View style={[s.inputRow, !!fieldErrors.phone && s.inputRowError, !fieldErrors.phone && form.phone.length === 10 && s.inputRowOk]}>
//                     <View style={s.prefixWrap}>
//                       <Text style={s.prefix}>🇮🇳 +91</Text>
//                     </View>
//                     <TextInput
//                       ref={phoneRef}
//                       style={s.input}
//                       value={form.phone}
//                       onChangeText={v => update('phone', v)}
//                       placeholder="98765 43210"
//                       placeholderTextColor="#9ca3af"
//                       keyboardType="number-pad"
//                       maxLength={10}
//                       editable={!loading}
//                       returnKeyType="next"
//                       onSubmitEditing={() => passwordRef.current?.focus()}
//                     />
//                     {!fieldErrors.phone && form.phone.length === 10 && (
//                       <Ionicons name="checkmark-circle" size={17} color="#10b981" style={{ marginLeft: 6 }} />
//                     )}
//                   </View>
//                   {!!fieldErrors.phone && (
//                     <View style={s.fieldErrRow}>
//                       <Ionicons name="alert-circle-outline" size={12} color="#ef4444" />
//                       <Text style={s.fieldErrText}>{fieldErrors.phone}</Text>
//                     </View>
//                   )}
//                 </View>

//                 {renderField({
//                   fieldKey: 'password', label: 'Password', placeholder: 'Min 8 characters',
//                   secure: !showPassword, showToggle: true, onToggle: () => setShowPassword(v => !v),
//                   nextRef: confirmRef, inputRef: passwordRef, autoCapitalize: 'none',
//                 })}
//                 {form.password.length > 0 && (
//                   <View style={s.strengthWrap}>
//                     <View style={s.strengthTrack}>
//                       <View style={[s.strengthFill, { width: pwStrength.width, backgroundColor: pwStrength.color }]} />
//                     </View>
//                     <Text style={[s.strengthLabel, { color: pwStrength.color }]}>{pwStrength.label}</Text>
//                   </View>
//                 )}
//                 {renderField({
//                   fieldKey: 'confirmPassword', label: 'Confirm Password', placeholder: 'Re-enter password',
//                   secure: !showConfirm, showToggle: true, onToggle: () => setShowConfirm(v => !v),
//                   inputRef: confirmRef, autoCapitalize: 'none',
//                 })}

//                 <TouchableOpacity
//                   style={s.primaryBtn}
//                   onPress={handleShowRecap}
//                   activeOpacity={0.85}
//                 >
//                   <Ionicons name="eye-outline" size={18} color="white" />
//                   <Text style={s.primaryBtnText}>Review Details</Text>
//                 </TouchableOpacity>
//               </>
//             )}

//             {/* ── STEP 2: Recap ── */}
//             {step === 2 && (
//               <>
//                 {/* Recap rows */}
//                 <View style={s.recapCard}>
//                   <RecapRow icon="person-outline"  label="Full Name"    value={form.name} />
//                   <RecapRow icon="storefront-outline" label="Shop Name" value={form.shop_name} />
//                   <RecapRow icon="mail-outline"    label="Email"        value={form.email} />
//                   <RecapRow icon="call-outline"    label="Phone"        value={`+91 ${form.phone}`} last />
//                 </View>

//                 {/* Security note */}
//                 <View style={s.secureNote}>
//                   <Ionicons name="lock-closed-outline" size={13} color="#6b7280" />
//                   <Text style={s.secureNoteText}>
//                     Your password is encrypted and never stored in plain text.
//                   </Text>
//                 </View>

//                 {/* Confirm & send OTP */}
//                 <TouchableOpacity
//                   style={[s.primaryBtn, loading && s.primaryBtnDim]}
//                   onPress={handleSendOtp}
//                   disabled={loading}
//                   activeOpacity={0.85}
//                 >
//                   {loading
//                     ? <><ActivityIndicator color="white" size="small" /><Text style={s.primaryBtnText}>Sending OTP…</Text></>
//                     : <><Ionicons name="phone-portrait-outline" size={18} color="white" /><Text style={s.primaryBtnText}>Confirm & Send OTP</Text></>
//                   }
//                 </TouchableOpacity>

//                 {/* Edit details */}
//                 <TouchableOpacity
//                   style={s.backBtn}
//                   onPress={() => { setStep(1); setFormError(''); }}
//                   disabled={loading}
//                 >
//                   <Ionicons name="create-outline" size={16} color="#6b7280" />
//                   <Text style={s.backBtnText}>Edit Details</Text>
//                 </TouchableOpacity>
//               </>
//             )}

//             {/* ── STEP 3: OTP ── */}
//             {step === 3 && (
//               <>
//                 <View style={s.otpHint}>
//                   <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3b82f6" />
//                   <Text style={s.otpHintText}>
//                     Enter the 6-digit code sent via SMS to{' '}
//                     <Text style={{ fontWeight: '700' }}>+91 {form.phone}</Text>
//                   </Text>
//                 </View>

//                 <View style={s.field}>
//                   <Text style={s.label}>Verification Code</Text>
//                   <View style={[s.inputRow, form.otp.length === 6 && s.inputRowOk]}>
//                     <TextInput
//                       ref={otpRef}
//                       style={[s.input, s.otpInput]}
//                       value={form.otp}
//                       onChangeText={v => update('otp', v)}
//                       placeholder="● ● ● ● ● ●"
//                       placeholderTextColor="#d1d5db"
//                       keyboardType="numeric"
//                       maxLength={6}
//                       editable={!loading}
//                       returnKeyType="done"
//                       onSubmitEditing={handleVerifyAndRegister}
//                       autoFocus
//                     />
//                     {form.otp.length === 6 && (
//                       <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginLeft: 6 }} />
//                     )}
//                   </View>
//                 </View>

//                 <TouchableOpacity
//                   onPress={handleResend}
//                   disabled={resendCooldown > 0 || loading}
//                   style={s.resendBtn}
//                 >
//                   <Text style={[s.resendText, resendCooldown > 0 && s.resendTextDim]}>
//                     {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[s.primaryBtn, (loading || form.otp.length !== 6) && s.primaryBtnDim]}
//                   onPress={handleVerifyAndRegister}
//                   disabled={loading || form.otp.length !== 6}
//                   activeOpacity={0.85}
//                 >
//                   {loading
//                     ? <><ActivityIndicator color="white" size="small" /><Text style={s.primaryBtnText}>Creating Account…</Text></>
//                     : <><Ionicons name="checkmark-done-outline" size={18} color="white" /><Text style={s.primaryBtnText}>Create Seller Account</Text></>
//                   }
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={s.backBtn}
//                   onPress={() => {
//                     setStep(2);
//                     setForm(p => ({ ...p, otp: '' }));
//                     setFormError('');
//                     if (cooldownRef.current) { clearInterval(cooldownRef.current); cooldownRef.current = null; }
//                     setResendCooldown(0);
//                   }}
//                   disabled={loading}
//                 >
//                   <Ionicons name="arrow-back-outline" size={16} color="#6b7280" />
//                   <Text style={s.backBtnText}>Back to recap</Text>
//                 </TouchableOpacity>
//               </>
//             )}

//             {/* Login link */}
//             <View style={s.loginRow}>
//               <Text style={s.loginPrompt}>Already have an account? </Text>
//               <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
//                 <Text style={s.loginLink}>Sign In</Text>
//               </TouchableOpacity>
//             </View>

//           </Animated.View>

//           <Text style={s.footer}>Kerala Sellers · Built for local businesses</Text>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   );
// };

// // ── Recap Row sub-component ───────────────────────────────────────────────────

// const RecapRow: React.FC<{
//   icon: any; label: string; value: string; last?: boolean;
// }> = ({ icon, label, value, last }) => (
//   <View style={[rr.row, !last && rr.rowBorder]}>
//     <View style={rr.iconWrap}>
//       <Ionicons name={icon} size={16} color="#3b82f6" />
//     </View>
//     <View style={rr.textWrap}>
//       <Text style={rr.label}>{label}</Text>
//       <Text style={rr.value} numberOfLines={1}>{value}</Text>
//     </View>
//   </View>
// );

// const rr = StyleSheet.create({
//   row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
//   rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
//   iconWrap:  { width: 34, height: 34, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
//   textWrap:  { flex: 1 },
//   label:     { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
//   value:     { fontSize: 14, fontWeight: '700', color: '#111827' },
// });

// // ── Styles ────────────────────────────────────────────────────────────────────

// const s = StyleSheet.create({
//   root:            { flex: 1, backgroundColor: '#f8fafc' },
//   scroll:          { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 },
//   brand:           { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, paddingTop: 12 },
//   logoBg:          { width: 48, height: 48, borderRadius: 14, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center',
//                      shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
//   logoK:           { fontSize: 26, fontWeight: '900', color: 'white' },
//   logoLine1:       { fontSize: 19, fontWeight: '900', color: '#1f2937', letterSpacing: 3 },
//   logoLine2:       { fontSize: 13, fontWeight: '700', color: '#3b82f6', letterSpacing: 4, marginTop: -2 },
//   card:            { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 20,
//                      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
//   cardTitle:       { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
//   cardSub:         { fontSize: 14, color: '#6b7280', marginBottom: 20 },
//   progressWrap:    { marginBottom: 20 },
//   progressTrack:   { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 6 },
//   progressFill:    { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2 },
//   stepText:        { fontSize: 12, color: '#9ca3af', textAlign: 'right' },
//   formError:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2',
//                      borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12, marginBottom: 16 },
//   formErrorText:   { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '500' },
//   field:           { marginBottom: 14 },
//   label:           { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
//   inputRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
//                      borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, minHeight: 50 },
//   inputRowError:   { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
//   inputRowOk:      { borderColor: '#10b981' },
//   prefixWrap:      { marginRight: 10, paddingRight: 10, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
//   prefix:          { fontSize: 13, fontWeight: '600', color: '#374151' },
//   input:           { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500', paddingVertical: 0 },
//   eyeBtn:          { padding: 4, marginLeft: 4 },
//   fieldErrRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
//   fieldErrText:    { fontSize: 12, color: '#ef4444' },
//   strengthWrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -8, marginBottom: 10 },
//   strengthTrack:   { flex: 1, height: 3, backgroundColor: '#e5e7eb', borderRadius: 2 },
//   strengthFill:    { height: '100%', borderRadius: 2 },
//   strengthLabel:   { fontSize: 11, fontWeight: '700', width: 44, textAlign: 'right' },

//   // Recap
//   recapCard:       { backgroundColor: '#f9fafb', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb',
//                      paddingHorizontal: 16, marginBottom: 16 },
//   secureNote:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20,
//                      backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10 },
//   secureNoteText:  { flex: 1, fontSize: 12, color: '#374151', lineHeight: 17 },

//   // OTP
//   otpHint:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#eff6ff',
//                      borderRadius: 10, padding: 12, marginBottom: 16 },
//   otpHintText:     { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 19 },
//   otpInput:        { textAlign: 'center', letterSpacing: 10, fontSize: 20, fontWeight: '700' },
//   resendBtn:       { alignSelf: 'flex-end', marginBottom: 12, marginTop: -4 },
//   resendText:      { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
//   resendTextDim:   { color: '#9ca3af' },

//   primaryBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
//                      backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 14, marginBottom: 10,
//                      shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
//   primaryBtnDim:   { backgroundColor: '#93c5fd', shadowOpacity: 0, elevation: 0 },
//   primaryBtnText:  { fontSize: 15, fontWeight: '700', color: 'white' },
//   backBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginBottom: 4 },
//   backBtnText:     { fontSize: 14, color: '#6b7280' },
//   loginRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
//                      marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
//   loginPrompt:     { fontSize: 14, color: '#6b7280' },
//   loginLink:       { fontSize: 14, color: '#3b82f6', fontWeight: '700' },
//   footer:          { textAlign: 'center', fontSize: 12, color: '#d1d5db', marginTop: 4 },
// });

// export default RegisterScreen;
// src/screens/auth/RegisterScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView,
  Platform, StatusBar, Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FirebaseAuthService from '../../services/FirebaseAuthService';
import AuthService from '../../services/AuthService';

type Props = { navigation: StackNavigationProp<any> };

interface FormData {
  name:            string;
  shop_name:       string;
  phone:           string;
  email:           string;
  password:        string;
  confirmPassword: string;
  otp:             string;
}

interface FieldErrors {
  name?:            string;
  shop_name?:       string;
  phone?:           string;
  email?:           string;
  password?:        string;
  confirmPassword?: string;
}

const EMPTY_FORM: FormData = {
  name: '', shop_name: '', phone: '', email: '',
  password: '', confirmPassword: '', otp: '',
};

const validators = {
  name:            (v: string) => !v.trim() ? 'Full name is required' : v.trim().length < 2 ? 'At least 2 characters' : '',
  shop_name:       (v: string) => !v.trim() ? 'Shop name is required' : v.trim().length < 2 ? 'At least 2 characters' : '',
  phone:           (v: string) => !v ? 'Phone number is required' : !/^[6-9]\d{9}$/.test(v) ? 'Enter a valid 10-digit number' : '',
  email:           (v: string) => !v.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email' : '',
  password:        (v: string) => !v ? 'Password is required' : v.length < 8 ? 'Minimum 8 characters' : '',
  confirmPassword: (v: string, pw: string) => !v ? 'Please confirm your password' : v !== pw ? 'Passwords do not match' : '',
};

const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
  if (!pw)           return { label: '',       color: '#e5e7eb', width: '0%'   };
  if (pw.length < 6) return { label: 'Weak',   color: '#ef4444', width: '25%'  };
  if (pw.length < 8) return { label: 'Fair',   color: '#f59e0b', width: '50%'  };
  if (/[A-Z]/.test(pw) && /\d/.test(pw)) return { label: 'Strong', color: '#10b981', width: '100%' };
  return { label: 'Good', color: '#3b82f6', width: '75%' };
};

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // step: 1 = form, 2 = recap, 3 = OTP
  const [step,           setStep]           = useState<1 | 2 | 3>(1);
  const [loading,        setLoading]        = useState(false);
  const [formError,      setFormError]      = useState('');
  const [fieldErrors,    setFieldErrors]    = useState<FieldErrors>({});
  const [showPassword,   setShowPassword]   = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [verificationId, setVerificationId] = useState<any>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [form,           setForm]           = useState<FormData>(EMPTY_FORM);

  const shakeAnim       = useRef(new Animated.Value(0)).current;
  const cooldownRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSubmittingRef = useRef(false);

  // ── Keyboard / scroll refs ────────────────────────────────────────────────
  // scrollRef lets us programmatically scroll to any focused field so it
  // stays visible above the keyboard on both iOS and Android.
  const scrollRef   = useRef<ScrollView>(null);
  const cardRef     = useRef<View>(null);

  const shopRef     = useRef<TextInput>(null);
  const emailRef    = useRef<TextInput>(null);
  const phoneRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef  = useRef<TextInput>(null);
  const otpRef      = useRef<TextInput>(null);

  const pwStrength = getPasswordStrength(form.password);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  // ── Scroll the focused field into view above the keyboard ─────────────────
  // We measure the input's position relative to the ScrollView content and
  // add a comfortable 120 px padding so the field sits well above the keyboard.
  const scrollToInput = (inputRef: React.RefObject<TextInput>) => {
    if (!inputRef.current || !scrollRef.current) return;
    // Small delay lets the layout settle before measuring
    setTimeout(() => {
      inputRef.current?.measureLayout(
        // @ts-ignore – findNodeHandle is the correct handle here
        scrollRef.current as any,
        (_x: number, y: number, _w: number, h: number) => {
          scrollRef.current?.scrollTo({ y: y - 80, animated: true });
        },
        () => {},
      );
    }, 100);
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const update = (key: keyof FormData, value: string) => {
    const cleaned = key === 'phone'
      ? value.replace(/\D/g, '').slice(0, 10)
      : key === 'otp'
        ? value.replace(/\D/g, '').slice(0, 6)
        : value;
    setForm(prev => ({ ...prev, [key]: cleaned }));
    setFormError('');
    if (fieldErrors[key as keyof FieldErrors])
      setFieldErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const setFieldError = (key: keyof FieldErrors, msg: string) =>
    setFieldErrors(prev => ({ ...prev, [key]: msg }));

  const validateAll = (): boolean => {
    const errs: FieldErrors = {};
    errs.name            = validators.name(form.name)                                      || undefined;
    errs.shop_name       = validators.shop_name(form.shop_name)                            || undefined;
    errs.phone           = validators.phone(form.phone)                                    || undefined;
    errs.email           = validators.email(form.email)                                    || undefined;
    errs.password        = validators.password(form.password)                              || undefined;
    errs.confirmPassword = validators.confirmPassword(form.confirmPassword, form.password) || undefined;
    const cleaned = Object.fromEntries(Object.entries(errs).filter(([, v]) => v));
    setFieldErrors(cleaned);
    return Object.keys(cleaned).length === 0;
  };

  const startCooldown = (secs = 60) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(secs);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(v => {
        if (v <= 1) { clearInterval(cooldownRef.current!); cooldownRef.current = null; return 0; }
        return v - 1;
      });
    }, 1000);
  };

  // Step 1 → Step 2 (recap)
  const handleShowRecap = () => {
    setFormError('');
    if (!validateAll()) { shake(); return; }
    setStep(2);
    // Scroll back to top when moving between steps
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
  };

  // Step 2 recap → Step 3 (send OTP)
  const handleSendOtp = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setFormError('');
    setLoading(true);
    try {
      const check = await AuthService.checkSellerExists(form.phone, form.email.trim());
      if (check.exists) {
        setStep(1);
        if (check.field === 'phone') setFieldError('phone', check.message ?? 'Already registered');
        if (check.field === 'email') setFieldError('email', check.message ?? 'Already registered');
        shake();
        return;
      }

      const confirmation = await FirebaseAuthService.sendOTP(`+91${form.phone}`);
      setVerificationId(confirmation);
      setStep(3);
      startCooldown(60);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
    } catch (err: any) {
      const msg = err.message ?? '';
      if (msg.includes('reCAPTCHA') || msg.includes('captcha'))
        setFormError('Verification blocked. Ensure SHA-1 & SHA-256 are added in Firebase Console, then rebuild.');
      else if (msg.includes('Too many') || msg.includes('too-many'))
        setFormError('Too many attempts. Please wait a few minutes before trying again.');
      else if (msg.includes('not authorized') || msg.includes('app-not-authorized'))
        setFormError('App not authorized. Check SHA fingerprints in Firebase Console.');
      else
        setFormError(msg || 'Failed to send OTP. Please try again.');
      shake();
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerifyAndRegister = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setFormError('');
    if (!form.otp || form.otp.length !== 6) {
      setFormError('Enter the 6-digit code sent to your phone');
      shake();
      isSubmittingRef.current = false;
      return;
    }
    setLoading(true);
    try {
      const firebaseResult = await FirebaseAuthService.verifyOTP(verificationId, form.otp.trim());
      await AuthService.registerWithFirebase({
        name:              form.name.trim(),
        shop_name:         form.shop_name.trim(),
        phone:             form.phone,
        email:             form.email.trim(),
        password:          form.password,
        confirmPassword:   form.confirmPassword,
        firebase_id_token: firebaseResult.idToken,
      });
      navigation.replace('Login');
    } catch (err: any) {
      setFormError(err.message ?? 'Verification failed. Please try again.');
      shake();
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setForm(p => ({ ...p, otp: '' }));
    setFormError('');
    try {
      const confirmation = await FirebaseAuthService.sendOTP(`+91${form.phone}`, true);
      setVerificationId(confirmation);
      startCooldown(60);
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to resend OTP.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const renderField = ({
    fieldKey, label, placeholder, keyboard = 'default', secure = false,
    showToggle, onToggle, maxLen, nextRef, inputRef, autoCapitalize = 'words',
  }: {
    fieldKey:        keyof FormData;
    label:           string;
    placeholder:     string;
    keyboard?:       any;
    secure?:         boolean;
    showToggle?:     boolean;
    onToggle?:       () => void;
    maxLen?:         number;
    nextRef?:        React.RefObject<TextInput>;
    inputRef?:       React.RefObject<TextInput>;
    autoCapitalize?: any;
  }) => {
    const err  = fieldErrors[fieldKey as keyof FieldErrors];
    const val  = form[fieldKey];
    const isOk = !err && val.length > 0;
    return (
      <View style={s.field} key={fieldKey}>
        <Text style={s.label}>{label}</Text>
        <View style={[s.inputRow, !!err && s.inputRowError, isOk && s.inputRowOk]}>
          <TextInput
            ref={inputRef}
            style={s.input}
            value={val}
            onChangeText={v => update(fieldKey, v)}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            keyboardType={keyboard}
            secureTextEntry={secure}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            editable={!loading}
            maxLength={maxLen}
            returnKeyType={nextRef ? 'next' : 'done'}
            onSubmitEditing={() => nextRef?.current?.focus()}
            // ── Scroll field into view when focused ──────────────────────
            onFocus={() => inputRef && scrollToInput(inputRef)}
          />
          {showToggle && onToggle && (
            <TouchableOpacity onPress={onToggle} style={s.eyeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
          {isOk && !showToggle && (
            <Ionicons name="checkmark-circle" size={17} color="#10b981" style={{ marginLeft: 6 }} />
          )}
        </View>
        {!!err && (
          <View style={s.fieldErrRow}>
            <Ionicons name="alert-circle-outline" size={12} color="#ef4444" />
            <Text style={s.fieldErrText}>{err}</Text>
          </View>
        )}
      </View>
    );
  };

  // ── Step progress labels ──────────────────────────────────────────────────
  const stepTitles = {
    1: 'Create your account',
    2: 'Review your details',
    3: 'Verify your phone',
  };
  const stepSubs = {
    1: 'Join Kerala Sellers and start selling today',
    2: 'Please confirm your information below',
    3: `Code sent to +91 ${form.phone}`,
  };
  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';
  const totalSteps = 3;

  // ── Keyboard avoiding offset (status bar + safe area top) ─────────────────
  // On iOS, 'padding' mode shrinks the scroll container by the keyboard height.
  // On Android, 'height' mode does the same. Both need a small extra offset so
  // the content clears the system status bar correctly.
  const keyboardVerticalOffset = Platform.OS === 'ios' ? insets.top + 10 : 0;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/*
        ── FIX 1: Use 'padding' on iOS and 'height' on Android ──────────────
        Previously Android received `undefined` so the keyboard covered fields.
        'height' shrinks the KeyboardAvoidingView so the ScrollView stays above
        the keyboard on Android too.
      */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {/*
          ── FIX 2: Pass scrollRef + scrollToEnd/scrollToInput ────────────
          keyboardShouldPersistTaps="handled" was already correct.
          We add ref={scrollRef} so scrollToInput() can measure & scroll.
        */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // ── FIX 3: Don't dismiss keyboard on drag so user can scroll ───
          keyboardDismissMode="interactive"
        >
          {/* Brand */}
          <View style={s.brand}>
            <View style={s.logoBg}>
              <Text style={s.logoK}>K</Text>
            </View>
            <View>
              <Text style={s.logoLine1}>KERALA</Text>
              <Text style={s.logoLine2}>SELLERS</Text>
            </View>
          </View>

          {/* Card */}
          <Animated.View style={[s.card, { transform: [{ translateX: shakeAnim }] }]}>

            <Text style={s.cardTitle}>{stepTitles[step]}</Text>
            <Text style={s.cardSub}>{stepSubs[step]}</Text>

            {/* Progress */}
            <View style={s.progressWrap}>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: progressWidth }]} />
              </View>
              <Text style={s.stepText}>Step {step} of {totalSteps}</Text>
            </View>

            {/* Global error */}
            {!!formError && (
              <View style={s.formError}>
                <Ionicons name="alert-circle" size={15} color="#991b1b" />
                <Text style={s.formErrorText}>{formError}</Text>
              </View>
            )}

            {/* ── STEP 1: Form ── */}
            {step === 1 && (
              <>
                {renderField({ fieldKey: 'name',      label: 'Full Name',  placeholder: 'Ravi Kumar',       nextRef: shopRef,  inputRef: undefined, autoCapitalize: 'words' })}
                {renderField({ fieldKey: 'shop_name', label: 'Shop Name',  placeholder: 'Ravi Electronics', nextRef: emailRef, inputRef: shopRef,   autoCapitalize: 'words' })}
                {renderField({ fieldKey: 'email',     label: 'Email',      placeholder: 'ravi@gmail.com',   nextRef: phoneRef, inputRef: emailRef,  autoCapitalize: 'none', keyboard: 'email-address' })}

                {/* Phone with +91 prefix */}
                <View style={s.field}>
                  <Text style={s.label}>Phone Number</Text>
                  <View style={[s.inputRow, !!fieldErrors.phone && s.inputRowError, !fieldErrors.phone && form.phone.length === 10 && s.inputRowOk]}>
                    <View style={s.prefixWrap}>
                      <Text style={s.prefix}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      ref={phoneRef}
                      style={s.input}
                      value={form.phone}
                      onChangeText={v => update('phone', v)}
                      placeholder="98765 43210"
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                      maxLength={10}
                      editable={!loading}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      onFocus={() => scrollToInput(phoneRef)}
                    />
                    {!fieldErrors.phone && form.phone.length === 10 && (
                      <Ionicons name="checkmark-circle" size={17} color="#10b981" style={{ marginLeft: 6 }} />
                    )}
                  </View>
                  {!!fieldErrors.phone && (
                    <View style={s.fieldErrRow}>
                      <Ionicons name="alert-circle-outline" size={12} color="#ef4444" />
                      <Text style={s.fieldErrText}>{fieldErrors.phone}</Text>
                    </View>
                  )}
                </View>

                {renderField({
                  fieldKey: 'password', label: 'Password', placeholder: 'Min 8 characters',
                  secure: !showPassword, showToggle: true, onToggle: () => setShowPassword(v => !v),
                  nextRef: confirmRef, inputRef: passwordRef, autoCapitalize: 'none',
                })}
                {form.password.length > 0 && (
                  <View style={s.strengthWrap}>
                    <View style={s.strengthTrack}>
                      <View style={[s.strengthFill, { width: pwStrength.width, backgroundColor: pwStrength.color }]} />
                    </View>
                    <Text style={[s.strengthLabel, { color: pwStrength.color }]}>{pwStrength.label}</Text>
                  </View>
                )}
                {renderField({
                  fieldKey: 'confirmPassword', label: 'Confirm Password', placeholder: 'Re-enter password',
                  secure: !showConfirm, showToggle: true, onToggle: () => setShowConfirm(v => !v),
                  inputRef: confirmRef, autoCapitalize: 'none',
                })}

                <TouchableOpacity
                  style={s.primaryBtn}
                  onPress={handleShowRecap}
                  activeOpacity={0.85}
                >
                  <Ionicons name="eye-outline" size={18} color="white" />
                  <Text style={s.primaryBtnText}>Review Details</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── STEP 2: Recap ── */}
            {step === 2 && (
              <>
                <View style={s.recapCard}>
                  <RecapRow icon="person-outline"    label="Full Name"  value={form.name} />
                  <RecapRow icon="storefront-outline" label="Shop Name" value={form.shop_name} />
                  <RecapRow icon="mail-outline"      label="Email"      value={form.email} />
                  <RecapRow icon="call-outline"      label="Phone"      value={`+91 ${form.phone}`} last />
                </View>

                <View style={s.secureNote}>
                  <Ionicons name="lock-closed-outline" size={13} color="#6b7280" />
                  <Text style={s.secureNoteText}>
                    Your password is encrypted and never stored in plain text.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[s.primaryBtn, loading && s.primaryBtnDim]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <><ActivityIndicator color="white" size="small" /><Text style={s.primaryBtnText}>Sending OTP…</Text></>
                    : <><Ionicons name="phone-portrait-outline" size={18} color="white" /><Text style={s.primaryBtnText}>Confirm & Send OTP</Text></>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.backBtn}
                  onPress={() => { setStep(1); setFormError(''); }}
                  disabled={loading}
                >
                  <Ionicons name="create-outline" size={16} color="#6b7280" />
                  <Text style={s.backBtnText}>Edit Details</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── STEP 3: OTP ── */}
            {step === 3 && (
              <>
                <View style={s.otpHint}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3b82f6" />
                  <Text style={s.otpHintText}>
                    Enter the 6-digit code sent via SMS to{' '}
                    <Text style={{ fontWeight: '700' }}>+91 {form.phone}</Text>
                  </Text>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Verification Code</Text>
                  <View style={[s.inputRow, form.otp.length === 6 && s.inputRowOk]}>
                    <TextInput
                      ref={otpRef}
                      style={[s.input, s.otpInput]}
                      value={form.otp}
                      onChangeText={v => update('otp', v)}
                      placeholder="● ● ● ● ● ●"
                      placeholderTextColor="#d1d5db"
                      keyboardType="numeric"
                      maxLength={6}
                      editable={!loading}
                      returnKeyType="done"
                      onSubmitEditing={handleVerifyAndRegister}
                      // ── FIX 4: Delay autoFocus so scroll settles first ──
                      // Using a ref-based focus call after a short delay is
                      // more reliable than the autoFocus prop on step change.
                      onFocus={() => scrollToInput(otpRef)}
                    />
                    {form.otp.length === 6 && (
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginLeft: 6 }} />
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  style={s.resendBtn}
                >
                  <Text style={[s.resendText, resendCooldown > 0 && s.resendTextDim]}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.primaryBtn, (loading || form.otp.length !== 6) && s.primaryBtnDim]}
                  onPress={handleVerifyAndRegister}
                  disabled={loading || form.otp.length !== 6}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <><ActivityIndicator color="white" size="small" /><Text style={s.primaryBtnText}>Creating Account…</Text></>
                    : <><Ionicons name="checkmark-done-outline" size={18} color="white" /><Text style={s.primaryBtnText}>Create Seller Account</Text></>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.backBtn}
                  onPress={() => {
                    setStep(2);
                    setForm(p => ({ ...p, otp: '' }));
                    setFormError('');
                    if (cooldownRef.current) { clearInterval(cooldownRef.current); cooldownRef.current = null; }
                    setResendCooldown(0);
                    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
                  }}
                  disabled={loading}
                >
                  <Ionicons name="arrow-back-outline" size={16} color="#6b7280" />
                  <Text style={s.backBtnText}>Back to recap</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Login link */}
            <View style={s.loginRow}>
              <Text style={s.loginPrompt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
                <Text style={s.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>

          <Text style={s.footer}>Kerala Sellers · Built for local businesses</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ── Recap Row sub-component ───────────────────────────────────────────────────

const RecapRow: React.FC<{
  icon: any; label: string; value: string; last?: boolean;
}> = ({ icon, label, value, last }) => (
  <View style={[rr.row, !last && rr.rowBorder]}>
    <View style={rr.iconWrap}>
      <Ionicons name={icon} size={16} color="#3b82f6" />
    </View>
    <View style={rr.textWrap}>
      <Text style={rr.label}>{label}</Text>
      <Text style={rr.value} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

const rr = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  iconWrap:  { width: 34, height: 34, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  textWrap:  { flex: 1 },
  label:     { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value:     { fontSize: 14, fontWeight: '700', color: '#111827' },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#f8fafc' },
  scroll:          { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 },
  brand:           { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, paddingTop: 12 },
  logoBg:          { width: 48, height: 48, borderRadius: 14, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center',
                     shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  logoK:           { fontSize: 26, fontWeight: '900', color: 'white' },
  logoLine1:       { fontSize: 19, fontWeight: '900', color: '#1f2937', letterSpacing: 3 },
  logoLine2:       { fontSize: 13, fontWeight: '700', color: '#3b82f6', letterSpacing: 4, marginTop: -2 },
  card:            { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 20,
                     shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  cardTitle:       { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  cardSub:         { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  progressWrap:    { marginBottom: 20 },
  progressTrack:   { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 6 },
  progressFill:    { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2 },
  stepText:        { fontSize: 12, color: '#9ca3af', textAlign: 'right' },
  formError:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2',
                     borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12, marginBottom: 16 },
  formErrorText:   { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '500' },
  field:           { marginBottom: 14 },
  label:           { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
                     borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, minHeight: 50 },
  inputRowError:   { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  inputRowOk:      { borderColor: '#10b981' },
  prefixWrap:      { marginRight: 10, paddingRight: 10, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  prefix:          { fontSize: 13, fontWeight: '600', color: '#374151' },
  input:           { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500', paddingVertical: 0 },
  eyeBtn:          { padding: 4, marginLeft: 4 },
  fieldErrRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  fieldErrText:    { fontSize: 12, color: '#ef4444' },
  strengthWrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -8, marginBottom: 10 },
  strengthTrack:   { flex: 1, height: 3, backgroundColor: '#e5e7eb', borderRadius: 2 },
  strengthFill:    { height: '100%', borderRadius: 2 },
  strengthLabel:   { fontSize: 11, fontWeight: '700', width: 44, textAlign: 'right' },

  // Recap
  recapCard:       { backgroundColor: '#f9fafb', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb',
                     paddingHorizontal: 16, marginBottom: 16 },
  secureNote:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20,
                     backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10 },
  secureNoteText:  { flex: 1, fontSize: 12, color: '#374151', lineHeight: 17 },

  // OTP
  otpHint:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#eff6ff',
                     borderRadius: 10, padding: 12, marginBottom: 16 },
  otpHintText:     { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 19 },
  otpInput:        { textAlign: 'center', letterSpacing: 10, fontSize: 20, fontWeight: '700' },
  resendBtn:       { alignSelf: 'flex-end', marginBottom: 12, marginTop: -4 },
  resendText:      { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  resendTextDim:   { color: '#9ca3af' },

  primaryBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                     backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 14, marginBottom: 10,
                     shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  primaryBtnDim:   { backgroundColor: '#93c5fd', shadowOpacity: 0, elevation: 0 },
  primaryBtnText:  { fontSize: 15, fontWeight: '700', color: 'white' },
  backBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginBottom: 4 },
  backBtnText:     { fontSize: 14, color: '#6b7280' },
  loginRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                     marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  loginPrompt:     { fontSize: 14, color: '#6b7280' },
  loginLink:       { fontSize: 14, color: '#3b82f6', fontWeight: '700' },
  footer:          { textAlign: 'center', fontSize: 12, color: '#d1d5db', marginTop: 4 },
});

export default RegisterScreen;