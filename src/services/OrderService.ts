import apiClient from './ApiClient';

interface OrderFilters {
  status?: string;
  payment_method?: string;
  search?: string;
  date_filter?: string;
  min_amount?: string;
  max_amount?: string;
  store_id?: string;
}

class OrderService {
  async getOrders(filters: OrderFilters = {}): Promise<{ data: any }> {
    try {
      console.log('🔍 Fetching ONLINE orders only (excluding local bills)...');
      
      const params = new URLSearchParams();
      
      // ✅ IMPORTANT: Only fetch ONLINE orders, not LOCAL bills
      params.append('order_type', 'ONLINE');
      
      // Add other filters
      if (filters.status) params.append('status', filters.status);
      if (filters.payment_method) params.append('payment_method', filters.payment_method);
      if (filters.store_id) params.append('store_id', filters.store_id);
      
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
          case 'quarter':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        }
        
        if (startDate) {
          params.append('created_at__gte', startDate.toISOString());
        }
      }
      
      // Search filter
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      // Amount filters
      if (filters.min_amount) params.append('min_amount', filters.min_amount);
      if (filters.max_amount) params.append('max_amount', filters.max_amount);
      
      // Ordering
      params.append('ordering', '-created_at');
      
      const url = `/user/orders/${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      console.log('✅ Online orders fetched (local bills excluded):', response.data);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch online orders:', error);
      throw error;
    }
  }

  async getOrder(orderId: number): Promise<{ data: any }> {
    try {
      console.log('🔍 Fetching order details:', orderId);
      const response = await apiClient.get(`/user/orders/${orderId}/`);
      console.log('✅ Order details fetched:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch order details:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: number, updateData: any): Promise<{ data: any }> {
    try {
      console.log('🔄 Updating order status:', { orderId, updateData });
      const response = await apiClient.patch(`/user/orders/${orderId}/update_status/`, updateData);
      console.log('✅ Order status updated:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Failed to update order status:', error);
      throw error;
    }
  }

  async getOrdersCount(): Promise<{ data: { count: number } }> {
    try {
      // ✅ Get count of ONLINE orders only
      const response = await apiClient.get('/user/orders/count/?order_type=ONLINE');
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch orders count:', error);
      throw error;
    }
  }

  async getNotifications(): Promise<{ data: { unread_count: number } }> {
    try {
      return { data: { unread_count: 0 } };
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
      return { data: { unread_count: 0 } };
    }
  }
}

export default new OrderService();
