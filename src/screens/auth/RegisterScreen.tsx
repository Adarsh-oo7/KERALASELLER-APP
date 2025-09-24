import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../App';

const COLORS = {
  primary: '#2B4B39',
  primaryLight: '#3A5D47',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1D1D1F',
  textSecondary: '#86868B',
  inputBorder: '#E5E5E7',
  shadow: 'rgba(0, 0, 0, 0.1)',
  error: '#FF3B30',
  success: '#4A6B52',
  warning: '#FF9500',
};

const API_BASE_URL = 'http://192.168.1.7:8000';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type RegistrationStep = 'form' | 'otp' | 'success';

export default function RegisterScreen({ navigation }: Props) {
  const [step, setStep] = useState<RegistrationStep>('form');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    shopName: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

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

    // Phone validation
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 10 || !phoneClean.match(/^[6-9]/)) {
      return 'Please enter a valid 10-digit phone number starting with 6-9';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    // Password validation
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
      console.log('📱 Sending OTP to:', phoneClean);
      
      const response = await fetch(`${API_BASE_URL}/user/send-otp/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneClean,
        }),
      });

      const responseText = await response.text();
      console.log('📡 OTP Response:', response.status, responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid server response');
      }

      if (response.ok) {
        setOtpSent(true);
        setStep('otp');
        Alert.alert('OTP Sent! 📱', `6-digit OTP sent to +91${phoneClean}\n\nCheck Django console for OTP (development mode)`);
      } else {
        throw new Error(data.error || data.detail || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('❌ OTP send error:', error);
      Alert.alert('OTP Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validate form first
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    // Send OTP first if not sent
    if (!otpSent) {
      await sendOTP();
      return;
    }

    // If OTP sent, validate OTP
    if (!formData.otp.trim()) {
      Alert.alert('OTP Required', 'Please enter the 6-digit OTP');
      return;
    }

    if (formData.otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    
    try {
      const phoneClean = formData.phone.replace(/\D/g, '');
      
      console.log('🔄 Registering seller...');
      
      // Fixed request body to match Django backend expectations
      const requestBody = {
        phone: phoneClean,
        name: formData.name.trim(),
        shop_name: formData.shopName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password.trim(),
        confirmPassword: formData.confirmPassword.trim(), // Django expects this field
        otp: formData.otp.trim(),
      };
      
      console.log('📦 Registration request:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/user/register/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Registration response status:', response.status);
      
      const responseText = await response.text();
      console.log('📦 Registration response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Raw response was:', responseText);
        throw new Error('Server returned invalid response');
      }

      if (response.ok) {
        if (data.seller && data.api_token) {
          setStep('success');
          Alert.alert(
            'Registration Successful! 🎉',
            `Welcome ${data.seller.name}!\n\nShop: ${data.seller.shop_name}\nPhone: ${data.seller.phone}\n\nYou can now login with your phone number and password.`,
            [
              {
                text: 'Login Now',
                onPress: () => navigation.navigate('Login'),
              }
            ]
          );
        } else if (data.message) {
          Alert.alert('Registration Complete', data.message);
          navigation.navigate('Login');
        } else {
          console.log('Unexpected success response:', data);
          Alert.alert('Registration Status', 'Registration completed. Please login with your credentials.');
          navigation.navigate('Login');
        }
      } else {
        // Handle specific Django validation errors
        let errorMessages = [];
        
        if (data.phone) {
          errorMessages.push(`Phone: ${Array.isArray(data.phone) ? data.phone.join(', ') : data.phone}`);
        }
        if (data.email) {
          errorMessages.push(`Email: ${Array.isArray(data.email) ? data.email.join(', ') : data.email}`);
        }
        if (data.password) {
          errorMessages.push(`Password: ${Array.isArray(data.password) ? data.password.join(', ') : data.password}`);
        }
        if (data.confirmPassword) {
          errorMessages.push(`Password Confirmation: ${Array.isArray(data.confirmPassword) ? data.confirmPassword.join(', ') : data.confirmPassword}`);
        }
        if (data.otp) {
          errorMessages.push(`OTP: ${Array.isArray(data.otp) ? data.otp.join(', ') : data.otp}`);
        }
        if (data.name) {
          errorMessages.push(`Name: ${Array.isArray(data.name) ? data.name.join(', ') : data.name}`);
        }
        if (data.shop_name) {
          errorMessages.push(`Shop Name: ${Array.isArray(data.shop_name) ? data.shop_name.join(', ') : data.shop_name}`);
        }
        
        let errorMessage = errorMessages.length > 0 
          ? errorMessages.join('\n') 
          : (data.error || data.detail || data.message || 'Registration failed');
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = error.message || 'Registration failed. Please try again.';
      
      // Provide helpful error messages
      if (errorMessage.includes('phone')) {
        errorMessage = 'Phone number issue: May already be registered or OTP is invalid/expired';
      } else if (errorMessage.includes('email')) {
        errorMessage = 'Email already registered. Please use a different email address.';
      } else if (errorMessage.includes('OTP')) {
        errorMessage = 'Invalid or expired OTP. Please request a new one.';
      }
      
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    updateField('otp', '');
    setOtpSent(false);
    await sendOTP();
  };

  const testRegistration = async () => {
    const testData = {
      phone: "9847161603",
      name: "Test Seller",
      shop_name: "Test Shop",
      email: "testseller@example.com",
      password: "testpass123",
      confirmPassword: "testpass123",
      otp: "728466" // Use the latest OTP from Django console
    };
    
    console.log('🧪 Testing registration with:', testData);
    Alert.alert('Test Mode', 'Testing registration... Check console for results.');
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/register/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      const responseText = await response.text();
      console.log('🧪 Test response:', response.status, responseText);
      Alert.alert('Test Result', `Status: ${response.status}\nCheck console for full response`);
    } catch (error: any) {
      console.error('🧪 Test error:', error);
      Alert.alert('Test Error', error.message);
    }
  };

  const renderFormStep = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.logoCircle}
          >
            <Text style={styles.logoText}>K</Text>
          </LinearGradient>
        </View>
        
        <Text style={styles.title}>Join KeralaSellers</Text>
        <Text style={styles.subtitle}>Register your shop and start selling</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Debug Test Button */}
        <TouchableOpacity 
          onPress={testRegistration}
          style={styles.testButton}
        >
          <Text style={styles.testButtonText}>🧪 Test Registration</Text>
        </TouchableOpacity>

        {/* Phone Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.textInput}
              placeholder="9876543210"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.phone}
              onChangeText={formatPhoneNumber}
              keyboardType="numeric"
              maxLength={10}
              editable={!loading}
            />
          </View>
          <Text style={styles.inputHelper}>10-digit mobile number for OTP verification</Text>
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>
        </View>

        {/* Shop Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Shop Name *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your shop/business name"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.shopName}
              onChangeText={(text) => updateField('shopName', text)}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Create a strong password"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
          <Text style={styles.inputHelper}>Minimum 8 characters</Text>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm Password *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Re-enter your password"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity 
          style={[styles.registerButton, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? [COLORS.textSecondary, COLORS.textSecondary] : [COLORS.primary, COLORS.primaryLight]}
            style={styles.buttonGradient}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.surface} size="small" />
                <Text style={styles.buttonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Send OTP & Register</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')} 
          disabled={loading}
        >
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderOTPStep = () => (
    <View style={styles.otpContainer}>
      {/* Header */}
      <View style={styles.otpHeader}>
        <View style={styles.otpIcon}>
          <Text style={styles.otpIconText}>📱</Text>
        </View>
        <Text style={styles.otpTitle}>Verify Your Phone</Text>
        <Text style={styles.otpSubtitle}>
          Enter the 6-digit code sent to{'\n'}+91{formData.phone}
        </Text>
      </View>

      {/* OTP Input */}
      <View style={styles.otpInputContainer}>
        <Text style={styles.inputLabel}>6-Digit OTP</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, styles.otpInput]}
            placeholder="123456"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.otp}
            onChangeText={(text) => updateField('otp', text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="numeric"
            maxLength={6}
            editable={!loading}
          />
        </View>
        <Text style={styles.inputHelper}>Check Django console for OTP (development)</Text>
      </View>

      {/* Verify Button */}
      <TouchableOpacity 
        style={[styles.registerButton, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={loading ? [COLORS.textSecondary, COLORS.textSecondary] : [COLORS.success, '#5A8B63']}
          style={styles.buttonGradient}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.surface} size="small" />
              <Text style={styles.buttonText}>Verifying...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Verify & Complete Registration</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Resend OTP */}
      <TouchableOpacity onPress={resendOTP} disabled={loading} style={styles.resendContainer}>
        <Text style={styles.resendText}>
          Didn't receive code? <Text style={styles.resendLink}>Resend OTP</Text>
        </Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => {
          setStep('form');
          setOtpSent(false);
          updateField('otp', '');
        }} 
        disabled={loading}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>← Back to Form</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>🎉</Text>
      </View>
      <Text style={styles.successTitle}>Registration Complete!</Text>
      <Text style={styles.successSubtitle}>
        Welcome to KeralaSellers! Your shop is now registered and ready to start selling.
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
          <Text style={styles.footerWebsite}>keralasellers.in</Text>
          <Text style={styles.footerTagline}>Join thousands of successful Kerala sellers</Text>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
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
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    flex: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  testButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'center',
    marginBottom: 12,
  },
  testButtonText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  countryCode: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 12,
  },
  inputHelper: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // OTP Step Styles
  otpContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  otpHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  otpIcon: {
    marginBottom: 20,
  },
  otpIconText: {
    fontSize: 60,
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  otpSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  otpInputContainer: {
    marginBottom: 30,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 4,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  // Success Step Styles
  successContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 30,
  },
  successIconText: {
    fontSize: 80,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  footerWebsite: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerTagline: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
