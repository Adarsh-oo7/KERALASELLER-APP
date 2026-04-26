
// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   Switch,
//   Platform,
//   KeyboardAvoidingView,
//   Image,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import * as ImagePicker from 'expo-image-picker';
// import { Ionicons } from '@expo/vector-icons';
// import { COLORS } from '../../constants/colors';
// import { api } from '../../config/api';
// import { useAuth } from '../../context/AuthContext';
// import MainLayout from '../../components/layout/MainLayout';

// interface StoreProfile {
//   name: string;
//   description: string;
//   whatsapp_number: string;
//   tagline: string;
//   instagram_link: string;
//   facebook_link: string;
//   email: string;
//   delivery_time_local: string;
//   delivery_time_national: string;
//   meta_title: string;
//   meta_description: string;
//   payment_method: 'NONE' | 'RAZORPAY'; // ← UPI removed
//   razorpay_key_id: string;
//   razorpay_key_secret: string;
//   accepts_cod: boolean;
//   gst_number: string;
//   business_license: string;
//   owner_name: string;
//   business_address: string;
//   verification_status: 'pending' | 'verified' | 'rejected';
//   cloudinary_logo?: any;
//   cloudinary_banner?: any;
// }

// export default function SettingsScreen({ navigation }: { navigation: any }) {
//   const [activeTab, setActiveTab] = useState<'basic' | 'business' | 'payments'>('basic');
//   const [store, setStore] = useState<StoreProfile>({
//     name: '', description: '', whatsapp_number: '', tagline: '',
//     instagram_link: '', facebook_link: '', email: '',
//     delivery_time_local: '', delivery_time_national: '',
//     meta_title: '', meta_description: '',
//     payment_method: 'NONE', razorpay_key_id: '', razorpay_key_secret: '',
//     accepts_cod: false, gst_number: '', business_license: '',
//     owner_name: '', business_address: '', verification_status: 'pending',
//   });

//   const [isLoading,          setIsLoading]          = useState(true);
//   const [isSaving,           setIsSaving]           = useState(false);
//   const [verificationProgress, setVerificationProgress] = useState(0);
//   const [showSecrets,        setShowSecrets]        = useState<Record<string, boolean>>({});

//   const [logoUri,            setLogoUri]            = useState<string | null>(null);
//   const [isUploadingLogo,    setIsUploadingLogo]    = useState(false);
//   const [bannerUri,          setBannerUri]          = useState<string | null>(null);
//   const [isUploadingBanner,  setIsUploadingBanner]  = useState(false);

//   const { logout } = useAuth();

//   useEffect(() => { fetchStoreProfile(); }, []);

//   const fetchStoreProfile = useCallback(async () => {
//     try {
//       const response  = await api.getStoreProfile();
//       const sellerData = response.seller        || {};
//       const storeData  = response.store_profile || {};

//       // Normalise payment_method — strip legacy UPI values from API
//       const rawMethod  = storeData.payment_method || 'NONE';
//       const safeMethod: 'NONE' | 'RAZORPAY' =
//         rawMethod === 'RAZORPAY' ? 'RAZORPAY' : 'NONE';

//       setStore(prev => ({
//         ...prev,
//         name:                     storeData.name             || sellerData.shop_name || '',
//         description:              storeData.description      || '',
//         whatsapp_number:          storeData.whatsapp_number  || sellerData.phone     || '',
//         tagline:                  storeData.tagline          || '',
//         email:                    sellerData.email           || '',
//         instagram_link:           storeData.instagram_link   || '',
//         facebook_link:            storeData.facebook_link    || '',
//         delivery_time_local:      storeData.delivery_time_local    || '1-2 days',
//         delivery_time_national:   storeData.delivery_time_national || '3-5 days',
//         meta_title:               storeData.meta_title       || '',
//         meta_description:         storeData.meta_description || '',
//         payment_method:           safeMethod,
//         razorpay_key_id:          storeData.razorpay_key_id     || '',
//         razorpay_key_secret:      storeData.razorpay_key_secret  || '',
//         accepts_cod:              Boolean(storeData.accepts_cod),
//         gst_number:               storeData.gst_number       || '',
//         business_license:         storeData.business_license || '',
//         owner_name:               storeData.owner_name       || '',
//         business_address:         storeData.business_address || '',
//         verification_status:      storeData.verification_status || 'pending',
//         cloudinary_logo:          storeData.cloudinary_logo,
//         cloudinary_banner:        storeData.cloudinary_banner,
//       }));

//       if (storeData.cloudinary_logo) {
//         setLogoUri(
//           typeof storeData.cloudinary_logo === 'string'
//             ? storeData.cloudinary_logo
//             : storeData.cloudinary_logo.url
//         );
//       }
//       if (storeData.cloudinary_banner) {
//         setBannerUri(
//           typeof storeData.cloudinary_banner === 'string'
//             ? storeData.cloudinary_banner
//             : storeData.cloudinary_banner.url
//         );
//       }

