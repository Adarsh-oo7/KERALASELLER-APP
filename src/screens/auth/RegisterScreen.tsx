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
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../App';

// ✅ Import your centralized API configuration
import { getApiConfig, getBaseURL } from '../../config/api';

// Modern Color Palette (matching your login screen)
const COLORS = {
  primary: '#4A7C4F',
  primaryLight: '#6B9B6F', 
  background: '#FAFCFA',
  surface: '#FFFFFF',
  textPrimary: '#1A1F1A',
  textSecondary: '#5F6B5F',
  textTertiary: '#9CA59C',
  inputBorder: 'rgba(74, 124, 79, 0.15)',
  shadow: 'rgba(26, 31, 26, 0.08)',
  success: '#4A7C4F',
  warning: '#D4941E',
  error: '#D84315',
};

// ✅ Replace hardcoded URL with centralized config
const API_BASE_URL = getBaseURL(); // Gets current environment's baseURL

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type RegistrationStep = 'form' | 'otp' | 'success';

// Enhanced Custom Loading Component
const CustomRegistrationLoader = () => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    scaleAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      scaleAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseOpacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.customLoaderContainer}>
      <Animated.View
        style={[
          styles.loaderOuterRing,
          {
            transform: [{ rotate: spin }, { scale: scaleValue }],
            opacity: pulseOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.loaderInnerRing,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      />
      <View style={styles.loaderCore}>
        <Text style={styles.loaderIcon}>📝</Text>
      </View>
    </View>
  );
};

export default function RegisterScreen({ navigation }: Props) {
  const [step, setStep] = useState<RegistrationStep>('form');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Logo and form animations
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const formSlideAnim = useRef(new Animated.Value(50)).current;
  
  // Simplified form data
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    shopName: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  useEffect(() => {
    // Staggered entrance animations
    Animated.parallel([
      Animated.timing(logoFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // ✅ Log current API configuration on screen load
    const config = getApiConfig();
    console.log('🔧 Register Screen API Configuration:', {
      baseURL: config.baseURL,
      timeout: config.timeout,
      debug: config.debug,
    });
  }, []);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      updateField('phone', cleaned);
    }
  };

  const validateForm = (): string | null => {
    const { phone, name, shopName, email, password, confirmPassword } = formData;

    if (!phone.trim() || !name.trim() || !shopName.trim() || !email.trim() || !password.trim()) {
      return 'Please fill in all required fields';
    }

    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 10 || !phoneClean.match(/^[6-9]/)) {
      return 'Please enter a valid 10-digit phone number starting with 6-9';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    return null;
  };

  const sendOTP = async () => {
    const phoneClean = formData.phone.replace(/\D/g, '');
    
    if (phoneClean.length !== 10 || !phoneClean.match(/^[6-9]/)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📱 Sending OTP:', {
        phone: phoneClean,
        endpoint: `${API_BASE_URL}/user/send-otp/`,
        environment: getApiConfig().debug ? 'Development' : 'Production'
      });

      // ✅ Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), getApiConfig().timeout);

      const response = await fetch(`${API_BASE_URL}/user/send-otp/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneClean,
        }),
        signal: controller.signal, // Add timeout signal
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid server response');
      }

      if (response.ok) {
        setOtpSent(true);
        setStep('otp');
        Alert.alert('OTP Sent! 📱', `6-digit OTP sent to +91${phoneClean}`);
        console.log('✅ OTP sent successfully');
      } else {
        throw new Error(data.error || data.detail || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('❌ OTP Error:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      if (error.name === 'AbortError') {
        errorMessage = `Connection timeout after ${getApiConfig().timeout}ms. Please try again.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('OTP Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    if (!otpSent) {
      await sendOTP();
      return;
    }

    if (!formData.otp.trim() || formData.otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    
    try {
      const phoneClean = formData.phone.replace(/\D/g, '');
      
      const requestBody = {
        phone: phoneClean,
        name: formData.name.trim(),
        shop_name: formData.shopName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password.trim(),
        confirmPassword: formData.confirmPassword.trim(),
        otp: formData.otp.trim(),
      };

      console.log('🔄 Seller Registration Request:', {
        phone: phoneClean,
        name: formData.name,
        shopName: formData.shopName,
        endpoint: `${API_BASE_URL}/user/register/`,
        environment: getApiConfig().debug ? 'Development' : 'Production'
      });
      
      // ✅ Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), getApiConfig().timeout);
      
      const response = await fetch(`${API_BASE_URL}/user/register/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal, // Add timeout signal
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Server returned invalid response');
      }

      if (response.ok) {
        setStep('success');
        console.log('✅ Registration Successful:', {
          sellerId: data.seller?.id,
          sellerName: data.seller?.name,
          shopName: data.seller?.shop_name,
        });
        
        Alert.alert(
          'Registration Successful! 🎉',
          `Welcome ${data.seller?.name || formData.name}!\n\nYou can now login with your credentials.`,
          [{ text: 'Login Now', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        let errorMessage = 'Registration failed';
        if (data.phone) errorMessage = 'Phone number may already be registered';
        else if (data.email) errorMessage = 'Email already registered';
        else if (data.otp) errorMessage = 'Invalid or expired OTP';
        else if (data.error || data.detail) errorMessage = data.error || data.detail;
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Registration Error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.name === 'AbortError') {
        errorMessage = `Connection timeout after ${getApiConfig().timeout}ms. Please try again.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderFormStep = () => (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header with Logo Image */}
      <Animated.View 
        style={[styles.header, { opacity: logoFadeAnim }]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
              onError={() => console.log('Logo failed to load')}
            />
            <LinearGradient
              colors={['transparent', 'rgba(74, 124, 79, 0.1)']}
              style={styles.logoOverlay}
            />
          </View>
        </View>
        <Text style={styles.title}>Join Kerala Sellers</Text>
        <Text style={styles.subtitle}>Register your shop</Text>
      </Animated.View>

      {/* Animated Form Container */}
      <Animated.View 
        style={[
          styles.formContainer,
          { transform: [{ translateY: formSlideAnim }] }
        ]}
      >
        <Text style={styles.formTitle}>Create Account</Text>
        
        {/* ✅ Show current API URL for debugging (only in development) */}
        {getApiConfig().debug && (
          <Text style={styles.apiInfo}>
            API: {API_BASE_URL} ({getApiConfig().debug ? 'Dev' : 'Prod'})
          </Text>
        )}
        
        {/* Phone & Name Row */}
        <View style={styles.rowContainer}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Phone *</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.countryCode}>🇮🇳 +91</Text>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                placeholderTextColor={COLORS.textTertiary}
                value={formData.phone}
                onChangeText={formatPhoneNumber}
                keyboardType="numeric"
                maxLength={10}
                editable={!loading}
              />
            </View>
          </View>
          
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Name *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={COLORS.textTertiary}
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
          </View>
        </View>

        {/* Shop Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Name *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your shop/business name"
              placeholderTextColor={COLORS.textTertiary}
              value={formData.shopName}
              onChangeText={(text) => updateField('shopName', text)}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.textTertiary}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
        </View>

        {/* Password Row */}
        <View style={styles.rowContainer}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputPassword}
                placeholder="Min 8 chars"
                placeholderTextColor={COLORS.textTertiary}
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Confirm *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Re-enter"
                placeholderTextColor={COLORS.textTertiary}
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>
        </View>

        {/* Enhanced Register Button */}
        <TouchableOpacity 
          style={[styles.registerButton, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? [COLORS.textTertiary, COLORS.textTertiary] : [COLORS.primary, COLORS.primaryLight]}
            style={styles.buttonGradient}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <CustomRegistrationLoader />
                <Text style={styles.buttonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{otpSent ? 'Verify & Register' : 'Send OTP & Register'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Fill & Login Link */}
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            onPress={() => {
              updateField('phone', '9876543210');
              updateField('name', 'Test Seller');
              updateField('shopName', 'Test Shop');
              updateField('email', 'test@example.com');
              updateField('password', 'testpass123');
              updateField('confirmPassword', 'testpass123');
            }}
            style={styles.quickFillButton}
          >
            <Text style={styles.quickFillText}>⚡ Use Sample Data</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')} 
            disabled={loading}
          >
            <Text style={styles.loginText}>
              Already registered? <Text style={styles.loginLink}>Sign In →</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );

  const renderOTPStep = () => (
    <View style={styles.otpContainer}>
      <View style={styles.otpHeader}>
        <Text style={styles.otpIcon}>📱</Text>
        <Text style={styles.otpTitle}>Verify Phone</Text>
        <Text style={styles.otpSubtitle}>
          Enter 6-digit code sent to +91{formData.phone}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>6-Digit OTP</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.otpInput]}
            placeholder="123456"
            placeholderTextColor={COLORS.textTertiary}
            value={formData.otp}
            onChangeText={(text) => updateField('otp', text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="numeric"
            maxLength={6}
            editable={!loading}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.registerButton, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={loading ? [COLORS.textTertiary, COLORS.textTertiary] : [COLORS.success, '#5A8B63']}
          style={styles.buttonGradient}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <CustomRegistrationLoader />
              <Text style={styles.buttonText}>Verifying...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Verify & Complete</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => {
          setStep('form');
          setOtpSent(false);
          updateField('otp', '');
        }} 
        disabled={loading}
      >
        <Text style={styles.backText}>← Back to Form</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <Text style={styles.successIcon}>🎉</Text>
      <Text style={styles.successTitle}>Welcome to Kerala Sellers!</Text>
      <Text style={styles.successSubtitle}>
        Your shop is registered and ready to start selling.
      </Text>
      
      <TouchableOpacity 
        style={styles.registerButton}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Continue to Login</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={[COLORS.background, COLORS.surface]}
          style={styles.backgroundGradient}
        />

        {step === 'form' && renderFormStep()}
        {step === 'otp' && renderOTPStep()}
        {step === 'success' && renderSuccessStep()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>keralasellers.in</Text>
          {/* ✅ Show environment in footer (development only) */}
          {getApiConfig().debug && (
            <Text style={styles.footerSubtext}>
              Environment: {getApiConfig().debug ? 'Development' : 'Production'}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

// ✅ OPTIMIZED STYLESHEET - Removed duplicate definitions [web:392]
const styles = StyleSheet.create({
  // Layout Styles
  container: {
    flex: 1,
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

  // Header Styles
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoWrapper: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Form Styles
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Input Styles
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  countryCode: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginRight: 6,
    paddingRight: 6,
    borderRightWidth: 1,
    borderRightColor: COLORS.inputBorder,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 10,
    fontWeight: '500',
  },
  inputPassword: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 10,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 6,
  },

  // Button Styles
  registerButton: {
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Action Styles
  bottomActions: {
    alignItems: 'center',
    gap: 12,
  },
  quickFillButton: {
    backgroundColor: 'rgba(74, 124, 79, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  quickFillText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  loginText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // OTP Styles
  otpContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  otpHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  otpIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
  backText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },

  // Success Styles
  successContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },

  // Footer Styles
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // Debug Styles (Development only)
  apiInfo: {
    fontSize: 9,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Enhanced Custom Loader Styles
  customLoaderContainer: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderOuterRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.surface,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  loaderInnerRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderTopColor: COLORS.surface,
    borderLeftColor: COLORS.surface,
  },
  loaderCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderIcon: {
    fontSize: 8,
    opacity: 0.9,
  },
});
