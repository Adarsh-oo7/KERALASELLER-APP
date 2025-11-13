// Add to your existing axios api file

import api from './axiosApi'; // Your existing axios instance

// ✅ Add Payment API Methods
export const PaymentAPI = {
  // Get gateway status
  getGatewayStatus: async () => {
    try {
      const response = await api.get('/api/payments/account/gateway_status/');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          razorpay: { connected: false, verified: false, status: 'pending' },
          cashfree: { connected: false, verified: false, status: 'pending' },
          primary_gateway: null,
          is_ready: false
        };
      }
      throw error;
    }
  },

  // Get payout history
  getPayoutHistory: async () => {
    try {
      const response = await api.get('/api/payments/payouts/history/');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { payouts: [] };
      }
      throw error;
    }
  },

  // Connect Razorpay
  connectRazorpay: async (data: { key_id: string; key_secret: string }) => {
    try {
      const response = await api.post('/api/payments/razorpay/connect/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Disconnect Razorpay
  disconnectRazorpay: async () => {
    try {
      const response = await api.delete('/api/payments/razorpay/disconnect/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify Razorpay
  verifyRazorpayAccount: async () => {
    try {
      const response = await api.post('/api/payments/razorpay/verify/', {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
