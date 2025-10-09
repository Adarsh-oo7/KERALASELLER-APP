import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ENDPOINTS } from '../config/api';

class ApiService {
  
  // Dashboard API - Get Thor A D's real data
  async getDashboardData() {
    try {
      console.log('📊 ApiService: Fetching dashboard data...');
      const data = await apiClient.get(ENDPOINTS.dashboard, true);
      console.log('✅ ApiService: Dashboard data received:', data);
      return data;
    } catch (error) {
      console.error('❌ ApiService: Dashboard error:', error);
      throw error;
    }
  }

  // Store Profile API - Get Gost namez shop data
  async getStoreProfile() {
    try {
      console.log('🏪 ApiService: Fetching store profile...');
      const data = await apiClient.get(ENDPOINTS.storeProfile, true);
      console.log('✅ ApiService: Store profile received:', data);
      return data;
    } catch (error) {
      console.error('❌ ApiService: Store profile error:', error);
      throw error;
    }
  }

  // Products API - Get Thor A D's products
  async getProducts() {
    try {
      console.log('📦 ApiService: Fetching products...');
      const data = await apiClient.get(ENDPOINTS.products, true);
      console.log('✅ ApiService: Products received:', data);
      return data;
    } catch (error) {
      console.error('❌ ApiService: Products error:', error);
      throw error;
    }
  }

  async getProductDetail(productId: string) {
    try {
      console.log(`📦 ApiService: Fetching product ${productId}...`);
      const data = await apiClient.get(`${ENDPOINTS.products}${productId}/`, true);
      console.log('✅ ApiService: Product detail received:', data);
      return data;
    } catch (error) {
      console.error('❌ ApiService: Product detail error:', error);
      throw error;
    }
  }

  // Orders API - Get Thor A D's orders
  async getOrders() {
    try {
      console.log('📋 ApiService: Fetching orders...');
      // Try both endpoints in case one is the correct one
      let data;
      try {
        data = await apiClient.get(ENDPOINTS.orders, true);
      } catch (firstError) {
        console.log('🔄 ApiService: Trying alternative orders endpoint...');
        data = await apiClient.get(ENDPOINTS.userOrders, true);
      }
      console.log('✅ ApiService: Orders received:', data);
      return data;
    } catch (error) {
      console.error('❌ ApiService: Orders error:', error);
      throw error;
    }
  }

  async getOrderDetail(orderId: string) {
    try {
      console.log(`📋 ApiService: Fetching order ${orderId}...`);
      const data = await apiClient.get(`${ENDPOINTS.orders}${orderId}/`, true);
      console.log('✅ ApiService: Order detail received:', data);
      return data;
    } catch (error) {
      console.error('❌ ApiService: Order detail error:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    try {
      console.log(`📋 ApiService: Updating order ${orderId} status to ${status}...`);
      const data = await apiClient.post(`${ENDPOINTS.orders}${orderId}/status/`, { status }, true);
      console.log('✅ ApiService: Order status updated:', data);
      return data;
    } catch (error) {
      console.error('❌ ApiService: Update order status error:', error);
      throw error;
    }
  }

  // Test connection to your backend
  async testConnection() {
    try {
      console.log('🔍 ApiService: Testing connection...');
      const data = await apiClient.get(ENDPOINTS.testAuth, true);
      console.log('✅ ApiService: Connection test successful:', data);
      return data;
    } catch (error) {
      console.error('❌ ApiService: Connection test failed:', error);
      throw error;
    }
  }

  // Get user profile data
  async getProfile() {
    try {
      console.log('👤 ApiService: Fetching profile...');
      const data = await apiClient.get(ENDPOINTS.profile, true);
      console.log('✅ ApiService: Profile received:', data);
      return data;
    } catch (error) {
      console.error('❌ ApiService: Profile error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
