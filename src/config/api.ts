// config/api.ts - ✅ AUTO-SWITCHING VERSION
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface ApiEnvironment {
  baseURL: string;
  timeout: number;
  websocketURL?: string;
  debug?: boolean;
}

// Get production URL from app.json
const getProductionBaseURL = (): string => {
  const configUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (configUrl) return configUrl;
  return 'https://keralaseller-backend.onrender.com';
};

// Get development URL based on platform
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

// ✅ CRITICAL FIX: Auto-detect environment
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
  // ✅ FIXED: Auto-detect instead of hardcoded
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

class TokenManager {
  private static ACCESS_TOKEN_KEY = '@kerala_sellers_access_token';
  private static REFRESH_TOKEN_KEY = '@kerala_sellers_refresh_token';
  private static USER_DATA_KEY = '@kerala_sellers_user_data';
  private static SELLER_DATA_KEY = '@kerala_sellers_seller_data';

  static async getAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY);
      if (__DEV__ && token) console.log('🔑 TokenManager: Access token retrieved');
      return token;
    } catch (error) {
      console.error('❌ TokenManager: Error getting access token:', error);
      return null;
    }
  }

  static async setAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      if (__DEV__) console.log('🔑 TokenManager: Access token stored');
    } catch (error) {
      console.error('❌ TokenManager: Error setting access token:', error);
    }
  }

  static async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('❌ TokenManager: Error getting refresh token:', error);
      return null;
    }
  }

  static async setRefreshToken(token: string): Promise<void> {
    try {
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
        if (this.debug) console.log('🔐 Authorization header added');
      } else if (this.debug) {
        console.warn('⚠️ No access token available for authenticated request');
      }
    }

    return headers;
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
        
        if (response.status === 401) {
          console.warn('🔐 Unauthorized - clearing tokens');
          await TokenManager.clearAll();
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

  async get(endpoint: string, includeAuth: boolean = false): Promise<any> {
    return this.makeRequest('GET', endpoint, undefined, includeAuth);
  }

  async post(endpoint: string, data?: any, includeAuth: boolean = false): Promise<any> {
    return this.makeRequest('POST', endpoint, data, includeAuth);
  }

  async put(endpoint: string, data?: any, includeAuth: boolean = false): Promise<any> {
    return this.makeRequest('PUT', endpoint, data, includeAuth);
  }

  async patch(endpoint: string, data?: any, includeAuth: boolean = false): Promise<any> {
    return this.makeRequest('PATCH', endpoint, data, includeAuth);
  }

  async delete(endpoint: string, includeAuth: boolean = false): Promise<any> {
    return this.makeRequest('DELETE', endpoint, undefined, includeAuth);
  }

  async update(endpoint: string, data?: any, includeAuth: boolean = false): Promise<any> {
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
      await this.get('/health/', false);
      return true;
    } catch (error) {
      if (this.debug) console.log('🏥 Health check failed - trying alternative endpoint');
      try {
        await this.get('/user/dashboard/', true);
        return true;
      } catch (altError) {
        return false;
      }
    }
  }

  async testAuth(): Promise<any> {
    try {
      return await this.get(ENDPOINTS.testAuth, true);
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

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
      });

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
}

export const apiClient = new ApiClient();

