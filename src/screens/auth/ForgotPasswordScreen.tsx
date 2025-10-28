// src/screens/auth/ForgotPasswordScreen.tsx
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
import { getBaseURL } from '../../config/api';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleSendOTP = async () => {
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 10 || !phoneClean.match(/^[6-9]/)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number starting with 6-9');
      return;
    }

    setLoading(true);
    const API_BASE_URL = getBaseURL();

    try {
      const response = await fetch(`${API_BASE_URL}/user/seller/password-reset/send-otp/`, {

        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneClean }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ OTP sent:', data);
        Alert.alert('OTP Sent', 'A 6-digit OTP has been sent to your phone', [
          { text: 'OK', onPress: () => setStep(2) }
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      Alert.alert('Connection Error', 'Cannot connect to server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const API_BASE_URL = getBaseURL();

    try {
      const response = await fetch(`${API_BASE_URL}/user/seller/password-reset/verify/`, {

        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          otp: otp,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      if (response.ok) {
        console.log('✅ Password reset successful');
        setStep(3);
        setTimeout(() => navigation.navigate('Login'), 3000);
      } else {
        const errorData = await response.json();
        Alert.alert('Reset Failed', errorData.error || 'Invalid OTP or password');
      }
    } catch (error) {
      console.error('❌ Reset password error:', error);
      Alert.alert('Connection Error', 'Cannot connect to server');
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

  // SUCCESS SCREEN
  if (step === 3) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          <Text style={styles.successTitle}>Password Reset Successfully!</Text>
          <Text style={styles.successMessage}>
            You can now login with your new password.
          </Text>

          <TouchableOpacity style={styles.successButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.successButtonText}>Go to Login</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>KS</Text>
            </View>
            <Text style={styles.brandTitle}>Kerala Sellers</Text>
            <Text style={styles.brandSubtitle}>Password Recovery</Text>
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View 
          style={[
            styles.formContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={styles.formTitle}>
            {step === 1 ? 'Forgot Your Password?' : 'Reset Your Password'}
          </Text>
          <Text style={styles.formSubtitle}>
            {step === 1 
              ? 'Enter your phone number to receive a 6-digit OTP'
              : 'Enter the OTP and create a new password'
            }
          </Text>

          {step === 1 ? (
            // STEP 1: Phone Number
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.countryCode}>🇮🇳 +91</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="9876543210"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={formatPhoneNumber}
                    keyboardType="numeric"
                    maxLength={10}
                    editable={!loading}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                onPress={handleSendOTP} 
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.buttonText}>Sending OTP...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // STEP 2: OTP + New Password
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>6-Digit OTP</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="123456"
                    placeholderTextColor="#9CA3AF"
                    value={otp}
                    onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="numeric"
                    maxLength={6}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Min 8 characters"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton} 
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                      size={22} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Re-enter password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton} 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                      size={22} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                onPress={handleResetPassword} 
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.buttonText}>Resetting...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back-outline" size={18} color="#3B82F6" />
                <Text style={styles.secondaryButtonText}>Back to Phone Entry</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <Text style={styles.loginLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  backIcon: {
    position: 'absolute',
    left: 20,
    top: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countryCode: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    marginRight: 8,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 14,
    fontWeight: '500',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 14,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  loginLinkText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  successButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