//       calculateProgress(storeData);
//     } catch (error: any) {
//       console.error('❌ Error fetching store profile:', error);
//       Alert.alert('Load Error', 'Failed to load store settings.');
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   const calculateProgress = (storeData: any) => {
//     const required  = ['name', 'description', 'whatsapp_number', 'owner_name', 'business_address'];
//     const completed = required.filter(f => storeData[f]?.trim()).length;
//     setVerificationProgress(Math.round((completed / required.length) * 100));
//   };

//   const handleInputChange = (field: keyof StoreProfile, value: string | boolean) => {
//     setStore(prev => ({ ...prev, [field]: value }));
//   };

//   // ── Logo ──────────────────────────────────────────────────────────────────

//   const pickLogo = async () => {
//     try {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow access to photos.'); return; }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true, aspect: [1, 1], quality: 0.8,
//       });
//       if (!result.canceled && result.assets[0]) {
//         const uri = result.assets[0].uri;
//         setLogoUri(uri);
//         await uploadLogoToCloudinary(uri);
//       }
//     } catch (error) {
//       console.error('❌ Error picking logo:', error);
//       Alert.alert('Error', 'Failed to pick logo');
//     }
//   };

//   const uploadLogoToCloudinary = async (uri: string) => {
//     setIsUploadingLogo(true);
//     try {
//       const formData = new FormData();
//       formData.append('file',           { uri, type: 'image/jpeg', name: 'store_logo.jpg' } as any);
//       formData.append('upload_preset',  'kerala_sellers');
//       formData.append('cloud_name',     'dlqm6dyps');

//       const res  = await fetch('https://api.cloudinary.com/v1_1/dlqm6dyps/image/upload', { method: 'POST', body: formData });
//       const data = await res.json();
//       if (data.secure_url) {
//         setStore(prev => ({ ...prev, cloudinary_logo: { url: data.secure_url, public_id: data.public_id } }));
//         Alert.alert('Success', 'Logo uploaded!');
//       }
//     } catch (error) {
//       console.error('❌ Upload error:', error);
//       Alert.alert('Upload Error', 'Failed to upload logo.');
//     } finally {
//       setIsUploadingLogo(false);
//     }
//   };

//   // ── Banner ────────────────────────────────────────────────────────────────

//   const pickBanner = async () => {
//     try {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow access to photos.'); return; }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true, aspect: [3, 1], quality: 0.8,
//       });
//       if (!result.canceled && result.assets[0]) {
//         const uri = result.assets[0].uri;
//         setBannerUri(uri);
//         await uploadBannerToCloudinary(uri);
//       }
//     } catch (error) {
//       console.error('❌ Error picking banner:', error);
//       Alert.alert('Error', 'Failed to pick banner');
//     }
//   };

//   const uploadBannerToCloudinary = async (uri: string) => {
//     setIsUploadingBanner(true);
//     try {
//       const formData = new FormData();
//       formData.append('file',           { uri, type: 'image/jpeg', name: 'store_banner.jpg' } as any);
//       formData.append('upload_preset',  'kerala_sellers');
//       formData.append('cloud_name',     'dlqm6dyps');

//       const res  = await fetch('https://api.cloudinary.com/v1_1/dlqm6dyps/image/upload', { method: 'POST', body: formData });
//       const data = await res.json();
//       if (data.secure_url) {
//         setStore(prev => ({ ...prev, cloudinary_banner: { url: data.secure_url, public_id: data.public_id } }));
//         Alert.alert('Success', 'Banner uploaded!');
//       }
//     } catch (error) {
//       console.error('❌ Upload error:', error);
//       Alert.alert('Upload Error', 'Failed to upload banner.');
//     } finally {
//       setIsUploadingBanner(false);
//     }
//   };

//   // ── Validation ────────────────────────────────────────────────────────────

//   const validateForm = (): string[] => {
//     const errors: string[] = [];
//     if (!store.name?.trim())             errors.push('Store name is required');
//     if (!store.description?.trim())      errors.push('Store description is required');
//     if (!store.whatsapp_number?.trim())  errors.push('WhatsApp number is required');
//     if (store.whatsapp_number && !/^(\+91|91)?[6-9]\d{9}$/.test(store.whatsapp_number.replace(/\s+/g, ''))) {
//       errors.push('Please enter a valid Indian mobile number');
//     }
//     if (store.payment_method === 'RAZORPAY') {
//       if (!store.razorpay_key_id?.trim())     errors.push('Razorpay Key ID is required');
//       if (!store.razorpay_key_secret?.trim())  errors.push('Razorpay Key Secret is required');
//     }
//     return errors;
//   };

//   const handleSubmit = async () => {
//     const validationErrors = validateForm();
//     if (validationErrors.length > 0) { Alert.alert('Validation Error', validationErrors.join('\n')); return; }

//     setIsSaving(true);
//     try {
//       const response = await api.updateStoreProfile(store);
//       calculateProgress(response.store_profile || response);
//       Alert.alert('Success! 🎉', 'Store settings updated!');
//     } catch (error: any) {
//       console.error('❌ Update error:', error);
//       Alert.alert('Update Error', error.message || 'Failed to update.');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const toggleSecretVisibility = (field: string) => {
//     setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
//   };

//   const getVerificationStatusDisplay = () => {
//     const config = {
//       pending:  { icon: 'time-outline',     color: COLORS.warning, text: 'Verification Pending',  bgColor: '#FEF3C7' },
//       verified: { icon: 'checkmark-circle', color: COLORS.success, text: 'Verified Seller',        bgColor: '#D1FAE5' },
//       rejected: { icon: 'close-circle',     color: COLORS.error,   text: 'Verification Rejected',  bgColor: '#FEE2E2' },
//     };
//     return config[store.verification_status] || config.verified;
//   };

//   // ── Loading ───────────────────────────────────────────────────────────────

//   if (isLoading) {
//     return (
//       <MainLayout navigation={navigation} currentTab="settings" headerTitle="Settings">
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={COLORS.primary} />
//           <Text style={styles.loadingText}>Loading Settings...</Text>
//         </View>
//       </MainLayout>
//     );
//   }

//   // ── Render ────────────────────────────────────────────────────────────────

//   return (
//     <MainLayout navigation={navigation} currentTab="settings" headerTitle="Store Settings">
//       <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
//         <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

//           {/* Header */}
//           <View style={styles.headerCard}>
//             <LinearGradient colors={['#667eea', '#764ba2']} style={styles.headerGradient}>
//               <Ionicons name="settings" size={40} color={COLORS.surface} />
//               <Text style={styles.headerTitle}>Store Settings</Text>
//               <Text style={styles.headerSubtitle}>Configure your {store.name || 'store'}</Text>
//             </LinearGradient>
//           </View>

//           {/* Verification Status */}
//           <View style={styles.statusCard}>
//             <View style={styles.statusHeader}>
//               <View style={[styles.statusIconContainer, { backgroundColor: getVerificationStatusDisplay().bgColor }]}>
//                 <Ionicons name={getVerificationStatusDisplay().icon as any} size={20} color={getVerificationStatusDisplay().color} />
//               </View>
//               <View style={styles.statusTextContainer}>
//                 <Text style={styles.statusTitle}>Verification Status</Text>
//                 <Text style={[styles.statusText, { color: getVerificationStatusDisplay().color }]}>
//                   {getVerificationStatusDisplay().text}
//                 </Text>
//               </View>
//             </View>
//             <View style={styles.progressContainer}>
//               <View style={styles.progressHeader}>
//                 <Text style={styles.progressLabel}>Profile Completion</Text>
//                 <Text style={styles.progressPercent}>{verificationProgress}%</Text>
//               </View>
//               <View style={styles.progressBarContainer}>
//                 <View style={styles.progressBar}>
//                   <View style={[styles.progressFill, { width: `${verificationProgress}%` }]} />
//                 </View>
//               </View>
//             </View>
//           </View>

//           {/* Tabs */}
//           <View style={styles.tabContainer}>
//             {(['basic', 'business', 'payments'] as const).map((tab) => (
//               <TouchableOpacity
//                 key={tab}
//                 style={[styles.tab, activeTab === tab && styles.activeTab]}
//                 onPress={() => setActiveTab(tab)}
//               >
//                 <Ionicons
//                   name={tab === 'basic' ? 'information-circle' : tab === 'business' ? 'business' : 'card'}
//                   size={18}
//                   color={activeTab === tab ? COLORS.surface : COLORS.textSecondary}
//                 />
//                 <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
//                   {tab.charAt(0).toUpperCase() + tab.slice(1)}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Form Content */}
//           <View style={styles.formContainer}>

//             {/* ── Basic Tab ── */}
//             {activeTab === 'basic' && (
//               <View>
//                 <View style={styles.sectionCard}>
//                   <Text style={styles.sectionTitle}>Store Logo</Text>
//                   <TouchableOpacity style={styles.logoUploadContainer} onPress={pickLogo} disabled={isUploadingLogo}>
//                     {logoUri
//                       ? <Image source={{ uri: logoUri }} style={styles.logoPreview} />
//                       : <View style={styles.logoPlaceholder}>
//                           <Ionicons name="image-outline" size={40} color={COLORS.textTertiary} />
//                           <Text style={styles.logoPlaceholderText}>Tap to upload logo</Text>
//                         </View>
//                     }
//                     {isUploadingLogo && (
//                       <View style={styles.uploadOverlay}>
//                         <ActivityIndicator size="large" color={COLORS.primary} />
//                         <Text style={styles.uploadText}>Uploading...</Text>
//                       </View>
//                     )}
//                   </TouchableOpacity>
//                   <Text style={styles.helpText}>Square image recommended (400×400px or larger)</Text>
//                 </View>

//                 <View style={styles.sectionCard}>
//                   <Text style={styles.sectionTitle}>Store Banner</Text>
//                   <TouchableOpacity style={styles.bannerUploadContainer} onPress={pickBanner} disabled={isUploadingBanner}>
//                     {bannerUri
//                       ? <Image source={{ uri: bannerUri }} style={styles.bannerPreview} />
//                       : <View style={styles.bannerPlaceholder}>
//                           <Ionicons name="images-outline" size={40} color={COLORS.textTertiary} />
//                           <Text style={styles.bannerPlaceholderText}>Tap to upload banner</Text>
//                         </View>
//                     }
//                     {isUploadingBanner && (
//                       <View style={styles.uploadOverlay}>
//                         <ActivityIndicator size="large" color={COLORS.primary} />
//                         <Text style={styles.uploadText}>Uploading...</Text>
//                       </View>
//                     )}
//                   </TouchableOpacity>
//                   <Text style={styles.helpText}>Wide banner recommended (1200×400px or larger)</Text>
//                 </View>

//                 <View style={styles.sectionCard}>
//                   <Text style={styles.sectionTitle}>Basic Information</Text>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Store Name *</Text>
//                     <TextInput style={styles.input} value={store.name}
//                       onChangeText={t => handleInputChange('name', t)}
//                       placeholder="Enter your store name" placeholderTextColor={COLORS.textTertiary} maxLength={100} />
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Store Tagline</Text>
//                     <TextInput style={styles.input} value={store.tagline}
//                       onChangeText={t => handleInputChange('tagline', t)}
//                       placeholder="Quality Products, Delivered Fast" placeholderTextColor={COLORS.textTertiary} maxLength={150} />
//                     <Text style={styles.charCount}>{store.tagline.length}/150</Text>
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Store Description *</Text>
//                     <TextInput style={styles.textArea} value={store.description}
//                       onChangeText={t => handleInputChange('description', t)}
//                       placeholder="Describe your store..." placeholderTextColor={COLORS.textTertiary}
//                       multiline numberOfLines={4} textAlignVertical="top" maxLength={500} />
//                     <Text style={styles.charCount}>{store.description.length}/500</Text>
//                   </View>
//                 </View>

//                 <View style={styles.sectionCard}>
//                   <Text style={styles.sectionTitle}>Contact Information</Text>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>WhatsApp Number *</Text>
//                     <TextInput style={styles.input} value={store.whatsapp_number}
//                       onChangeText={t => handleInputChange('whatsapp_number', t)}
//                       placeholder="+91 9876543210" placeholderTextColor={COLORS.textTertiary}
//                       keyboardType="phone-pad" maxLength={15} />
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Email Address</Text>
//                     <TextInput style={styles.input} value={store.email}
//                       onChangeText={t => handleInputChange('email', t)}
//                       placeholder="your.email@example.com" placeholderTextColor={COLORS.textTertiary}
//                       keyboardType="email-address" autoCapitalize="none" />
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Instagram Profile</Text>
//                     <TextInput style={styles.input} value={store.instagram_link}
//                       onChangeText={t => handleInputChange('instagram_link', t)}
//                       placeholder="https://instagram.com/yourstore" placeholderTextColor={COLORS.textTertiary}
//                       keyboardType="url" autoCapitalize="none" />
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Facebook Page</Text>
//                     <TextInput style={styles.input} value={store.facebook_link}
//                       onChangeText={t => handleInputChange('facebook_link', t)}
//                       placeholder="https://facebook.com/yourstore" placeholderTextColor={COLORS.textTertiary}
//                       keyboardType="url" autoCapitalize="none" />
//                   </View>
//                 </View>
//               </View>
//             )}

//             {/* ── Business Tab ── */}
//             {activeTab === 'business' && (
//               <View>
//                 <View style={styles.sectionCard}>
//                   <Text style={styles.sectionTitle}>Business Settings</Text>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Owner Name</Text>
//                     <TextInput style={styles.input} value={store.owner_name}
//                       onChangeText={t => handleInputChange('owner_name', t)}
//                       placeholder="Enter owner name" placeholderTextColor={COLORS.textTertiary} />
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Business Address</Text>
//                     <TextInput style={styles.textArea} value={store.business_address}
//                       onChangeText={t => handleInputChange('business_address', t)}
//                       placeholder="Enter complete address" placeholderTextColor={COLORS.textTertiary}
//                       multiline numberOfLines={3} textAlignVertical="top" />
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Local Delivery Time</Text>
//                     <TextInput style={styles.input} value={store.delivery_time_local}
//                       onChangeText={t => handleInputChange('delivery_time_local', t)}
//                       placeholder="e.g., 1-2 days" placeholderTextColor={COLORS.textTertiary} />
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>National Delivery Time</Text>
//                     <TextInput style={styles.input} value={store.delivery_time_national}
//                       onChangeText={t => handleInputChange('delivery_time_national', t)}
//                       placeholder="e.g., 3-5 days" placeholderTextColor={COLORS.textTertiary} />
//                   </View>
//                 </View>

//                 <View style={styles.sectionCard}>
//                   <Text style={styles.sectionTitle}>Business Verification</Text>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>GST Number</Text>
//                     <TextInput style={styles.input} value={store.gst_number}
//                       onChangeText={t => handleInputChange('gst_number', t)}
//                       placeholder="22AAAAA0000A1Z5" placeholderTextColor={COLORS.textTertiary}
//                       autoCapitalize="characters" />
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Business License</Text>
//                     <TextInput style={styles.input} value={store.business_license}
//                       onChangeText={t => handleInputChange('business_license', t)}
//                       placeholder="Enter license number" placeholderTextColor={COLORS.textTertiary} />
//                   </View>
//                 </View>
//               </View>
//             )}

//             {/* ── Payments Tab ── */}
//             {activeTab === 'payments' && (
//               <View>
//                 <View style={styles.sectionCard}>
//                   <Text style={styles.sectionTitle}>Payment Settings</Text>

//                   {/* Payment method selector — NONE | RAZORPAY only */}
//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Payment Method</Text>
//                     <View style={styles.radioGroup}>
//                       {(['NONE', 'RAZORPAY'] as const).map((method) => (
//                         <TouchableOpacity
//                           key={method}
//                           style={styles.radioOption}
//                           onPress={() => handleInputChange('payment_method', method)}
//                         >
//                           <View style={[styles.radioCircle, store.payment_method === method && styles.radioSelected]}>
//                             {store.payment_method === method && <View style={styles.radioInner} />}
//                           </View>
//                           <Text style={styles.radioText}>{method === 'NONE' ? 'None' : 'Razorpay'}</Text>
//                         </TouchableOpacity>
//                       ))}
//                     </View>
//                   </View>

//                   {/* Razorpay credentials */}
//                   {store.payment_method === 'RAZORPAY' && (
//                     <>
//                       <View style={styles.inputGroup}>
//                         <Text style={styles.label}>Razorpay Key ID *</Text>
//                         <TextInput style={styles.input} value={store.razorpay_key_id}
//                           onChangeText={t => handleInputChange('razorpay_key_id', t)}
//                           placeholder="rzp_test_..." placeholderTextColor={COLORS.textTertiary} />
//                       </View>

//                       <View style={styles.inputGroup}>
//                         <Text style={styles.label}>Razorpay Key Secret *</Text>
//                         <View style={styles.passwordContainer}>
//                           <TextInput
//                             style={styles.passwordInput}
//                             value={store.razorpay_key_secret}
//                             onChangeText={t => handleInputChange('razorpay_key_secret', t)}
//                             placeholder="Enter secret key"
//                             placeholderTextColor={COLORS.textTertiary}
//                             secureTextEntry={!showSecrets.razorpay_key_secret}
//                           />
//                           <TouchableOpacity
//                             style={styles.eyeButton}
//                             onPress={() => toggleSecretVisibility('razorpay_key_secret')}
//                           >
//                             <Ionicons
//                               name={showSecrets.razorpay_key_secret ? 'eye' : 'eye-off'}
//                               size={20}
//                               color={COLORS.textSecondary}
//                             />
//                           </TouchableOpacity>
//                         </View>
//                       </View>
//                     </>
//                   )}

//                   {/* COD toggle */}
//                   <View style={styles.switchContainer}>
//                     <Text style={styles.switchLabel}>Accept Cash on Delivery</Text>
//                     <Switch
//                       value={store.accepts_cod}
//                       onValueChange={v => handleInputChange('accepts_cod', v)}
//                       trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
//                       thumbColor={store.accepts_cod ? COLORS.primary : COLORS.textTertiary}
//                     />
//                   </View>
//                 </View>
//               </View>
//             )}

//           </View>

//           {/* Submit Button */}
//           <View style={styles.submitContainer}>
//             <TouchableOpacity
//               style={[styles.submitButton, isSaving && styles.disabledButton]}
//               onPress={handleSubmit}
//               disabled={isSaving}
//             >
//               <LinearGradient
//                 colors={isSaving ? ['#94a3b8', '#64748b'] : ['#3b82f6', '#1d4ed8']}
//                 style={styles.submitGradient}
//               >
//                 {isSaving
//                   ? <ActivityIndicator size="small" color={COLORS.surface} />
//                   : <Ionicons name="save" size={20} color={COLORS.surface} />
//                 }
//                 <Text style={styles.submitText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
//               </LinearGradient>
//             </TouchableOpacity>
//           </View>

//           <View style={{ height: 40 }} />
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </MainLayout>
//   );
// }

// const styles = StyleSheet.create({
//   container:            { flex: 1, backgroundColor: COLORS.background },
//   loadingContainer:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   loadingText:          { marginTop: 16, fontSize: 16, color: COLORS.textSecondary, fontWeight: '500' },
//   headerCard:           { margin: 16, borderRadius: 16, overflow: 'hidden', elevation: 4 },
//   headerGradient:       { padding: 24, alignItems: 'center' },
//   headerTitle:          { fontSize: 24, fontWeight: '700', color: COLORS.surface, marginTop: 12 },
//   headerSubtitle:       { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
//   statusCard:           { backgroundColor: COLORS.surface, margin: 16, padding: 20, borderRadius: 12, elevation: 2 },
//   statusHeader:         { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
//   statusIconContainer:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
//   statusTextContainer:  { flex: 1 },
//   statusTitle:          { fontSize: 14, color: COLORS.textSecondary },
//   statusText:           { fontSize: 16, fontWeight: '600' },
//   progressContainer:    { gap: 8 },
//   progressHeader:       { flexDirection: 'row', justifyContent: 'space-between' },
//   progressLabel:        { fontSize: 14, color: COLORS.textSecondary },
//   progressPercent:      { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
//   progressBarContainer: { borderRadius: 6, overflow: 'hidden' },
//   progressBar:          { height: 6, backgroundColor: COLORS.border, borderRadius: 6 },
//   progressFill:         { height: '100%', backgroundColor: COLORS.primary, borderRadius: 6 },
//   tabContainer:         { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.surface, borderRadius: 8, padding: 4, elevation: 2 },
//   tab:                  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, gap: 6 },
//   activeTab:            { backgroundColor: COLORS.primary },
//   tabText:              { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
//   activeTabText:        { color: COLORS.surface, fontWeight: '600' },
//   formContainer:        { paddingHorizontal: 16 },
//   sectionCard:          { backgroundColor: COLORS.surface, borderRadius: 12, padding: 20, marginBottom: 16, elevation: 2 },
//   sectionTitle:         { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 16 },
//   inputGroup:           { marginBottom: 16 },
//   label:                { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
//   input:                { backgroundColor: COLORS.primarySoft, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },
//   textArea:             { backgroundColor: COLORS.primarySoft, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, minHeight: 80 },
//   helpText:             { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
//   charCount:            { fontSize: 12, color: COLORS.textTertiary, textAlign: 'right', marginTop: 4 },
//   passwordContainer:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primarySoft, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
//   passwordInput:        { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: COLORS.textPrimary },
//   eyeButton:            { padding: 12 },
//   radioGroup:           { flexDirection: 'row', gap: 24 },
//   radioOption:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   radioCircle:          { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
//   radioSelected:        { borderColor: COLORS.primary },
//   radioInner:           { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
//   radioText:            { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
//   switchContainer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginTop: 4 },
//   switchLabel:          { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
//   submitContainer:      { paddingHorizontal: 16, paddingTop: 24 },
//   submitButton:         { borderRadius: 12, overflow: 'hidden', elevation: 4 },
//   disabledButton:       { opacity: 0.6 },
//   submitGradient:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 12 },
//   submitText:           { fontSize: 16, fontWeight: '600', color: COLORS.surface },

//   logoUploadContainer:  { width: '100%', height: 200, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primarySoft, overflow: 'hidden' },
//   logoPreview:          { width: '100%', height: '100%', resizeMode: 'cover' },
//   logoPlaceholder:      { alignItems: 'center', gap: 12 },
//   logoPlaceholderText:  { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },

//   bannerUploadContainer: { width: '100%', height: 150, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primarySoft, overflow: 'hidden' },
//   bannerPreview:         { width: '100%', height: '100%', resizeMode: 'cover' },
//   bannerPlaceholder:     { alignItems: 'center', gap: 12 },
//   bannerPlaceholderText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },

//   uploadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', gap: 12 },
//   uploadText:    { color: COLORS.surface, fontSize: 14, fontWeight: '600' },
// });// src/screens/settings/SettingsScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Switch, Platform, KeyboardAvoidingView,
  Image, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { api } from '../../config/api';
import MainLayout from '../../components/layout/MainLayout';
import { usePayment } from '../../context/PaymentContext';


// ── Types ─────────────────────────────────────────────────────────────────────

interface StoreProfile {
  name: string; description: string; whatsapp_number: string; tagline: string;
  instagram_link: string; facebook_link: string; email: string;
  delivery_time_local: string; delivery_time_national: string;
  meta_title: string; meta_description: string;
  payment_method: 'NONE' | 'RAZORPAY';
  razorpay_key_id: string; razorpay_key_secret: string;
  accepts_cod: boolean; gst_number: string; business_license: string;
  owner_name: string; business_address: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  cloudinary_logo?: any; cloudinary_banner?: any;
}

const EMPTY_STORE: StoreProfile = {
  name: '', description: '', whatsapp_number: '', tagline: '',
  instagram_link: '', facebook_link: '', email: '',
  delivery_time_local: '', delivery_time_national: '',
  meta_title: '', meta_description: '',
  payment_method: 'NONE', razorpay_key_id: '', razorpay_key_secret: '',
  accepts_cod: false, gst_number: '', business_license: '',
  owner_name: '', business_address: '', verification_status: 'pending',
};

type TabKey = 'basic' | 'business' | 'seo' | 'payments';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SHADOW = Platform.select({
  ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  android: { elevation: 3 },
});
const SHADOW_LG = Platform.select({
  ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16 },
  android: { elevation: 6 },
});

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Cleaner input with label above */
const Field: React.FC<{
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; required?: boolean; multiline?: boolean; lines?: number;
  keyboardType?: any; autoCapitalize?: any; secureTextEntry?: boolean;
  maxLength?: number; right?: React.ReactNode; help?: string;
}> = ({ label, value, onChangeText, placeholder, required, multiline, lines = 4,
        keyboardType, autoCapitalize, secureTextEntry, maxLength, right, help }) => (
  <View style={f.group}>
    <Text style={f.label}>
      {label}{required && <Text style={{ color: '#ef4444' }}> *</Text>}
    </Text>
    <View style={[f.inputWrap, multiline && { height: lines * 24 + 24, alignItems: 'flex-start' }]}>
      <TextInput
        style={[f.input, multiline && { textAlignVertical: 'top', paddingTop: 12 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        numberOfLines={multiline ? lines : 1}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
      />
      {right}
    </View>
    {help && <Text style={f.help}>{help}</Text>}
    {maxLength && <Text style={f.count}>{value.length}/{maxLength}</Text>}
  </View>
);
const f = StyleSheet.create({
  group:    { marginBottom: 16 },
  label:    { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 7 },
  inputWrap:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', overflow: 'hidden' },
  input:    { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', fontWeight: '500' },
  help:     { fontSize: 11, color: '#94a3b8', marginTop: 5, lineHeight: 16 },
  count:    { fontSize: 11, color: '#cbd5e1', marginTop: 4, textAlign: 'right' },
});

/** Section card wrapper */
const SectionCard: React.FC<{ title: string; icon: any; iconColor?: string; children: React.ReactNode }> = ({
  title, icon, iconColor = '#3b82f6', children,
}) => (
  <View style={sc.card}>
    <View style={sc.head}>
      <View style={[sc.iconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={sc.title}>{title}</Text>
    </View>
    <View style={sc.body}>{children}</View>
  </View>
);
const sc = StyleSheet.create({
  card:    { backgroundColor: 'white', borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', ...SHADOW },
  head:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconWrap:{ width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  body:    { padding: 16 },
});

/** Image upload tile */
const ImageTile: React.FC<{
  uri: string | null; uploading: boolean; onPress: () => void;
  aspect: [number, number]; height: number; label: string; hint: string;
}> = ({ uri, uploading, onPress, height, label, hint }) => (
  <TouchableOpacity onPress={onPress} disabled={uploading} activeOpacity={0.85} style={[img.tile, { height }]}>
    {uri ? (
      <Image source={{ uri }} style={img.preview} />
    ) : (
      <View style={img.placeholder}>
        <Ionicons name="cloud-upload-outline" size={28} color="#94a3b8" />
        <Text style={img.label}>{label}</Text>
        <Text style={img.hint}>{hint}</Text>
      </View>
    )}
    {uploading && (
      <View style={img.overlay}>
        <ActivityIndicator size="large" color="white" />
        <Text style={img.overlayText}>Uploading...</Text>
      </View>
    )}
    {!uploading && uri && (
      <View style={img.editBadge}>
        <Ionicons name="camera" size={12} color="white" />
        <Text style={img.editText}>Change</Text>
      </View>
    )}
  </TouchableOpacity>
);
const img = StyleSheet.create({
  tile:        { borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#cbd5e1', backgroundColor: '#f8fafc', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  preview:     { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { alignItems: 'center', gap: 6, padding: 16 },
  label:       { fontSize: 13, fontWeight: '700', color: '#64748b' },
  hint:        { fontSize: 11, color: '#94a3b8', textAlign: 'center' },
  overlay:     { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', gap: 10 },
  overlayText: { color: 'white', fontWeight: '700', fontSize: 13 },
  editBadge:   { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  editText:    { color: 'white', fontSize: 11, fontWeight: '700' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const { isRazorpayConnected, gatewayStatus, refreshGatewayStatus } = usePayment();

  const [activeTab,           setActiveTab]           = useState<TabKey>('basic');
  const [store,               setStore]               = useState<StoreProfile>(EMPTY_STORE);
  const [isLoading,           setIsLoading]           = useState(true);
  const [isSaving,            setIsSaving]            = useState(false);
  const [progress,            setProgress]            = useState(0);
  const [showSecrets,         setShowSecrets]         = useState<Record<string, boolean>>({});
  const [logoUri,             setLogoUri]             = useState<string | null>(null);
  const [isUploadingLogo,     setIsUploadingLogo]     = useState(false);
  const [bannerUri,           setBannerUri]           = useState<string | null>(null);
  const [isUploadingBanner,   setIsUploadingBanner]   = useState(false);
  const [saveSuccess,         setSaveSuccess]         = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Progress animation ───────────────────────────────────────────────────

  const animateProgress = useCallback((to: number) => {
    Animated.timing(progressAnim, {
      toValue: to / 100, duration: 600, useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const calcProgress = useCallback((data: any) => {
    const fields    = ['name', 'description', 'whatsapp_number', 'owner_name', 'business_address'];
    const done      = fields.filter(f => data[f]?.trim()).length;
    const pct       = Math.round((done / fields.length) * 100);
    setProgress(pct);
    animateProgress(pct);
  }, [animateProgress]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchStoreProfile = useCallback(async () => {
    try {
      const response   = await api.getStoreProfile();
      const sellerData = response.seller        || {};
      const storeData  = response.store_profile || {};
      const safeMethod: 'NONE' | 'RAZORPAY' = storeData.payment_method === 'RAZORPAY' ? 'RAZORPAY' : 'NONE';

      const merged: StoreProfile = {
        name:                   storeData.name                   || sellerData.shop_name || '',
        description:            storeData.description            || '',
        whatsapp_number:        storeData.whatsapp_number        || sellerData.phone     || '',
        tagline:                storeData.tagline                || '',
        email:                  sellerData.email                 || '',
        instagram_link:         storeData.instagram_link         || '',
        facebook_link:          storeData.facebook_link          || '',
        delivery_time_local:    storeData.delivery_time_local    || '1-2 days',
        delivery_time_national: storeData.delivery_time_national || '3-5 days',
        meta_title:             storeData.meta_title             || '',
        meta_description:       storeData.meta_description       || '',
        payment_method:         safeMethod,
        razorpay_key_id:        storeData.razorpay_key_id        || '',
        razorpay_key_secret:    storeData.razorpay_key_secret    || '',
        accepts_cod:            Boolean(storeData.accepts_cod),
        gst_number:             storeData.gst_number             || '',
        business_license:       storeData.business_license       || '',
        owner_name:             storeData.owner_name             || '',
        business_address:       storeData.business_address       || '',
        verification_status:    storeData.verification_status    || 'pending',
        cloudinary_logo:        storeData.cloudinary_logo,
        cloudinary_banner:      storeData.cloudinary_banner,
      };
      setStore(merged);
      calcProgress(merged);

      if (storeData.cloudinary_logo)
        setLogoUri(typeof storeData.cloudinary_logo === 'string' ? storeData.cloudinary_logo : storeData.cloudinary_logo.url);
      if (storeData.cloudinary_banner)
        setBannerUri(typeof storeData.cloudinary_banner === 'string' ? storeData.cloudinary_banner : storeData.cloudinary_banner.url);
    } catch (e: any) {
      Alert.alert('Load Error', 'Failed to load store settings.');
    } finally {
      setIsLoading(false);
    }
  }, [calcProgress]);

  useEffect(() => { fetchStoreProfile(); }, [fetchStoreProfile]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const set = (field: keyof StoreProfile, value: string | boolean) =>
    setStore(prev => ({ ...prev, [field]: value }));

  const uploadToCloudinary = async (uri: string, name: string) => {
    const fd = new FormData();
    fd.append('file',          { uri, type: 'image/jpeg', name } as any);
    fd.append('upload_preset', 'kerala_sellers');
    fd.append('cloud_name',    'dlqm6dyps');
    const res  = await fetch('https://api.cloudinary.com/v1_1/dlqm6dyps/image/upload', { method: 'POST', body: fd });
    return res.json();
  };

  const pickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow photo access.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setLogoUri(uri);
        setIsUploadingLogo(true);
        const data = await uploadToCloudinary(uri, 'store_logo.jpg');
        if (data.secure_url) setStore(prev => ({ ...prev, cloudinary_logo: { url: data.secure_url, public_id: data.public_id } }));
        else { setLogoUri(null); Alert.alert('Upload Error', data.error?.message || 'Upload failed.'); }
        setIsUploadingLogo(false);
      }
    } catch { setIsUploadingLogo(false); Alert.alert('Error', 'Failed to upload logo.'); }
  };

  const pickBanner = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Please allow photo access.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 1], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setBannerUri(uri);
        setIsUploadingBanner(true);
        const data = await uploadToCloudinary(uri, 'store_banner.jpg');
        if (data.secure_url) setStore(prev => ({ ...prev, cloudinary_banner: { url: data.secure_url, public_id: data.public_id } }));
        else { setBannerUri(null); Alert.alert('Upload Error', data.error?.message || 'Upload failed.'); }
        setIsUploadingBanner(false);
      }
    } catch { setIsUploadingBanner(false); Alert.alert('Error', 'Failed to upload banner.'); }
  };

  const handleSubmit = async () => {
    const errors: string[] = [];
    if (!store.name?.trim())            errors.push('Store name is required');
    if (!store.description?.trim())     errors.push('Store description is required');
    if (!store.whatsapp_number?.trim()) errors.push('WhatsApp number is required');
    if (store.whatsapp_number && !/^(\+91|91)?[6-9]\d{9}$/.test(store.whatsapp_number.replace(/\s+/g, '')))
      errors.push('Enter a valid Indian mobile number');
    if (errors.length > 0) { Alert.alert('Missing Info', errors.join('\n')); return; }

    setIsSaving(true);
    try {
      const res = await api.updateStoreProfile(store);
      calcProgress(res.store_profile || res);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: any) {
      Alert.alert('Save Failed', e.message || 'Failed to update settings.');
    } finally { setIsSaving(false); }
  };

  // ── Verification config ───────────────────────────────────────────────────

  const verifyConfig = {
    pending:  { icon: 'time-outline'     as const, color: '#d97706', bg: '#fffbeb', label: 'Verification Pending' },
    verified: { icon: 'checkmark-circle' as const, color: '#059669', bg: '#ecfdf5', label: 'Verified Seller'       },
    rejected: { icon: 'close-circle'     as const, color: '#dc2626', bg: '#fef2f2', label: 'Verification Rejected' },
  };
  const vStatus = verifyConfig[store.verification_status] ?? verifyConfig.pending;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) return (
    <MainLayout navigation={navigation} currentTab="settings" headerTitle="Settings">
      <View style={s.loadingWrap}>
        <LinearGradient colors={['#eff6ff', '#dbeafe']} style={s.loadingIcon}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </LinearGradient>
        <Text style={s.loadingTitle}>Loading Settings</Text>
        <Text style={s.loadingSub}>Fetching your store profile...</Text>
      </View>
    </MainLayout>
  );

  const TABS: { key: TabKey; label: string; icon: any; color: string }[] = [
    { key: 'basic',    label: 'Basic',    icon: 'storefront-outline', color: '#3b82f6' },
    { key: 'business', label: 'Business', icon: 'business-outline',   color: '#7c3aed' },
    { key: 'seo',      label: 'SEO',      icon: 'search-outline',     color: '#059669' },
    { key: 'payments', label: 'Payments', icon: 'card-outline',       color: '#f59e0b' },
  ];

  const rp = gatewayStatus.razorpay;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <MainLayout navigation={navigation} currentTab="settings" headerTitle="Store Settings">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Hero Header ── */}
          <LinearGradient colors={['#1e3a8a', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
            <View style={s.heroRow}>
              <View style={s.heroAvatar}>
                {logoUri
                  ? <Image source={{ uri: logoUri }} style={s.heroAvatarImg} />
                  : <Ionicons name="storefront" size={28} color="#93c5fd" />
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.heroName}>{store.name || 'Your Store'}</Text>
                <Text style={s.heroSub} numberOfLines={1}>{store.tagline || 'No tagline set'}</Text>
              </View>
              <View style={[s.vBadge, { backgroundColor: vStatus.bg }]}>
                <Ionicons name={vStatus.icon} size={12} color={vStatus.color} />
                <Text style={[s.vBadgeText, { color: vStatus.color }]}>{vStatus.label}</Text>
              </View>
            </View>

            {/* Progress */}
            <View style={s.progressWrap}>
              <View style={s.progressRow}>
                <Text style={s.progressLabel}>Profile Completion</Text>
                <Text style={s.progressPct}>{progress}%</Text>
              </View>
              <View style={s.progressTrack}>
                <Animated.View style={[s.progressFill, {
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  backgroundColor: progress === 100 ? '#10b981' : '#60a5fa',
                }]} />
              </View>
              {progress < 100 && (
                <Text style={s.progressHint}>Complete your profile to improve visibility</Text>
              )}
            </View>
          </LinearGradient>

          {/* ── Tab bar ── */}
          <View style={s.tabBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[s.tab, activeTab === tab.key && { ...s.tabActive, borderBottomColor: tab.color }]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={tab.icon} size={15} color={activeTab === tab.key ? tab.color : '#94a3b8'} />
                  <Text style={[s.tabLabel, activeTab === tab.key && { color: tab.color }]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Save success toast */}
          {saveSuccess && (
            <View style={s.savedToast}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={s.savedToastText}>Settings saved successfully!</Text>
            </View>
          )}

          <View style={s.content}>

            {/* ════════ BASIC TAB ════════ */}
            {activeTab === 'basic' && (
              <>
                {/* Images */}
                <SectionCard title="Store Images" icon="images-outline" iconColor="#3b82f6">
                  <Text style={s.imgLabel}>Store Logo</Text>
                  <ImageTile
                    uri={logoUri} uploading={isUploadingLogo} onPress={pickLogo}
                    aspect={[1, 1]} height={160} label="Tap to upload logo"
                    hint="Square · 400×400px or larger"
                  />
                  <Text style={[s.imgLabel, { marginTop: 16 }]}>Store Banner</Text>
                  <ImageTile
                    uri={bannerUri} uploading={isUploadingBanner} onPress={pickBanner}
                    aspect={[3, 1]} height={120} label="Tap to upload banner"
                    hint="Wide · 1200×400px or larger"
                  />
                </SectionCard>

                {/* Basic Info */}
                <SectionCard title="Store Info" icon="information-circle-outline" iconColor="#3b82f6">
                  <Field label="Store Name" value={store.name} onChangeText={v => set('name', v)} placeholder="e.g. Demk Store" required maxLength={100} />
                  <Field label="Tagline" value={store.tagline} onChangeText={v => set('tagline', v)} placeholder="Quality Products, Delivered Fast" maxLength={150} />
                  <Field label="Description" value={store.description} onChangeText={v => set('description', v)} placeholder="Tell customers about your store..." required multiline lines={4} maxLength={500} />
                </SectionCard>

                {/* Contact */}
                <SectionCard title="Contact" icon="call-outline" iconColor="#059669">
                  <Field label="WhatsApp Number" value={store.whatsapp_number} onChangeText={v => set('whatsapp_number', v)} placeholder="+91 9876543210" required keyboardType="phone-pad" maxLength={15} />
                  <Field label="Email Address" value={store.email} onChangeText={v => set('email', v)} placeholder="store@example.com" keyboardType="email-address" autoCapitalize="none" />
                  <Field label="Instagram" value={store.instagram_link} onChangeText={v => set('instagram_link', v)} placeholder="https://instagram.com/yourstore" keyboardType="url" autoCapitalize="none" />
                  <Field label="Facebook" value={store.facebook_link} onChangeText={v => set('facebook_link', v)} placeholder="https://facebook.com/yourstore" keyboardType="url" autoCapitalize="none" />
                </SectionCard>
              </>
            )}

            {/* ════════ BUSINESS TAB ════════ */}
            {activeTab === 'business' && (
              <>
                <SectionCard title="Business Details" icon="business-outline" iconColor="#7c3aed">
                  <Field label="Owner Name" value={store.owner_name} onChangeText={v => set('owner_name', v)} placeholder="Full name of owner" />
                  <Field label="Business Address" value={store.business_address} onChangeText={v => set('business_address', v)} placeholder="Complete address with city & pincode" multiline lines={3} />
                </SectionCard>

                <SectionCard title="Delivery Times" icon="bicycle-outline" iconColor="#059669">
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Field label="Local" value={store.delivery_time_local} onChangeText={v => set('delivery_time_local', v)} placeholder="1-2 days" help="Within your city/district" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="National" value={store.delivery_time_national} onChangeText={v => set('delivery_time_national', v)} placeholder="3-5 days" help="Pan-India shipping" />
                    </View>
                  </View>
                </SectionCard>

                <SectionCard title="Business Verification" icon="shield-checkmark-outline" iconColor="#f59e0b">
                  <View style={s.verifyInfo}>
                    <Ionicons name="information-circle-outline" size={14} color="#64748b" />
                    <Text style={s.verifyInfoText}>Adding GST & license number helps verify your store faster</Text>
                  </View>
                  <Field label="GST Number" value={store.gst_number} onChangeText={v => set('gst_number', v)} placeholder="22AAAAA0000A1Z5" autoCapitalize="characters" help="Optional — improves buyer trust" />
                  <Field label="Business License" value={store.business_license} onChangeText={v => set('business_license', v)} placeholder="Trade license number" help="Optional — required for some categories" />
                </SectionCard>
              </>
            )}

            {/* ════════ SEO TAB ════════ */}
            {activeTab === 'seo' && (
              <>
                <SectionCard title="SEO Settings" icon="globe-outline" iconColor="#059669">
                  <View style={s.seoInfo}>
                    <Ionicons name="rocket-outline" size={16} color="#059669" />
                    <Text style={s.seoInfoText}>Improve your store's discoverability on Google & search engines</Text>
                  </View>
                  <Field label="Meta Title" value={store.meta_title} onChangeText={v => set('meta_title', v)} placeholder="Your Store — Best Products in Kerala" maxLength={60} help="50–60 characters for best results" />
                  <Field label="Meta Description" value={store.meta_description} onChangeText={v => set('meta_description', v)} placeholder="Shop the best products from our store — fast delivery across Kerala." multiline lines={3} maxLength={160} help="130–160 characters recommended" />
                  {store.meta_title ? (
                    <View style={s.seoPreview}>
                      <Text style={s.seoPreviewLabel}>Google Preview</Text>
                      <Text style={s.seoPreviewTitle} numberOfLines={1}>{store.meta_title}</Text>
                      <Text style={s.seoPreviewUrl}>keralasellers.in › {store.name?.toLowerCase().replace(/\s+/g, '-')}</Text>
                      <Text style={s.seoPreviewDesc} numberOfLines={2}>{store.meta_description || 'No description set.'}</Text>
                    </View>
                  ) : null}
                </SectionCard>
              </>
            )}

            {/* ════════ PAYMENTS TAB ════════ */}
            {activeTab === 'payments' && (
              <>
                {/* Razorpay status card — driven by shared context */}
                <View style={[s.gatewayCard, isRazorpayConnected && s.gatewayCardLive]}>
                  {isRazorpayConnected && (
                    <LinearGradient colors={['#ecfdf5', '#f0fdf4']} style={s.gatewayLiveBanner}>
                      <View style={s.pulseDot}>
                        <View style={[s.pulseDotInner, { backgroundColor: '#059669' }]} />
                      </View>
                      <Text style={s.gatewayLiveText}>Razorpay is Live & Accepting Payments</Text>
                    </LinearGradient>
                  )}

                  <View style={s.gatewayBody}>
                    <LinearGradient colors={['#dbeafe', '#eff6ff']} style={s.gatewayLogo}>
                      <Ionicons name="card" size={22} color="#3b82f6" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={s.gatewayName}>Razorpay</Text>
                      <Text style={s.gatewayTag}>
                        {rp.verified ? 'Connected · ' + (rp.account_id || 'Live') : 'Online Payments · UPI · Cards'}
                      </Text>
                    </View>
                    <View style={[s.statusPill, { backgroundColor: rp.verified ? '#ecfdf5' : '#fffbeb', borderColor: rp.verified ? '#6ee7b7' : '#fcd34d' }]}>
                      <Ionicons name={rp.verified ? 'checkmark-circle' : 'time'} size={12} color={rp.verified ? '#059669' : '#d97706'} />
                      <Text style={[s.statusPillText, { color: rp.verified ? '#059669' : '#d97706' }]}>
                        {rp.verified ? 'Live' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={s.gatewayFooter}>
                    {!isRazorpayConnected ? (
                      <TouchableOpacity
                        style={s.connectBtn}
                        onPress={() => navigation.navigate('Payments')}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="link-outline" size={16} color="white" />
                        <Text style={s.connectBtnText}>Connect Razorpay</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={s.manageBtn}
                        onPress={() => navigation.navigate('Payments')}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="settings-outline" size={14} color="#3b82f6" />
                        <Text style={s.manageBtnText}>Manage in Payments</Text>
                        <Ionicons name="arrow-forward" size={13} color="#3b82f6" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* COD toggle */}
                <SectionCard title="Cash on Delivery" icon="cash-outline" iconColor="#059669">
                  <View style={s.codRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.codLabel}>Accept COD Orders</Text>
                      <Text style={s.codSub}>Customers pay in cash when delivered</Text>
                    </View>
                    <Switch
                      value={store.accepts_cod}
                      onValueChange={v => set('accepts_cod', v)}
                      trackColor={{ false: '#e2e8f0', true: '#bbf7d0' }}
                      thumbColor={store.accepts_cod ? '#059669' : '#94a3b8'}
                    />
                  </View>
                </SectionCard>

                {/* Info tip */}
                <View style={s.payTip}>
                  <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
                  <Text style={s.payTipText}>Enable at least one payment method so customers can place orders in your store.</Text>
                </View>
              </>
            )}

          </View>

          {/* ── Save Button ── */}
          <View style={s.saveWrap}>
            <TouchableOpacity onPress={handleSubmit} disabled={isSaving} activeOpacity={0.88} style={s.saveBtn}>
              <LinearGradient
                colors={isSaving ? ['#94a3b8', '#64748b'] : saveSuccess ? ['#059669', '#047857'] : ['#2563eb', '#1d4ed8']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveGradient}
              >
                {isSaving
                  ? <ActivityIndicator size="small" color="white" />
                  : <Ionicons name={saveSuccess ? 'checkmark' : 'save-outline'} size={18} color="white" />
                }
                <Text style={s.saveBtnText}>
                  {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Settings'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </MainLayout>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#f1f5f9' },

  // Loading
  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingIcon:  { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  loadingTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  loadingSub:   { fontSize: 13, color: '#94a3b8' },

  // Hero
  hero:         { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  heroRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  heroAvatar:   { width: 54, height: 54, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroAvatarImg:{ width: 54, height: 54, resizeMode: 'cover' },
  heroName:     { fontSize: 18, fontWeight: '900', color: 'white', marginBottom: 3 },
  heroSub:      { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  vBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  vBadgeText:   { fontSize: 10, fontWeight: '800' },
  progressWrap: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14 },
  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel:{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  progressPct:  { fontSize: 13, fontWeight: '800', color: 'white' },
  progressTrack:{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  progressHint: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 7 },

  // Tabs
  tabBar:       { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', ...SHADOW },
  tabScroll:    { paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  tab:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:    { backgroundColor: '#f8fafc' },
  tabLabel:     { fontSize: 12, fontWeight: '700', color: '#94a3b8' },

  // Save toast
  savedToast:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ecfdf5', borderColor: '#6ee7b7', borderWidth: 1, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12 },
  savedToastText:{ fontSize: 13, fontWeight: '600', color: '#065f46' },

  // Content
  content:      { padding: 16 },

  // Image labels
  imgLabel:     { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },

  // Verify info
  verifyInfo:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fcd34d' },
  verifyInfoText:{ flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18 },

  // SEO
  seoInfo:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  seoInfoText:  { flex: 1, fontSize: 12, color: '#065f46', lineHeight: 18 },
  seoPreview:   { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4 },
  seoPreviewLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  seoPreviewTitle: { fontSize: 15, fontWeight: '700', color: '#1a73e8', marginBottom: 2 },
  seoPreviewUrl:   { fontSize: 12, color: '#1e8a3e', marginBottom: 4 },
  seoPreviewDesc:  { fontSize: 12, color: '#4b5563', lineHeight: 18 },

  // Gateway card (payments tab)
  gatewayCard:     { backgroundColor: 'white', borderRadius: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#e2e8f0', overflow: 'hidden', ...SHADOW_LG },
  gatewayCardLive: { borderColor: '#3b82f6' },
  gatewayLiveBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#bbf7d0' },
  pulseDot:        { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  pulseDotInner:   { width: 6, height: 6, borderRadius: 3 },
  gatewayLiveText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  gatewayBody:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, paddingBottom: 12 },
  gatewayLogo:     { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  gatewayName:     { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  gatewayTag:      { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  statusPill:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  statusPillText:  { fontSize: 11, fontWeight: '700' },
  gatewayFooter:   { paddingHorizontal: 16, paddingBottom: 16 },
  connectBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3b82f6', paddingVertical: 13, borderRadius: 12 },
  connectBtnText:  { fontSize: 14, fontWeight: '800', color: 'white' },
  manageBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#bfdbfe', paddingVertical: 11, borderRadius: 11 },
  manageBtnText:   { fontSize: 13, fontWeight: '700', color: '#3b82f6', flex: 1, textAlign: 'center' },

  // COD
  codRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codLabel:   { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  codSub:     { fontSize: 12, color: '#94a3b8' },

  // Payment tip
  payTip:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fcd34d', marginBottom: 8 },
  payTipText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18 },

  // Save button
  saveWrap:      { paddingHorizontal: 16, paddingTop: 8 },
  saveBtn:       { borderRadius: 14, overflow: 'hidden', ...SHADOW_LG },
  saveGradient:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  saveBtnText:   { fontSize: 15, fontWeight: '800', color: 'white' },
});