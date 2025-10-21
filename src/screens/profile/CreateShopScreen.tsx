import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet,
  ActivityIndicator, Image, Switch, Platform, FlatList, Modal,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../services/ApiClient';
import AuthService from '../../services/AuthService';

// ✅ Cloudinary Config (Same as Web)
const CLOUDINARY_CONFIG = {
  cloudName: 'dnmbfeckd',
  uploadPreset: 'keralasellers_preset',
  fallbackPreset: 'ml_default',
  folder: 'kerala-sellers/store-profiles',
};

// ✅ Cloudinary Upload Function
const uploadToCloudinary = async (fileUri: string, options: any = {}) => {
  const presetsToTry = [
    { preset: CLOUDINARY_CONFIG.uploadPreset, name: 'custom' },
    { preset: CLOUDINARY_CONFIG.fallbackPreset, name: 'fallback' },
  ];

  for (const { preset, name } of presetsToTry) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'image/jpeg',
        name: `store_${Date.now()}.jpg`,
      } as any);
      formData.append('upload_preset', preset);
      formData.append('folder', options.folder || CLOUDINARY_CONFIG.folder);
      if (options.width) formData.append('width', options.width.toString());
      if (options.height) formData.append('height', options.height.toString());
      if (options.crop) formData.append('crop', options.crop);
      formData.append('quality', 'auto:good');
      formData.append('fetch_format', 'auto');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        if (name === 'fallback') throw new Error('Upload failed');
        continue;
      }

      const result = await response.json();
      return { success: true, url: result.secure_url, publicId: result.public_id };
    } catch (error) {
      if (name === 'fallback') return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'All upload presets failed' };
};

interface StoreFormData {
  name: string;
  description: string;
  whatsapp_number: string;
  tagline: string;
  delivery_time_local: string;
  delivery_time_national: string;
  payment_method: string;
  accepts_cod: boolean;
  cashfree_bank_account: string;
  cashfree_ifsc: string;
  cashfree_account_holder: string;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  upi_id: string;
}

type CreateShopScreenProps = {
  navigation: StackNavigationProp<any>;
};

