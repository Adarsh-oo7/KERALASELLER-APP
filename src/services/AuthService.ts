import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import apiClient from './ApiClient';

const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.4:8000'
  : 'https://keralaseller-backend.onrender.com';

class AuthService {
  private navigationRef: any = null;

  // ✅ NEW: Set navigation reference for logout
  setNavigationRef(navigationRef: any) {
    this.navigationRef = navigationRef;
    console.log('🧭 AuthService: Navigation reference set');
  }

  async login(phone: string, password: string): Promise<any> {
    try {
      console.log('🔐 AuthService: Starting SELLER login...');
      console.log('📞 Phone:', phone);
      console.log('🔑 Password length:', password?.length);

      // ✅ VALIDATION: Input validation
      if (!phone || !password) {
        throw new Error('Phone and password are required');
      }

      // ✅ FORMAT: Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      const requestData = {
        phone: cleanPhone,
        password: password,
      };

      console.log('📤 Sending SELLER login request to: /user/login/');
      console.log('📋 Request data:', { phone: requestData.phone, password: '***' });

      const response = await apiClient.post('/user/login/', requestData);

      console.log('✅ Seller login API response received:', {
        status: response.status,
        dataKeys: response.data ? Object.keys(response.data) : [],
      });

      const loginData = response.data;

      // ✅ HANDLE: LoginSeller response structure
      if (loginData && loginData.seller) {
        const accessToken = loginData.access_token;
        const refreshToken = loginData.refresh_token;
        const apiToken = loginData.api_token;

        if (!accessToken) {
          console.error('❌ No access token in response');
          throw new Error('Login successful but no access token received');
        }

        // ✅ STORAGE: Store all tokens
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('access_token', accessToken);
        await AsyncStorage.setItem('refresh_token', refreshToken);
        await AsyncStorage.setItem('api_token', apiToken);
        
        // ✅ STORE: Seller user data
        const sellerData = {
          id: loginData.seller.id,
          name: loginData.seller.name,
          email: loginData.seller.email,
          phone: loginData.seller.phone,
          shop_name: loginData.seller.shop_name,
          user_type: loginData.user_type || 'seller'
        };
        
        await AsyncStorage.setItem('user_data', JSON.stringify(sellerData));
        
        console.log('✅ AuthService: Seller login successful!');
        console.log('💾 Stored access token:', accessToken.substring(0, 30) + '...');
        console.log('👤 Seller data:', sellerData);
        
        return {
          access: accessToken,
          access_token: accessToken,
          refresh: refreshToken,
          refresh_token: refreshToken,
          api_token: apiToken,
          seller: loginData.seller,
          user_type: loginData.user_type,
          user: sellerData,
          success: true
        };

      } else {
        console.error('❌ No seller data in response:', loginData);
        throw new Error('Invalid login response - no seller data found');
      }

    } catch (error: any) {
      console.error('❌ AuthService Login Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        url: error.config?.url,
      });

      // ✅ ENHANCED: Better error handling
      let errorMessage = 'Login failed';

