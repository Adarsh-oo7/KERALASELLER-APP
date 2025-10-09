import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  Switch,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import StoreService from '../../services/StoreService';
import AuthService from '../../services/AuthService';
import { StoreProfile, ApiError } from '../../types/api';

interface StoreFormData {
  name: string;
  description: string;
  whatsapp_number: string;
  tagline: string;
  instagram_link: string;
  facebook_link: string;
  delivery_time_local: string;
  delivery_time_national: string;
  payment_method: string;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  upi_id: string;
  accepts_cod: boolean;
  gst_number: string;
  business_license: string;
  owner_name: string;
  business_address: string;
  verification_status: string;
}

type CreateShopScreenProps = {
  navigation: StackNavigationProp<any>;
};

const CreateShopScreen: React.FC<CreateShopScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'mandatory' | 'optional'>('mandatory');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [verificationProgress, setVerificationProgress] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // ✅ FIXED: Better mode detection
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [storeExists, setStoreExists] = useState<boolean>(false);
  const [storeId, setStoreId] = useState<number | null>(null);

  const [store, setStore] = useState<StoreFormData>({
    name: '',
    description: '',
    whatsapp_number: '',
    tagline: '',
    instagram_link: '',
    facebook_link: '',
    delivery_time_local: '',
    delivery_time_national: '',
    payment_method: 'NONE', // ✅ FIXED: Use NONE as default (matches Django backend)
    razorpay_key_id: '',
    razorpay_key_secret: '',
    upi_id: '',
    accepts_cod: true,
    gst_number: '',
    business_license: '',
    owner_name: '',
    business_address: '',
    verification_status: 'pending'
  });

  // File states
  const [logoUri, setLogoUri] = useState<string>('');
  const [bannerUri, setBannerUri] = useState<string>('');
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>('');
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string>('');

  useEffect(() => {
    requestPermissions();
    fetchStoreProfile();
  }, []);

  const requestPermissions = async (): Promise<void> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload images.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // ✅ FIXED: Simplified store detection - ANY existing profile = EDIT mode
  const fetchStoreProfile = async (): Promise<void> => {
    try {
      console.log('🔍 Checking if store profile exists...');
      const response = await StoreService.getProfile();
      const profileData = response.data.store_profile;
      
      if (profileData) {
        // ✅ ANY existing profile goes to EDIT mode
        console.log('✅ Store profile found - EDIT MODE');
        setStoreExists(true);
        setIsEditMode(true);
        setStoreId(profileData.id || null);
        
        setStore({
          name: profileData.name || '',
          description: profileData.description || '',
          whatsapp_number: profileData.whatsapp_number || '',
          tagline: profileData.tagline || '',
          instagram_link: profileData.instagram_link || '',
          facebook_link: profileData.facebook_link || '',
          delivery_time_local: profileData.delivery_time_local || '',
          delivery_time_national: profileData.delivery_time_national || '',
          payment_method: profileData.payment_method || 'NONE', // ✅ Use backend value directly
          razorpay_key_id: profileData.razorpay_key_id || '',
          razorpay_key_secret: profileData.razorpay_key_secret || '',
          upi_id: profileData.upi_id || '',
          accepts_cod: profileData.accepts_cod !== undefined ? profileData.accepts_cod : true,
          gst_number: profileData.gst_number || '',
          business_license: profileData.business_license || '',
          owner_name: profileData.owner_name || '',
          business_address: profileData.business_address || '',
          verification_status: profileData.verification_status || 'pending'
        });
        
        setCurrentLogoUrl(profileData.logo_url || '');
        setCurrentBannerUrl(profileData.banner_image_url || '');
        calculateProgress(profileData);
        
      } else {
        // ✅ No profile = CREATE mode
        console.log('ℹ️ No store profile found - CREATE MODE');
        setStoreExists(false);
        setIsEditMode(false);
      }
    } catch (error: any) {
      console.error('❌ Error checking store profile:', error);
      
      if (error.response?.status === 404) {
        console.log('ℹ️ 404 - No store profile exists - CREATE MODE');
        setStoreExists(false);
        setIsEditMode(false);
      } else if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: () => handleLogout() }
        ]);
      } else {
        console.log('⚠️ Other error occurred:', error.response?.status);
        setStoreExists(false);
        setIsEditMode(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = (storeData: any): void => {
    const mandatoryFields = ['name', 'description', 'whatsapp_number'];
    const optionalFields = ['gst_number', 'business_license', 'owner_name', 'business_address'];
    
    let completed = 0;
    let total = mandatoryFields.length + optionalFields.length + 1;
    
    mandatoryFields.forEach(field => {
      if (storeData[field]?.trim()) completed++;
    });
    
    if (storeData.logo_url) completed++;
    
    optionalFields.forEach(field => {
      if (storeData[field]?.trim()) completed++;
    });
    
    setVerificationProgress(Math.round((completed / total) * 100));
  };

  const handleInputChange = (name: keyof StoreFormData, value: string | boolean): void => {
    setStore(prev => ({ ...prev, [name]: value }));
    
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!store.name?.trim()) errors.push('Store name is required');
    if (!store.description?.trim()) errors.push('Store description is required');
    if (!store.whatsapp_number?.trim()) errors.push('WhatsApp number is required');
    
    if (store.whatsapp_number) {
      const cleanNumber = store.whatsapp_number.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
        errors.push('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9');
      }
    }
    
    return errors;
  };

  // ✅ SIMPLIFIED: Use the smart create/update method
  const handleSubmit = async (): Promise<void> => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors.join('\n\n'));
      return;
    }
    
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      console.log('🔄 Saving store profile...');
      
      let response;
      
      // ✅ STEP 1: Save text data (this should always work)
      console.log('📤 Step 1: Saving text data...');
      response = await StoreService.createOrUpdateProfile(store);
      console.log('✅ Text data saved successfully');

      // ✅ STEP 2: Handle files separately if they exist
      const hasFiles = logoUri || bannerUri;
      if (hasFiles) {
        console.log('📤 Step 2: Uploading files...');
        
        try {
          const formData = new FormData();
          formData.append('name', store.name); // Required field
          
          if (logoUri) {
            formData.append('logo', {
              uri: logoUri,
              type: 'image/jpeg',
              name: 'logo.jpg',
            } as any);
          }
          
          if (bannerUri) {
            formData.append('banner_image', {
              uri: bannerUri,
              type: 'image/jpeg',
              name: 'banner.jpg',
            } as any);
          }
          
          // ✅ For files, we always UPDATE (since profile exists after step 1)
          const fileResponse = await StoreService.updateProfile(formData);
          console.log('✅ Files uploaded successfully');
          response = fileResponse;
          
        } catch (fileError: any) {
          console.error('⚠️ File upload failed:', fileError);
          Alert.alert(
            'Partial Success',
            'Your store profile was saved, but image upload failed. You can try uploading images again later.',
            [{ text: 'OK' }]
          );
        }
      }
      
      handleSuccess(response);
      
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ UPDATED: Better test method
  const testSaveWithoutFiles = async () => {
    try {
      console.log('🧪 Testing smart save without files...');
      
      const testData = {
        name: store.name || 'Updated Test Store',
        description: store.description || 'Updated test description for store profile',
        whatsapp_number: store.whatsapp_number || '9876543210',
        tagline: store.tagline || 'Updated test tagline',
        payment_method: 'NONE', // ✅ Use exact backend value
        accepts_cod: true,
        verification_status: 'pending',
      };
      
      const response = await StoreService.createOrUpdateProfile(testData);
      console.log('✅ Smart save test successful');
      
      Alert.alert('Success!', 'Smart save without files works! Profile updated.');
      
    } catch (error: any) {
      console.error('❌ Smart save test failed:', error);
      Alert.alert('Failed', error.message || 'Smart save test failed');
    }
  };

  // ✅ HELPER: Handle success
  const handleSuccess = (response: any) => {
    console.log(`✅ Store profile ${isEditMode ? 'updated' : 'created'} successfully!`);
    
    Alert.alert(
      isEditMode ? 'Profile Updated! ✅' : 'Store Created! 🎉', 
      isEditMode 
        ? 'Your store profile has been updated successfully!' 
        : 'Your Kerala store is now live and ready to receive customers!',
      [
        {
          text: 'View Dashboard',
          onPress: () => navigation.navigate('MainTabs')
        }
      ]
    );
    
    // Update state
    if (response.data?.store_profile) {
      setCurrentLogoUrl(response.data.store_profile.logo_url || '');
      setCurrentBannerUrl(response.data.store_profile.banner_image_url || '');
      calculateProgress(response.data.store_profile);
      
      if (!isEditMode) {
        setIsEditMode(true);
        setStoreExists(true);
      }
    }
    
    setLogoUri('');
    setBannerUri('');
    setSuccessMessage(`Store profile ${isEditMode ? 'updated' : 'created'} successfully!`);
  };

  // ✅ HELPER: Handle errors
  const handleError = (error: any) => {
    console.error(`❌ Store profile ${isEditMode ? 'update' : 'creation'} failed:`, error);
    
    let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} store profile`;
    
    if (error.message === 'Network Error') {
      errorMessage = 'Network connection failed. Please check your internet connection and try again.';
    } else if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (typeof errorData === 'object') {
        const fieldErrors = [];
        Object.entries(errorData).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            fieldErrors.push(`${field}: ${messages.join(', ')}`);
          } else if (typeof messages === 'string') {
            fieldErrors.push(`${field}: ${messages}`);
          }
        });
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join('\n');
        }
      }
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed. Please login again.';
      setTimeout(() => handleLogout(), 1000);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setErrorMessage(errorMessage);
    Alert.alert('Error', errorMessage);
  };

  const testAPI = async () => {
    try {
      console.log('🧪 Testing API connection...');
      await StoreService.testConnection();
      Alert.alert('Success!', 'API connection is working correctly.');
    } catch (error: any) {
      console.error('❌ API test failed:', error);
      Alert.alert('API Test Failed', error.message || 'Unknown error occurred');
    }
  };

  const selectImage = async (type: 'logo' | 'banner'): Promise<void> => {
    try {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Camera', onPress: () => openCamera(type) },
          { text: 'Gallery', onPress: () => openGallery(type) },
        ]
      );
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

const openCamera = async (type: 'logo' | 'banner'): Promise<void> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ KEEP THIS: It works in newer versions
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      if (type === 'logo') {
        setLogoUri(imageUri);
      } else {
        setBannerUri(imageUri);
      }
      console.log(`✅ ${type} image selected:`, imageUri);
    }
  } catch (error) {
    console.error('Camera error:', error);
    Alert.alert('Error', 'Failed to take photo');
  }
};

const openGallery = async (type: 'logo' | 'banner'): Promise<void> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ KEEP THIS: It works in newer versions
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      if (type === 'logo') {
        setLogoUri(imageUri);
      } else {
        setBannerUri(imageUri);
      }
      console.log(`✅ ${type} image selected:`, imageUri);
    }
  } catch (error) {
    console.error('Gallery error:', error);
    Alert.alert('Error', 'Failed to select image from gallery');
  }
};


  const handleLogout = async (): Promise<void> => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
          }
        }
      ]
    );
  };

  const renderVerificationStatus = (): JSX.Element => {
    const getStatusConfig = () => {
      switch (store.verification_status) {
        case 'verified':
          return { color: '#10b981', bgColor: '#d1fae5', text: 'Verified Seller', emoji: '✅' };
        case 'rejected':
          return { color: '#ef4444', bgColor: '#fee2e2', text: 'Verification Rejected', emoji: '❌' };
        default:
          return { color: '#f59e0b', bgColor: '#fef3c7', text: 'Verification Pending', emoji: '⏳' };
      }
    };

    const config = getStatusConfig();

    return (
      <View style={[styles.verificationStatus, { backgroundColor: config.bgColor }]}>
        <Text style={[styles.verificationText, { color: config.color }]}>
          {config.emoji} {config.text}
        </Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${verificationProgress}%`, backgroundColor: config.color }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{verificationProgress}% Complete</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>
          Loading store profile...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ✅ SMART: Auto-changing header based on actual detection */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {(isEditMode || storeExists) ? '⚙️ Edit Your Store' : '🏪 Create Your Store'}
          </Text>
          <Text style={styles.subtitle}>
            {(isEditMode || storeExists)
              ? 'Update your Kerala Sellers store profile' 
              : 'Set up your Kerala Sellers store profile'
            }
          </Text>
          {renderVerificationStatus()}
        </View>

        {/* Success/Error Messages */}
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

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'mandatory' && styles.activeTab]}
            onPress={() => setActiveTab('mandatory')}
          >
            <Text style={[styles.tabText, activeTab === 'mandatory' && styles.activeTabText]}>
              🏪 Essential Info
            </Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.badgeText}>Required</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'optional' && styles.activeTab]}
            onPress={() => setActiveTab('optional')}
          >
            <Text style={[styles.tabText, activeTab === 'optional' && styles.activeTabText]}>
              🛡️ Verification
            </Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.badgeText}>Optional</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        {activeTab === 'mandatory' ? (
          <View style={styles.formSection}>
            {/* Store Branding */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>⭐ Store Branding</Text>
              
              <View style={styles.brandingContainer}>
                <View style={styles.imageSection}>
                  <Text style={styles.label}>Store Logo</Text>
                  <TouchableOpacity 
                    style={styles.imageUpload}
                    onPress={() => selectImage('logo')}
                    activeOpacity={0.7}
                  >
                    {logoUri || currentLogoUrl ? (
                      <View style={styles.imageContainer}>
                        <Image 
                          source={{ uri: logoUri || currentLogoUrl }} 
                          style={styles.logoImage}
                          resizeMode="cover"
                        />
                        <View style={styles.imageOverlay}>
                          <Text style={styles.changeText}>Tap to change</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderIcon}>📷</Text>
                        <Text style={styles.placeholderText}>Add Logo</Text>
                        <Text style={styles.placeholderSubtext}>Tap to upload</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.imageSection}>
                  <Text style={styles.label}>Store Banner</Text>
                  <TouchableOpacity 
                    style={styles.bannerUpload}
                    onPress={() => selectImage('banner')}
                    activeOpacity={0.7}
                  >
                    {bannerUri || currentBannerUrl ? (
                      <View style={styles.imageContainer}>
                        <Image 
                          source={{ uri: bannerUri || currentBannerUrl }} 
                          style={styles.bannerImage}
                          resizeMode="cover"
                        />
                        <View style={styles.imageOverlay}>
                          <Text style={styles.changeText}>Tap to change</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderIcon}>🖼️</Text>
                        <Text style={styles.placeholderText}>Add Banner</Text>
                        <Text style={styles.placeholderSubtext}>Tap to upload</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Basic Information */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🏢 Basic Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Store Name *</Text>
                <TextInput
                  style={styles.input}
                  value={store.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Enter your store name"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>WhatsApp Business Number *</Text>
                <TextInput
                  style={styles.input}
                  value={store.whatsapp_number}
                  onChangeText={(value) => handleInputChange('whatsapp_number', value)}
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <Text style={styles.helpText}>Enter your 10-digit WhatsApp number (without +91)</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Store Tagline</Text>
                <TextInput
                  style={styles.input}
                  value={store.tagline}
                  onChangeText={(value) => handleInputChange('tagline', value)}
                  placeholder="Quality Products, Delivered Fast"
                  maxLength={150}
                />
                <Text style={styles.charCount}>{store.tagline.length}/150</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Store Description *</Text>
                <TextInput
                  style={styles.textArea}
                  value={store.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  placeholder="Describe your store and what you sell..."
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{store.description.length}/500</Text>
              </View>
            </View>

            {/* Payment Settings */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>💳 Payment Settings</Text>
              
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Accept Cash on Delivery</Text>
                  <Switch
                    value={store.accepts_cod}
                    onValueChange={(value) => handleInputChange('accepts_cod', value)}
                    trackColor={{ false: '#767577', true: '#3b82f6' }}
                    thumbColor={store.accepts_cod ? '#ffffff' : '#f4f3f4'}
                  />
                </View>
                <Text style={styles.helpText}>
                  {store.accepts_cod 
                    ? '✅ Customers can pay with cash on delivery' 
                    : '❌ Only online payments accepted'
                  }
                </Text>
              </View>

              {/* ✅ Payment Method Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Online Payment Method</Text>
                <View style={styles.paymentOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.paymentOption, 
                      store.payment_method === 'NONE' && styles.paymentOptionActive
                    ]}
                    onPress={() => handleInputChange('payment_method', 'NONE')}
                  >
                    <Text style={[
                      styles.paymentOptionText,
                      store.payment_method === 'NONE' && styles.paymentOptionTextActive
                    ]}>None</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.paymentOption, 
                      store.payment_method === 'RAZORPAY' && styles.paymentOptionActive
                    ]}
                    onPress={() => handleInputChange('payment_method', 'RAZORPAY')}
                  >
                    <Text style={[
                      styles.paymentOptionText,
                      store.payment_method === 'RAZORPAY' && styles.paymentOptionTextActive
                    ]}>Razorpay</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.paymentOption, 
                      store.payment_method === 'UPI' && styles.paymentOptionActive
                    ]}
                    onPress={() => handleInputChange('payment_method', 'UPI')}
                  >
                    <Text style={[
                      styles.paymentOptionText,
                      store.payment_method === 'UPI' && styles.paymentOptionTextActive
                    ]}>UPI</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.helpText}>
                  Choose your preferred online payment method
                </Text>
              </View>
            </View>

            {/* Social Media */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🌐 Social Media</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Instagram Profile</Text>
                <TextInput
                  style={styles.input}
                  value={store.instagram_link}
                  onChangeText={(value) => handleInputChange('instagram_link', value)}
                  placeholder="https://instagram.com/yourstore"
                  keyboardType="url"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Facebook Page</Text>
                <TextInput
                  style={styles.input}
                  value={store.facebook_link}
                  onChangeText={(value) => handleInputChange('facebook_link', value)}
                  placeholder="https://facebook.com/yourstore"
                  keyboardType="url"
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.formSection}>
            {/* Business Verification */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🛡️ Business Verification</Text>
              <Text style={styles.sectionDescription}>
                Add business details to get verified and build customer trust
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Owner Name</Text>
                <TextInput
                  style={styles.input}
                  value={store.owner_name}
                  onChangeText={(value) => handleInputChange('owner_name', value)}
                  placeholder="Full name as per documents"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>GST Number</Text>
                <TextInput
                  style={styles.input}
                  value={store.gst_number}
                  onChangeText={(value) => handleInputChange('gst_number', value)}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Address</Text>
                <TextInput
                  style={styles.textArea}
                  value={store.business_address}
                  onChangeText={(value) => handleInputChange('business_address', value)}
                  placeholder="Complete business address with pincode"
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business License Number</Text>
                <TextInput
                  style={styles.input}
                  value={store.business_license}
                  onChangeText={(value) => handleInputChange('business_license', value)}
                  placeholder="Trade license or registration number"
                  maxLength={50}
                />
              </View>
            </View>

            {/* Delivery Settings */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🚚 Delivery Settings</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Local Delivery Time</Text>
                <TextInput
                  style={styles.input}
                  value={store.delivery_time_local}
                  onChangeText={(value) => handleInputChange('delivery_time_local', value)}
                  placeholder="2-3 business days"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>National Delivery Time</Text>
                <TextInput
                  style={styles.input}
                  value={store.delivery_time_national}
                  onChangeText={(value) => handleInputChange('delivery_time_national', value)}
                  placeholder="5-7 business days"
                />
              </View>
            </View>
          </View>
        )}

        {/* Test Buttons */}
        <TouchableOpacity style={styles.testButton} onPress={testAPI}>
          <Text style={styles.testButtonText}>🧪 Test API Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.testButton, { backgroundColor: '#8b5cf6' }]}
          onPress={testSaveWithoutFiles}
        >
          <Text style={styles.testButtonText}>🧪 Test Save (No Files)</Text>
        </TouchableOpacity>

        {/* ✅ SMART: Auto-changing button text */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.saveButtonText}>
                {(isEditMode || storeExists) ? 'Updating Profile...' : 'Creating Store...'}
              </Text>
            </>
          ) : (
            <Text style={styles.saveButtonText}>
              {(isEditMode || storeExists) ? '💾 Update Store Profile' : '🏪 Create Store Profile'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.dashboardButton} 
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text style={styles.dashboardButtonText}>📊 View Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  verificationStatus: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  successAlert: {
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  alertText: {
    fontSize: 14,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  activeTabText: {
    color: 'white',
  },
  requiredBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionalBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  formSection: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  brandingContainer: {
    gap: 16,
  },
  imageSection: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  imageUpload: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
  },
  bannerUpload: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
  },
  logoImage: {
    width: 116,
    height: 116,
    borderRadius: 10,
  },
  bannerImage: {
    width: '100%',
    height: 116,
    borderRadius: 10,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 4,
  },
  placeholderIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // ✅ Payment Option Styles
  paymentOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  paymentOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  paymentOptionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dashboardButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  dashboardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateShopScreen;
