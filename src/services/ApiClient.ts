// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // ✅ LIVE SERVER - FORCE PRODUCTION
// const API_BASE_URL = __DEV__ 
//   ? 'https://api.keralasellers.in'  // ✅ FORCE LIVE EVEN IN DEV MODE
//   : 'https://api.keralasellers.in'; // ✅ PRODUCTION LIVE SERVER

// console.log('🌐 API Client initialized');
// console.log('🔧 API Base URL:', API_BASE_URL);
// console.log('🚀 Mode:', __DEV__ ? 'Development (using LIVE server)' : 'Production');

// // ✅ Create axios instance with proper configuration
// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 30000, // 30 second timeout
//   headers: {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json',
//   },
// });

// // ✅ Request interceptor
// apiClient.interceptors.request.use(
//   async (config) => {
//     console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
//     try {
//       // ✅ Add authentication token (skip for login/register/send-otp)
//       const skipAuthUrls = ['/login/', '/register/', '/send-otp/', '/check-exists/'];
//       const needsAuth = !skipAuthUrls.some(url => config.url?.includes(url));
      
//       if (needsAuth) {
//         const token = await AsyncStorage.getItem('access_token');
//         if (token && token !== 'fallback_token') {
//           config.headers.Authorization = `Bearer ${token}`;
//           console.log('🔐 Added Bearer token');
//         } else {
//           console.log('⚠️ No valid access token found');
//         }
//       } else {
//         console.log('🔓 Auth not required for this endpoint');
//       }

//       // ✅ Handle FormData properly
//       if (config.data instanceof FormData) {
//         delete config.headers['Content-Type']; // Let axios set it automatically
//         console.log('📤 FormData request - letting axios handle Content-Type');
//       }

//       // ✅ Log request details
//       console.log('📤 Request details:', {
//         url: `${config.baseURL}${config.url}`,
//         method: config.method?.toUpperCase(),
//         hasAuth: !!config.headers.Authorization,
//         contentType: config.headers['Content-Type'] || 'auto',
//         hasData: !!config.data,
//         dataType: config.data instanceof FormData ? 'FormData' : typeof config.data,
//       });

//       // ✅ Log request body (for debugging)
//       if (config.data && !(config.data instanceof FormData)) {
//         console.log('📤 Request body:', JSON.stringify(config.data, null, 2));
//       }

//       return config;
//     } catch (error) {
//       console.error('❌ Request interceptor error:', error);
//       return config;
//     }
//   },
//   (error) => {
//     console.error('❌ Request interceptor failed:', error);
//     return Promise.reject(error);
//   }
// );

// // ✅ Response interceptor
// apiClient.interceptors.response.use(
//   (response) => {
//     console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
//     console.log('📥 Response data keys:', response.data ? Object.keys(response.data) : []);
    
//     // ✅ Log response data for login/register
//     if (response.config.url?.includes('/login/') || response.config.url?.includes('/register/')) {
//       console.log('📥 Auth response:', {
//         hasToken: !!response.data?.access_token,
//         hasSeller: !!response.data?.seller,
//         sellerShop: response.data?.seller?.shop_name
//       });
//     }
    
//     return response;
//   },
//   async (error) => {
//     const { config, response } = error;
    
//     console.error(`❌ API Error: ${response?.status || 'NO_RESPONSE'} ${config?.method?.toUpperCase()} ${config?.url}`);
//     console.error('📥 Error response:', response?.data);
//     console.error('📥 Error message:', error.message);

//     // ✅ Handle specific error codes
//     if (response?.status === 400) {
//       console.error('🔍 400 Bad Request Details:');
//       console.error('- Full URL:', `${config?.baseURL}${config?.url}`);
//       console.error('- Method:', config?.method?.toUpperCase());
//       console.error('- Headers:', JSON.stringify(config?.headers, null, 2));
      
