// src/services/BackendAuthService.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.keralasellers.in'; // Your backend URL

class BackendAuthService {
  /**
   * Send OTP via Django backend
   */
  async sendOTP(phoneNumber: string): Promise<boolean> {
    try {
      console.log('📤 Sending OTP via backend to:', phoneNumber);
      
      const response = await axios.post(`${API_BASE_URL}/user/seller/send-otp/`, {
        phone: phoneNumber
      });
      
      console.log('✅ OTP sent successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to send OTP');
    }
  }

  /**
   * Verify OTP via Django backend
   */
  async verifyOTP(phoneNumber: string, otp: string): Promise<any> {
    try {
      console.log('🔍 Verifying OTP via backend...');
      
      const response = await axios.post(`${API_BASE_URL}/user/seller/verify-otp/`, {
        phone: phoneNumber,
        otp: otp
      });
      
      console.log('✅ OTP verified successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error verifying OTP:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Invalid OTP');
    }
  }

  /**
   * Register new seller
   */
  async registerSeller(data: any): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/user/seller/register/`, data);
      
      // Save tokens
      if (response.data.access_token) {
        await AsyncStorage.setItem('access_token', response.data.access_token);
        await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      console.log('✅ Seller registered successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error registering seller:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  /**
   * Login seller
   */
  async login(phone: string, password: string): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/user/seller/login/`, {
        phone_number: phone,
        password: password
      });
      
      // Save tokens
      if (response.data.access_token) {
        await AsyncStorage.setItem('access_token', response.data.access_token);
        await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
  }
}

export default new BackendAuthService();
