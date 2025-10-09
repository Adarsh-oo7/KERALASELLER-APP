import apiClient from './ApiClient';

class BillingService {
  async createLocalBill(orderData: any): Promise<{ data: any }> {
    try {
      console.log('🧾 Creating local bill:', orderData);
      
      // Create the order - Django will handle bill generation
      const response = await apiClient.post('/user/orders/create-order/', orderData);
      console.log('✅ Local bill created:', response.data);
      
      return response;
    } catch (error) {
      console.error('❌ Failed to create local bill:', error);
      throw error;
    }
  }

  // Optional: Get bill URL for viewing/downloading
  async getBillUrl(orderId: number): Promise<string> {
    const API_BASE_URL = 'https://your-backend-url.com'; // Replace with your actual URL
    return `${API_BASE_URL}/user/orders/${orderId}/generate-bill/`;
  }

  // Optional: Get PDF download URL
  async getPdfUrl(orderId: number): Promise<string> {
    const API_BASE_URL = 'https://your-backend-url.com'; // Replace with your actual URL
    return `${API_BASE_URL}/user/orders/${orderId}/download-bill/`;
  }
}

export default new BillingService();
