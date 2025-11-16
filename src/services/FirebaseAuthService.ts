// src/services/FirebaseAuthService.ts
import auth from '@react-native-firebase/auth';

class FirebaseAuthService {
  /**
   * Send OTP via Firebase Phone Auth
   * @param phoneNumber - Phone number to send OTP to
   * @returns Firebase confirmation object
   */
  async sendOTP(phoneNumber: string): Promise<any> {
    try {
      console.log('📤 Sending Firebase OTP to:', phoneNumber);
      
      // Format phone number with +91 country code
      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      // Send OTP via Firebase - returns confirmation object
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
      
      console.log('✅ Firebase OTP sent successfully!');
      return confirmation;
      
    } catch (error: any) {
      console.error('❌ Firebase OTP send failed:', error);
      
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      } else if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format.');
      }
      
      throw new Error(error.message || 'Failed to send OTP via Firebase');
    }
  }

  /**
   * Verify OTP and get Firebase ID token
   * @param confirmation - Firebase confirmation object from sendOTP
   * @param code - 6-digit OTP code
   * @returns User data with Firebase ID token
   */
  async verifyOTP(confirmation: any, code: string): Promise<{
    user: any;
    idToken: string;
    phoneNumber: string;
    uid: string;
  }> {
    try {
      console.log('🔍 Verifying Firebase OTP...');
      
      // Confirm the OTP code
      const userCredential = await confirmation.confirm(code);
      
      console.log('✅ Firebase OTP verified! User:', userCredential.user.uid);
      
      // Get Firebase ID token - THIS IS WHAT YOUR BACKEND NEEDS
      const idToken = await userCredential.user.getIdToken();
      
      return {
        user: userCredential.user,
        idToken: idToken,  // ← This goes to your backend as firebase_id_token
        phoneNumber: userCredential.user.phoneNumber || '',
        uid: userCredential.user.uid,
      };
      
    } catch (error: any) {
      console.error('❌ Firebase OTP verification failed:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP code. Please try again.');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('OTP code has expired. Please request a new one.');
      } else if (error.code === 'auth/session-expired') {
        throw new Error('Session expired. Please request a new OTP.');
      }
      
      throw new Error(error.message || 'Invalid OTP');
    }
  }

  /**
   * Get current Firebase user
   */
  getCurrentUser() {
    return auth().currentUser;
  }

  /**
   * Get Firebase ID token for current user
   */
  async getIdToken(): Promise<string | null> {
    const user = auth().currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  /**
   * Sign out from Firebase
   */
  async signOut() {
    try {
      await auth().signOut();
      console.log('✅ Signed out from Firebase');
    } catch (error) {
      console.error('❌ Firebase sign out failed:', error);
      throw error;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: any) => void) {
    return auth().onAuthStateChanged(callback);
  }
}

export default new FirebaseAuthService();
