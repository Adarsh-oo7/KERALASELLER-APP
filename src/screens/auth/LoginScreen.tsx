import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AuthService from '../../services/AuthService';
import { ApiError } from '../../types/api';

type LoginScreenProps = {
  navigation: StackNavigationProp<any>;
  onLoginSuccess?: () => void; // Optional callback for auth state management
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onLoginSuccess }) => {
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (): Promise<void> => {
    // Validation
    if (!phone || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Phone number validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Attempting login with:', { phone: cleanPhone, password: '***' });
      
      const response = await AuthService.login(cleanPhone, password);
      
      console.log('✅ Login successful, response:', response);
      
      // Call auth state callback if provided (for AppNavigator)
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      
      // Navigate to CreateShop or Dashboard based on user's store setup status
      Alert.alert(
        'Welcome to Kerala Sellers! 🌴', 
        'Login successful! Let\'s set up your store and start selling.',
        [
          {
            text: 'Continue',
            onPress: () => {
              console.log('Navigating to CreateShop...');
              // Check if user has a store profile, otherwise go to CreateShop
              navigation.navigate('CreateShop');
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response?.data) {
        const apiError = error.response.data;
        errorMessage = apiError.message || apiError.error || 'Invalid phone number or password';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (): void => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = (): void => {
    Alert.alert(
      'Forgot Password?',
      'Please contact Kerala Sellers support for password reset assistance.',
      [
        { text: 'OK' },
        { 
          text: 'Contact Support', 
          onPress: () => {
            // You can add a support contact method here
            console.log('Contact support for password reset');
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Kerala Sellers</Text>
          <Text style={styles.subtitle}>Seller Login</Text>
          <Text style={styles.description}>
            Start selling across Kerala with zero commission fees
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.buttonText}>Logging in...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>🚀 Login to Kerala Sellers</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>New to Kerala Sellers?</Text>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              activeOpacity={0.7}
            >
              <Text style={styles.registerText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>Why Kerala Sellers?</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefit}>✅ Zero commission fees</Text>
            <Text style={styles.benefit}>🌐 Reach customers across Kerala</Text>
            <Text style={styles.benefit}>📱 Easy mobile store management</Text>
            <Text style={styles.benefit}>🚀 SEO-optimized store pages</Text>
          </View>
        </View>

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Debug: Server at {__DEV__ ? 'http://192.168.1.4:8000' : 'Production'}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    color: '#6b7280',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#9ca3af',
    lineHeight: 20,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
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
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  registerPrompt: {
    color: '#6b7280',
    fontSize: 16,
  },
  registerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  registerText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  benefits: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 8,
  },
  benefit: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    textAlign: 'center',
  },
  debugInfo: {
    alignItems: 'center',
    opacity: 0.7,
  },
  debugText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default LoginScreen;
