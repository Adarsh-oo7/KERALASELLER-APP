import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AuthService from '../../services/AuthService';
import { 
  SellerRegistrationData, 
  OTPRequest, 
  ApiError 
} from '../../types/api';

type RegisterScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface ValidationErrors {
  name?: string;
  shop_name?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const [formData, setFormData] = useState<SellerRegistrationData & { otp: string }>({
    name: '',
    shop_name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  // Validation functions - exact match to web
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.shop_name.trim()) {
      errors.shop_name = 'Shop name is required';
    } else if (formData.shop_name.trim().length < 2) {
      errors.shop_name = 'Shop name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (name: keyof typeof formData, value: string): void => {
    // Format phone number to remove non-digits
    if (name === 'phone') {
      const formattedValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear validation error for this field
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear general error
    if (error) setError('');
  };

  const handleSendOtp = async (): Promise<void> => {
    setError('');
    
    if (!validateForm()) {
      setError('Please fix the errors above');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const otpData: OTPRequest = {
        phone: formData.phone.trim(),
        name: formData.name.trim(),
        shop_name: formData.shop_name.trim(),
        email: formData.email.trim()
      };
      
      await AuthService.sendOTP(otpData);
      setStep(2);
    } catch (err: any) {
      console.error('OTP send error:', err);
      const apiError = err.response?.data as ApiError;
      const errorMessage = apiError?.error || 
                         apiError?.message ||
                         apiError?.phone?.[0] ||
                         'Failed to send OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async (): Promise<void> => {
    setError('');
    
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await AuthService.register({
        name: formData.name.trim(),
        shop_name: formData.shop_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        otp: formData.otp.trim(),
      });
      
      Alert.alert(
        'Success!', 
        'Registration successful! Please log in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
      
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      
      const errorData = err.response?.data as ApiError;
      let errorMessage = 'Registration failed. Please try again.';
      
      if (errorData?.phone?.[0]) {
        errorMessage = errorData.phone[0];
      } else if (errorData?.confirmPassword?.[0]) {
        errorMessage = errorData.confirmPassword[0];
      } else if (errorData?.otp?.[0]) {
        errorMessage = errorData.otp[0];
      } else if (errorData?.email?.[0]) {
        errorMessage = errorData.email[0];
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async (): Promise<void> => {
    setError('');
    setIsLoading(true);
    
    try {
      const otpData: OTPRequest = {
        phone: formData.phone.trim(),
        name: formData.name.trim(),
        shop_name: formData.shop_name.trim(),
        email: formData.email.trim()
      };
      
      await AuthService.sendOTP(otpData);
      setError('OTP has been resent to your phone');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToStep1 = (): void => {
    setStep(1);
    setFormData(prev => ({ ...prev, otp: '' }));
    setError('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Seller Account</Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? "Join Kerala Sellers and start selling your products online" 
                : "We've sent a verification code to your phone"}
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: step === 1 ? '50%' : '100%' }
                ]}
              />
            </View>
            <Text style={styles.stepIndicator}>Step {step} of 2</Text>
          </View>

          {step === 1 ? (
            /* Step 1: Business Details */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Full Name</Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(value) => handleChange('name', value)}
                  placeholder="Enter your full name"
                  style={[
                    styles.input,
                    validationErrors.name && styles.inputError
                  ]}
                  editable={!isLoading}
                />
                {validationErrors.name && (
                  <Text style={styles.errorText}>{validationErrors.name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shop Name</Text>
                <TextInput
                  value={formData.shop_name}
                  onChangeText={(value) => handleChange('shop_name', value)}
                  placeholder="Enter your shop/business name"
                  style={[
                    styles.input,
                    validationErrors.shop_name && styles.inputError
                  ]}
                  editable={!isLoading}
                />
                {validationErrors.shop_name && (
                  <Text style={styles.errorText}>{validationErrors.shop_name}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(value) => handleChange('email', value)}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    validationErrors.email && styles.inputError
                  ]}
                  editable={!isLoading}
                />
                {validationErrors.email && (
                  <Text style={styles.errorText}>{validationErrors.email}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  value={formData.phone}
                  onChangeText={(value) => handleChange('phone', value)}
                  placeholder="Enter 10-digit phone number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={[
                    styles.input,
                    validationErrors.phone && styles.inputError
                  ]}
                  editable={!isLoading}
                />
                {validationErrors.phone && (
                  <Text style={styles.errorText}>{validationErrors.phone}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    value={formData.password}
                    onChangeText={(value) => handleChange('password', value)}
                    placeholder="Create a strong password (min 8 characters)"
                    secureTextEntry={!showPassword}
                    style={[
                      styles.passwordInput,
                      validationErrors.password && styles.inputError
                    ]}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    <Text style={styles.eyeButtonText}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {validationErrors.password && (
                  <Text style={styles.errorText}>{validationErrors.password}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleChange('confirmPassword', value)}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirmPassword}
                    style={[
                      styles.passwordInput,
                      validationErrors.confirmPassword && styles.inputError
                    ]}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    <Text style={styles.eyeButtonText}>
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {validationErrors.confirmPassword && (
                  <Text style={styles.errorText}>{validationErrors.confirmPassword}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.buttonText}>Sending OTP...</Text>
                  </>
                ) : (
                  <Text style={styles.buttonText}>Send Verification OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Step 2: OTP Verification */
            <View style={styles.form}>
              <View style={styles.otpInfo}>
                <Text style={styles.otpText}>
                  Verification code sent to: +91 {formData.phone}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  value={formData.otp}
                  onChangeText={(value) => 
                    setFormData(prev => ({
                      ...prev,
                      otp: value.replace(/\D/g, '').slice(0, 6)
                    }))
                  }
                  placeholder="Enter 6-digit OTP"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, styles.otpInput]}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOtp}
                  disabled={isLoading}
                >
                  <Text style={styles.resendButtonText}>Resend OTP</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleCompleteRegistration}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.buttonText}>Creating Account...</Text>
                  </>
                ) : (
                  <Text style={styles.buttonText}>Create Seller Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToStep1}
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>← Back to Details</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorMessage}>⚠️ {error}</Text>
            </View>
          )}

          {/* Footer Links */}
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    paddingRight: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  eyeButtonText: {
    fontSize: 18,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 6,
  },
  otpInfo: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  otpText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: '600',
  },
  resendButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 4,
  },
  resendButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  button: {
    width: '100%',
    padding: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    marginTop: 16,
  },
  errorMessage: {
    color: '#991b1b',
    fontSize: 14,
    textAlign: 'center',
  },
  footerLinks: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default RegisterScreen;
