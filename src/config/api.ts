// config/api.ts - ✅ FIXED VERSION WITH PROPER TOKEN HANDLING

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface ApiEnvironment {
  baseURL: string;
  timeout: number;
  websocketURL?: string;
  debug?: boolean;
}

const getProductionBaseURL = (): string => {
  const configUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (configUrl) return configUrl;
  return 'https://keralaseller-backend.onrender.com';
};

const getDevelopmentBaseURL = (): string => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  if (Platform.OS === 'ios') return 'http://192.168.1.4:8000';
  return 'http://localhost:8000';
};

const getProductionWebSocketURL = (): string => {
  return getProductionBaseURL().replace('https://', 'wss://') + '/ws/';
};

const getDevelopmentWebSocketURL = (): string => {
  return getDevelopmentBaseURL().replace('http://', 'ws://') + '/ws/';
};

const detectEnvironment = (): 'development' | 'production' => {
  if (__DEV__) {
    console.log('🔧 Detected: Development mode');
    return 'development';
  }
  console.log('🚀 Detected: Production mode');
  return 'production';
};

export const API_CONFIG = {
  development: {
    baseURL: getDevelopmentBaseURL(),
    timeout: 15000,
    websocketURL: getDevelopmentWebSocketURL(),
    debug: true,
  } as ApiEnvironment,
  production: {
    baseURL: getProductionBaseURL(),
    timeout: 20000,
    websocketURL: getProductionWebSocketURL(),
    debug: false,
  } as ApiEnvironment,
  current: detectEnvironment(),
};

export const getApiConfig = (): ApiEnvironment => API_CONFIG[API_CONFIG.current];
export const getBaseURL = (): string => getApiConfig().baseURL;

export const getLocalIP = (): string => {
  if (Platform.OS === 'android') return '10.0.2.2';
  if (Platform.OS === 'ios') return '192.168.1.4';
  return 'localhost';
};

export const ENDPOINTS = {
  login: '/user/login/',
  register: '/user/register/',
  sendOTP: '/user/send-otp/',
  dashboard: '/user/dashboard/',
  testAuth: '/user/test-auth/',
  store: '/user/store/',
  storeProfile: '/user/store/profile/',
  profile: '/user/profile/',
  buyerProfile: '/api/buyer/profile/',
  products: '/api/products/',
  categories: '/api/categories/',
  orders: '/api/orders/',
  userOrders: '/user/orders/',
  analytics: '/user/analytics/',
  salesReport: '/user/analytics/sales/',
  revenueReport: '/user/analytics/revenue/',
  stock: '/user/inventory/',
  stockAlerts: '/user/inventory/alerts/',
  stockHistory: '/user/inventory/history/',
  notifications: '/api/notifications/',
  markNotificationRead: '/api/notifications/{id}/read/',
  notificationSettings: '/api/notifications/settings/',
  transactions: '/user/transactions/',
  transactionHistory: '/user/transactions/history/',
  paymentHistory: '/user/payments/',
  localBills: '/user/billing/',
  generateBill: '/user/billing/generate/',
  billHistory: '/user/billing/history/',
  subscriptions: '/api/subscriptions/',
  subscriptionStatus: '/api/subscriptions/status/',
  upgradeSubscription: '/api/subscriptions/upgrade/',
  settings: '/user/settings/',
  updateSettings: '/user/settings/',
  uploadImage: '/user/media/upload/',
  deleteImage: '/user/media/delete/',
  wishlist: '/api/',
} as const;

class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  remove(key: string): void {
    this.cache.delete(key);
  }
}

class RequestQueueManager {
  private queue = new Map<string, Promise<any>>();

  async executeOrQueue(key: string, execute: () => Promise<any>): Promise<any> {
    if (this.queue.has(key)) {
      return this.queue.get(key)!;
    }

    const promise = execute().finally(() => {
      this.queue.delete(key);
    });

    this.queue.set(key, promise);
    return promise;
  }

  clear(): void {
    this.queue.clear();
  }
}

class TokenManager {
  private static ACCESS_TOKEN_KEY = '@kerala_sellers_access_token';
  private static REFRESH_TOKEN_KEY = '@kerala_sellers_refresh_token';
  private static USER_DATA_KEY = '@kerala_sellers_user_data';
  private static SELLER_DATA_KEY = '@kerala_sellers_seller_data';

