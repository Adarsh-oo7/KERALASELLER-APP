import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { getApiConfig, getBaseURL } from '../../config/api';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter details, 2: Success message
  const [resetMethod, setResetMethod] = useState<'phone' | 'email'>('phone');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateInput = (): boolean => {
    if (resetMethod === 'phone') {
      const phoneClean = phone.replace(/\D/g, '');
      if (phoneClean.length !== 10 || !phoneClean.match(/^[6-9]/)) {
        Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number starting with 6-9');
        return false;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return false;
      }
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateInput()) return;

    setLoading(true);
    const API_BASE_URL = getBaseURL();

    try {
      const requestBody = resetMethod === 'phone' 
        ? { phone: phone.replace(/\D/g, '') }
        : { email: email.trim() };

      console.log('🔄 Password Reset Request:', {
        method: resetMethod,
        endpoint: `${API_BASE_URL}/user/forgot-password/`,
        data: requestBody
      });

      const response = await fetch(`${API_BASE_URL}/user/forgot-password/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Password reset initiated:', data);
        
        setStep(2);
        
        // Auto redirect after 5 seconds
        setTimeout(() => {
          navigation.goBack();
        }, 5000);
        
      } else {
        const errorData = await response.text();
        console.error('❌ Reset Password Error:', errorData);
        
        if (response.status === 404) {
          Alert.alert(
            'Account Not Found', 
            `No account found with this ${resetMethod}. Please check your ${resetMethod} or register a new account.`
          );
        } else {
          Alert.alert('Reset Failed', errorData || 'Failed to send reset instructions. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      Alert.alert('Connection Error', 'Cannot connect to server. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
  };

  if (step === 2) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        
        <LinearGradient
          colors={[COLORS.background, COLORS.surface]}
          style={styles.backgroundGradient}
        />

        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          </View>
          
          <Text style={styles.successTitle}>Reset Instructions Sent!</Text>
          <Text style={styles.successMessage}>
            We've sent password reset instructions to your {resetMethod === 'phone' ? 'phone number' : 'email address'}.
          </Text>
          <Text style={styles.successSubMessage}>
            {resetMethod === 'phone' 
              ? `Check your SMS messages for the reset link.`
              : `Please check your email inbox and follow the instructions.`
            }
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.backButtonGradient}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <LinearGradient
        colors={[COLORS.background, COLORS.surface]}
        style={styles.backgroundGradient}
      />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.logoSection}>
            <LinearGradient
              colors={COLORS.gradients.kerala}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>KS</Text>
            </LinearGradient>
            <Text style={styles.brandTitle}>Kerala Sellers</Text>
            <Text style={styles.brandSubtitle}>Password Recovery</Text>
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View 
          style={[
            styles.formContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.formTitle}>Forgot Your Password?</Text>
          <Text style={styles.formSubtitle}>
            No worries! Enter your {resetMethod === 'phone' ? 'phone number' : 'email address'} and we'll send you reset instructions.
          </Text>

          {/* Reset Method Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                resetMethod === 'phone' && styles.toggleButtonActive
              ]}
              onPress={() => setResetMethod('phone')}
            >
              <Ionicons 
                name="call" 
                size={16} 
                color={resetMethod === 'phone' ? COLORS.surface : COLORS.textSecondary} 
              />
              <Text style={[
                styles.toggleText,
                resetMethod === 'phone' && styles.toggleTextActive
              ]}>
                Phone
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                resetMethod === 'email' && styles.toggleButtonActive
              ]}
              onPress={() => setResetMethod('email')}
            >
              <Ionicons 
                name="mail" 
                size={16} 
                color={resetMethod === 'email' ? COLORS.surface : COLORS.textSecondary} 
              />
              <Text style={[
                styles.toggleText,
                resetMethod === 'email' && styles.toggleTextActive
              ]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {resetMethod === 'phone' ? 'Phone Number' : 'Email Address'}
            </Text>
            
            {resetMethod === 'phone' ? (
              <View style={styles.inputContainer}>
                <Text style={styles.countryCode}>🇮🇳 +91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  placeholderTextColor={COLORS.textTertiary}
                  value={phone}
                  onChangeText={formatPhoneNumber}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!loading}
                />
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.emailInput}
                  placeholder="seller@example.com"
                  placeholderTextColor={COLORS.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            )}
          </View>

          {/* Reset Button */}
          <TouchableOpacity 
            style={[styles.resetButton, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [COLORS.textTertiary, COLORS.textTertiary] : [COLORS.primary, COLORS.primaryLight]}
              style={styles.resetButtonGradient}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.resetButtonText}>Sending...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.resetButtonText}>Send Reset Instructions</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back-outline" size={16} color={COLORS.primary} />
            <Text style={styles.loginButtonText}>Back to Login</Text>
          </TouchableOpacity>

          {/* Help Text */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              If you're having trouble resetting your password, contact our support team at support@keralasellers.com
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  backIcon: {
    position: 'absolute',
    left: 20,
    top: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: COLORS.shadowColored,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.surface,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Form
  formContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    elevation: 4,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
    elevation: 2,
    shadowColor: COLORS.shadowColored,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.surface,
  },

  // Input
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: COLORS.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  countryCode: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 12,
    fontWeight: '500',
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 12,
    paddingLeft: 12,
    fontWeight: '500',
  },

  // Buttons
  resetButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.shadowColored,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  resetButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Help
  helpSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Success Screen
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  successSubMessage: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 200,
  },
  backButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