//       if (config?.data && !(config.data instanceof FormData)) {
//         console.error('- Request body:', JSON.stringify(config.data, null, 2));
//       }
      
//       console.error('- Response errors:', JSON.stringify(response.data, null, 2));
//     }

//     // ✅ Handle 401 Unauthorized
//     if (response?.status === 401) {
//       console.log('🔓 401 Unauthorized - clearing auth data...');
//       try {
//         await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data', 'accessToken', 'api_token']);
//         console.log('✅ Auth data cleared');
//       } catch (clearError) {
//         console.error('❌ Failed to clear auth data:', clearError);
//       }
//     }

//     // ✅ Handle Network Errors
//     if (!response) {
//       console.error('🌐 Network Error Details:');
//       console.error('- Attempted URL:', `${config?.baseURL}${config?.url}`);
//       console.error('- This usually means:');
//       console.error('  1. Server is not reachable');
//       console.error('  2. CORS issue (web only)');
//       console.error('  3. Network timeout');
//       console.error('  4. SSL/Certificate issue');
      
//       if (API_BASE_URL.includes('10.0.2.2') || API_BASE_URL.includes('localhost')) {
//         console.error('⚠️ You are using local server - make sure Django is running!');
//       } else {
//         console.error('⚠️ Check if live server is accessible:', API_BASE_URL);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default apiClient;
// src/services/ApiClient.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE_URL = 'https://api.keralasellers.in';

// Endpoints that never need an auth token
const PUBLIC_ENDPOINTS = [
  '/user/login/',
  '/user/register/',
  '/user/send-otp/',
  '/user/validate-otp/',
  '/user/check-exists/',
  '/user/forgot-password/',
  '/health/',
];

const isPublicEndpoint = (url?: string) =>
  PUBLIC_ENDPOINTS.some(ep => url?.includes(ep));

// ── Instance ──────────────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Accept':       'application/json',
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // ── Attach auth token for protected endpoints only ──
    if (!isPublicEndpoint(config.url)) {
      const token = await AsyncStorage.getItem('access_token');
      if (token && token !== 'fallback_token') {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // No warning log here — missing token is handled by 401 response
    }

    // ── FormData: let axios set Content-Type with boundary ──
    if (config.data instanceof FormData) {
      delete (config.headers as any)['Content-Type'];
    }

    // ── Dev-only: warn if request body contains newlines (e.g. password + \n) ──
    if (__DEV__ && config.data && !(config.data instanceof FormData)) {
      const body = JSON.stringify(config.data);
      if (body.includes('\\n') || /\n/.test(body)) {
        console.warn(
          '⚠️ ApiClient: Request body contains newline characters.\n' +
          '   Check password/input fields for trailing \\n.',
          config.url,
        );
      }
    }

    if (__DEV__) {
      console.log(
        `→ ${config.method?.toUpperCase()} ${config.url}`,
        config.headers.Authorization ? '[auth]' : '[public]',
      );
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log(`← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },

  async (error) => {
    const status = error.response?.status;
    const url    = error.config?.url ?? '';

    if (__DEV__) {
      console.error(
        `← ${status ?? 'ERR'} ${error.config?.method?.toUpperCase()} ${url}`,
        error.response?.data ?? error.message,
      );
    }

    // ── 401 on a PROTECTED route → clear tokens ──
    // Do NOT clear tokens on public endpoints (e.g. wrong password on /login/)
    if (status === 401 && !isPublicEndpoint(url)) {
      try {
        await AsyncStorage.multiRemove([
          'access_token', 'accessToken',
          'refresh_token', 'api_token', 'user_data',
        ]);
        // Invalidate AuthService cache if accessible
        // AuthService.invalidateCache() — called from AuthService itself on logout
      } catch {
        // storage clear failure shouldn't block error propagation
      }
    }

    // ── No response = network/timeout issue ──
    if (!error.response && __DEV__) {
      console.error('🌐 Network error — server unreachable:', API_BASE_URL);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