  // ✅ Cache token in memory for faster access
  private static accessTokenCache: string | null = null;
  private static refreshTokenCache: string | null = null;

  static async getAccessToken(): Promise<string | null> {
    try {
      // ✅ Check memory cache first
      if (this.accessTokenCache) {
        if (__DEV__) console.log('🔑 TokenManager: Access token from memory cache');
        return this.accessTokenCache;
      }

      // Get from AsyncStorage
      const token = await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY);
      
      // ✅ Cache in memory
      if (token) {
        this.accessTokenCache = token;
        if (__DEV__) console.log('🔑 TokenManager: Access token retrieved and cached');
      }
      
      return token;
    } catch (error) {
      console.error('❌ TokenManager: Error getting access token:', error);
      return null;
    }
  }

  static async setAccessToken(token: string): Promise<void> {
    try {
      // ✅ Set both memory and storage
      this.accessTokenCache = token;
      await AsyncStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      if (__DEV__) console.log('🔑 TokenManager: Access token stored');
    } catch (error) {
      console.error('❌ TokenManager: Error setting access token:', error);
    }
  }

  static async getRefreshToken(): Promise<string | null> {
    try {
      // ✅ Check memory cache first
      if (this.refreshTokenCache) {
        return this.refreshTokenCache;
      }

      const token = await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
      
      // ✅ Cache in memory
      if (token) {
        this.refreshTokenCache = token;
      }
      
      return token;
    } catch (error) {
      console.error('❌ TokenManager: Error getting refresh token:', error);
      return null;
    }
  }

  static async setRefreshToken(token: string): Promise<void> {
    try {
      // ✅ Set both memory and storage
      this.refreshTokenCache = token;
      await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('❌ TokenManager: Error setting refresh token:', error);
    }
  }

  static async getUserData(): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ TokenManager: Error getting user data:', error);
      return null;
    }
  }

  static async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
      if (__DEV__) console.log('👤 TokenManager: User data stored for:', userData?.name || 'User');
    } catch (error) {
      console.error('❌ TokenManager: Error setting user data:', error);
    }
  }

  static async getSellerData(): Promise<any> {
    try {
      const sellerData = await AsyncStorage.getItem(this.SELLER_DATA_KEY);
      return sellerData ? JSON.parse(sellerData) : null;
    } catch (error) {
      console.error('❌ TokenManager: Error getting seller data:', error);
      return null;
    }
  }

  static async setSellerData(sellerData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SELLER_DATA_KEY, JSON.stringify(sellerData));
      if (__DEV__) console.log('🏪 TokenManager: Seller data stored for shop:', sellerData?.shop_name || 'Shop');
    } catch (error) {
      console.error('❌ TokenManager: Error setting seller data:', error);
    }
  }

  static async clearAll(): Promise<void> {
    try {
      // ✅ Clear both memory and storage
      this.accessTokenCache = null;
      this.refreshTokenCache = null;
      
      await AsyncStorage.multiRemove([
        this.ACCESS_TOKEN_KEY,
        this.REFRESH_TOKEN_KEY,
        this.USER_DATA_KEY,
        this.SELLER_DATA_KEY,
      ]);
      console.log('✅ TokenManager: All tokens and data cleared');
    } catch (error) {
      console.error('❌ TokenManager: Error clearing tokens:', error);
    }
  }
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private debug: boolean;
  private cacheManager = new CacheManager();
  private requestQueueManager = new RequestQueueManager();

  constructor() {
    const config = getApiConfig();
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.debug = config.debug || false;

    if (this.debug) {
      console.log('🌐 ApiClient initialized for Kerala Sellers');
      console.log('📱 Platform:', Platform.OS);
      console.log('📡 Base URL:', this.baseURL);
    }
  }

  private buildURL(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }

  // ✅ FIXED: Properly get and set headers with token
  private async getHeaders(includeAuth: boolean = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Client-App': 'Kerala-Sellers-Mobile',
      'X-Client-Version': '1.0.0',
      'X-Platform': Platform.OS,
    };

    if (includeAuth) {
      const token = await TokenManager.getAccessToken();
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        if (this.debug) {
          console.log('✅ Token added to headers:', `Bearer ${token.substring(0, 20)}...`);
        }
      } else {
        console.warn('⚠️ NO TOKEN AVAILABLE - Request will be UNAUTHORIZED');
        if (this.debug) {
          console.warn('🔍 Auth status:', {
            hasToken: !!token,
            tokenLength: token?.length || 0,
          });
        }
      }
    }

    return headers;
  }

  // ✅ FIXED: Retry logic with better error handling
  private async makeRequestWithRetry(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
    includeAuth: boolean = false,
    retries: number = 2
  ): Promise<any> {
    try {
      return await this.makeRequest(method, endpoint, data, includeAuth);
    } catch (error: any) {
      // ✅ Don't retry 401 errors - they're auth failures
      if (error.message?.includes('401')) {
        console.error('🔐 Authentication failed - not retrying');
        throw error;
      }

      const isRetryable =
        error.message.includes('timeout') ||
        error.message.includes('503') ||
        error.message.includes('502') ||
        error.message.includes('504');

      if (retries > 0 && isRetryable) {
        const delay = (3 - retries) * 1000;
        console.warn(`⏳ Retry attempt ${3 - retries}/${2} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(method, endpoint, data, includeAuth, retries - 1);
      }
      throw error;
    }
  }

  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
    includeAuth: boolean = false
  ): Promise<any> {
    const url = this.buildURL(endpoint);
    const headers = await this.getHeaders(includeAuth);

    if (this.debug) {
      console.log(`🔍 API ${method}:`, url);
      console.log('📋 Headers:', {
        'Authorization': headers['Authorization'] ? `Bearer ${headers['Authorization'].substring(0, 20)}...` : 'NOT SET',
        'Content-Type': headers['Content-Type'],
      });
      if (data && method !== 'GET') {
        console.log('📦 Request Data:', JSON.stringify(data, null, 2));
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const requestOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      if (this.debug) {
        console.log('📡 Response Status:', response.status, response.statusText);
      }

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (!response.ok) {
        const errorMessage = responseData?.error ||
          responseData?.detail ||
          responseData?.message ||
          responseData ||
          'Request failed';

        if (this.debug) {
          console.error(`❌ API ${method} Error [${response.status}]:`, errorMessage);
        }

        // ✅ FIXED: Handle 401 properly
        if (response.status === 401) {
          console.warn('🔐 Unauthorized - clearing tokens and logging out');
          await TokenManager.clearAll();
          this.cacheManager.clear();
          
          // Optionally trigger logout event here
          // This would be better handled in your auth context
        }

        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }

      if (this.debug) {
        console.log('✅ API Response Success:', method, endpoint);
        if (responseData && typeof responseData === 'object') {
          console.log('📨 Response keys:', Object.keys(responseData));
        }
      }

      return responseData;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`⏰ API ${method} Timeout:`, url);
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }

      if (this.debug) {
        console.error(`❌ API ${method} Error:`, error.message);
      }
      throw error;
    }
  }

  async get(
    endpoint: string,
    includeAuth: boolean = true, // ✅ DEFAULT TO TRUE
    options?: { useCache?: boolean; deduplicateKey?: string }
  ): Promise<any> {
    const useCache = options?.useCache !== false;
    const deduplicateKey = options?.deduplicateKey || endpoint;

    if (useCache) {
      const cached = this.cacheManager.get(endpoint);
      if (cached) {
        if (this.debug) console.log('💾 Cache hit:', endpoint);
        return cached;
      }
    }

    const response = await this.requestQueueManager.executeOrQueue(
      deduplicateKey,
      async () => {
        const data = await this.makeRequestWithRetry('GET', endpoint, undefined, includeAuth);
        if (useCache) {
          this.cacheManager.set(endpoint, data);
        }
        return data;
      }
    );

    return response;
  }

  async post(endpoint: string, data?: any, includeAuth: boolean = true): Promise<any> { // ✅ DEFAULT TO TRUE
    this.cacheManager.remove(endpoint);
    return this.makeRequestWithRetry('POST', endpoint, data, includeAuth);
  }

  async put(endpoint: string, data?: any, includeAuth: boolean = true): Promise<any> { // ✅ DEFAULT TO TRUE
    this.cacheManager.remove(endpoint);
    return this.makeRequestWithRetry('PUT', endpoint, data, includeAuth);
  }

  async patch(endpoint: string, data?: any, includeAuth: boolean = true): Promise<any> { // ✅ DEFAULT TO TRUE
    this.cacheManager.remove(endpoint);
    return this.makeRequestWithRetry('PATCH', endpoint, data, includeAuth);
  }

  async delete(endpoint: string, includeAuth: boolean = true): Promise<any> { // ✅ DEFAULT TO TRUE
    this.cacheManager.remove(endpoint);
    return this.makeRequestWithRetry('DELETE', endpoint, undefined, includeAuth);
  }

  async update(endpoint: string, data?: any, includeAuth: boolean = true): Promise<any> { // ✅ DEFAULT TO TRUE
    try {
      if (this.debug) console.log('🔄 Smart Update: Trying PATCH first...');
      return await this.patch(endpoint, data, includeAuth);
    } catch (patchError: any) {
      if (this.debug) console.log('⚠️ PATCH failed, trying PUT...', patchError.message);
      if (patchError.message.includes('405') || patchError.message.includes('Method Not Allowed')) {
        return await this.put(endpoint, data, includeAuth);
      }
      throw patchError;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health/', false, { useCache: false });
      return true;
    } catch (error) {
      if (this.debug) console.log('🏥 Health check failed - trying alternative endpoint');
      try {
        await this.get('/user/dashboard/', true, { useCache: false });
        return true;
      } catch (altError) {
        return false;
      }
    }
  }

  async testAuth(): Promise<any> {
    try {
      return await this.get(ENDPOINTS.testAuth, true, { useCache: false });
    } catch (error) {
      if (this.debug) console.log('🔐 Auth test failed:', error);
      throw error;
    }
  }

  async uploadFile(endpoint: string, file: any, additionalData?: Record<string, any>): Promise<any> {
    const url = this.buildURL(endpoint);
    const token = await TokenManager.getAccessToken();

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || `upload_${Date.now()}.jpg`,
    } as any);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'multipart/form-data',
    };

    // ✅ IMPORTANT: Always add token for file uploads
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      if (this.debug) console.log('✅ Token added to file upload');
    } else {
      console.warn('⚠️ NO TOKEN FOR FILE UPLOAD');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'File upload failed');
      }

      if (this.debug) {
        console.log('✅ File upload successful');
      }

      return responseData;
    } catch (error) {
      if (this.debug) {
        console.error('❌ File upload failed:', error);
      }
      throw error;
    }
  }

  clearCache(): void {
    this.cacheManager.clear();
    console.log('💾 Cache cleared');
  }

  clearAll(): void {
    this.cacheManager.clear();
    this.requestQueueManager.clear();
    console.log('🧹 All cache and queues cleared');
  }
}

export const apiClient = new ApiClient();

// ✅ FIXED: All methods now default to includeAuth = true
export const api = {
  login: (phone: string, password: string) => {
    console.log('🔐 API: Login attempt for phone:', phone);
    return apiClient.post(ENDPOINTS.login, { phone, password }, false); // ✅ False for login
  },
  register: (userData: any) => {
    console.log('📝 API: Registration for:', userData.name);
    return apiClient.post(ENDPOINTS.register, userData, false); // ✅ False for register
  },
  sendOTP: (phone: string) => apiClient.post(ENDPOINTS.sendOTP, { phone }, false), // ✅ False for OTP
  getDashboard: () => {
    console.log('🏠 API: Fetching dashboard');
    return apiClient.get(ENDPOINTS.dashboard); // ✅ Default to true
  },
  getStoreProfile: () => {
    console.log('🏪 API: Fetching store profile');
    return apiClient.get(ENDPOINTS.storeProfile); // ✅ Default to true
  },
  updateStoreProfile: (data: any) => {
    console.log('🏪 API: Updating store profile');
    return apiClient.update(ENDPOINTS.storeProfile, data); // ✅ Default to true
  },
  getProfile: () => apiClient.get(ENDPOINTS.profile),
  updateProfile: (data: any) => apiClient.update(ENDPOINTS.profile, data),
  getOrders: () => {
    console.log('📋 API: Fetching orders');
    return apiClient.get(ENDPOINTS.orders); // ✅ Default to true
  },
  getOrder: (id: string) => apiClient.get(`${ENDPOINTS.orders}${id}/`),
  updateOrderStatus: (id: string, status: string) =>
    apiClient.patch(`${ENDPOINTS.orders}${id}/`, { status }),
  getProducts: () => {
    console.log('📦 API: Fetching products');
    return apiClient.get(ENDPOINTS.products); // ✅ Default to true
  },
  getProduct: (id: string) => apiClient.get(`${ENDPOINTS.products}${id}/`),
  createProduct: (data: any) => apiClient.post(ENDPOINTS.products, data),
  updateProduct: (id: string, data: any) => apiClient.update(`${ENDPOINTS.products}${id}/`, data),
  deleteProduct: (id: string) => apiClient.delete(`${ENDPOINTS.products}${id}/`),
  getAnalytics: () => apiClient.get(ENDPOINTS.analytics),
  getSalesReport: (params?: any) => apiClient.get(ENDPOINTS.salesReport),
  getRevenueReport: (params?: any) => apiClient.get(ENDPOINTS.revenueReport),
  getStock: () => apiClient.get(ENDPOINTS.stock),
  getStockAlerts: () => apiClient.get(ENDPOINTS.stockAlerts),
  getStockHistory: () => apiClient.get(ENDPOINTS.stockHistory),
  updateStock: (productId: string, quantity: number) =>
    apiClient.patch(`${ENDPOINTS.stock}${productId}/`, { quantity }),
  getNotifications: () => {
    console.log('🔔 API: Fetching notifications');
    return apiClient.get(ENDPOINTS.notifications);
  },
  markNotificationRead: (id: string) =>
    apiClient.patch(ENDPOINTS.markNotificationRead.replace('{id}', id), {}),
  getTransactionHistory: () => {
    console.log('📜 API: Fetching transaction history');
    return apiClient.get(ENDPOINTS.transactionHistory);
  },
  getTransactions: (params?: any) => apiClient.get(ENDPOINTS.transactions),
  getPaymentHistory: () => apiClient.get(ENDPOINTS.paymentHistory),
  getLocalBills: () => apiClient.get(ENDPOINTS.localBills),
  generateBill: (billData: any) => {
    console.log('🧾 API: Generating local bill');
    return apiClient.post(ENDPOINTS.generateBill, billData);
  },
  getBillHistory: () => apiClient.get(ENDPOINTS.billHistory),
  getSubscriptions: () => apiClient.get(ENDPOINTS.subscriptions),
  getSubscriptionData: () => apiClient.get(ENDPOINTS.subscriptionStatus),
  upgradeSubscription: (planData: any) => apiClient.post(ENDPOINTS.upgradeSubscription, planData),
  getSettings: () => apiClient.get(ENDPOINTS.settings),
  updateSettings: (data: any) => apiClient.update(ENDPOINTS.updateSettings, data),
  uploadProductImage: (file: any, productData?: any) =>
    apiClient.uploadFile(ENDPOINTS.uploadImage, file, productData),
  testConnection: () => apiClient.healthCheck(),
  testAuth: () => apiClient.testAuth(),
  TokenManager,
  clearCache: () => apiClient.clearCache(),
  clearAll: () => apiClient.clearAll(),
};

export const switchToProduction = () => {
  API_CONFIG.current = 'production';
  console.log('🌍 Switched to Production environment');
  console.log('🔗 Base URL:', getBaseURL());
};

export const switchToDevelopment = () => {
  API_CONFIG.current = 'development';
  console.log('🌍 Switched to Development environment');
  console.log('🔗 Base URL:', getBaseURL());
};

export const getCurrentEnvironment = () => {
  return {
    current: API_CONFIG.current,
    platform: Platform.OS,
    baseURL: getBaseURL(),
    timeout: getApiConfig().timeout,
    debug: getApiConfig().debug,
  };
};

if (__DEV__) {
  console.log('🔧 API Configuration Loaded:');
  console.log('Environment:', API_CONFIG.current);
  console.log('Platform:', Platform.OS);
  console.log('Base URL:', getBaseURL());
  console.log('Timeout:', getApiConfig().timeout);
  console.log('Debug Mode:', getApiConfig().debug);
  console.log('✅ Features:');
  console.log('  - ✅ Token included in ALL authenticated requests');
  console.log('  - ✅ Retry logic (2 attempts, not on 401)');
  console.log('  - ✅ Request deduplication');
  console.log('  - ✅ Response caching (5 min)');
  console.log('  - ✅ Memory token cache');
  console.log('  - ✅ Auto environment detection');
  console.log('🏪 Ready for Kerala Sellers');
}

export default api;
