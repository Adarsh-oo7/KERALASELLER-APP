// // src/services/FirebaseAuthService.ts
// import axios from 'axios';

// const API_BASE_URL = 'https://keralaseller-backend.onrender.com';

// class FirebaseAuthService {
//   private phoneNumber: string = '';

//   /**
//    * Send OTP via Django backend
//    */
//   async sendOTP(phoneNumber: string): Promise<any> {
//     try {
//       // Remove +91 if present
//       const cleanPhone = phoneNumber.replace('+91', '');
//       this.phoneNumber = cleanPhone;
      
//       console.log('📤 Sending OTP via backend to:', cleanPhone);
      
//       // ✅ CORRECTED ENDPOINT: /user/send-otp/ (not /user/seller/send-otp/)
//       const response = await axios.post(`${API_BASE_URL}/user/send-otp/`, {
//         phone: cleanPhone
//       });
      
//       console.log('✅ OTP sent successfully');
      
//       // Return a mock confirmation object to match Firebase interface
//       return {
//         phoneNumber: cleanPhone,
//         confirm: async (code: string) => {
//           return await this.verifyOTP({ phoneNumber: cleanPhone }, code);
//         }
//       };
      
//     } catch (error: any) {
//       console.error('❌ Error sending OTP:', error.response?.data || error.message);
//       throw new Error(error.response?.data?.error || 'Failed to send OTP');
//     }
//   }

//   /**
//    * Verify OTP via Django backend
//    */
//   async verifyOTP(confirmation: any, code: string): Promise<{
//     user: any;
//     idToken: string;
//     phoneNumber: string;
//     uid: string;
//   }> {
//     try {
//       console.log('🔍 Verifying OTP via backend...');
      
//       // Note: Your backend might not have a verify endpoint for sellers
//       // You might need to check what endpoint exists for OTP verification
//       // Looking at the URLs, there's no /user/verify-otp/ for sellers
//       // You might need to add this endpoint in your Django backend
      
//       const response = await axios.post(`${API_BASE_URL}/user/verify-otp/`, {
//         phone: confirmation.phoneNumber || this.phoneNumber,
//         otp: code
//       });
      
//       console.log('✅ OTP verified successfully');
      
//       // Return data in Firebase-compatible format
//       return {
//         user: {
//           phoneNumber: confirmation.phoneNumber || this.phoneNumber,
//           uid: `seller_${confirmation.phoneNumber || this.phoneNumber}`
//         },
//         idToken: response.data.temp_token || 'verified',
//         phoneNumber: confirmation.phoneNumber || this.phoneNumber,
//         uid: `seller_${confirmation.phoneNumber || this.phoneNumber}`
//       };
      
//     } catch (error: any) {
//       console.error('❌ Error verifying OTP:', error.response?.data || error.message);
//       throw new Error(error.response?.data?.error || 'Invalid OTP');
//     }
//   }

//   getCurrentUser() {
//     return null;
//   }

//   async getIdToken(): Promise<string | null> {
//     return null;
//   }

//   async signOut() {
//     this.phoneNumber = '';
//     console.log('✅ Signed out');
//   }

//   onAuthStateChanged(callback: (user: any) => void) {
//     return () => {};
//   }
// }

// export default new FirebaseAuthService();
// src/services/FirebaseAuthService.ts
// src/services/FirebaseAuthService.ts
import auth from '@react-native-firebase/auth';

class FirebaseAuthService {

  // ── Send OTP ──────────────────────────────────────────────────────────────

  async sendOTP(phoneNumber: string, forceResend = false): Promise<any> {
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const e164 = cleanPhone.startsWith('91') && cleanPhone.length === 12
        ? `+${cleanPhone}`
        : `+91${cleanPhone}`;

      if (!/^\+91[6-9]\d{9}$/.test(e164)) {
        throw new Error('Enter a valid 10-digit Indian mobile number');
      }

      console.log('📤 Sending OTP via Firebase to:', e164);

      const confirmation = await auth().signInWithPhoneNumber(e164, forceResend);

      console.log('✅ OTP sent successfully via Firebase');
      return confirmation;

    } catch (error: any) {
      console.error('❌ Firebase sendOTP error:', error.code, error.message);
      throw new Error(this.parseError(error.code, error.message));
    }
  }

  // ── Verify OTP ────────────────────────────────────────────────────────────

  async verifyOTP(
    confirmation: any,
    code: string,
  ): Promise<{ user: any; idToken: string; phoneNumber: string; uid: string }> {
    try {
      if (!confirmation || typeof confirmation.confirm !== 'function') {
        throw new Error('Invalid confirmation object. Please resend OTP.');
      }

      console.log('🔍 Verifying OTP via Firebase...');
      const userCredential = await confirmation.confirm(code.trim());
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      console.log('✅ OTP verified. Firebase UID:', user.uid);
      return { user, idToken, phoneNumber: user.phoneNumber ?? '', uid: user.uid };

    } catch (error: any) {
      console.error('❌ Firebase verifyOTP error:', error.code, error.message);
      throw new Error(this.parseError(error.code, error.message));
    }
  }

  // ── Auth state ────────────────────────────────────────────────────────────

  getCurrentUser() { return auth().currentUser; }

  async getIdToken(): Promise<string | null> {
    try { return await auth().currentUser?.getIdToken() ?? null; }
    catch { return null; }
  }

  async signOut(): Promise<void> {
    try { await auth().signOut(); console.log('✅ Firebase signed out'); }
    catch (error: any) { console.error('❌ Sign out error:', error.message); }
  }

  onAuthStateChanged(callback: (user: any) => void): () => void {
    return auth().onAuthStateChanged(callback);
  }

  // ── Error parser ──────────────────────────────────────────────────────────

  private parseError(code: string, fallback: string): string {
    const map: Record<string, string> = {
      'auth/invalid-phone-number':           'Invalid phone number format',
      'auth/too-many-requests':              'Too many attempts. Try again after some time',
      'auth/invalid-verification-code':      'Incorrect OTP. Please try again',
      'auth/code-expired':                   'OTP has expired. Please request a new one',
      'auth/session-expired':                'OTP session expired. Please request a new one',
      'auth/quota-exceeded':                 'SMS quota exceeded. Try again later',
      'auth/missing-phone-number':           'Phone number is required',
      'auth/captcha-check-failed':           'reCAPTCHA failed. Please restart the app and try again',
      'auth/web-context-cancelled':          'Verification cancelled. Please try again',
      'auth/web-context-already-presented':  'A verification is already in progress',
      'auth/missing-activity-for-recaptcha': 'reCAPTCHA error. Please update the app',
      'auth/network-request-failed':         'Network error. Check your connection',
      'auth/user-disabled':                  'This account has been disabled',
      'auth/operation-not-allowed':          'Phone sign-in is not enabled in Firebase Console',
      'auth/app-not-authorized':             'App not authorized. Check SHA-1 in Firebase Console',
      'auth/invalid-app-credential':         'Invalid app credential. Check google-services.json',
    };
    return map[code] ?? fallback ?? 'Something went wrong. Please try again';
  }
}

export default new FirebaseAuthService();