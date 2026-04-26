
// // src/services/ApiClient.ts
// import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // ── Config ────────────────────────────────────────────────────────────────────

// const API_BASE_URL = 'https://api.keralasellers.in';

// // Endpoints that never need an auth token
// const PUBLIC_ENDPOINTS = [
//   '/user/login/',
//   '/user/register/',
//   '/user/send-otp/',
//   '/user/validate-otp/',
//   '/user/check-exists/',
//   '/user/forgot-password/',
//   '/health/',
// ];

// const isPublicEndpoint = (url?: string) =>
//   PUBLIC_ENDPOINTS.some(ep => url?.includes(ep));

// // ── Instance ──────────────────────────────────────────────────────────────────

// const apiClient: AxiosInstance = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 30_000,
//   headers: {
//     'Accept':       'application/json',
//     'Content-Type': 'application/json',
//   },
// });

// // ── Request interceptor ───────────────────────────────────────────────────────

// apiClient.interceptors.request.use(
//   async (config: InternalAxiosRequestConfig) => {
//     // ── Attach auth token for protected endpoints only ──
//     if (!isPublicEndpoint(config.url)) {
//       const token = await AsyncStorage.getItem('access_token');
//       if (token && token !== 'fallback_token') {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       // No warning log here — missing token is handled by 401 response
//     }

//     // ── FormData: let axios set Content-Type with boundary ──
//     if (config.data instanceof FormData) {
//       delete (config.headers as any)['Content-Type'];
//     }

//     // ── Dev-only: warn if request body contains newlines (e.g. password + \n) ──
//     if (__DEV__ && config.data && !(config.data instanceof FormData)) {
//       const body = JSON.stringify(config.data);
//       if (body.includes('\\n') || /\n/.test(body)) {
//         console.warn(
//           '⚠️ ApiClient: Request body contains newline characters.\n' +
//           '   Check password/input fields for trailing \\n.',
//           config.url,
//         );
//       }
//     }

//     if (__DEV__) {
//       console.log(
//         `→ ${config.method?.toUpperCase()} ${config.url}`,
//         config.headers.Authorization ? '[auth]' : '[public]',
//       );
//     }

//     return config;
//   },
//   (error) => Promise.reject(error),
// );

// // ── Response interceptor ──────────────────────────────────────────────────────

// apiClient.interceptors.response.use(
//   (response: AxiosResponse) => {
//     if (__DEV__) {
//       console.log(`← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
//     }
//     return response;
//   },

//   async (error) => {
//     const status = error.response?.status;
//     const url    = error.config?.url ?? '';

//     if (__DEV__) {
//       console.error(
//         `← ${status ?? 'ERR'} ${error.config?.method?.toUpperCase()} ${url}`,
//         error.response?.data ?? error.message,
//       );
//     }

//     // ── 401 on a PROTECTED route → clear tokens ──
//     // Do NOT clear tokens on public endpoints (e.g. wrong password on /login/)
//     if (status === 401 && !isPublicEndpoint(url)) {
//       try {
//         await AsyncStorage.multiRemove([
//           'access_token', 'accessToken',
//           'refresh_token', 'api_token', 'user_data',
//         ]);
//         // Invalidate AuthService cache if accessible
//         // AuthService.invalidateCache() — called from AuthService itself on logout
//       } catch {
//         // storage clear failure shouldn't block error propagation
//       }
//     }

//     // ── No response = network/timeout issue ──
//     if (!error.response && __DEV__) {
//       console.error('🌐 Network error — server unreachable:', API_BASE_URL);
//     }

//     return Promise.reject(error);
//   },
// );

// export default apiClient;
// src/services/ApiClient.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.keralasellers.in';

const PUBLIC_ENDPOINTS = [
  '/user/login/',
  '/user/register/',
  '/user/send-otp/',
  '/user/validate-otp/',
  '/user/check-exists/',
  '/user/forgot-password/',
  '/user/seller/password-reset/',
  '/health/',
  '/api/token/refresh/',  // ← must be public or it loops
];

const isPublicEndpoint = (url?: string) =>
  PUBLIC_ENDPOINTS.some(ep => url?.includes(ep));

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
    if (!isPublicEndpoint(config.url)) {
      const token =
        (await AsyncStorage.getItem('accessToken')) ??
        (await AsyncStorage.getItem('access_token'));

      if (token && token !== 'fallback_token') {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.data instanceof FormData) {
      delete (config.headers as any)['Content-Type'];
    }

    if (__DEV__ && config.data && !(config.data instanceof FormData)) {
      const body = JSON.stringify(config.data);
      if (body.includes('\\n') || /\n/.test(body)) {
        console.warn('⚠️ Request body has newlines — check input fields', config.url);
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

// ── Refresh queue ─────────────────────────────────────────────────────────────

let _isRefreshing = false;
let _refreshQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  _refreshQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  _refreshQueue = [];
};

// ── Response interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log(`← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },

  async (error) => {
    const status   = error.response?.status;
    const url      = error.config?.url ?? '';
    const original = error.config;

    if (__DEV__) {
      console.error(
        `← ${status ?? 'ERR'} ${error.config?.method?.toUpperCase()} ${url}`,
        error.response?.data ?? error.message,
      );
    }

    // ── Token refresh on 401 ──────────────────────────────────────────────
    if (status === 401 && !isPublicEndpoint(url) && !original._retry) {

      // Queue duplicate 401s while refresh is in progress
      if (_isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        }).catch(err => Promise.reject(err));
      }

      original._retry = true;
      _isRefreshing   = true;

      try {
        // Lazy import avoids circular dependency
        const AuthService = (await import('./AuthService')).default;
        const newToken    = await AuthService.refreshAccessToken();

        if (!newToken) throw new Error('No new token from refresh');

        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);

      } catch (refreshError) {
        processQueue(refreshError, null);

        // Only wipe tokens if refresh itself failed
        try {
          await AsyncStorage.multiRemove([
            'accessToken', 'access_token',
            'refresh_token', 'api_token', 'user_data',
          ]);
        } catch {}

        if (__DEV__) console.warn('🔐 Refresh failed — logging out');
        return Promise.reject(refreshError);

      } finally {
        _isRefreshing = false;
      }
    }

    if (!error.response && __DEV__) {
      console.error('🌐 Network error — server unreachable:', API_BASE_URL);
    }

    return Promise.reject(error);
  },
);

export default apiClient;