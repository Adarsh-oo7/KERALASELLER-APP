import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Keep your existing interface
export interface ApiEnvironment {
  baseURL: string;
  timeout: number;
  websocketURL?: string;
  debug?: boolean;
}

// ✅ Enhanced API configuration with your existing endpoints
export const API_CONFIG = {
  // Development (your local Django server)
  development: {
    baseURL: 'http://10.0.2.2:8000',
 // ✅ Updated to your Django server IP
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
current: 'production' as 'development' | 'production',
};

export const getApiConfig = (): ApiEnvironment => {
  return API_CONFIG[API_CONFIG.current];
};

// Helper function to get base URL
export const getBaseURL = (): string => {
  return getApiConfig().baseURL;
};

// ✅ Enhanced endpoints with your existing working ones + new features
export const ENDPOINTS = {
  // ✅ Your existing working Auth endpoints
  login: '/user/login/',              // POST - Seller login (Thor A D: 9898989898)
  register: '/user/register/',        // POST - Seller registration
  sendOTP: '/user/send-otp/',         // POST - Send OTP for registration
  dashboard: '/user/dashboard/',      // GET - Seller dashboard
  testAuth: '/user/test-auth/',       // GET - Test connection
  
  // ✅ Your existing working Store/Shop endpoints
  store: '/user/store/',              // Store management
  storeProfile: '/user/store/profile/', // Store profile - ✅ Your working endpoint
  
  // ✅ Your existing Profile endpoints
  profile: '/user/profile/',          // ✅ User profile endpoint (Thor A D)
  buyerProfile: '/api/buyer/profile/', // Buyer profile (separate)
  
  // ✅ Your existing Product endpoints
  products: '/api/products/',         // CRUD operations for products
  categories: '/api/categories/',     // Product categories
  
  // ✅ Your existing Orders endpoints
  orders: '/api/orders/',             // Seller orders
  userOrders: '/user/orders/',        // User orders endpoint
  
  // ✅ Enhanced endpoints for new features
  // Analytics & Reports
  analytics: '/user/analytics/',           // Business analytics for Thor A D
  salesReport: '/user/analytics/sales/',   // Sales reports
  revenueReport: '/user/analytics/revenue/', // Revenue data
  
  // Inventory & Stock Management
  stock: '/user/inventory/',               // Stock management
  stockAlerts: '/user/inventory/alerts/',  // Low stock alerts
  stockHistory: '/user/inventory/history/', // Stock movement history
  
  // Notifications
  notifications: '/api/notifications/',    // ✅ Your existing endpoint
  markNotificationRead: '/api/notifications/{id}/read/', // Mark as read
  notificationSettings: '/api/notifications/settings/', // Settings
  
  // Transaction History
  transactions: '/user/transactions/',     // All transactions
  transactionHistory: '/user/transactions/history/', // Historical data
  paymentHistory: '/user/payments/',       // Payment records
  
  // Local Billing (New feature for Thor A D)
  localBills: '/user/billing/',           // Local billing system
  generateBill: '/user/billing/generate/', // Generate bill for walk-in customers
  billHistory: '/user/billing/history/',   // Bill history
  
  // Subscriptions
  subscriptions: '/api/subscriptions/',    // ✅ Your existing endpoint
  subscriptionStatus: '/api/subscriptions/status/', // Current status
  upgradeSubscription: '/api/subscriptions/upgrade/', // Upgrade plan
  
  // Settings
  settings: '/user/settings/',             // Store settings
  updateSettings: '/user/settings/',       // Update settings
  
  // Media & File Upload
  uploadImage: '/user/media/upload/',      // Image upload for products
  deleteImage: '/user/media/delete/',      // Delete images
  
  // Wishlist
  wishlist: '/api/',                       // ✅ Your existing wishlist endpoint
} as const;

// ✅ Enhanced Token Management for Kerala Sellers
class TokenManager {
  private static ACCESS_TOKEN_KEY = '@kerala_sellers_access_token';
  private static REFRESH_TOKEN_KEY = '@kerala_sellers_refresh_token';
  private static USER_DATA_KEY = '@kerala_sellers_user_data';
  private static SELLER_DATA_KEY = '@kerala_sellers_seller_data';

  static async getAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY);
      if (__DEV__ && token) {
        console.log('🔑 TokenManager: Access token retrieved');
      }
      return token;
    } catch (error) {
      console.error('❌ TokenManager: Error getting access token:', error);
      return null;
    }
  }

  static async setAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      if (__DEV__) {
        console.log('🔑 TokenManager: Access token stored');
      }
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

  // ✅ Enhanced user data management for Thor A D
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
      if (__DEV__) {
        console.log('👤 TokenManager: User data stored for:', userData?.name || 'User');
      }
    } catch (error) {
      console.error('❌ TokenManager: Error setting user data:', error);
    }
  }

  // ✅ Enhanced seller data management for Thor A D's shop
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
      if (__DEV__) {
        console.log('🏪 TokenManager: Seller data stored for shop:', sellerData?.shop_name || 'Shop');
      }
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

