// src/services/FirebaseAuthService.ts
import { 
  PhoneAuthProvider, 
  signInWithCredential,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '../config/firebase.config';

class FirebaseAuthService {
  /**
   * Send OTP via Firebase Phone Auth
   */
  async sendOTP(
    phoneNumber: string, 
    recaptchaVerifier: any
  ): Promise<string> {
    try {
      console.log('📤 Sending Firebase OTP to:', phoneNumber);
      
      // Format phone number with +91 country code
      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      const phoneProvider = new PhoneAuthProvider(auth);
      
      // Send OTP via Firebase
      const verificationId = await phoneProvider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier
      );

      console.log('✅ Firebase OTP sent! Verification ID:', verificationId);
      return verificationId;
      
    } catch (error: any) {
      console.error('❌ Firebase OTP send failed:', error);
      throw new Error(error.message || 'Failed to send OTP via Firebase');
    }
  }

  /**
   * Verify OTP and get Firebase ID token
   */
  async verifyOTP(verificationId: string, code: string): Promise<{
    user: any;
    idToken: string;
    phoneNumber: string;
    uid: string;
  }> {
    try {
      console.log('🔍 Verifying Firebase OTP...');
      
      // Create credential with verification ID and OTP code
      const credential = PhoneAuthProvider.credential(verificationId, code);
      
      // Sign in with credential
      const userCredential = await signInWithCredential(auth, credential);
      
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
      }
      
      throw new Error(error.message || 'Invalid OTP');
    }
  }

  /**
   * Get current Firebase user
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Get Firebase ID token
   */
  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
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
      await firebaseSignOut(auth);
      console.log('✅ Signed out from Firebase');
    } catch (error) {
      console.error('❌ Firebase sign out failed:', error);
      throw error;
    }
  }
}

export default new FirebaseAuthService();
