// import React, { useState, useEffect } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet,
//   ActivityIndicator, Image, Switch, Platform, FlatList, Modal,
// } from 'react-native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import * as ImagePicker from 'expo-image-picker';
// import apiClient from '../../services/ApiClient';

// // ✅ Cloudinary Config
// // ✅ FIXED: Use the WORKING Cloudinary account

// const CLOUDINARY_CONFIG = {
//   cloudName: 'dnmbfeckd',  // ✅ MUST be dnmbfeckd
//   uploadPreset: 'kerala_sellers_preset',  // ✅ MUST be kerala_sellers_preset
//   fallbackPreset: 'ml_default',
//   folder: 'kerala-sellers/store-profiles',
// };


// // ✅ Cloudinary Upload Function
// // ✅ Enhanced Cloudinary Upload Function with detailed error logging
// const uploadToCloudinary = async (fileUri: string, options: any = {}) => {
//   console.log('🔍 Starting Cloudinary upload...');
//   console.log('📋 Cloud Name:', CLOUDINARY_CONFIG.cloudName);
//   console.log('📋 Upload Preset:', CLOUDINARY_CONFIG.uploadPreset);
//   console.log('📋 File URI:', fileUri);
  
//   const presetsToTry = [
//     { preset: CLOUDINARY_CONFIG.uploadPreset, name: 'custom' },
//     { preset: CLOUDINARY_CONFIG.fallbackPreset, name: 'fallback' },
//   ];

//   for (const { preset, name } of presetsToTry) {
//     try {
//       console.log(`🔄 Trying ${name} preset: ${preset}`);
      
//       const formData = new FormData();
//       formData.append('file', {
//         uri: fileUri,
//         type: 'image/jpeg',
//         name: `store_${Date.now()}.jpg`,
//       } as any);
//       formData.append('upload_preset', preset);
//       formData.append('folder', options.folder || CLOUDINARY_CONFIG.folder);
//       if (options.width) formData.append('width', options.width.toString());
//       if (options.height) formData.append('height', options.height.toString());
//       if (options.crop) formData.append('crop', options.crop);
//       formData.append('quality', 'auto:good');
//       formData.append('fetch_format', 'auto');

//       console.log('📤 Sending to Cloudinary...');
//       const response = await fetch(
//         `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
//         { method: 'POST', body: formData }
//       );

//       console.log('📡 Response status:', response.status);
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error(`❌ ${name} preset failed:`, errorText);
        
//         if (name === 'fallback') {
//           throw new Error(`Upload failed: ${errorText}`);
//         }
//         continue;
//       }

//       const result = await response.json();
//       console.log('✅ Upload successful!');
//       console.log('🔗 URL:', result.secure_url);
      
//       return { success: true, url: result.secure_url, publicId: result.public_id };
//     } catch (error: any) {
//       console.error(`❌ ${name} preset error:`, error.message);
//       if (name === 'fallback') {
//         return { success: false, error: error.message };
//       }
//     }
//   }
//   return { success: false, error: 'All upload presets failed' };
// };


// interface StoreFormData {
//   name: string;
//   description: string;
//   whatsapp_number: string;
//   tagline: string;
//   delivery_time_local: string;
//   delivery_time_national: string;
//   payment_method: string;
//   accepts_cod: boolean;
//   cashfree_bank_account: string;
//   cashfree_ifsc: string;
//   cashfree_account_holder: string;
//   razorpay_key_id: string;
//   razorpay_key_secret: string;
//   upi_id: string;
// }

// type CreateShopScreenProps = {
//   navigation: StackNavigationProp<any>;
// };

// const CreateShopScreen: React.FC<CreateShopScreenProps> = ({ navigation }) => {
//   const [activeTab, setActiveTab] = useState<'mandatory' | 'optional'>('mandatory');
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [isSaving, setIsSaving] = useState<boolean>(false);
//   const [isUploadingImages, setIsUploadingImages] = useState<boolean>(false);
//   const [successMessage, setSuccessMessage] = useState<string>('');
//   const [errorMessage, setErrorMessage] = useState<string>('');
  
//   const [store, setStore] = useState<StoreFormData>({
//     name: '',
//     description: '',
//     whatsapp_number: '',
//     tagline: '',
//     delivery_time_local: '',
//     delivery_time_national: '',
//     payment_method: 'CASHFREE',
//     accepts_cod: false,
//     cashfree_bank_account: '',
//     cashfree_ifsc: '',
//     cashfree_account_holder: '',
//     razorpay_key_id: '',
//     razorpay_key_secret: '',
//     upi_id: '',
//   });

//   const [logoUri, setLogoUri] = useState<string>('');
//   const [bannerUri, setBannerUri] = useState<string>('');
//   const [currentLogoUrl, setCurrentLogoUrl] = useState<string>('');
//   const [cloudinaryData, setCloudinaryData] = useState<any>({ logo: null, banner: null });
  
//   const [predefinedBanners, setPredefinedBanners] = useState<any[]>([]);
//   const [selectedPredefinedBanners, setSelectedPredefinedBanners] = useState<number[]>([]);
//   const [currentBannerUrls, setCurrentBannerUrls] = useState<string[]>([]);
//   const [showBannerGallery, setShowBannerGallery] = useState<boolean>(false);
  
//   const [cashfreeConnected, setCashfreeConnected] = useState<boolean>(false);
//   const [isConnectingCashfree, setIsConnectingCashfree] = useState<boolean>(false);

//   useEffect(() => {
//     requestPermissions();
//     fetchStoreProfile();
//     fetchPredefinedBanners();
//   }, []);

//   const requestPermissions = async (): Promise<void> => {
//     if (Platform.OS !== 'web') {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission Required', 'Please grant camera roll permissions.');
//       }
//     }
//   };

//   const fetchPredefinedBanners = async (): Promise<void> => {
//     try {
//       const response = await apiClient.get('/api/predefined-banners/');
//       const activeBanners = response.data.filter((b: any) => b.is_active);
//       setPredefinedBanners(activeBanners);
//       console.log(`✅ Loaded ${activeBanners.length} predefined banners`);
//     } catch (error) {
//       console.error('❌ Error fetching predefined banners:', error);
//     }
//   };

//   const fetchStoreProfile = async (): Promise<void> => {
//     try {
//       setIsLoading(true);
//       const response = await apiClient.get('/user/store/profile/');
      