const CreateShopScreen: React.FC<CreateShopScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'mandatory' | 'optional'>('mandatory');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingImages, setIsUploadingImages] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [store, setStore] = useState<StoreFormData>({
    name: '',
    description: '',
    whatsapp_number: '',
    tagline: '',
    delivery_time_local: '',
    delivery_time_national: '',
    payment_method: 'CASHFREE',
    accepts_cod: false,
    cashfree_bank_account: '',
    cashfree_ifsc: '',
    cashfree_account_holder: '',
    razorpay_key_id: '',
    razorpay_key_secret: '',
    upi_id: '',
  });

  const [logoUri, setLogoUri] = useState<string>('');
  const [bannerUri, setBannerUri] = useState<string>('');
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>('');
  const [cloudinaryData, setCloudinaryData] = useState<any>({ logo: null, banner: null });
  
  // ✅ NEW: Predefined Banners (Like Web)
  const [predefinedBanners, setPredefinedBanners] = useState<any[]>([]);
  const [selectedPredefinedBanners, setSelectedPredefinedBanners] = useState<number[]>([]);
  const [currentBannerUrls, setCurrentBannerUrls] = useState<string[]>([]);
  const [showBannerGallery, setShowBannerGallery] = useState<boolean>(false);
  
  // ✅ NEW: Cashfree State (Like Web)
  const [cashfreeConnected, setCashfreeConnected] = useState<boolean>(false);
  const [isConnectingCashfree, setIsConnectingCashfree] = useState<boolean>(false);

  useEffect(() => {
    requestPermissions();
    fetchStoreProfile();
    fetchPredefinedBanners();
  }, []);

  const requestPermissions = async (): Promise<void> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions.');
      }
    }
  };

  const fetchPredefinedBanners = async (): Promise<void> => {
    try {
      const response = await apiClient.get('/api/predefined-banners/');
      const activeBanners = response.data.filter((b: any) => b.is_active);
      setPredefinedBanners(activeBanners);
      console.log(`✅ Loaded ${activeBanners.length} predefined banners`);
    } catch (error) {
      console.error('❌ Error fetching predefined banners:', error);
    }
  };

  const fetchStoreProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/user/store/profile/');
      
      if (response.data.store_profile) {
        const profile = response.data.store_profile;
        setStore({
          name: profile.name || '',
          description: profile.description || '',
          whatsapp_number: profile.whatsapp_number || '',
          tagline: profile.tagline || '',
          delivery_time_local: profile.delivery_time_local || '',
          delivery_time_national: profile.delivery_time_national || '',
          payment_method: profile.payment_method || 'CASHFREE',
          accepts_cod: profile.accepts_cod || false,
          cashfree_bank_account: profile.cashfree_bank_account || '',
          cashfree_ifsc: profile.cashfree_ifsc || '',
          cashfree_account_holder: profile.cashfree_account_holder || '',
          razorpay_key_id: profile.razorpay_key_id || '',
          razorpay_key_secret: profile.razorpay_key_secret || '',
          upi_id: profile.upi_id || '',
        });
        
        setCurrentLogoUrl(profile.logo_url || '');
        
        const banners: number[] = [];
        const bannerUrls: string[] = [];
        if (profile.predefined_banner_1) {
          banners.push(profile.predefined_banner_1);
          bannerUrls.push(profile.banner_1_url);
        }
        if (profile.predefined_banner_2) {
          banners.push(profile.predefined_banner_2);
          bannerUrls.push(profile.banner_2_url);
        }
        if (profile.predefined_banner_3) {
          banners.push(profile.predefined_banner_3);
          bannerUrls.push(profile.banner_3_url);
        }
        setSelectedPredefinedBanners(banners);
        setCurrentBannerUrls(bannerUrls);
      }

      await checkCashfreeStatus();
    } catch (error) {
      console.error('Error fetching store profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCashfreeStatus = async () => {
    try {
      const response = await apiClient.get('/api/payments/cashfree/vendor/status/');
      if (response.data.registered) {
        setCashfreeConnected(true);
      }
    } catch (error) {
      console.log('No Cashfree vendor found');
    }
  };

  const handleInputChange = (name: keyof StoreFormData, value: string | boolean): void => {
    setStore(prev => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const handleFileChange = async (fileType: 'logo' | 'banner', file: any) => {
    if (!file) return;

    setIsUploadingImages(true);
    const result = await uploadToCloudinary(file.uri, {
      folder: `${CLOUDINARY_CONFIG.folder}/${fileType}`,
      width: fileType === 'logo' ? 400 : 1200,
      height: fileType === 'logo' ? 400 : 400,
      crop: 'fill',
    });

    if (result.success) {
      setCloudinaryData((prev: any) => ({ ...prev, [fileType]: result }));
      if (fileType === 'logo') setCurrentLogoUrl(result.url);
      if (fileType === 'banner') {
        setCurrentBannerUrls([result.url]);
        setSelectedPredefinedBanners([]);
      }
      setSuccessMessage(`${fileType} uploaded successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(`Failed to upload ${fileType}`);
    }
    setIsUploadingImages(false);
  };

  const handleBannerSelect = (bannerId: number, bannerUrl: string) => {
    if (selectedPredefinedBanners.includes(bannerId)) {
      setSelectedPredefinedBanners(prev => prev.filter(id => id !== bannerId));
      setCurrentBannerUrls(prev => prev.filter(url => url !== bannerUrl));
    } else if (selectedPredefinedBanners.length < 3) {
      setSelectedPredefinedBanners(prev => [...prev, bannerId]);
      setCurrentBannerUrls(prev => [...prev, bannerUrl]);
    } else {
      setErrorMessage('⚠️ Maximum 3 banners allowed');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleCashfreeConnect = async () => {
    if (!store.cashfree_bank_account?.trim() || !store.cashfree_ifsc?.trim() || !store.cashfree_account_holder?.trim()) {
      setErrorMessage('Please fill all Cashfree fields');
      return;
    }

    try {
      setIsConnectingCashfree(true);
      const response = await apiClient.post('/api/payments/cashfree/vendor/register/', {
        bank_account: store.cashfree_bank_account,
        ifsc: store.cashfree_ifsc,
        account_holder_name: store.cashfree_account_holder,
        email: `${store.whatsapp_number}@keralasellers.com`,
      });

      if (response.data.vendor_id) {
        setCashfreeConnected(true);
        setSuccessMessage('Bank account registered! You will receive 100% of sales directly.');
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.error || 'Failed to register bank account');
    } finally {
      setIsConnectingCashfree(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!store.name?.trim() || !store.description?.trim() || !store.whatsapp_number?.trim()) {
      setErrorMessage('Please fill all required fields');
      return;
    }

    setIsSaving(true);
    try {
      let updatedCloudinaryData = { ...cloudinaryData };

      // Upload new images if selected
      if (logoUri || bannerUri) {
        setIsUploadingImages(true);
        
        if (logoUri) {
          const logoResult = await uploadToCloudinary(logoUri, {
            folder: `${CLOUDINARY_CONFIG.folder}/logo`,
            width: 400,
            height: 400,
            crop: 'fill',
          });
          if (logoResult.success) {
            updatedCloudinaryData.logo = {
              publicId: logoResult.publicId,
              url: logoResult.url,
            };
          }
        }

        if (bannerUri) {
          const bannerResult = await uploadToCloudinary(bannerUri, {
            folder: `${CLOUDINARY_CONFIG.folder}/banner`,
            width: 1200,
            height: 400,
            crop: 'fill',
          });
          if (bannerResult.success) {
            updatedCloudinaryData.banner = {
              publicId: bannerResult.publicId,
              url: bannerResult.url,
            };
          }
        }
        
        setIsUploadingImages(false);
      }

      const requestData = {
        ...store,
        predefined_banner_1: selectedPredefinedBanners[0] || null,
        predefined_banner_2: selectedPredefinedBanners[1] || null,
        predefined_banner_3: selectedPredefinedBanners[2] || null,
        cloudinary_logo: updatedCloudinaryData.logo ? {
          public_id: updatedCloudinaryData.logo.publicId,
          url: updatedCloudinaryData.logo.url,
        } : null,
        cloudinary_banner_1: updatedCloudinaryData.banner ? {
          public_id: updatedCloudinaryData.banner.publicId,
          url: updatedCloudinaryData.banner.url,
        } : null,
      };

      const response = await apiClient.patch('/user/store/profile/', requestData);
      
      setSuccessMessage('✅ Settings updated successfully!');
      Alert.alert('Success', 'Store profile updated successfully!');
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update settings';
      setErrorMessage(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSaving(false);
      setIsUploadingImages(false);
    }
  };

  const selectImage = async (type: 'logo' | 'banner'): Promise<void> => {
    Alert.alert('Select Image', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: () => openCamera(type) },
      { text: 'Gallery', onPress: () => openGallery(type) },
    ]);
  };

  const openCamera = async (type: 'logo' | 'banner') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission needed');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'logo') setLogoUri(result.assets[0].uri);
      else setBannerUri(result.assets[0].uri);
    }
  };

  const openGallery = async (type: 'logo' | 'banner') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'logo') setLogoUri(result.assets[0].uri);
      else setBannerUri(result.assets[0].uri);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading store profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Store Settings</Text>
          <Text style={styles.subtitle}>Manage your store information</Text>
        </View>

        {successMessage ? (
          <View style={styles.successAlert}>
            <Text style={styles.alertText}>✅ {successMessage}</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorAlert}>
            <Text style={styles.alertText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        {isUploadingImages && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.uploadingText}>☁️ Uploading to Cloudinary...</Text>
          </View>
        )}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'mandatory' && styles.activeTab]}
            onPress={() => setActiveTab('mandatory')}
          >
            <Text style={[styles.tabText, activeTab === 'mandatory' && styles.activeTabText]}>
              🏪 Essential
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'optional' && styles.activeTab]}
            onPress={() => setActiveTab('optional')}
          >
            <Text style={[styles.tabText, activeTab === 'optional' && styles.activeTabText]}>
              💳 Payment
            </Text>
          </TouchableOpacity>
        </View>

        {/* MANDATORY TAB */}
        {activeTab === 'mandatory' ? (
          <View style={styles.formSection}>
            {/* Store Images */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>⭐ Store Images</Text>
              
              <View style={styles.imageRow}>
                <View style={styles.imageSection}>
                  <Text style={styles.label}>Logo</Text>
                  <TouchableOpacity onPress={() => selectImage('logo')} style={styles.imageUpload}>
                    {logoUri || currentLogoUrl ? (
                      <Image source={{ uri: logoUri || currentLogoUrl }} style={styles.logoImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderIcon}>📷</Text>
                        <Text style={styles.placeholderText}>Add Logo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Banner Gallery Button */}
              <TouchableOpacity
                onPress={() => setShowBannerGallery(!showBannerGallery)}
                style={[
                  styles.galleryButton,
                  { backgroundColor: selectedPredefinedBanners.length > 0 ? '#10b981' : '#8b5cf6' }
                ]}
              >
                <Text style={styles.galleryButtonText}>
                  {selectedPredefinedBanners.length > 0 
                    ? `✅ ${selectedPredefinedBanners.length} Banner${selectedPredefinedBanners.length > 1 ? 's' : ''} Selected`
                    : '🎨 Choose Banners (Max 3)'}
                </Text>
              </TouchableOpacity>

              {/* Selected Banners Preview */}
              {currentBannerUrls.length > 0 && (
                <View style={styles.selectedBannersContainer}>
                  <Text style={styles.label}>Selected Banners ({currentBannerUrls.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedBannersScroll}>
                    {currentBannerUrls.map((url, index) => (
                      <View key={index} style={styles.selectedBannerItem}>
                        <Image source={{ uri: url }} style={styles.selectedBannerImage} />
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>#{index + 1}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Basic Info */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🏢 Basic Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Store Name *</Text>
                <TextInput
                  style={styles.input}
                  value={store.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="My Awesome Store"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tagline</Text>
                <TextInput
                  style={styles.input}
                  value={store.tagline}
                  onChangeText={(value) => handleInputChange('tagline', value)}
                  placeholder="Quality Products, Fast Delivery"
                  maxLength={150}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={styles.textArea}
                  value={store.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  placeholder="Tell customers about your store..."
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>WhatsApp Number *</Text>
                <TextInput
                  style={styles.input}
                  value={store.whatsapp_number}
                  onChangeText={(value) => handleInputChange('whatsapp_number', value)}
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </View>
        ) : (
          /* PAYMENT TAB */
          <View style={styles.formSection}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>💳 Payment Methods</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment Method *</Text>
                <View style={styles.paymentOptions}>
                  <TouchableOpacity
                    style={[styles.paymentOption, store.payment_method === 'CASHFREE' && styles.paymentOptionActive]}
                    onPress={() => handleInputChange('payment_method', 'CASHFREE')}
                  >
                    <Text style={[styles.paymentOptionText, store.payment_method === 'CASHFREE' && styles.paymentOptionTextActive]}>
                      Cashfree
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.paymentOption, store.payment_method === 'UPI' && styles.paymentOptionActive]}
                    onPress={() => handleInputChange('payment_method', 'UPI')}
                  >
                    <Text style={[styles.paymentOptionText, store.payment_method === 'UPI' && styles.paymentOptionTextActive]}>
                      UPI
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.paymentOption, store.payment_method === 'RAZORPAY' && styles.paymentOptionActive]}
                    onPress={() => handleInputChange('payment_method', 'RAZORPAY')}
                  >
                    <Text style={[styles.paymentOptionText, store.payment_method === 'RAZORPAY' && styles.paymentOptionTextActive]}>
                      Razorpay
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* CASHFREE */}
              {store.payment_method === 'CASHFREE' && !cashfreeConnected && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bank Account Number *</Text>
                    <TextInput
                      style={styles.input}
                      value={store.cashfree_bank_account}
                      onChangeText={(value) => handleInputChange('cashfree_bank_account', value)}
                      placeholder="Your bank account number"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>IFSC Code *</Text>
                    <TextInput
                      style={styles.input}
                      value={store.cashfree_ifsc}
                      onChangeText={(value) => handleInputChange('cashfree_ifsc', value)}
                      placeholder="SBIN0001234"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Account Holder Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={store.cashfree_account_holder}
                      onChangeText={(value) => handleInputChange('cashfree_account_holder', value)}
                      placeholder="Name as per bank"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleCashfreeConnect}
                    disabled={isConnectingCashfree}
                    style={styles.cashfreeButton}
                  >
                    <Text style={styles.cashfreeButtonText}>
                      {isConnectingCashfree ? 'Registering...' : 'Register Bank Account (0% Commission)'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {store.payment_method === 'CASHFREE' && cashfreeConnected && (
                <View style={styles.cashfreeConnected}>
                  <Text style={styles.cashfreeConnectedText}>
                    ✅ Bank registered! You'll receive 100% of sales directly.
                  </Text>
                </View>
              )}

              {/* UPI */}
              {store.payment_method === 'UPI' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>UPI ID *</Text>
                  <TextInput
                    style={styles.input}
                    value={store.upi_id}
                    onChangeText={(value) => handleInputChange('upi_id', value)}
                    placeholder="yourname@paytm"
                  />
                </View>
              )}

              {/* RAZORPAY */}
              {store.payment_method === 'RAZORPAY' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Razorpay Key ID *</Text>
                    <TextInput
                      style={styles.input}
                      value={store.razorpay_key_id}
                      onChangeText={(value) => handleInputChange('razorpay_key_id', value)}
                      placeholder="rzp_test_..."
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Razorpay Key Secret *</Text>
                    <TextInput
                      style={styles.input}
                      value={store.razorpay_key_secret}
                      onChangeText={(value) => handleInputChange('razorpay_key_secret', value)}
                      placeholder="Your secret key"
                      secureTextEntry
                    />
                  </View>
                </>
              )}

              <View style={styles.switchContainer}>
                <Text style={styles.label}>Accept Cash on Delivery</Text>
                <Switch
                  value={store.accepts_cod}
                  onValueChange={(value) => handleInputChange('accepts_cod', value)}
                  trackColor={{ false: '#767577', true: '#3b82f6' }}
                  thumbColor={store.accepts_cod ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : '💾 Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Banner Gallery Modal */}
      <Modal visible={showBannerGallery} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Choose Banners ({selectedPredefinedBanners.length}/3)
              </Text>
              <TouchableOpacity onPress={() => setShowBannerGallery(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={predefinedBanners}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.galleryItem,
                    selectedPredefinedBanners.includes(item.id) && styles.galleryItemSelected,
                  ]}
                  onPress={() => handleBannerSelect(item.id, item.image_url)}
                >
                  <Image source={{ uri: item.image_url }} style={styles.galleryImage} />
                  {selectedPredefinedBanners.includes(item.id) && (
                    <View style={styles.selectedBadgeGallery}>
                      <Text style={styles.selectedBadgeText}>
                        #{selectedPredefinedBanners.indexOf(item.id) + 1}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.bannerName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#6b7280' },
  header: { marginBottom: 24, marginTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  successAlert: { backgroundColor: '#d1fae5', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#10b981' },
  errorAlert: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#ef4444' },
  alertText: { fontSize: 14, textAlign: 'center' },
  uploadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#dbeafe', borderRadius: 8, marginBottom: 16, gap: 8 },
  uploadingText: { fontSize: 14, color: '#1e40af', fontWeight: '500' },
  tabContainer: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  activeTab: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  activeTabText: { color: 'white' },
  formSection: { gap: 16 },
  sectionCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#f3f4f6' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: 'white' },
  textArea: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: 'white', minHeight: 80, textAlignVertical: 'top' },
  imageRow: { flexDirection: 'row', gap: 16 },
  imageSection: { flex: 1, alignItems: 'center' },
  imageUpload: { width: 120, height: 120, borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' },
  logoImage: { width: 116, height: 116, borderRadius: 10 },
  imagePlaceholder: { alignItems: 'center', gap: 4 },
  placeholderIcon: { fontSize: 24 },
  placeholderText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  galleryButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  galleryButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  selectedBannersContainer: { marginTop: 12 },
  selectedBannersScroll: { marginTop: 8 },
  selectedBannerItem: { position: 'relative', marginRight: 8, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#10b981' },
  selectedBannerImage: { width: 150, height: 80 },
  selectedBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: '#10b981', borderRadius: 4, padding: 4 },
  selectedBadgeText: { color: 'white', fontSize: 11, fontWeight: '600' },
  paymentOptions: { flexDirection: 'row', gap: 8 },
  paymentOption: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb', alignItems: 'center' },
  paymentOptionActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  paymentOptionText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  paymentOptionTextActive: { color: 'white', fontWeight: '600' },
  cashfreeButton: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  cashfreeButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
  cashfreeConnected: { backgroundColor: '#ecfdf5', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#10b981', marginTop: 12 },
  cashfreeConnectedText: { color: '#065f46', fontWeight: '600', textAlign: 'center' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  saveButton: { backgroundColor: '#10b981', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  saveButtonDisabled: { backgroundColor: '#9ca3af' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  modalClose: { fontSize: 24, color: '#6b7280', fontWeight: 'bold' },
  galleryItem: { flex: 1, margin: 6, borderRadius: 8, borderWidth: 2, borderColor: '#e5e7eb', overflow: 'hidden' },
  galleryItemSelected: { borderColor: '#10b981', borderWidth: 3 },
  galleryImage: { width: '100%', height: 100 },
  selectedBadgeGallery: { position: 'absolute', top: 6, right: 6, backgroundColor: '#10b981', borderRadius: 6, padding: 4 },
  bannerName: { padding: 8, backgroundColor: 'white', fontSize: 12, fontWeight: '500', color: '#374151', textAlign: 'center' },
});

export default CreateShopScreen;
