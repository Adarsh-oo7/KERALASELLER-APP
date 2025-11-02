// services/ApiService.ts - ✅ WORKING VERSION WITH NEW API CONFIG
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ENDPOINTS } from '../config/api'; // ✅ Use new API config

class ApiService {
  // ✅ Dashboard API
  async getDashboardData() {
    try {
      console.log('📊 ApiService: Fetching dashboard data...');
      const data = await api.getDashboard();
      console.log('✅ ApiService: Dashboard data received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Dashboard error:', error);
      throw error;
    }
  }

  // ✅ Store Profile API
  async getStoreProfile() {
    try {
      console.log('🏪 ApiService: Fetching store profile...');
      const data = await api.getStoreProfile();
      console.log('✅ ApiService: Store profile received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Store profile error:', error);
      throw error;
    }
  }

  // ✅ Update Store Profile
  async updateStoreProfile(profileData: any) {
    try {
      console.log('🏪 ApiService: Updating store profile...');
      const data = await api.updateStoreProfile(profileData);
      console.log('✅ ApiService: Store profile updated');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Update store profile error:', error);
      throw error;
    }
  }

  // ✅ Products API
  async getProducts() {
    try {
      console.log('📦 ApiService: Fetching products...');
      const data = await api.getProducts();
      console.log('✅ ApiService: Products received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Products error:', error);
      throw error;
    }
  }

  // ✅ Get Product Detail
  async getProductDetail(productId: string) {
    try {
      console.log(`📦 ApiService: Fetching product ${productId}...`);
      const data = await api.getProduct(productId);
      console.log('✅ ApiService: Product detail received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Product detail error:', error);
      throw error;
    }
  }

  // ✅ Create Product
  async createProduct(productData: any) {
    try {
      console.log('📦 ApiService: Creating product...');
      const data = await api.createProduct(productData);
      console.log('✅ ApiService: Product created');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Create product error:', error);
      throw error;
    }
  }

  // ✅ Update Product
  async updateProduct(productId: string, productData: any) {
    try {
      console.log(`📦 ApiService: Updating product ${productId}...`);
      const data = await api.updateProduct(productId, productData);
      console.log('✅ ApiService: Product updated');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Update product error:', error);
      throw error;
    }
  }

  // ✅ Delete Product
  async deleteProduct(productId: string) {
    try {
      console.log(`📦 ApiService: Deleting product ${productId}...`);
      const data = await api.deleteProduct(productId);
      console.log('✅ ApiService: Product deleted');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Delete product error:', error);
      throw error;
    }
  }

  // ✅ Orders API
  async getOrders() {
    try {
      console.log('📋 ApiService: Fetching orders...');
      const data = await api.getOrders();
      console.log('✅ ApiService: Orders received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Orders error:', error);
      throw error;
    }
  }

  // ✅ Get Order Detail
  async getOrderDetail(orderId: string) {
    try {
      console.log(`📋 ApiService: Fetching order ${orderId}...`);
      const data = await api.getOrder(orderId);
      console.log('✅ ApiService: Order detail received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Order detail error:', error);
      throw error;
    }
  }

  // ✅ Update Order Status
  async updateOrderStatus(orderId: string, status: string) {
    try {
      console.log(`📋 ApiService: Updating order ${orderId} status to ${status}...`);
      const data = await api.updateOrderStatus(orderId, status);
      console.log('✅ ApiService: Order status updated');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Update order status error:', error);
      throw error;
    }
  }

  // ✅ Analytics API
  async getAnalytics() {
    try {
      console.log('📊 ApiService: Fetching analytics...');
      const data = await api.getAnalytics();
      console.log('✅ ApiService: Analytics received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Analytics error:', error);
      throw error;
    }
  }

  // ✅ Sales Report
  async getSalesReport() {
    try {
      console.log('📈 ApiService: Fetching sales report...');
      const data = await api.getSalesReport();
      console.log('✅ ApiService: Sales report received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Sales report error:', error);
      throw error;
    }
  }

  // ✅ Revenue Report
  async getRevenueReport() {
    try {
      console.log('💰 ApiService: Fetching revenue report...');
      const data = await api.getRevenueReport();
      console.log('✅ ApiService: Revenue report received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Revenue report error:', error);
      throw error;
    }
  }

  // ✅ Stock API
  async getStock() {
    try {
      console.log('📦 ApiService: Fetching stock...');
      const data = await api.getStock();
      console.log('✅ ApiService: Stock received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Stock error:', error);
      throw error;
    }
  }

  // ✅ Stock Alerts
  async getStockAlerts() {
    try {
      console.log('⚠️ ApiService: Fetching stock alerts...');
      const data = await api.getStockAlerts();
      console.log('✅ ApiService: Stock alerts received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Stock alerts error:', error);
      throw error;
    }
  }

  // ✅ Update Stock
  async updateStock(productId: string, quantity: number) {
    try {
      console.log(`📦 ApiService: Updating stock for product ${productId}...`);
      const data = await api.updateStock(productId, quantity);
      console.log('✅ ApiService: Stock updated');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Update stock error:', error);
      throw error;
    }
  }