// ✅ Enhanced API Client Class with your existing logic + new features
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
      console.log('📡 Base URL:', this.baseURL);
    }
  }

  // Helper method to build full URL
  private buildURL(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }

  // ✅ Enhanced headers with better token management
  private async getHeaders(includeAuth: boolean = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Client-App': 'Kerala-Sellers-Mobile',
      'X-Client-Version': '1.0.0',
    };

    if (includeAuth) {
      const token = await TokenManager.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        if (this.debug) {
          console.log('🔐 Authorization header added');
        }
      } else if (this.debug) {
        console.warn('⚠️ No access token available for authenticated request');
      }
    }

    return headers;
  }

  // ✅ Enhanced request handler with better error handling
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

      // Add body for methods that support it
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
        
        // ✅ Handle specific error cases
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

  // ✅ Your existing HTTP methods
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

  // ✅ Your existing smart update method
  async update(endpoint: string, data?: any, includeAuth: boolean = false): Promise<any> {
    try {
      if (this.debug) {
        console.log('🔄 Smart Update: Trying PATCH first...');
      }
      return await this.patch(endpoint, data, includeAuth);
    } catch (patchError: any) {
      if (this.debug) {
        console.log('⚠️ PATCH failed, trying PUT...', patchError.message);
      }
      
      if (patchError.message.includes('405') || patchError.message.includes('Method Not Allowed')) {
        // Method not allowed, try PUT
        return await this.put(endpoint, data, includeAuth);
      }
      
      // Re-throw if it's not a method-related error
      throw patchError;
    }
  }

  // ✅ Your existing health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health/', false);
      return true;
    } catch (error) {
      if (this.debug) {
        console.log('🏥 Health check failed - trying alternative endpoint');
      }
      
      // Try alternative health check
      try {
        await this.get('/user/dashboard/', true);
        return true;
      } catch (altError) {
        return false;
      }
    }
  }

  // ✅ Your existing test authentication
  async testAuth(): Promise<any> {
    try {
      return await this.get(ENDPOINTS.testAuth, true);
    } catch (error) {
      if (this.debug) {
        console.log('🔐 Auth test failed:', error);
      }
      throw error;
    }
  }

  // ✅ Enhanced file upload for product images
  async uploadFile(endpoint: string, file: any, additionalData?: Record<string, any>): Promise<any> {
    const url = this.buildURL(endpoint);
    const token = await TokenManager.getAccessToken();
    
    const formData = new FormData();
    
    // Add file
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || `upload_${Date.now()}.jpg`,
    } as any);

    // Add additional data
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

// Create singleton instance
export const apiClient = new ApiClient();

