// src/config/api.ts

export interface ApiEnvironment {
  baseURL: string;
  timeout: number;
  websocketURL?: string;
  debug?: boolean;
}

export const API_CONFIG = {
  // Development (your local Django server)
  development: {
    baseURL: 'http://10.0.2.2:8000', // ✅ Updated for Android emulator
    timeout: 15000,
    websocketURL: 'ws://10.0.2.2:8000/ws/',
    debug: true,
  } as ApiEnvironment,
  
  // Production (your deployed backend)
  production: {
    baseURL: 'https://keralaseller-backend.onrender.com',
    timeout: 20000,
    websocketURL: 'wss://keralaseller-backend.onrender.com/ws/',
    debug: false,
  } as ApiEnvironment,
  
  // Switch this when going live
  current: 'development' as 'development' | 'production',
};

export const getApiConfig = (): ApiEnvironment => {
  return API_CONFIG[API_CONFIG.current];
};

// Helper function to get base URL
export const getBaseURL = (): string => {
  return getApiConfig().baseURL;
};

// Your actual backend endpoints
export const ENDPOINTS = {
  // ✅ Updated to match your Django URLs
  // Auth endpoints
  login: '/user/login/',              // POST - Seller login
  register: '/user/register/',        // POST - Seller registration
  sendOTP: '/user/send-otp/',         // POST - Send OTP for registration
  dashboard: '/user/dashboard/',      // GET - Seller dashboard
  testAuth: '/user/test-auth/',       // GET - Test connection
  
  // Store/Shop endpoints
  store: '/api/store/',               // Store management
  storeProfile: '/api/store/profile/', // Store profile
  
  // Product endpoints (for sellers)
  products: '/api/products/',         // CRUD operations for products
  categories: '/api/categories/',     // Product categories
  
  // Orders endpoints
  orders: '/api/orders/',             // Seller orders
  userOrders: '/user/orders/',        // User orders endpoint
  
  // Additional seller endpoints
  profile: '/api/buyer/profile/',     // User profile (though you're seller-focused)
  subscriptions: '/api/subscriptions/', // Subscriptions
  notifications: '/api/notifications/', // Notifications
  wishlist: '/api/',                  // Wishlist endpoints
} as const;

// API Client Class with better error handling [web:340]
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private debug: boolean;

  constructor() {
    const config = getApiConfig();
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.debug = config.debug || false;
  }

  // Helper method to build full URL
  private buildURL(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }

  // Helper method to get headers
  private async getHeaders(includeAuth: boolean = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      try {
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
    }

    return headers;
  }

  // GET request
  async get(endpoint: string, includeAuth: boolean = false): Promise<any> {
    const url = this.buildURL(endpoint);
    const headers = await this.getHeaders(includeAuth);

    if (this.debug) {
      console.log('🔍 API GET:', url);
      console.log('📤 Headers:', headers);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (this.debug) {
        console.log('📡 Response Status:', response.status);
      }

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || data.detail || 'Request failed'}`);
      }

      return data;
    } catch (error: any) {
      if (this.debug) {
        console.error('❌ API GET Error:', error);
      }
      throw error;
    }
  }

  // POST request
  async post(endpoint: string, data?: any, includeAuth: boolean = false): Promise<any> {
    const url = this.buildURL(endpoint);
    const headers = await this.getHeaders(includeAuth);

    if (this.debug) {
      console.log('🔍 API POST:', url);
      console.log('📤 Headers:', headers);
      console.log('📦 Data:', data);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (this.debug) {
        console.log('📡 Response Status:', response.status);
      }

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseData.error || responseData.detail || 'Request failed'}`);
      }

      return responseData;
    } catch (error: any) {
      if (this.debug) {
        console.error('❌ API POST Error:', error);
      }
      throw error;
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Environment switching helpers
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

// Debug info
if (__DEV__) {
  console.log('🔧 API Configuration Loaded:');
  console.log('Environment:', API_CONFIG.current);
  console.log('Base URL:', getBaseURL());
  console.log('Timeout:', getApiConfig().timeout);
}
