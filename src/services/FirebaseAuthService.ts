// src/services/FirebaseAuthService.ts
import axios from 'axios';

const API_BASE_URL = 'https://keralaseller-backend.onrender.com';

class FirebaseAuthService {
  private phoneNumber: string = '';

  /**
   * Send OTP via Django backend
   */
  async sendOTP(phoneNumber: string): Promise<any> {
    try {
      // Remove +91 if present
      const cleanPhone = phoneNumber.replace('+91', '');
      this.phoneNumber = cleanPhone;
      
      console.log('📤 Sending OTP via backend to:', cleanPhone);
      
      // ✅ CORRECTED ENDPOINT: /user/send-otp/ (not /user/seller/send-otp/)
      const response = await axios.post(`${API_BASE_URL}/user/send-otp/`, {
        phone: cleanPhone
      });
      
      console.log('✅ OTP sent successfully');
      
      // Return a mock confirmation object to match Firebase interface
      return {
        phoneNumber: cleanPhone,
        confirm: async (code: string) => {
          return await this.verifyOTP({ phoneNumber: cleanPhone }, code);
        }
      };
      
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to send OTP');
    }
  }

  /**
   * Verify OTP via Django backend
   */
  async verifyOTP(confirmation: any, code: string): Promise<{
    user: any;
    idToken: string;
    phoneNumber: string;
    uid: string;
  }> {
    try {
      console.log('🔍 Verifying OTP via backend...');
      
      // Note: Your backend might not have a verify endpoint for sellers
      // You might need to check what endpoint exists for OTP verification
      // Looking at the URLs, there's no /user/verify-otp/ for sellers
      // You might need to add this endpoint in your Django backend
      
      const response = await axios.post(`${API_BASE_URL}/user/verify-otp/`, {
        phone: confirmation.phoneNumber || this.phoneNumber,
        otp: code
      });
      
      console.log('✅ OTP verified successfully');
      
      // Return data in Firebase-compatible format
      return {
        user: {
          phoneNumber: confirmation.phoneNumber || this.phoneNumber,
          uid: `seller_${confirmation.phoneNumber || this.phoneNumber}`
        },
        idToken: response.data.temp_token || 'verified',
        phoneNumber: confirmation.phoneNumber || this.phoneNumber,
        uid: `seller_${confirmation.phoneNumber || this.phoneNumber}`
      };
      
    } catch (error: any) {
      console.error('❌ Error verifying OTP:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Invalid OTP');
    }
  }

  getCurrentUser() {
    return null;
  }

  async getIdToken(): Promise<string | null> {
    return null;
  }

  async signOut() {
    this.phoneNumber = '';
    console.log('✅ Signed out');
  }

  onAuthStateChanged(callback: (user: any) => void) {
    return () => {};
  }
}

export default new FirebaseAuthService();