      if (error.response?.status === 400) {
        const responseData = error.response.data;
        console.log('🔍 400 Error details:', responseData);

        if (responseData?.phone) {
          errorMessage = Array.isArray(responseData.phone) 
            ? responseData.phone[0] 
            : 'Invalid phone number';
        } else if (responseData?.password) {
          errorMessage = Array.isArray(responseData.password)
            ? responseData.password[0]
            : 'Invalid password';
        } else if (responseData?.non_field_errors) {
          errorMessage = Array.isArray(responseData.non_field_errors)
            ? responseData.non_field_errors[0]
            : 'Invalid credentials';
        } else if (responseData?.detail) {
          errorMessage = responseData.detail;
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        } else {
          errorMessage = 'Invalid phone number or password';
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid phone number or password';
      } else if (error.response?.status === 404) {
        errorMessage = 'Login service not found. Please check server connection.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Please check your internet connection.';
      } else if (!error.response) {
        errorMessage = 'Network error. Cannot connect to server.';
      }

      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      enhancedError.response = error.response;
      throw enhancedError;
    }
  }

  // ✅ FIXED: Proper logout with navigation reset
  async logout(): Promise<void> {
    try {
      console.log('🚪 AuthService: Starting logout...');
      
      // ✅ STEP 1: Clear all auth data
      const keysToRemove = [
        'accessToken', 
        'access_token', 
        'refresh_token', 
        'api_token', 
        'user_data',
        'buyerAccessToken', // Legacy cleanup
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ AuthService: Auth data cleared');

      // ✅ STEP 2: Reset navigation stack to login screen
      if (this.navigationRef?.current) {
        console.log('🧭 AuthService: Resetting navigation to Login...');
        this.navigationRef.current.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
        console.log('✅ AuthService: Navigation reset completed');
      } else {
        console.log('⚠️ AuthService: No navigation reference available');
      }

      console.log('✅ AuthService: Logout completed');
    } catch (error: any) {
      console.error('❌ AuthService: Logout error:', error);
      
      // ✅ FALLBACK: Force navigation even if clearing storage fails
      if (this.navigationRef?.current) {
        try {
          this.navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
          console.log('✅ AuthService: Fallback navigation reset completed');
        } catch (navError) {
          console.error('❌ AuthService: Navigation reset failed:', navError);
        }
      }
      
      // Don't throw error - logout should always succeed from UI perspective
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const userData = await AsyncStorage.getItem('user_data');
      const isAuth = !!(accessToken && userData && accessToken !== 'fallback_token');
      console.log('🔍 AuthService: Authentication status:', isAuth);
      return isAuth;
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Failed to get current user:', error);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      return null;
    }
  }

  async fetchCurrentUserFromAPI(): Promise<any> {
    try {
      const response = await apiClient.get('/user/dashboard/');
      console.log('✅ Fresh seller data from API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch current seller from API:', error);
      throw error;
    }
  }

  // ✅ NEW: Send OTP method for registration
  async sendOTP(data: { phone: string; name: string; shop_name: string; email: string }): Promise<any> {
    try {
      console.log('📱 AuthService: Sending OTP for registration...');
      console.log('📋 OTP data:', { 
        phone: data.phone, 
        name: data.name, 
        shop_name: data.shop_name, 
        email: data.email 
      });
      
      // ✅ VALIDATION: Clean and validate phone number
      const cleanPhone = data.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      // ✅ VALIDATION: Validate required fields
      if (!data.name.trim()) {
        throw new Error('Name is required');
      }
      if (!data.shop_name.trim()) {
        throw new Error('Shop name is required');
      }
      if (!data.email.trim()) {
        throw new Error('Email is required');
      }

      const requestData = {
        phone: cleanPhone,
        name: data.name.trim(),
        shop_name: data.shop_name.trim(),
        email: data.email.trim()
      };

      console.log('📤 Sending OTP request to: /user/send-otp/');
      const response = await apiClient.post('/user/send-otp/', requestData);

      console.log('✅ OTP sent successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService: Failed to send OTP:', {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });

      // ✅ ENHANCED: Better error handling for OTP
      let errorMessage = 'Failed to send OTP';

      if (error.response?.status === 400) {
        const responseData = error.response.data;
        if (responseData?.phone) {
          errorMessage = Array.isArray(responseData.phone) 
            ? responseData.phone[0] 
            : 'Invalid phone number';
        } else if (responseData?.email) {
          errorMessage = Array.isArray(responseData.email)
            ? responseData.email[0]
            : 'Invalid email address';
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        }
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many OTP requests. Please wait a moment and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      enhancedError.response = error.response;
      throw enhancedError;
    }
  }

  // ✅ NEW: Register method
  async register(data: {
    name: string;
    shop_name: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
    otp: string;
  }): Promise<any> {
    try {
      console.log('📝 AuthService: Starting seller registration...');
      console.log('📋 Registration data:', { 
        name: data.name, 
        shop_name: data.shop_name,
        phone: data.phone,
        email: data.email,
        otp: data.otp 
      });

      // ✅ VALIDATION: Input validation
      if (!data.name.trim()) {
        throw new Error('Name is required');
      }
      if (!data.shop_name.trim()) {
        throw new Error('Shop name is required');
      }
      if (!data.email.trim()) {
        throw new Error('Email is required');
      }
      if (!data.phone.trim()) {
        throw new Error('Phone number is required');
      }
      if (!data.password) {
        throw new Error('Password is required');
      }
      if (!data.confirmPassword) {
        throw new Error('Password confirmation is required');
      }
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (!data.otp.trim()) {
        throw new Error('OTP is required');
      }
      if (data.otp.trim().length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      // ✅ FORMAT: Clean phone number
      const cleanPhone = data.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      const requestData = {
        name: data.name.trim(),
        shop_name: data.shop_name.trim(),
        phone: cleanPhone,
        email: data.email.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        otp: data.otp.trim(),
      };

      console.log('📤 Sending registration request to: /user/register/');
      const response = await apiClient.post('/user/register/', requestData);

      console.log('✅ Registration successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService: Registration failed:', {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });

      // ✅ ENHANCED: Better error handling for registration
      let errorMessage = 'Registration failed';

      if (error.response?.status === 400) {
        const responseData = error.response.data;
        
        // Check for specific field errors
        if (responseData?.phone) {
          errorMessage = Array.isArray(responseData.phone) 
            ? responseData.phone[0] 
            : 'Invalid phone number';
        } else if (responseData?.email) {
          errorMessage = Array.isArray(responseData.email)
            ? responseData.email[0]
            : 'Invalid email address';
        } else if (responseData?.password) {
          errorMessage = Array.isArray(responseData.password)
            ? responseData.password[0]
            : 'Invalid password';
        } else if (responseData?.confirmPassword) {
          errorMessage = Array.isArray(responseData.confirmPassword)
            ? responseData.confirmPassword[0]
            : 'Password confirmation error';
        } else if (responseData?.otp) {
          errorMessage = Array.isArray(responseData.otp)
            ? responseData.otp[0]
            : 'Invalid or expired OTP';
        } else if (responseData?.name) {
          errorMessage = Array.isArray(responseData.name)
            ? responseData.name[0]
            : 'Invalid name';
        } else if (responseData?.shop_name) {
          errorMessage = Array.isArray(responseData.shop_name)
            ? responseData.shop_name[0]
            : 'Invalid shop name';
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.detail) {
          errorMessage = responseData.detail;
        }
      } else if (error.response?.status === 409) {
        errorMessage = 'An account with this phone number or email already exists.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many registration attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      enhancedError.response = error.response;
      throw enhancedError;
    }
  }

  // ✅ UPDATED: Test connection method
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing API connection...');
      const response = await apiClient.get('/user/test-auth/', { timeout: 5000 });
      console.log('✅ API connection successful');
      return true;
    } catch (error) {
      console.error('❌ API connection failed:', error.message);
      return false;
    }
  }

  // ✅ LEGACY: Simple send OTP method (for backward compatibility)
  async sendOTPSimple(phone: string): Promise<any> {
    try {
      console.log('📱 Sending simple OTP to:', phone);
      
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      const response = await apiClient.post('/user/send-otp/', {
        phone: cleanPhone
      });

      console.log('✅ Simple OTP sent successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send simple OTP:', error);
      throw error;
    }
  }

  // ✅ NEW: Resend OTP method
  async resendOTP(data: { phone: string; name: string; shop_name: string; email: string }): Promise<any> {
    try {
      console.log('🔄 Resending OTP...');
      return await this.sendOTP(data);
    } catch (error) {
      console.error('❌ Failed to resend OTP:', error);
      throw error;
    }
  }

  // ✅ NEW: Validate OTP method (if your backend supports it)
  async validateOTP(phone: string, otp: string): Promise<any> {
    try {
      console.log('🔍 Validating OTP for phone:', phone);
      
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await apiClient.post('/user/validate-otp/', {
        phone: cleanPhone,
        otp: otp.trim()
      });

      console.log('✅ OTP validation successful');
      return response.data;
    } catch (error) {
      console.error('❌ OTP validation failed:', error);
      throw error;
    }
  }
}

export default new AuthService();