export const api = {
  login: (phone: string, password: string) => {
    console.log('🔐 API: Login attempt for phone:', phone);
    return apiClient.post(ENDPOINTS.login, { phone, password });
  },
  register: (userData: any) => {
    console.log('📝 API: Registration for:', userData.name);
    return apiClient.post(ENDPOINTS.register, userData);
  },
  sendOTP: (phone: string) => apiClient.post(ENDPOINTS.sendOTP, { phone }),
  getDashboard: () => {
    console.log('🏠 API: Fetching dashboard');
    return apiClient.get(ENDPOINTS.dashboard, true);
  },
  getStoreProfile: () => {
    console.log('🏪 API: Fetching store profile');
    return apiClient.get(ENDPOINTS.storeProfile, true);
  },
  updateStoreProfile: (data: any) => {
    console.log('🏪 API: Updating store profile');
    return apiClient.update(ENDPOINTS.storeProfile, data, true);
  },
  getProfile: () => apiClient.get(ENDPOINTS.profile, true),
  updateProfile: (data: any) => apiClient.update(ENDPOINTS.profile, data, true),
  getOrders: () => {
    console.log('📋 API: Fetching orders');
    return apiClient.get(ENDPOINTS.orders, true);
  },
  getOrder: (id: string) => apiClient.get(`${ENDPOINTS.orders}${id}/`, true),
  updateOrderStatus: (id: string, status: string) => 
    apiClient.patch(`${ENDPOINTS.orders}${id}/`, { status }, true),
  getProducts: () => {
    console.log('📦 API: Fetching products');
    return apiClient.get(ENDPOINTS.products, true);
  },
  getProduct: (id: string) => apiClient.get(`${ENDPOINTS.products}${id}/`, true),
  createProduct: (data: any) => apiClient.post(ENDPOINTS.products, data, true),
  updateProduct: (id: string, data: any) => apiClient.update(`${ENDPOINTS.products}${id}/`, data, true),
  deleteProduct: (id: string) => apiClient.delete(`${ENDPOINTS.products}${id}/`, true),
  getAnalytics: () => apiClient.get(ENDPOINTS.analytics, true),
  getSalesReport: (params?: any) => apiClient.get(ENDPOINTS.salesReport, true),
  getRevenueReport: (params?: any) => apiClient.get(ENDPOINTS.revenueReport, true),
  getStock: () => apiClient.get(ENDPOINTS.stock, true),
  getStockAlerts: () => apiClient.get(ENDPOINTS.stockAlerts, true),
  getStockHistory: () => apiClient.get(ENDPOINTS.stockHistory, true),
  updateStock: (productId: string, quantity: number) => 
    apiClient.patch(`${ENDPOINTS.stock}${productId}/`, { quantity }, true),
  getNotifications: () => {
    console.log('🔔 API: Fetching notifications');
    return apiClient.get(ENDPOINTS.notifications, true);
  },
  markNotificationRead: (id: string) => 
    apiClient.patch(ENDPOINTS.markNotificationRead.replace('{id}', id), {}, true),
  getTransactionHistory: () => {
    console.log('📜 API: Fetching transaction history');
    return apiClient.get(ENDPOINTS.transactionHistory, true);
  },
  getTransactions: (params?: any) => apiClient.get(ENDPOINTS.transactions, true),
  getPaymentHistory: () => apiClient.get(ENDPOINTS.paymentHistory, true),
  getLocalBills: () => apiClient.get(ENDPOINTS.localBills, true),
  generateBill: (billData: any) => {
    console.log('🧾 API: Generating local bill');
    return apiClient.post(ENDPOINTS.generateBill, billData, true);
  },
  getBillHistory: () => apiClient.get(ENDPOINTS.billHistory, true),
  getSubscriptions: () => apiClient.get(ENDPOINTS.subscriptions, true),
  getSubscriptionData: () => apiClient.get(ENDPOINTS.subscriptionStatus, true),
  upgradeSubscription: (planData: any) => apiClient.post(ENDPOINTS.upgradeSubscription, planData, true),
  getSettings: () => apiClient.get(ENDPOINTS.settings, true),
  updateSettings: (data: any) => apiClient.update(ENDPOINTS.updateSettings, data, true),
  uploadProductImage: (file: any, productData?: any) => 
    apiClient.uploadFile(ENDPOINTS.uploadImage, file, productData),
  testConnection: () => apiClient.healthCheck(),
  testAuth: () => apiClient.testAuth(),
  TokenManager,
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
  console.log('🏪 Ready for Kerala Sellers');
}

export default api;