// ✅ Enhanced convenience methods for Thor A D's Kerala Sellers app
export const api = {
  // ✅ Authentication (Your existing working endpoints)
  login: (phone: string, password: string) => {
    console.log('🔐 API: Login attempt for phone:', phone);
    return apiClient.post(ENDPOINTS.login, { phone, password });
  },
  
  register: (userData: any) => {
    console.log('📝 API: Registration for:', userData.name);
    return apiClient.post(ENDPOINTS.register, userData);
  },
  
  sendOTP: (phone: string) => apiClient.post(ENDPOINTS.sendOTP, { phone }),
  
  // ✅ Dashboard (Your working endpoint)
  getDashboard: () => {
    console.log('🏠 API: Fetching dashboard for Thor A D');
    return apiClient.get(ENDPOINTS.dashboard, true);
  },
  
  // ✅ Store Profile (Your working endpoint)
  getStoreProfile: () => {
    console.log('🏪 API: Fetching store profile');
    return apiClient.get(ENDPOINTS.storeProfile, true);
  },
  
  updateStoreProfile: (data: any) => {
    console.log('🏪 API: Updating store profile');
    return apiClient.update(ENDPOINTS.storeProfile, data, true);
  },
  
  // ✅ User Profile (Your working endpoint)
  getProfile: () => apiClient.get(ENDPOINTS.profile, true),
  updateProfile: (data: any) => apiClient.update(ENDPOINTS.profile, data, true),
  
  // ✅ Orders (Your existing endpoints)
  getOrders: () => {
    console.log('📋 API: Fetching orders');
    return apiClient.get(ENDPOINTS.orders, true);
  },
  getOrder: (id: string) => apiClient.get(`${ENDPOINTS.orders}${id}/`, true),
  updateOrderStatus: (id: string, status: string) => 
    apiClient.patch(`${ENDPOINTS.orders}${id}/`, { status }, true),
  
  // ✅ Products (Your existing endpoints)
  getProducts: () => {
    console.log('📦 API: Fetching products');
    return apiClient.get(ENDPOINTS.products, true);
  },
  getProduct: (id: string) => apiClient.get(`${ENDPOINTS.products}${id}/`, true),
  createProduct: (data: any) => apiClient.post(ENDPOINTS.products, data, true),
  updateProduct: (id: string, data: any) => apiClient.update(`${ENDPOINTS.products}${id}/`, data, true),
  deleteProduct: (id: string) => apiClient.delete(`${ENDPOINTS.products}${id}/`, true),
  
  // ✅ Enhanced Analytics
  getAnalytics: () => apiClient.get(ENDPOINTS.analytics, true),
  getSalesReport: (params?: any) => apiClient.get(ENDPOINTS.salesReport, true),
  getRevenueReport: (params?: any) => apiClient.get(ENDPOINTS.revenueReport, true),
  
  // ✅ Enhanced Stock Management
  getStock: () => apiClient.get(ENDPOINTS.stock, true),
  getStockAlerts: () => apiClient.get(ENDPOINTS.stockAlerts, true),
  getStockHistory: () => apiClient.get(ENDPOINTS.stockHistory, true),
  updateStock: (productId: string, quantity: number) => 
    apiClient.patch(`${ENDPOINTS.stock}${productId}/`, { quantity }, true),
  
  // ✅ Enhanced Notifications
  getNotifications: () => {
    console.log('🔔 API: Fetching notifications');
    return apiClient.get(ENDPOINTS.notifications, true);
  },
  markNotificationRead: (id: string) => 
    apiClient.patch(ENDPOINTS.markNotificationRead.replace('{id}', id), {}, true),
  
  // ✅ Enhanced Transaction History
  getTransactionHistory: () => {
    console.log('📜 API: Fetching transaction history');
    return apiClient.get(ENDPOINTS.transactionHistory, true);
  },
  getTransactions: (params?: any) => apiClient.get(ENDPOINTS.transactions, true),
  getPaymentHistory: () => apiClient.get(ENDPOINTS.paymentHistory, true),
  
  // ✅ Enhanced Local Billing
  getLocalBills: () => apiClient.get(ENDPOINTS.localBills, true),
  generateBill: (billData: any) => {
    console.log('🧾 API: Generating local bill');
    return apiClient.post(ENDPOINTS.generateBill, billData, true);
  },
  getBillHistory: () => apiClient.get(ENDPOINTS.billHistory, true),
  
  // ✅ Enhanced Subscriptions
  getSubscriptions: () => apiClient.get(ENDPOINTS.subscriptions, true),
  getSubscriptionData: () => apiClient.get(ENDPOINTS.subscriptionStatus, true),
  upgradeSubscription: (planData: any) => apiClient.post(ENDPOINTS.upgradeSubscription, planData, true),
  
  // ✅ Enhanced Settings
  getSettings: () => apiClient.get(ENDPOINTS.settings, true),
  updateSettings: (data: any) => apiClient.update(ENDPOINTS.updateSettings, data, true),
  
  // ✅ Enhanced File Upload
  uploadProductImage: (file: any, productData?: any) => 
    apiClient.uploadFile(ENDPOINTS.uploadImage, file, productData),
  
  // ✅ Test methods (Your existing)
  testConnection: () => apiClient.healthCheck(),
  testAuth: () => apiClient.testAuth(),
  
  // ✅ Enhanced Token Management
  TokenManager,
};

// ✅ Your existing environment switching helpers
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

// ✅ Your existing environment info
export const getCurrentEnvironment = () => {
  return {
    current: API_CONFIG.current,
    baseURL: getBaseURL(),
    timeout: getApiConfig().timeout,
    debug: getApiConfig().debug,
  };
};

// ✅ Enhanced debug info for Thor A D's app
if (__DEV__) {
  console.log('🔧 API Configuration Loaded:');
  console.log('Environment:', API_CONFIG.current);
  console.log('Base URL:', getBaseURL());
  console.log('Timeout:', getApiConfig().timeout);
  console.log('Debug Mode:', getApiConfig().debug);
  console.log('🏪 Ready for Kerala Sellers - Thor A D\'s Gost namez shop');
}

// ✅ Default export for convenience
export default api;