//       if (response.data.store_profile) {
//         const profile = response.data.store_profile;
//         setStore({
//           name: profile.name || '',
//           description: profile.description || '',
//           whatsapp_number: profile.whatsapp_number || '',
//           tagline: profile.tagline || '',
//           delivery_time_local: profile.delivery_time_local || '',
//           delivery_time_national: profile.delivery_time_national || '',
//           payment_method: profile.payment_method || 'CASHFREE',
//           accepts_cod: profile.accepts_cod || false,
//           cashfree_bank_account: profile.cashfree_bank_account || '',
//           cashfree_ifsc: profile.cashfree_ifsc || '',
//           cashfree_account_holder: profile.cashfree_account_holder || '',
//           razorpay_key_id: profile.razorpay_key_id || '',
//           razorpay_key_secret: profile.razorpay_key_secret || '',
//           upi_id: profile.upi_id || '',
//         });
        
//         setCurrentLogoUrl(profile.logo_url || '');
        
//         const banners: number[] = [];
//         const bannerUrls: string[] = [];
//         if (profile.predefined_banner_1) {
//           banners.push(profile.predefined_banner_1);
//           bannerUrls.push(profile.banner_1_url);
//         }
//         if (profile.predefined_banner_2) {
//           banners.push(profile.predefined_banner_2);
//           bannerUrls.push(profile.banner_2_url);
//         }
//         if (profile.predefined_banner_3) {
//           banners.push(profile.predefined_banner_3);
//           bannerUrls.push(profile.banner_3_url);
//         }
//         setSelectedPredefinedBanners(banners);
//         setCurrentBannerUrls(bannerUrls);
//       }

//       await checkCashfreeStatus();
//     } catch (error) {
//       console.error('Error fetching store profile:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const checkCashfreeStatus = async () => {
//     try {
//       const response = await apiClient.get('/api/payments/cashfree/vendor/status/');
//       if (response.data.registered) {
//         setCashfreeConnected(true);
//       }
//     } catch (error) {
//       console.log('No Cashfree vendor found');
//     }
//   };

//   const handleInputChange = (name: keyof StoreFormData, value: string | boolean): void => {
//     setStore(prev => ({ ...prev, [name]: value }));
//     if (errorMessage) setErrorMessage('');
//     if (successMessage) setSuccessMessage('');
//   };

//   // ✅ FIXED: Logo upload with immediate backend save
//   const handleFileChange = async (fileType: 'logo' | 'banner', file: any) => {
//     if (!file) return;

//     setIsUploadingImages(true);
//     console.log(`📤 Uploading ${fileType} to Cloudinary...`);
    
//     const result = await uploadToCloudinary(file.uri, {
//       folder: `${CLOUDINARY_CONFIG.folder}/${fileType}`,
//       width: fileType === 'logo' ? 400 : 1200,
//       height: fileType === 'logo' ? 400 : 400,
//       crop: 'fill',
//     });

//     if (result.success) {
//       console.log(`✅ ${fileType} uploaded successfully:`, result.url);
      
//       setCloudinaryData((prev: any) => ({ ...prev, [fileType]: result }));
      
//       if (fileType === 'logo') {
//         setCurrentLogoUrl(result.url);
        
//         // ✅ CRITICAL: Save logo to backend immediately
//         try {
//           console.log('💾 Saving logo to backend...');
//           const logoData = {
//             public_id: result.publicId,
//             url: result.url,
//           };
          
//           await apiClient.patch('/user/store/profile/', {
//             ...store,
//             cloudinary_logo: logoData
//           });
          
//           console.log('✅ Logo saved to backend successfully');
//           setSuccessMessage('Logo uploaded and saved!');
//           setTimeout(() => setSuccessMessage(''), 3000);
//         } catch (saveError) {
//           console.error('❌ Error saving logo:', saveError);
//           setErrorMessage('Logo uploaded but not saved. Click Save Changes to persist.');
//           setTimeout(() => setErrorMessage(''), 3000);
//         }
//       }
      
//       if (fileType === 'banner') {
//         setCurrentBannerUrls([result.url]);
//         setSelectedPredefinedBanners([]);
//         setSuccessMessage('Banner uploaded successfully!');
//         setTimeout(() => setSuccessMessage(''), 3000);
//       }
//     } else {
//       console.error(`❌ Failed to upload ${fileType}:`, result.error);
//       setErrorMessage(`Failed to upload ${fileType}`);
//       setTimeout(() => setErrorMessage(''), 3000);
//     }
    
//     setIsUploadingImages(false);
//   };

//   const handleBannerSelect = (bannerId: number, bannerUrl: string) => {
//     if (selectedPredefinedBanners.includes(bannerId)) {
//       setSelectedPredefinedBanners(prev => prev.filter(id => id !== bannerId));
//       setCurrentBannerUrls(prev => prev.filter(url => url !== bannerUrl));
//     } else if (selectedPredefinedBanners.length < 3) {
//       setSelectedPredefinedBanners(prev => [...prev, bannerId]);
//       setCurrentBannerUrls(prev => [...prev, bannerUrl]);
//     } else {
//       setErrorMessage('⚠️ Maximum 3 banners allowed');
//       setTimeout(() => setErrorMessage(''), 3000);
//     }
//   };

//   const handleCashfreeConnect = async () => {
//     if (!store.cashfree_bank_account?.trim() || !store.cashfree_ifsc?.trim() || !store.cashfree_account_holder?.trim()) {
//       setErrorMessage('Please fill all Cashfree fields');
//       return;
//     }

//     try {
//       setIsConnectingCashfree(true);
//       const response = await apiClient.post('/api/payments/cashfree/vendor/register/', {
//         bank_account: store.cashfree_bank_account,
//         ifsc: store.cashfree_ifsc,
//         account_holder_name: store.cashfree_account_holder,
//         email: `${store.whatsapp_number}@keralasellers.com`,
//       });

//       if (response.data.vendor_id) {
//         setCashfreeConnected(true);
//         setSuccessMessage('Bank account registered! You will receive 100% of sales directly.');
//       }
//     } catch (error: any) {
//       setErrorMessage(error.response?.data?.error || 'Failed to register bank account');
//     } finally {
//       setIsConnectingCashfree(false);
//     }
//   };

//   const handleSubmit = async (): Promise<void> => {
//     if (!store.name?.trim() || !store.description?.trim() || !store.whatsapp_number?.trim()) {
//       setErrorMessage('Please fill all required fields');
//       return;
//     }

//     setIsSaving(true);
//     try {
//       let updatedCloudinaryData = { ...cloudinaryData };

//       if (logoUri || bannerUri) {
//         setIsUploadingImages(true);
        
//         if (logoUri) {
//           const logoResult = await uploadToCloudinary(logoUri, {
//             folder: `${CLOUDINARY_CONFIG.folder}/logo`,
//             width: 400,
//             height: 400,
//             crop: 'fill',
//           });
//           if (logoResult.success) {
//             updatedCloudinaryData.logo = {
//               publicId: logoResult.publicId,
//               url: logoResult.url,
//             };
//           }
//         }

