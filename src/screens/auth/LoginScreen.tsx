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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../App';
import api from '../../api/api';

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
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const response = await api.post('/api/user/login/', {
        phone: phoneClean,
        password: password.trim(),
      });

      const data = response.data;

      if (data.access_token) {
        await AsyncStorage.setItem('accessToken', data.access_token);
        await AsyncStorage.setItem('refreshToken', data.refresh_token || '');
        await AsyncStorage.setItem('apiToken', data.api_token || '');
        await AsyncStorage.setItem('userPhone', phoneClean);
        await AsyncStorage.setItem('userType', 'seller');
        await AsyncStorage.setItem('sellerId', data.seller.id.toString());

        console.log('\u2705 Seller login successful:', data.seller);

        // Navigate to Dashboard
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' as any }],
        });
      } else {
        throw new Error(data.error || data.detail || data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('\u274c Login error:', error);

      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) setPhone(cleaned);
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

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.logoCircle}
            >
              <Text style={styles.logoText}>K</Text>
            </LinearGradient>
          </View>
          <Text style={styles.brandTitle}>KERALA</Text>
          <Text style={styles.brandSubtitle}>Sellers</Text>
          <Text style={styles.brandTagline}>Seller Dashboard</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Seller Sign In</Text>
            <Text style={styles.formSubtitle}>Access your seller dashboard</Text>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="9876543210"
                  placeholderTextColor={COLORS.textSecondary}
                  value={phone}
                  onChangeText={formatPhoneNumber}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!loading}
                />
              </View>
              <Text style={styles.inputHelper}>Enter 10-digit mobile number (6-9 start)</Text>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInputPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? '\uD83D\uDC41\uFE0F' : '\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8\uFE0F'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
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
                    <Text style={styles.buttonText}>Signing In...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Sign In as Seller</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
            >
              <Text style={styles.signUpText}>
                New seller? <Text style={styles.signUpLink}>Register your shop</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerWebsite}>keralasellers.in</Text>
            <Text style={styles.footerTagline}>Trusted platform for Kerala sellers</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  logoSection: { alignItems: 'center', paddingTop: 50, paddingBottom: 25 },
  logoContainer: { marginBottom: 16 },
  logoCircle: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8,
  },
  logoText: { fontSize: 28, fontWeight: 'bold', color: COLORS.surface },
  brandTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 2, marginBottom: -2 },
  brandSubtitle: { fontSize: 12, fontWeight: '300', color: COLORS.primary, letterSpacing: 1, marginBottom: 4 },
  brandTagline: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '500' },
  formSection: { flex: 1, paddingHorizontal: 18 },
  formContainer: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 20,
    elevation: 5,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 4 },
  formSubtitle: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 10, fontWeight: '600', color: COLORS.primary, marginBottom: 5, marginLeft: 3 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 1,
    borderWidth: 1, borderColor: COLORS.inputBorder, elevation: 1,
  },
  countryCode: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600', marginRight: 6 },
  textInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, paddingVertical: 10 },
  textInputPassword: { flex: 1, fontSize: 14, color: COLORS.textPrimary, paddingVertical: 10 },
  inputHelper: { fontSize: 9, color: COLORS.textSecondary, marginTop: 3, marginLeft: 3 },
  passwordToggle: { padding: 4 },
  passwordToggleText: { fontSize: 14 },
  signInButton: {
    marginTop: 8, marginBottom: 16, borderRadius: 8, overflow: 'hidden', elevation: 3,
  },
  buttonGradient: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: COLORS.surface, fontSize: 14, fontWeight: '600' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonDisabled: { opacity: 0.7 },
  signUpText: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  signUpLink: { color: COLORS.primary, fontWeight: '600' },
  footer: { alignItems: 'center', paddingVertical: 12 },
  footerWebsite: { fontSize: 10, color: COLORS.primary, fontWeight: '600', marginBottom: 2 },
  footerTagline: { fontSize: 8, color: COLORS.textSecondary },
});
