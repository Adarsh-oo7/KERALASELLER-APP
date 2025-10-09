import apiClient from './ApiClient';

interface CreateOrderData {
  plan_id: number;
  billing_cycle: 'monthly' | 'yearly';
}

class SubscriptionService {
  async getPlans(): Promise<{ data: any }> {
    try {
      console.log('🔍 Fetching REAL subscription plans...');
      // ✅ Your Django endpoint
      const response = await apiClient.get('/api/subscriptions/plans/');
      console.log('✅ REAL plans fetched:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch REAL plans:', error);
      throw error;
    }
  }

  async getCurrentSubscription(): Promise<{ data: any }> {
    try {
      console.log('🔍 Fetching REAL current subscription...');
      // ✅ Your Django endpoint  
      const response = await apiClient.get('/api/subscriptions/current/');
      console.log('✅ REAL subscription fetched:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch REAL subscription:', error);
      throw error;
    }
  }

  async createOrder(orderData: CreateOrderData): Promise<{ data: any }> {
    try {
      console.log('🔄 Creating REAL subscription order:', orderData);
      // ✅ Your Django endpoint
      const response = await apiClient.post('/api/subscriptions/create-order/', orderData);
      console.log('✅ REAL order created:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Failed to create REAL order:', error);
      throw error;
    }
  }

  async verifyPayment(verificationData: any): Promise<{ data: any }> {
    try {
      console.log('🔄 Verifying REAL payment:', verificationData);
      // ✅ Your Django endpoint
      const response = await apiClient.post('/api/subscriptions/verify-payment/', verificationData);
      console.log('✅ REAL payment verified:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Failed to verify REAL payment:', error);
      throw error;
    }
  }
}

export default new SubscriptionService();