//         if (bannerUri) {
//           const bannerResult = await uploadToCloudinary(bannerUri, {
//             folder: `${CLOUDINARY_CONFIG.folder}/banner`,
//             width: 1200,
//             height: 400,
//             crop: 'fill',
//           });
//           if (bannerResult.success) {
//             updatedCloudinaryData.banner = {
//               publicId: bannerResult.publicId,
//               url: bannerResult.url,
//             };
//           }
//         }
        
//         setIsUploadingImages(false);
//       }

//       const requestData = {
//         ...store,
//         predefined_banner_1: selectedPredefinedBanners[0] || null,
//         predefined_banner_2: selectedPredefinedBanners[1] || null,
//         predefined_banner_3: selectedPredefinedBanners[2] || null,
//         cloudinary_logo: updatedCloudinaryData.logo ? {
//           public_id: updatedCloudinaryData.logo.publicId,
//           url: updatedCloudinaryData.logo.url,
//         } : null,
//         cloudinary_banner_1: updatedCloudinaryData.banner ? {
//           public_id: updatedCloudinaryData.banner.publicId,
//           url: updatedCloudinaryData.banner.url,
//         } : null,
//       };

//       await apiClient.patch('/user/store/profile/', requestData);
      
//       setSuccessMessage('✅ Settings updated successfully!');
//       Alert.alert('Success', 'Store profile updated successfully!');
      
//     } catch (error: any) {
//       const errorMsg = error.response?.data?.error || 'Failed to update settings';
//       setErrorMessage(errorMsg);
//       Alert.alert('Error', errorMsg);
//     } finally {
//       setIsSaving(false);
//       setIsUploadingImages(false);
//     }
//   };

//   const selectImage = async (type: 'logo' | 'banner'): Promise<void> => {
//     Alert.alert('Select Image', 'Choose an option', [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'Camera', onPress: () => openCamera(type) },
//       { text: 'Gallery', onPress: () => openGallery(type) },
//     ]);
//   };

//   const openCamera = async (type: 'logo' | 'banner') => {
//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission Required', 'Camera permission needed');
//       return;
//     }

//     const result = await ImagePicker.launchCameraAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: type === 'logo' ? [1, 1] : [16, 9],
//       quality: 0.8,
//     });

//     if (!result.canceled && result.assets[0]) {
//       await handleFileChange(type, result.assets[0]);
//     }
//   };

//   const openGallery = async (type: 'logo' | 'banner') => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: type === 'logo' ? [1, 1] : [16, 9],
//       quality: 0.8,
//     });

//     if (!result.canceled && result.assets[0]) {
//       await handleFileChange(type, result.assets[0]);
//     }
//   };

//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#3b82f6" />
//         <Text style={styles.loadingText}>Loading store profile...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         <View style={styles.header}>
//           <Text style={styles.title}>⚙️ Store Settings</Text>
//           <Text style={styles.subtitle}>Manage your store information</Text>
//         </View>

//         {successMessage ? (
//           <View style={styles.successAlert}>
//             <Text style={styles.alertText}>✅ {successMessage}</Text>
//           </View>
//         ) : null}

//         {errorMessage ? (
//           <View style={styles.errorAlert}>
//             <Text style={styles.alertText}>⚠️ {errorMessage}</Text>
//           </View>
//         ) : null}

//         {isUploadingImages && (
//           <View style={styles.uploadingContainer}>
//             <ActivityIndicator size="small" color="#3b82f6" />
//             <Text style={styles.uploadingText}>☁️ Uploading to Cloudinary...</Text>
//           </View>
//         )}