  // ✅ Notifications API
  async getNotifications() {
    try {
      console.log('🔔 ApiService: Fetching notifications...');
      const data = await api.getNotifications();
      console.log('✅ ApiService: Notifications received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Notifications error:', error);
      throw error;
    }
  }

  // ✅ Mark Notification Read
  async markNotificationRead(notificationId: string) {
    try {
      console.log(`🔔 ApiService: Marking notification ${notificationId} as read...`);
      const data = await api.markNotificationRead(notificationId);
      console.log('✅ ApiService: Notification marked as read');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Mark notification read error:', error);
      throw error;
    }
  }

  // ✅ Transactions API
  async getTransactionHistory() {
    try {
      console.log('💳 ApiService: Fetching transaction history...');
      const data = await api.getTransactionHistory();
      console.log('✅ ApiService: Transaction history received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Transaction history error:', error);
      throw error;
    }
  }

  // ✅ Get Payment History
  async getPaymentHistory() {
    try {
      console.log('💳 ApiService: Fetching payment history...');
      const data = await api.getPaymentHistory();
      console.log('✅ ApiService: Payment history received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Payment history error:', error);
      throw error;
    }
  }

  // ✅ Billing API
  async getLocalBills() {
    try {
      console.log('🧾 ApiService: Fetching local bills...');
      const data = await api.getLocalBills();
      console.log('✅ ApiService: Local bills received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Local bills error:', error);
      throw error;
    }
  }

  // ✅ Generate Bill
  async generateBill(billData: any) {
    try {
      console.log('🧾 ApiService: Generating bill...');
      const data = await api.generateBill(billData);
      console.log('✅ ApiService: Bill generated');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Generate bill error:', error);
      throw error;
    }
  }

  // ✅ Subscription API
  async getSubscriptions() {
    try {
      console.log('👑 ApiService: Fetching subscriptions...');
      const data = await api.getSubscriptions();
      console.log('✅ ApiService: Subscriptions received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Subscriptions error:', error);
      throw error;
    }
  }

  // ✅ Get Subscription Data
  async getSubscriptionData() {
    try {
      console.log('👑 ApiService: Fetching subscription data...');
      const data = await api.getSubscriptionData();
      console.log('✅ ApiService: Subscription data received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Subscription data error:', error);
      throw error;
    }
  }

  // ✅ Upgrade Subscription
  async upgradeSubscription(planData: any) {
    try {
      console.log('👑 ApiService: Upgrading subscription...');
      const data = await api.upgradeSubscription(planData);
      console.log('✅ ApiService: Subscription upgraded');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Upgrade subscription error:', error);
      throw error;
    }
  }

  // ✅ Settings API
  async getSettings() {
    try {
      console.log('⚙️ ApiService: Fetching settings...');
      const data = await api.getSettings();
      console.log('✅ ApiService: Settings received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Settings error:', error);
      throw error;
    }
  }

  // ✅ Update Settings
  async updateSettings(settingsData: any) {
    try {
      console.log('⚙️ ApiService: Updating settings...');
      const data = await api.updateSettings(settingsData);
      console.log('✅ ApiService: Settings updated');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Update settings error:', error);
      throw error;
    }
  }

  // ✅ Profile API
  async getProfile() {
    try {
      console.log('👤 ApiService: Fetching profile...');
      const data = await api.getProfile();
      console.log('✅ ApiService: Profile received');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Profile error:', error);
      throw error;
    }
  }

  // ✅ Update Profile
  async updateProfile(profileData: any) {
    try {
      console.log('👤 ApiService: Updating profile...');
      const data = await api.updateProfile(profileData);
      console.log('✅ ApiService: Profile updated');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Update profile error:', error);
      throw error;
    }
  }

  // ✅ Upload Product Image
  async uploadProductImage(file: any, productData?: any) {
    try {
      console.log('📸 ApiService: Uploading product image...');
      const data = await api.uploadProductImage(file, productData);
      console.log('✅ ApiService: Product image uploaded');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Upload product image error:', error);
      throw error;
    }
  }

  // ✅ Test Connection
  async testConnection() {
    try {
      console.log('🔍 ApiService: Testing connection...');
      const data = await api.testConnection();
      console.log('✅ ApiService: Connection test successful');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Connection test failed:', error);
      throw error;
    }
  }

  // ✅ Test Auth
  async testAuth() {
    try {
      console.log('🔐 ApiService: Testing authentication...');
      const data = await api.testAuth();
      console.log('✅ ApiService: Auth test successful');
      return data;
    } catch (error) {
      console.error('❌ ApiService: Auth test failed:', error);
      throw error;
    }
  }

  // ✅ Clear Cache
  clearCache() {
    console.log('💾 ApiService: Clearing cache...');
    api.clearCache?.();
  }

  // ✅ Clear All
  clearAll() {
    console.log('🧹 ApiService: Clearing all cache and queues...');
    api.clearAll?.();
  }
}

export const apiService = new ApiService();
export default apiService;
