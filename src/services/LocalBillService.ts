import apiClient from './ApiClient';

interface LocalBillFilters {
  status?: string;
  date_filter?: string;
  search?: string;
}

class LocalBillService {
  async getLocalBills(filters: LocalBillFilters = {}): Promise<{ data: any }> {
    try {
      console.log('🧾 Fetching LOCAL bills only...');
      
      const params = new URLSearchParams();
      
      // ✅ IMPORTANT: Only fetch LOCAL bills
      params.append('order_type', 'LOCAL');
      
      // Add other filters
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      // Date filter logic
      if (filters.date_filter) {
        const now = new Date();
        let startDate;
        
        switch (filters.date_filter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        }
        
        if (startDate) {
          params.append('created_at__gte', startDate.toISOString());
        }
      }
      
      // Ordering - newest first
      params.append('ordering', '-created_at');
      
      const url = `/user/orders/?${params.toString()}`;
      const response = await apiClient.get(url);
      
      console.log('✅ Local bills fetched:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch local bills:', error);
      throw error;
    }
  }

  async getLocalBill(billId: number): Promise<{ data: any }> {
    try {
      console.log('🔍 Fetching local bill details:', billId);
      const response = await apiClient.get(`/user/orders/${billId}/`);
      console.log('✅ Local bill details fetched:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch local bill details:', error);
      throw error;
    }
  }
}

export default new LocalBillService();
