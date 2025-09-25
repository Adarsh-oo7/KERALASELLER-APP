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
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../App';

// ✅ Import your centralized API configuration
import { getApiConfig, getBaseURL } from '../../config/api';

// Your existing COLORS constant...
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
};

// ✅ Replace hardcoded URL with centralized config
// OLD: const API_BASE_URL = 'http://10.0.2.2:8000';
const API_BASE_URL = getBaseURL(); // Gets current environment's baseURL

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// Enhanced Custom Loading Component
const CustomLoader = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();
    return () => spinAnimation.stop();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.loaderContainer}>
      <Animated.View
        style={[
          styles.outerRing,
          { transform: [{ rotate: spin }] },
        ]}
      />
      <View style={styles.loaderCore}>
        <Text style={styles.loaderIcon}>🔄</Text>
      </View>
    </View>
  );
};

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Logo animation
  const logoFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoFadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // ✅ Log current API configuration on screen load
    const config = getApiConfig();
    console.log('🔧 Current API Configuration:', {
      baseURL: config.baseURL,
      timeout: config.timeout,
      debug: config.debug,
    });
  }, []);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter both phone number and password');
      return;
    }

    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length !== 10 || !phoneClean.match(/^[6-9]/)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number starting with 6-9');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔄 Seller Login Request:', {
        phone: phoneClean,
        endpoint: `${API_BASE_URL}/user/login/`,
        environment: getApiConfig().debug ? 'Development' : 'Production'
      });

      // ✅ Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), getApiConfig().timeout);

      const response = await fetch(`${API_BASE_URL}/user/login/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneClean,
          password: password.trim(),
        }),
        signal: controller.signal, // Add timeout signal
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

      console.log('📡 Response Status:', response.status);

      if (response.status === 404) {
        Alert.alert('Endpoint Not Found', 'Login endpoint not available. Check Django server.');
        return;
      }
      
      const responseText = await response.text();
      console.log('📦 Raw Response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        Alert.alert('Server Error', 'Invalid response from server');
        return;
      }

      if (response.ok && data.access_token) {
        // Store seller authentication tokens
        await AsyncStorage.setItem('accessToken', data.access_token);
        await AsyncStorage.setItem('refreshToken', data.refresh_token || '');
        await AsyncStorage.setItem('apiToken', data.api_token || '');
        await AsyncStorage.setItem('userPhone', phoneClean);
        await AsyncStorage.setItem('userType', 'seller');
        await AsyncStorage.setItem('sellerId', data.seller.id.toString());
        
        console.log('✅ Seller Login Successful:', {
          sellerId: data.seller.id,
          shopName: data.seller.shop_name,
          apiToken: data.api_token ? 'Present' : 'Missing',
          environment: getApiConfig().debug ? 'Development' : 'Production'
        });
        
        // ✅ SUCCESS: Show welcome message and automatically navigate
        Alert.alert(
          'Welcome Back! 🎉', 
          `Hello ${data.seller.name}!\n🏪 ${data.seller.shop_name}`,
          [{ 
            text: 'Go to Dashboard', 
            onPress: () => {
              console.log('🚀 Login successful - App.js will handle navigation');
              // The App.js will automatically detect the authentication state change
              // and navigate to the dashboard
            }
          }]
        );
      } else {
        throw new Error(data.error || data.detail || data.message || 'Login failed');
      }

    } catch (error: any) {
      console.error('❌ Login Error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = `Connection timeout after ${getApiConfig().timeout}ms. Please try again.`;
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Cannot connect to server. Check your network connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      console.log('🔍 Testing Django connection...');
      console.log('🌍 Current Environment:', getApiConfig());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for test

      const response = await fetch(`${API_BASE_URL}/user/test-auth/`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log('Test Response Status:', response.status);
      const responseText = await response.text();
      console.log('Test Response:', responseText);
      
      if (response.status === 200) {
        Alert.alert(
          'Connection Test ✅', 
          `Django server connected successfully!\n\nEnvironment: ${getApiConfig().debug ? 'Development' : 'Production'}\nURL: ${API_BASE_URL}`
        );
      } else if (response.status === 404) {
        Alert.alert('Endpoint Missing', 'Test endpoint not found. Check Django URLs.');
      } else {
        Alert.alert('Connection Issue', `Server responded with status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Connection Test Error:', error);
      
      let errorMessage = 'Cannot reach Django server.\n\n';
      
      if (error.name === 'AbortError') {
        errorMessage += '• Connection timeout\n';
      } else if (error.message.includes('Network request failed')) {
        errorMessage += '• Network connection failed\n';
      }
      
      errorMessage += `• Current URL: ${API_BASE_URL}\n`;
      errorMessage += '• Check Django server is running\n';
      errorMessage += '• Verify same network connection';
      
      Alert.alert('Connection Failed ❌', errorMessage);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
  };

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

        {/* Header with Logo */}
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
            </View>
          </View>
          <Text style={styles.title}>Kerala Sellers</Text>
          <Text style={styles.subtitle}>Seller Dashboard Login</Text>
        </Animated.View>

        {/* Main Form */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back, Seller!</Text>
          
          {/* ✅ Enhanced Connection Test Button with Environment Info */}
          <TouchableOpacity 
            onPress={testConnection}
            style={styles.testButton}
          >
            <Text style={styles.testButtonText}>
              🔍 Test Connection ({getApiConfig().debug ? 'Dev' : 'Prod'})
            </Text>
          </TouchableOpacity>
          
          {/* ✅ Show current API URL for debugging (only in development) */}
          {getApiConfig().debug && (
            <Text style={styles.apiInfo}>
              API: {API_BASE_URL}
            </Text>
          )}
          
          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seller Phone Number</Text>
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
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputPassword}
                placeholder="Enter your seller password"
                placeholderTextColor={COLORS.textTertiary}
                value={password}
                onChangeText={setPassword}
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

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? [COLORS.textTertiary, COLORS.textTertiary] : [COLORS.primary, COLORS.primaryLight]}
              style={styles.buttonGradient}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <CustomLoader />
                  <Text style={styles.buttonText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Login to Dashboard</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick Test Credentials */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              onPress={() => {
                setPhone('9876543210');
                setPassword('testpass123');
              }}
              style={styles.quickButton}
            >
              <Text style={styles.quickText}>⚡ Use Test Seller Credentials</Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('Register')} 
            disabled={loading}
            style={styles.registerButton}
          >
            <Text style={styles.registerText}>
              New seller? <Text style={styles.registerLink}>Register your shop →</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>keralasellers.in • Seller Portal</Text>
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

// Add these new styles to your existing StyleSheet
const styles = StyleSheet.create({
  // ... (keep all your existing styles)
  
  // ✅ Add these new styles
  apiInfo: {
    fontSize: 9,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footerSubtext: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  
  // ... (rest of your existing styles)
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
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: 'rgba(74, 124, 79, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 8,
  },
  testButtonText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
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
    borderColor: COLORS.inputBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  countryCode: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.inputBorder,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 12,
    fontWeight: '500',
  },
  inputPassword: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 12,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
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
  quickActions: {
    alignItems: 'center',
    marginBottom: 20,
  },
  quickButton: {
    backgroundColor: 'rgba(74, 124, 79, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  quickText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  registerButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  registerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Custom Loader Styles
  loaderContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.surface,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  loaderCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderIcon: {
    fontSize: 6,
    opacity: 0.8,
  },
});
