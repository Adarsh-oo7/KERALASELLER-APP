import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ FIXED: Correct URL for Android Emulator
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:8000'  // ✅ ANDROID EMULATOR FIX
  : 'https://keralaseller-backend.onrender.com';

console.log('🔧 API Base URL:', API_BASE_URL);

// ✅ FIXED: Create axios instance with proper configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// ✅ ENHANCED: Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    try {
      // ✅ ADD: Authentication token (skip for login/register)
      if (!config.url?.includes('/login/') && !config.url?.includes('/register/')) {
        const token = await AsyncStorage.getItem('access_token');
        if (token && token !== 'fallback_token') {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔐 Added Bearer token');
        } else {
          console.log('⚠️ No valid access token found');
        }
      }

      // ✅ IMPORTANT: Don't override Content-Type for FormData
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type']; // Let axios set it automatically
        console.log('📤 FormData request - letting axios handle Content-Type');
      }

      // ✅ LOG: Request details
      console.log('📤 Request details:', {
        url: `${config.baseURL}${config.url}`,
        method: config.method?.toUpperCase(),
        hasAuth: !!config.headers.Authorization,
        contentType: config.headers['Content-Type'] || 'auto',
        hasData: !!config.data,
        dataType: config.data instanceof FormData ? 'FormData' : typeof config.data,
      });

      // ✅ NEW: Log actual request data (critical for debugging)
      if (config.data && !(config.data instanceof FormData)) {
        console.log('📤 Request body:', JSON.stringify(config.data, null, 2));
      }

      return config;
    } catch (error) {
      console.error('❌ Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request interceptor failed:', error);
    return Promise.reject(error);
  }
);

// ✅ ENHANCED: Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('📥 Response data keys:', response.data ? Object.keys(response.data) : []);
    return response;
  },
  async (error) => {
    const { config, response } = error;
    
    console.error(`❌ API Error: ${response?.status} ${config?.method?.toUpperCase()} ${config?.url}`);
    console.error('📥 Error response:', response?.data);
    console.error('📥 Error message:', error.message);

    // ✅ ENHANCED: Detailed error logging for 400 errors
    if (response?.status === 400) {
      console.error('🔍 400 Bad Request Analysis:');
      console.error('- Request URL:', `${config?.baseURL}${config?.url}`);
      console.error('- Request method:', config?.method?.toUpperCase());
      console.error('- Request headers:', config?.headers);
      console.error('- Request data type:', config?.data instanceof FormData ? 'FormData' : typeof config?.data);
      
      // ✅ NEW: Log the actual data that was sent
      if (config?.data && !(config.data instanceof FormData)) {
        console.error('- Request body sent:', JSON.stringify(config.data, null, 2));
      }
      
      console.error('- Response data:', response.data);
      
      // Try to parse error details
      if (response.data && typeof response.data === 'object') {
        console.error('🔍 Field errors:', response.data);
      }
    }

    // ✅ HANDLE: 401 Unauthorized
    if (response?.status === 401) {
      console.log('🔓 401 Unauthorized - clearing auth data...');
      try {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
        console.log('✅ Auth data cleared');
      } catch (clearError) {
        console.error('❌ Failed to clear auth data:', clearError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
