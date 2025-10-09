import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { api } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../components/layout/MainLayout';

interface StoreProfile {
  // Basic Information
  name: string;
  description: string;
  whatsapp_number: string;
  tagline: string;
  
  // Contact & Social
  instagram_link: string;
  facebook_link: string;
  email: string;
  
  // Business Settings
  delivery_time_local: string;
  delivery_time_national: string;
  meta_title: string;
  meta_description: string;
  
  // Payment Settings
  payment_method: 'NONE' | 'RAZORPAY' | 'UPI';
  razorpay_key_id: string;
  razorpay_key_secret: string;
  upi_id: string;
  accepts_cod: boolean;
  
  // Verification
  gst_number: string;
  business_license: string;
  owner_name: string;
  business_address: string;
  verification_status: 'pending' | 'verified' | 'rejected';
}

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState<'basic' | 'business' | 'payments'>('basic');
  const [store, setStore] = useState<StoreProfile>({
    name: '',
    description: '',
    whatsapp_number: '',
    tagline: '',
    instagram_link: '',
    facebook_link: '',
    email: '',
    delivery_time_local: '',
    delivery_time_national: '',
    meta_title: '',
    meta_description: '',
    payment_method: 'NONE',
    razorpay_key_id: '',
    razorpay_key_secret: '',
    upi_id: '',
    accepts_cod: false,
    gst_number: '',
    business_license: '',
    owner_name: '',
    business_address: '',
    verification_status: 'pending'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const { logout } = useAuth();

  useEffect(() => {
    fetchStoreProfile();
  }, []);

  const fetchStoreProfile = useCallback(async () => {
    try {
      console.log('⚙️ SettingsScreen: Fetching store profile...');
      
      const response = await api.getStoreProfile();
      console.log('✅ SettingsScreen: Store profile received:', response);
      
      const sellerData = response.seller || {};
      const storeData = response.store_profile || {};
      
      setStore(prev => ({
        ...prev,
        name: storeData.name || sellerData.shop_name || 'Gost namez',
        description: storeData.description || 'Electronics and mobile accessories store in Kerala',
        whatsapp_number: storeData.whatsapp_number || storeData.seller_phone || sellerData.phone || '9898989898',
        tagline: storeData.tagline || 'Quality products, fast delivery across Kerala',
        email: sellerData.email || 'gost@gmail.com',
        instagram_link: storeData.instagram_link || '',
        facebook_link: storeData.facebook_link || '',
        delivery_time_local: storeData.delivery_time_local || '1-2 days',
        delivery_time_national: storeData.delivery_time_national || '3-5 days',
        meta_title: storeData.meta_title || '',
        meta_description: storeData.meta_description || '',
        payment_method: storeData.payment_method || 'NONE',
        razorpay_key_id: storeData.razorpay_key_id || '',
        razorpay_key_secret: storeData.razorpay_key_secret || '',
        upi_id: storeData.upi_id || '',
        accepts_cod: Boolean(storeData.accepts_cod),
        gst_number: storeData.gst_number || '',
        business_license: storeData.business_license || '',
        owner_name: storeData.owner_name || 'Thor A D',
        business_address: storeData.business_address || '',
        verification_status: storeData.verification_status || 'verified'
      }));
      
      calculateProgress(storeData);
      
    } catch (error: any) {
      console.error('❌ SettingsScreen: Error fetching store profile:', error);
      Alert.alert('Load Error', 'Failed to load store settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const calculateProgress = (storeData: any) => {
    const requiredFields = ['name', 'description', 'whatsapp_number', 'owner_name', 'business_address'];
    const completed = requiredFields.filter(field => storeData[field]?.trim()).length;
    setVerificationProgress(Math.round((completed / requiredFields.length) * 100));
  };

  const handleInputChange = (field: keyof StoreProfile, value: string | boolean) => {
    setStore(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!store.name?.trim()) errors.push('Store name is required');
    if (!store.description?.trim()) errors.push('Store description is required');
    if (!store.whatsapp_number?.trim()) errors.push('WhatsApp number is required');
    
    if (store.whatsapp_number && !/^(\+91|91)?[6-9]\d{9}$/.test(store.whatsapp_number.replace(/\s+/g, ''))) {
      errors.push('Please enter a valid Indian mobile number');
    }
    
    if (store.payment_method === 'RAZORPAY') {
      if (!store.razorpay_key_id?.trim()) errors.push('Razorpay Key ID is required');
      if (!store.razorpay_key_secret?.trim()) errors.push('Razorpay Key Secret is required');
    }
    
    if (store.payment_method === 'UPI' && !store.upi_id?.trim()) {
      errors.push('UPI ID is required when UPI payment is selected');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log('💾 SettingsScreen: Updating store profile...');
      
      const response = await api.updateStoreProfile(store);
      console.log('✅ SettingsScreen: Store profile updated:', response);
      
      calculateProgress(response.store_profile || response.store || response);
      
      Alert.alert(
        'Success! 🎉',
        'Store settings updated successfully!',
        [{ text: 'Great!' }]
      );
      
    } catch (error: any) {
      console.error('❌ SettingsScreen: Error updating store profile:', error);
      const errorMessage = error.message || 'Failed to update store settings. Please try again.';
      Alert.alert('Update Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getVerificationStatusDisplay = () => {
    const statusConfig = {
      pending: { 
        icon: 'time-outline', 
        color: COLORS.warning,
        text: 'Verification Pending',
        bgColor: '#FEF3C7'
      },
      verified: { 
        icon: 'checkmark-circle', 
        color: COLORS.success,
        text: 'Verified Seller',
        bgColor: '#D1FAE5'
      },
      rejected: { 
        icon: 'close-circle', 
        color: COLORS.error,
        text: 'Verification Rejected',
        bgColor: '#FEE2E2'
      }
    };
    
    return statusConfig[store.verification_status] || statusConfig.verified;
  };

  if (isLoading) {
    return (
      <MainLayout navigation={navigation} currentTab="settings" headerTitle="Settings">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Settings...</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation} currentTab="settings" headerTitle="Store Settings">
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.headerCard}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.headerGradient}
            >
              <Ionicons name="settings" size={40} color={COLORS.surface} />
              <Text style={styles.headerTitle}>Store Settings</Text>
              <Text style={styles.headerSubtitle}>
                Configure your Gost namez store
              </Text>
            </LinearGradient>
          </View>

          {/* Verification Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[
                styles.statusIconContainer,
                { backgroundColor: getVerificationStatusDisplay().bgColor }
              ]}>
                <Ionicons 
                  name={getVerificationStatusDisplay().icon as any} 
                  size={20} 
                  color={getVerificationStatusDisplay().color} 
                />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Verification Status</Text>
                <Text style={[
                  styles.statusText,
                  { color: getVerificationStatusDisplay().color }
                ]}>
                  {getVerificationStatusDisplay().text}
                </Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Profile Completion</Text>
                <Text style={styles.progressPercent}>{verificationProgress}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${verificationProgress}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'basic' && styles.activeTab]}
              onPress={() => setActiveTab('basic')}
            >
              <Ionicons name="information-circle" size={18} color={
                activeTab === 'basic' ? COLORS.surface : COLORS.textSecondary
              } />
              <Text style={[
                styles.tabText,
                activeTab === 'basic' && styles.activeTabText
              ]}>
                Basic Info
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'business' && styles.activeTab]}
              onPress={() => setActiveTab('business')}
            >
              <Ionicons name="business" size={18} color={
                activeTab === 'business' ? COLORS.surface : COLORS.textSecondary
              } />
              <Text style={[
                styles.tabText,
                activeTab === 'business' && styles.activeTabText
              ]}>
                Business
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'payments' && styles.activeTab]}
              onPress={() => setActiveTab('payments')}
            >
              <Ionicons name="card" size={18} color={
                activeTab === 'payments' ? COLORS.surface : COLORS.textSecondary
              } />
              <Text style={[
                styles.tabText,
                activeTab === 'payments' && styles.activeTabText
              ]}>
                Payments
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {activeTab === 'basic' && (
              <View>
                {/* Basic Information */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Store Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={store.name}
                      onChangeText={(text) => handleInputChange('name', text)}
                      placeholder="Enter your store name"
                      placeholderTextColor={COLORS.textTertiary}
                      maxLength={100}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Store Tagline</Text>
                    <TextInput
                      style={styles.input}
                      value={store.tagline}
                      onChangeText={(text) => handleInputChange('tagline', text)}
                      placeholder="Quality Products, Delivered Fast"
                      placeholderTextColor={COLORS.textTertiary}
                      maxLength={150}
                    />
                    <Text style={styles.charCount}>
                      {store.tagline.length}/150
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Store Description *</Text>
                    <TextInput
                      style={styles.textArea}
                      value={store.description}
                      onChangeText={(text) => handleInputChange('description', text)}
                      placeholder="Describe your store and what you sell..."
                      placeholderTextColor={COLORS.textTertiary}
                      multiline={true}
                      numberOfLines={4}
                      textAlignVertical="top"
                      maxLength={500}
                    />
                    <Text style={styles.charCount}>
                      {store.description.length}/500
                    </Text>
                  </View>
                </View>

                {/* Contact Information */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>WhatsApp Business Number *</Text>
                    <TextInput
                      style={styles.input}
                      value={store.whatsapp_number}
                      onChangeText={(text) => handleInputChange('whatsapp_number', text)}
                      placeholder="+91 9876543210"
                      placeholderTextColor={COLORS.textTertiary}
                      keyboardType="phone-pad"
                      maxLength={15}
                    />
                    <Text style={styles.helpText}>
                      Enter your WhatsApp Business number for customer support
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={styles.input}
                      value={store.email}
                      onChangeText={(text) => handleInputChange('email', text)}
                      placeholder="your.email@example.com"
                      placeholderTextColor={COLORS.textTertiary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Instagram Profile</Text>
                    <TextInput
                      style={styles.input}
                      value={store.instagram_link}
                      onChangeText={(text) => handleInputChange('instagram_link', text)}
                      placeholder="https://instagram.com/yourstore"
                      placeholderTextColor={COLORS.textTertiary}
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Facebook Page</Text>
                    <TextInput
                      style={styles.input}
                      value={store.facebook_link}
                      onChangeText={(text) => handleInputChange('facebook_link', text)}
                      placeholder="https://facebook.com/yourstore"
                      placeholderTextColor={COLORS.textTertiary}
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'business' && (
              <View>
                {/* Business Settings */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Business Settings</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Owner Name</Text>
                    <TextInput
                      style={styles.input}
                      value={store.owner_name}
                      onChangeText={(text) => handleInputChange('owner_name', text)}
                      placeholder="Enter business owner name"
                      placeholderTextColor={COLORS.textTertiary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Business Address</Text>
                    <TextInput
                      style={styles.textArea}
                      value={store.business_address}
                      onChangeText={(text) => handleInputChange('business_address', text)}
                      placeholder="Enter complete business address"
                      placeholderTextColor={COLORS.textTertiary}
                      multiline={true}
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Local Delivery Time</Text>
                    <TextInput
                      style={styles.input}
                      value={store.delivery_time_local}
                      onChangeText={(text) => handleInputChange('delivery_time_local', text)}
                      placeholder="e.g., 1-2 days"
                      placeholderTextColor={COLORS.textTertiary}
                    />
                    <Text style={styles.helpText}>
                      Delivery time within Kerala
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>National Delivery Time</Text>
                    <TextInput
                      style={styles.input}
                      value={store.delivery_time_national}
                      onChangeText={(text) => handleInputChange('delivery_time_national', text)}
                      placeholder="e.g., 3-5 days"
                      placeholderTextColor={COLORS.textTertiary}
                    />
                    <Text style={styles.helpText}>
                      Delivery time outside Kerala
                    </Text>
                  </View>
                </View>

                {/* Business Verification */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Business Verification</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>GST Number</Text>
                    <TextInput
                      style={styles.input}
                      value={store.gst_number}
                      onChangeText={(text) => handleInputChange('gst_number', text)}
                      placeholder="22AAAAA0000A1Z5"
                      placeholderTextColor={COLORS.textTertiary}
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Business License</Text>
                    <TextInput
                      style={styles.input}
                      value={store.business_license}
                      onChangeText={(text) => handleInputChange('business_license', text)}
                      placeholder="Enter business license number"
                      placeholderTextColor={COLORS.textTertiary}
                    />
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'payments' && (
              <View>
                {/* Payment Settings */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Payment Settings</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Payment Method</Text>
                    <View style={styles.radioGroup}>
                      {(['NONE', 'RAZORPAY', 'UPI'] as const).map((method) => (
                        <TouchableOpacity
                          key={method}
                          style={styles.radioOption}
                          onPress={() => handleInputChange('payment_method', method)}
                        >
                          <View style={[
                            styles.radioCircle,
                            store.payment_method === method && styles.radioSelected
                          ]}>
                            {store.payment_method === method && (
                              <View style={styles.radioInner} />
                            )}
                          </View>
                          <Text style={styles.radioText}>
                            {method === 'NONE' ? 'None' : method}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {store.payment_method === 'RAZORPAY' && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Razorpay Key ID *</Text>
                        <TextInput
                          style={styles.input}
                          value={store.razorpay_key_id}
                          onChangeText={(text) => handleInputChange('razorpay_key_id', text)}
                          placeholder="rzp_test_..."
                          placeholderTextColor={COLORS.textTertiary}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Razorpay Key Secret *</Text>
                        <View style={styles.passwordContainer}>
                          <TextInput
                            style={styles.passwordInput}
                            value={store.razorpay_key_secret}
                            onChangeText={(text) => handleInputChange('razorpay_key_secret', text)}
                            placeholder="Enter Razorpay secret key"
                            placeholderTextColor={COLORS.textTertiary}
                            secureTextEntry={!showSecrets.razorpay_key_secret}
                          />
                          <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => toggleSecretVisibility('razorpay_key_secret')}
                          >
                            <Ionicons
                              name={showSecrets.razorpay_key_secret ? 'eye' : 'eye-off'}
                              size={20}
                              color={COLORS.textSecondary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}

                  {store.payment_method === 'UPI' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>UPI ID *</Text>
                      <TextInput
                        style={styles.input}
                        value={store.upi_id}
                        onChangeText={(text) => handleInputChange('upi_id', text)}
                        placeholder="yourname@paytm"
                        placeholderTextColor={COLORS.textTertiary}
                      />
                    </View>
                  )}

                  <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Accept Cash on Delivery</Text>
                    <Switch
                      value={store.accepts_cod}
                      onValueChange={(value) => handleInputChange('accepts_cod', value)}
                      trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                      thumbColor={store.accepts_cod ? COLORS.primary : COLORS.textTertiary}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitButton, isSaving && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isSaving}
            >
              <LinearGradient
                colors={isSaving ? 
                  ['#94a3b8', '#64748b'] : 
                  ['#3b82f6', '#1d4ed8']
                }
                style={styles.submitGradient}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.surface} />
                ) : (
                  <Ionicons name="save" size={20} color={COLORS.surface} />
                )}
                <Text style={styles.submitText}>
                  {isSaving ? 'Saving Changes...' : 'Save Settings'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  headerCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.shadowColored,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.surface,
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  progressBarContainer: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 4,
    elevation: 2,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  eyeButton: {
    padding: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.shadowColored,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