//         <View style={styles.tabContainer}>
//           <TouchableOpacity
//             style={[styles.tab, activeTab === 'mandatory' && styles.activeTab]}
//             onPress={() => setActiveTab('mandatory')}
//           >
//             <Text style={[styles.tabText, activeTab === 'mandatory' && styles.activeTabText]}>
//               🏪 Essential
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.tab, activeTab === 'optional' && styles.activeTab]}
//             onPress={() => setActiveTab('optional')}
//           >
//             <Text style={[styles.tabText, activeTab === 'optional' && styles.activeTabText]}>
//               💳 Payment
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {activeTab === 'mandatory' ? (
//           <View style={styles.formSection}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>⭐ Store Images</Text>
              
//               <View style={styles.imageRow}>
//                 <View style={styles.imageSection}>
//                   <Text style={styles.label}>Logo</Text>
//                   <TouchableOpacity onPress={() => selectImage('logo')} style={styles.imageUpload}>
//                     {logoUri || currentLogoUrl ? (
//                       <Image source={{ uri: logoUri || currentLogoUrl }} style={styles.logoImage} />
//                     ) : (
//                       <View style={styles.imagePlaceholder}>
//                         <Text style={styles.placeholderIcon}>📷</Text>
//                         <Text style={styles.placeholderText}>Add Logo</Text>
//                       </View>
//                     )}
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               <TouchableOpacity
//                 onPress={() => setShowBannerGallery(!showBannerGallery)}
//                 style={[
//                   styles.galleryButton,
//                   { backgroundColor: selectedPredefinedBanners.length > 0 ? '#10b981' : '#8b5cf6' }
//                 ]}
//               >
//                 <Text style={styles.galleryButtonText}>
//                   {selectedPredefinedBanners.length > 0 
//                     ? `✅ ${selectedPredefinedBanners.length} Banner${selectedPredefinedBanners.length > 1 ? 's' : ''} Selected`
//                     : '🎨 Choose Banners (Max 3)'}
//                 </Text>
//               </TouchableOpacity>

//               {currentBannerUrls.length > 0 && (
//                 <View style={styles.selectedBannersContainer}>
//                   <Text style={styles.label}>Selected Banners ({currentBannerUrls.length})</Text>
//                   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedBannersScroll}>
//                     {currentBannerUrls.map((url, index) => (
//                       <View key={index} style={styles.selectedBannerItem}>
//                         <Image source={{ uri: url }} style={styles.selectedBannerImage} />
//                         <View style={styles.selectedBadge}>
//                           <Text style={styles.selectedBadgeText}>#{index + 1}</Text>
//                         </View>
//                       </View>
//                     ))}
//                   </ScrollView>
//                 </View>
//               )}
//             </View>

//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>🏢 Basic Information</Text>
              
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>Store Name *</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={store.name}
//                   onChangeText={(value) => handleInputChange('name', value)}
//                   placeholder="My Awesome Store"
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>Tagline</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={store.tagline}
//                   onChangeText={(value) => handleInputChange('tagline', value)}
//                   placeholder="Quality Products, Fast Delivery"
//                   maxLength={150}
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>Description *</Text>
//                 <TextInput
//                   style={styles.textArea}
//                   value={store.description}
//                   onChangeText={(value) => handleInputChange('description', value)}
//                   placeholder="Tell customers about your store..."
//                   multiline
//                   numberOfLines={4}
//                   maxLength={500}
//                 />
//               </View>

//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>WhatsApp Number *</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={store.whatsapp_number}
//                   onChangeText={(value) => handleInputChange('whatsapp_number', value)}
//                   placeholder="9876543210"
//                   keyboardType="phone-pad"
//                   maxLength={10}
//                 />
//               </View>
//             </View>
//           </View>
//         ) : (
//           <View style={styles.formSection}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>💳 Payment Methods</Text>
              
//               <View style={styles.inputGroup}>
//                 <Text style={styles.label}>Payment Method *</Text>
//                 <View style={styles.paymentOptions}>
//                   <TouchableOpacity
//                     style={[styles.paymentOption, store.payment_method === 'CASHFREE' && styles.paymentOptionActive]}
//                     onPress={() => handleInputChange('payment_method', 'CASHFREE')}
//                   >
//                     <Text style={[styles.paymentOptionText, store.payment_method === 'CASHFREE' && styles.paymentOptionTextActive]}>
//                       Cashfree
//                     </Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={[styles.paymentOption, store.payment_method === 'UPI' && styles.paymentOptionActive]}
//                     onPress={() => handleInputChange('payment_method', 'UPI')}
//                   >
//                     <Text style={[styles.paymentOptionText, store.payment_method === 'UPI' && styles.paymentOptionTextActive]}>
//                       UPI
//                     </Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={[styles.paymentOption, store.payment_method === 'RAZORPAY' && styles.paymentOptionActive]}
//                     onPress={() => handleInputChange('payment_method', 'RAZORPAY')}
//                   >
//                     <Text style={[styles.paymentOptionText, store.payment_method === 'RAZORPAY' && styles.paymentOptionTextActive]}>
//                       Razorpay
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>

//               {store.payment_method === 'CASHFREE' && !cashfreeConnected && (
//                 <>
//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Bank Account Number *</Text>
//                     <TextInput
//                       style={styles.input}
//                       value={store.cashfree_bank_account}
//                       onChangeText={(value) => handleInputChange('cashfree_bank_account', value)}
//                       placeholder="Your bank account number"
//                       keyboardType="numeric"
//                     />
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>IFSC Code *</Text>
//                     <TextInput
//                       style={styles.input}
//                       value={store.cashfree_ifsc}
//                       onChangeText={(value) => handleInputChange('cashfree_ifsc', value)}
//                       placeholder="SBIN0001234"
//                     />
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Account Holder Name *</Text>
//                     <TextInput
//                       style={styles.input}
//                       value={store.cashfree_account_holder}
//                       onChangeText={(value) => handleInputChange('cashfree_account_holder', value)}
//                       placeholder="Name as per bank"
//                     />
//                   </View>

//                   <TouchableOpacity
//                     onPress={handleCashfreeConnect}
//                     disabled={isConnectingCashfree}
//                     style={styles.cashfreeButton}
//                   >
//                     <Text style={styles.cashfreeButtonText}>
//                       {isConnectingCashfree ? 'Registering...' : 'Register Bank Account (0% Commission)'}
//                     </Text>
//                   </TouchableOpacity>
//                 </>
//               )}

//               {store.payment_method === 'CASHFREE' && cashfreeConnected && (
//                 <View style={styles.cashfreeConnected}>
//                   <Text style={styles.cashfreeConnectedText}>
//                     ✅ Bank registered! You'll receive 100% of sales directly.
//                   </Text>
//                 </View>
//               )}

//               {store.payment_method === 'UPI' && (
//                 <View style={styles.inputGroup}>
//                   <Text style={styles.label}>UPI ID *</Text>
//                   <TextInput
//                     style={styles.input}
//                     value={store.upi_id}
//                     onChangeText={(value) => handleInputChange('upi_id', value)}
//                     placeholder="yourname@paytm"
//                   />
//                 </View>
//               )}

//               {store.payment_method === 'RAZORPAY' && (
//                 <>
//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Razorpay Key ID *</Text>
//                     <TextInput
//                       style={styles.input}
//                       value={store.razorpay_key_id}
//                       onChangeText={(value) => handleInputChange('razorpay_key_id', value)}
//                       placeholder="rzp_test_..."
//                     />
//                   </View>

//                   <View style={styles.inputGroup}>
//                     <Text style={styles.label}>Razorpay Key Secret *</Text>
//                     <TextInput
//                       style={styles.input}
//                       value={store.razorpay_key_secret}
//                       onChangeText={(value) => handleInputChange('razorpay_key_secret', value)}
//                       placeholder="Your secret key"
//                       secureTextEntry
//                     />
//                   </View>
//                 </>
//               )}

//               <View style={styles.switchContainer}>
//                 <Text style={styles.label}>Accept Cash on Delivery</Text>
//                 <Switch
//                   value={store.accepts_cod}
//                   onValueChange={(value) => handleInputChange('accepts_cod', value)}
//                   trackColor={{ false: '#767577', true: '#3b82f6' }}
//                   thumbColor={store.accepts_cod ? '#ffffff' : '#f4f3f4'}
//                 />
//               </View>
//             </View>
//           </View>
//         )}

//         <TouchableOpacity
//           style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
//           onPress={handleSubmit}
//           disabled={isSaving}
//         >
//           <Text style={styles.saveButtonText}>
//             {isSaving ? 'Saving...' : '💾 Save Changes'}
//           </Text>
//         </TouchableOpacity>
//       </ScrollView>

//       <Modal visible={showBannerGallery} animationType="slide" transparent>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>
//                 Choose Banners ({selectedPredefinedBanners.length}/3)
//               </Text>
//               <TouchableOpacity onPress={() => setShowBannerGallery(false)}>
//                 <Text style={styles.modalClose}>✕</Text>
//               </TouchableOpacity>
//             </View>

//             <FlatList
//               data={predefinedBanners}
//               keyExtractor={(item) => item.id.toString()}
//               numColumns={2}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   style={[
//                     styles.galleryItem,
//                     selectedPredefinedBanners.includes(item.id) && styles.galleryItemSelected,
//                   ]}
//                   onPress={() => handleBannerSelect(item.id, item.image_url)}
//                 >
//                   <Image source={{ uri: item.image_url }} style={styles.galleryImage} />
//                   {selectedPredefinedBanners.includes(item.id) && (
//                     <View style={styles.selectedBadgeGallery}>
//                       <Text style={styles.selectedBadgeText}>
//                         #{selectedPredefinedBanners.indexOf(item.id) + 1}
//                       </Text>
//                     </View>
//                   )}
//                   <Text style={styles.bannerName}>{item.name}</Text>
//                 </TouchableOpacity>
//               )}
//             />
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f8fafc' },
//   scrollContent: { padding: 20, paddingBottom: 40 },
//   loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
//   loadingText: { marginTop: 10, fontSize: 16, color: '#6b7280' },
//   header: { marginBottom: 24, marginTop: 20 },
//   title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
//   subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
//   successAlert: { backgroundColor: '#d1fae5', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#10b981' },
//   errorAlert: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#ef4444' },
//   alertText: { fontSize: 14, textAlign: 'center' },
//   uploadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#dbeafe', borderRadius: 8, marginBottom: 16, gap: 8 },
//   uploadingText: { fontSize: 14, color: '#1e40af', fontWeight: '500' },
//   tabContainer: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 4, marginBottom: 20 },
//   tab: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
//   activeTab: { backgroundColor: '#3b82f6' },
//   tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
//   activeTabText: { color: 'white' },
//   formSection: { gap: 16 },
//   sectionCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
//   sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#f3f4f6' },
//   inputGroup: { marginBottom: 16 },
//   label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
//   input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: 'white' },
//   textArea: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: 'white', minHeight: 80, textAlignVertical: 'top' },
//   imageRow: { flexDirection: 'row', gap: 16 },
//   imageSection: { flex: 1, alignItems: 'center' },
//   imageUpload: { width: 120, height: 120, borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' },
//   logoImage: { width: 116, height: 116, borderRadius: 10 },
//   imagePlaceholder: { alignItems: 'center', gap: 4 },
//   placeholderIcon: { fontSize: 24 },
//   placeholderText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
//   galleryButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
//   galleryButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
//   selectedBannersContainer: { marginTop: 12 },
//   selectedBannersScroll: { marginTop: 8 },
//   selectedBannerItem: { position: 'relative', marginRight: 8, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#10b981' },
//   selectedBannerImage: { width: 150, height: 80 },
//   selectedBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: '#10b981', borderRadius: 4, padding: 4 },
//   selectedBadgeText: { color: 'white', fontSize: 11, fontWeight: '600' },
//   paymentOptions: { flexDirection: 'row', gap: 8 },
//   paymentOption: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb', alignItems: 'center' },
//   paymentOptionActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
//   paymentOptionText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
//   paymentOptionTextActive: { color: 'white', fontWeight: '600' },
//   cashfreeButton: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
//   cashfreeButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
//   cashfreeConnected: { backgroundColor: '#ecfdf5', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#10b981', marginTop: 12 },
//   cashfreeConnectedText: { color: '#065f46', fontWeight: '600', textAlign: 'center' },
//   switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
//   saveButton: { backgroundColor: '#10b981', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
//   saveButtonDisabled: { backgroundColor: '#9ca3af' },
//   saveButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
//   modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
//   modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
//   modalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
//   modalClose: { fontSize: 24, color: '#6b7280', fontWeight: 'bold' },
//   galleryItem: { flex: 1, margin: 6, borderRadius: 8, borderWidth: 2, borderColor: '#e5e7eb', overflow: 'hidden' },
//   galleryItemSelected: { borderColor: '#10b981', borderWidth: 3 },
//   galleryImage: { width: '100%', height: 100 },
//   selectedBadgeGallery: { position: 'absolute', top: 6, right: 6, backgroundColor: '#10b981', borderRadius: 6, padding: 4 },
//   bannerName: { padding: 8, backgroundColor: 'white', fontSize: 12, fontWeight: '500', color: '#374151', textAlign: 'center' },
// });

// export default CreateShopScreen;
// src/screens/profile/CreateShopScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, ActivityIndicator, Image, Switch,
  Platform, FlatList, Modal,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/ApiClient';

// ── Cloudinary ────────────────────────────────────────────────────────────────

const CLOUDINARY = {
  cloudName: 'dnmbfeckd',
  preset:    'kerala_sellers_preset',
  fallback:  'ml_default',
  folder:    'kerala-sellers/store-profiles',
} as const;

interface CloudinaryResult { success: true;  url: string; publicId: string; }
interface CloudinaryError  { success: false; error: string; }
type UploadResult = CloudinaryResult | CloudinaryError;

const uploadToCloudinary = async (
  uri: string,
  opts: { folder: string; width: number; height: number; crop: string },
): Promise<UploadResult> => {
  for (const preset of [CLOUDINARY.preset, CLOUDINARY.fallback]) {
    try {
      const form = new FormData();
      form.append('file',           { uri, type: 'image/jpeg', name: `store_${Date.now()}.jpg` } as any);
      form.append('upload_preset',  preset);
      form.append('folder',         opts.folder);
      form.append('width',          String(opts.width));
      form.append('height',         String(opts.height));
      form.append('crop',           opts.crop);
      form.append('quality',        'auto:good');
      form.append('fetch_format',   'auto');

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`,
        { method: 'POST', body: form },
      );

      if (!res.ok) {
        if (__DEV__) console.warn(`Cloudinary [${preset}] failed:`, await res.text());
        continue;
      }
      const d = await res.json();
      return { success: true, url: d.secure_url, publicId: d.public_id };
    } catch (e: any) {
      if (__DEV__) console.warn(`Cloudinary [${preset}] error:`, e.message);
    }
  }
  return { success: false, error: 'All upload presets failed' };
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoreForm {
  name:                   string;
  description:            string;
  whatsapp_number:        string;
  tagline:                string;
  delivery_time_local:    string;
  delivery_time_national: string;
  payment_method:         'RAZORPAY' | 'UPI';
  accepts_cod:            boolean;
  razorpay_key_id:        string;
  razorpay_key_secret:    string;
  upi_id:                 string;
}

const EMPTY_FORM: StoreForm = {
  name:                   '',
  description:            '',
  whatsapp_number:        '',
  tagline:                '',
  delivery_time_local:    '',
  delivery_time_national: '',
  payment_method:         'RAZORPAY',
  accepts_cod:            false,
  razorpay_key_id:        '',
  razorpay_key_secret:    '',
  upi_id:                 '',
};

interface PredefinedBanner { id: number; name: string; image_url: string; is_active: boolean; }

type Tab  = 'essential' | 'payment';
type Props = { navigation: StackNavigationProp<any> };

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | '';
const useToast = () => {
  const [toast, setToast] = useState<{ type: ToastType; msg: string }>({ type: '', msg: '' });
  const show = useCallback((type: ToastType, msg: string, ms = 3000) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), ms);
  }, []);
  return { toast, show };
};

// ── Component ─────────────────────────────────────────────────────────────────

const CreateShopScreen: React.FC<Props> = ({ navigation }) => {
  const [tab,             setTab]             = useState<Tab>('essential');
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [uploading,       setUploading]       = useState(false);
  const [showBanners,     setShowBanners]     = useState(false);
  const [showRzpSecret,   setShowRzpSecret]   = useState(false);

  const [form,            setForm]            = useState<StoreForm>(EMPTY_FORM);
  const [logoUrl,         setLogoUrl]         = useState('');
  const [pendingLogo,     setPendingLogo]     = useState<CloudinaryResult | null>(null);
  const [pendingBanner,   setPendingBanner]   = useState<CloudinaryResult | null>(null);

  const [bannerOptions,   setBannerOptions]   = useState<PredefinedBanner[]>([]);
  const [selectedBanners, setSelectedBanners] = useState<number[]>([]);
  const [bannerUrls,      setBannerUrls]      = useState<string[]>([]);

  const { toast, show } = useToast();

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted')
          Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
      }
      await Promise.all([loadProfile(), loadBanners()]);
    })();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/user/store/profile/');
      const p = data.store_profile;
      if (!p) return;

      setForm({
        name:                   p.name                   ?? '',
        description:            p.description            ?? '',
        whatsapp_number:        p.whatsapp_number        ?? '',
        tagline:                p.tagline                ?? '',
        delivery_time_local:    p.delivery_time_local    ?? '',
        delivery_time_national: p.delivery_time_national ?? '',
        payment_method:         p.payment_method === 'UPI' ? 'UPI' : 'RAZORPAY',
        accepts_cod:            p.accepts_cod            ?? false,
        razorpay_key_id:        p.razorpay_key_id        ?? '',
        razorpay_key_secret:    p.razorpay_key_secret    ?? '',
        upi_id:                 p.upi_id                 ?? '',
      });

      setLogoUrl(p.logo_url ?? '');

      const ids: number[]  = [];
      const urls: string[] = [];
      for (let i = 1; i <= 3; i++) {
        if (p[`predefined_banner_${i}`]) {
          ids.push(p[`predefined_banner_${i}`]);
          urls.push(p[`banner_${i}_url`]);
        }
      }
      setSelectedBanners(ids);
      setBannerUrls(urls);
    } catch (e) {
      if (__DEV__) console.error('loadProfile:', e);
      show('error', 'Failed to load store profile');
    } finally {
      setLoading(false);
    }
  };

  const loadBanners = async () => {
    try {
      const { data } = await apiClient.get('/api/predefined-banners/');
      setBannerOptions(data.filter((b: PredefinedBanner) => b.is_active));
    } catch (e) {
      if (__DEV__) console.error('loadBanners:', e);
    }
  };

  // ── Form ──────────────────────────────────────────────────────────────────

  const update = <K extends keyof StoreForm>(key: K, val: StoreForm[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  // ── Images ────────────────────────────────────────────────────────────────

  const pickImage = (type: 'logo' | 'banner') => {
    Alert.alert('Select Image', 'Choose a source', [
      { text: 'Cancel',  style: 'cancel' },
      { text: 'Camera',  onPress: () => openCamera(type) },
      { text: 'Gallery', onPress: () => openGallery(type) },
    ]);
  };

  const handleImageAsset = async (type: 'logo' | 'banner', uri: string) => {
    setUploading(true);
    const result = await uploadToCloudinary(uri, {
      folder: `${CLOUDINARY.folder}/${type}`,
      width:  type === 'logo' ? 400 : 1200,
      height: type === 'logo' ? 400 : 400,
      crop:   'fill',
    });
    setUploading(false);

    if (!result.success) {
      show('error', `Failed to upload ${type}. Please try again.`);
      return;
    }

    if (type === 'logo') {
      setLogoUrl(result.url);
      setPendingLogo(result);
      try {
        await apiClient.patch('/user/store/profile/', {
          cloudinary_logo: { public_id: result.publicId, url: result.url },
        });
        show('success', 'Logo saved!');
      } catch {
        show('error', 'Logo uploaded but not saved — hit Save Changes.');
      }
    } else {
      setPendingBanner(result);
      setBannerUrls([result.url]);
      setSelectedBanners([]);
      show('success', 'Banner uploaded!');
    }
  };

  const openCamera = async (type: 'logo' | 'banner') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Camera permission needed'); return; }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],                          // ✅ fixed deprecation
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (!res.canceled) await handleImageAsset(type, res.assets[0].uri);
  };

  const openGallery = async (type: 'logo' | 'banner') => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],                          // ✅ fixed deprecation
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (!res.canceled) await handleImageAsset(type, res.assets[0].uri);
  };

  // ── Banners ───────────────────────────────────────────────────────────────

  const toggleBanner = (id: number, url: string) => {
    if (selectedBanners.includes(id)) {
      setSelectedBanners(p => p.filter(x => x !== id));
      setBannerUrls(p => p.filter(x => x !== url));
    } else if (selectedBanners.length >= 3) {
      show('error', 'Maximum 3 banners allowed');
    } else {
      setSelectedBanners(p => [...p, id]);
      setBannerUrls(p => [...p, url]);
      setPendingBanner(null);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.whatsapp_number.trim()) {
      show('error', 'Store name, description and WhatsApp number are required');
      return;
    }
    if (form.payment_method === 'RAZORPAY' && (!form.razorpay_key_id.trim() || !form.razorpay_key_secret.trim())) {
      show('error', 'Please enter both Razorpay Key ID and Secret');
      return;
    }
    if (form.payment_method === 'UPI' && !form.upi_id.trim()) {
      show('error', 'Please enter your UPI ID');
      return;
    }

    setSaving(true);
    try {
      await apiClient.patch('/user/store/profile/', {
        ...form,
        predefined_banner_1: selectedBanners[0] ?? null,
        predefined_banner_2: selectedBanners[1] ?? null,
        predefined_banner_3: selectedBanners[2] ?? null,
        cloudinary_logo: pendingLogo
          ? { public_id: pendingLogo.publicId, url: pendingLogo.url }
          : null,
        cloudinary_banner_1: pendingBanner
          ? { public_id: pendingBanner.publicId, url: pendingBanner.url }
          : null,
      });
      show('success', 'Store profile updated!');
      Alert.alert('Saved!', 'Your store profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      const msg = e.response?.data?.error ?? 'Failed to save. Please try again.';
      show('error', msg);
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={s.loadingText}>Loading store profile...</Text>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Store Settings</Text>
          <Text style={s.subtitle}>Manage your store information</Text>
        </View>

        {/* Toast */}
        {!!toast.msg && (
          <View style={[s.toast, toast.type === 'success' ? s.toastSuccess : s.toastError]}>
            <Ionicons
              name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={16}
              color={toast.type === 'success' ? '#065f46' : '#991b1b'}
            />
            <Text style={[s.toastText, toast.type === 'success' ? s.toastSuccessText : s.toastErrorText]}>
              {toast.msg}
            </Text>
          </View>
        )}

        {/* Upload indicator */}
        {uploading && (
          <View style={s.uploadRow}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={s.uploadText}>Uploading image...</Text>
          </View>
        )}

        {/* Tabs */}
        <View style={s.tabs}>
          {([['essential', '🏪 Essential'], ['payment', '💳 Payment']] as const).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[s.tab, tab === key && s.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Essential Tab ── */}
        {tab === 'essential' ? (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>Store Images</Text>

              {/* Logo picker */}
              <View style={s.logoRow}>
                <TouchableOpacity style={s.logoWrap} onPress={() => pickImage('logo')} disabled={uploading}>
                  {logoUrl ? (
                    <Image source={{ uri: logoUrl }} style={s.logoImg} />
                  ) : (
                    <View style={s.logoPlaceholder}>
                      <Ionicons name="camera-outline" size={28} color="#3b82f6" />
                      <Text style={s.placeholderText}>Add Logo</Text>
                    </View>
                  )}
                  {uploading && (
                    <View style={s.logoOverlay}>
                      <ActivityIndicator color="white" />
                    </View>
                  )}
                </TouchableOpacity>
                <View style={s.logoHint}>
                  <Text style={s.hintTitle}>Store Logo</Text>
                  <Text style={s.hintText}>Square image recommended{'\n'}Min 400×400px</Text>
                </View>
              </View>

              {/* Banner picker */}
              <TouchableOpacity
                style={[s.bannerBtn, selectedBanners.length > 0 && s.bannerBtnSelected]}
                onPress={() => setShowBanners(true)}
              >
                <Ionicons
                  name={selectedBanners.length > 0 ? 'images' : 'add-circle-outline'}
                  size={18}
                  color="white"
                />
                <Text style={s.bannerBtnText}>
                  {selectedBanners.length > 0
                    ? `${selectedBanners.length} Banner${selectedBanners.length > 1 ? 's' : ''} Selected`
                    : 'Choose Banners (Max 3)'}
                </Text>
              </TouchableOpacity>

              {bannerUrls.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.previewScroll}>
                  {bannerUrls.map((url, i) => (
                    <View key={i} style={s.previewItem}>
                      <Image source={{ uri: url }} style={s.previewImg} />
                      <View style={s.previewBadge}>
                        <Text style={s.previewBadgeText}>#{i + 1}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Basic Info */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Basic Information</Text>
              {([
                ['name',            'Store Name *',              'My Awesome Store',                    false, false],
                ['tagline',         'Tagline',                   'Quality Products, Fast Delivery',     false, false],
                ['description',     'Description *',             'Tell customers about your store...',  true,  false],
                ['whatsapp_number', 'WhatsApp Number *',         '9876543210',                          false, true ],
              ] as const).map(([key, label, ph, multi, phone]) => (
                <View key={key} style={s.field}>
                  <Text style={s.label}>{label}</Text>
                  <TextInput
                    style={multi ? s.textarea : s.input}
                    value={String(form[key])}
                    onChangeText={v => update(key, v as any)}
                    placeholder={ph}
                    placeholderTextColor="#9ca3af"
                    multiline={multi}
                    numberOfLines={multi ? 4 : 1}
                    keyboardType={phone ? 'phone-pad' : 'default'}
                    maxLength={phone ? 10 : multi ? 500 : undefined}
                  />
                </View>
              ))}
            </View>
          </>

        ) : (
        /* ── Payment Tab ── */
          <View style={s.card}>
            <Text style={s.cardTitle}>Payment Settings</Text>

            {/* Method toggle */}
            <Text style={s.label}>Payment Method *</Text>
            <View style={s.methodRow}>
              {(['RAZORPAY', 'UPI'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.methodBtn, form.payment_method === m && s.methodBtnActive]}
                  onPress={() => update('payment_method', m)}
                >
                  <Text style={[s.methodText, form.payment_method === m && s.methodTextActive]}>
                    {m === 'RAZORPAY' ? 'Razorpay' : 'UPI'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Razorpay fields */}
            {form.payment_method === 'RAZORPAY' && (
              <View style={s.paymentSection}>
                <View style={s.paymentHint}>
                  <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
                  <Text style={s.paymentHintText}>
                    Get your keys from Razorpay Dashboard → Settings → API Keys
                  </Text>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Key ID *</Text>
                  <TextInput
                    style={s.input}
                    value={form.razorpay_key_id}
                    onChangeText={v => update('razorpay_key_id', v.trim())}
                    placeholder="rzp_test_xxxx or rzp_live_xxxx"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {/* Live key warning */}
                  {form.razorpay_key_id.startsWith('rzp_live_') && (
                    <View style={s.liveWarn}>
                      <Ionicons name="warning-outline" size={13} color="#d97706" />
                      <Text style={s.liveWarnText}>Live key — real payments will be charged</Text>
                    </View>
                  )}
                  {form.razorpay_key_id.startsWith('rzp_test_') && (
                    <View style={s.testOk}>
                      <Ionicons name="checkmark-circle-outline" size={13} color="#059669" />
                      <Text style={s.testOkText}>Test key — safe for development</Text>
                    </View>
                  )}
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Key Secret *</Text>
                  <View style={s.secretWrap}>
                    <TextInput
                      style={s.secretInput}
                      value={form.razorpay_key_secret}
                      onChangeText={v => update('razorpay_key_secret', v.trim())}
                      placeholder="Your Razorpay secret"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showRzpSecret}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={s.eyeBtn}
                      onPress={() => setShowRzpSecret(v => !v)}
                    >
                      <Ionicons
                        name={showRzpSecret ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#9ca3af"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Coming soon: Cashfree */}
                <View style={s.comingSoon}>
                  <Ionicons name="time-outline" size={16} color="#9ca3af" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.comingSoonTitle}>Cashfree — Coming Soon</Text>
                    <Text style={s.comingSoonText}>Direct bank payouts with 0% commission</Text>
                  </View>
                </View>
              </View>
            )}

            {/* UPI field */}
            {form.payment_method === 'UPI' && (
              <View style={s.paymentSection}>
                <View style={s.field}>
                  <Text style={s.label}>UPI ID *</Text>
                  <TextInput
                    style={s.input}
                    value={form.upi_id}
                    onChangeText={v => update('upi_id', v.trim())}
                    placeholder="yourname@paytm"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>

                {/* Coming soon: Cashfree */}
                <View style={s.comingSoon}>
                  <Ionicons name="time-outline" size={16} color="#9ca3af" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.comingSoonTitle}>Cashfree — Coming Soon</Text>
                    <Text style={s.comingSoonText}>Direct bank payouts with 0% commission</Text>
                  </View>
                </View>
              </View>
            )}

            {/* COD toggle */}
            <View style={s.switchRow}>
              <View>
                <Text style={s.label}>Cash on Delivery</Text>
                <Text style={s.switchSubtext}>Allow customers to pay at delivery</Text>
              </View>
              <Switch
                value={form.accepts_cod}
                onValueChange={v => update('accepts_cod', v)}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor="white"
              />
            </View>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={[s.saveBtn, (saving || uploading) && s.saveBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving || uploading}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="white" />
              <Text style={s.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Banner gallery modal */}
      <Modal
        visible={showBanners}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBanners(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Choose Banners ({selectedBanners.length}/3)</Text>
              <TouchableOpacity onPress={() => setShowBanners(false)} style={s.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={bannerOptions}
              keyExtractor={item => String(item.id)}
              numColumns={2}
              contentContainerStyle={{ padding: 8 }}
              renderItem={({ item }) => {
                const selected = selectedBanners.includes(item.id);
                const idx      = selectedBanners.indexOf(item.id);
                return (
                  <TouchableOpacity
                    style={[s.galleryItem, selected && s.galleryItemSelected]}
                    onPress={() => toggleBanner(item.id, item.image_url)}
                  >
                    <Image source={{ uri: item.image_url }} style={s.galleryImg} />
                    {selected && (
                      <View style={s.galleryBadge}>
                        <Text style={s.galleryBadgeText}>#{idx + 1}</Text>
                      </View>
                    )}
                    <Text style={s.galleryLabel} numberOfLines={1}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity style={s.modalDone} onPress={() => setShowBanners(false)}>
              <Text style={s.modalDoneText}>Done — {selectedBanners.length} Selected</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#f8fafc' },
  scroll:           { padding: 20, paddingBottom: 48 },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText:      { marginTop: 12, fontSize: 15, color: '#6b7280' },

  header:           { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  title:            { fontSize: 26, fontWeight: '800', color: '#111827' },
  subtitle:         { fontSize: 14, color: '#6b7280', marginTop: 4 },

  toast:            { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1 },
  toastSuccess:     { backgroundColor: '#d1fae5', borderColor: '#6ee7b7' },
  toastError:       { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  toastText:        { flex: 1, fontSize: 13, fontWeight: '500' },
  toastSuccessText: { color: '#065f46' },
  toastErrorText:   { color: '#991b1b' },

  uploadRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dbeafe', padding: 10, borderRadius: 8, marginBottom: 12 },
  uploadText:       { fontSize: 13, color: '#1e40af', fontWeight: '500' },

  tabs:             { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  tab:              { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive:        { backgroundColor: '#3b82f6' },
  tabText:          { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive:    { color: 'white' },

  card:             { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 }, android: { elevation: 2 } }) },
  cardTitle:        { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },

  logoRow:          { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  logoWrap:         { width: 100, height: 100, borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff' },
  logoImg:          { width: '100%', height: '100%' },
  logoPlaceholder:  { alignItems: 'center', gap: 4 },
  logoOverlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  logoHint:         { flex: 1 },
  hintTitle:        { fontSize: 14, fontWeight: '600', color: '#374151' },
  hintText:         { fontSize: 12, color: '#9ca3af', marginTop: 4, lineHeight: 18 },
  placeholderText:  { fontSize: 11, color: '#3b82f6', fontWeight: '600', marginTop: 2 },

  bannerBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 10, backgroundColor: '#8b5cf6', marginBottom: 12 },
  bannerBtnSelected:{ backgroundColor: '#059669' },
  bannerBtnText:    { color: 'white', fontSize: 14, fontWeight: '600' },
  previewScroll:    { marginBottom: 4 },
  previewItem:      { position: 'relative', marginRight: 8, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#059669' },
  previewImg:       { width: 140, height: 75 },
  previewBadge:     { position: 'absolute', top: 4, left: 4, backgroundColor: '#059669', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  previewBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },

  field:            { marginBottom: 14 },
  label:            { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:            { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 11, fontSize: 14, color: '#111827', backgroundColor: '#fafafa' },
  textarea:         { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 11, fontSize: 14, color: '#111827', backgroundColor: '#fafafa', minHeight: 90, textAlignVertical: 'top' },

  methodRow:        { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: 6 },
  methodBtn:        { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', backgroundColor: '#f9fafb' },
  methodBtnActive:  { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  methodText:       { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  methodTextActive: { color: 'white', fontWeight: '700' },

  paymentSection:   { marginTop: 4 },
  paymentHint:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', padding: 10, borderRadius: 8, marginBottom: 14 },
  paymentHintText:  { flex: 1, fontSize: 12, color: '#1e40af' },

  secretWrap:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#fafafa' },
  secretInput:      { flex: 1, padding: 11, fontSize: 14, color: '#111827' },
  eyeBtn:           { padding: 11 },

  liveWarn:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  liveWarnText:     { fontSize: 12, color: '#d97706' },
  testOk:           { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  testOkText:       { fontSize: 12, color: '#059669' },

  comingSoon:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed', marginTop: 12 },
  comingSoonTitle:  { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  comingSoonText:   { fontSize: 12, color: '#9ca3af', marginTop: 1 },

  switchRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  switchSubtext:    { fontSize: 11, color: '#9ca3af', marginTop: 2 },

  saveBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#10b981', borderRadius: 12, padding: 16, marginTop: 8 },
  saveBtnDisabled:  { backgroundColor: '#6ee7b7' },
  saveBtnText:      { color: 'white', fontSize: 16, fontWeight: '700' },

  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:       { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '82%' },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle:       { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalCloseBtn:    { padding: 4 },
  modalDone:        { margin: 16, backgroundColor: '#3b82f6', padding: 14, borderRadius: 10, alignItems: 'center' },
  modalDoneText:    { color: 'white', fontSize: 15, fontWeight: '600' },
  galleryItem:      { flex: 1, margin: 6, borderRadius: 10, borderWidth: 2, borderColor: '#e5e7eb', overflow: 'hidden', backgroundColor: 'white' },
  galleryItemSelected: { borderColor: '#10b981', borderWidth: 3 },
  galleryImg:       { width: '100%', height: 90 },
  galleryBadge:     { position: 'absolute', top: 6, right: 6, backgroundColor: '#10b981', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  galleryBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
  galleryLabel:     { padding: 8, fontSize: 12, fontWeight: '500', color: '#374151', textAlign: 'center' },
});

export default CreateShopScreen;
