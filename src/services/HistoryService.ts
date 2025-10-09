import apiClient from './ApiClient';

class HistoryService {
  async getStockHistory(): Promise<{ data: any }> {
    try {
      console.log('🔍 Fetching stock history...');
      const response = await apiClient.get('/user/store/stock-history/');
      console.log('✅ Stock history fetched:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch stock history:', error);
      throw error;
    }
  }
}

export default new HistoryService();
