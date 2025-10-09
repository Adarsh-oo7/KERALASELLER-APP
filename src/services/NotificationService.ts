import apiClient from './ApiClient';

interface Notification {
  id: string;
  type: 'order' | 'stock' | 'payment' | 'system' | 'marketing';
  title: string;
  message: string;
  time: string;
  unread: boolean;
  actionable: boolean;
  action_url?: string;
  created_at: string;
}

interface NotificationResponse {
  data: Notification[];
}

interface ActionResponse {
  data: {
    success: boolean;
    message?: string;
  };
}

class NotificationService {
  // ✅ Get all notifications with realistic Kerala Sellers data
  async getNotifications(): Promise<NotificationResponse> {
    try {
      console.log('🔔 Fetching notifications...');
      
      // ✅ TODO: Replace with real API endpoint
      // const response = await apiClient.get('/api/notifications/');
      // return response.data;
      
      // ✅ REALISTIC MOCK DATA: Kerala Sellers business notifications
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'order',
          title: 'New Order Received! 🎉',
          message: 'Order #KS1234 from Priya Nair for Samsung Galaxy A54 (₹2,450)',
          time: '2 minutes ago',
          unread: true,
          actionable: true,
          action_url: 'Orders',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'stock',
          title: 'Low Stock Alert ⚠️',
          message: 'Samsung Galaxy A54 is running low. Only 3 units left in stock.',
          time: '1 hour ago',
          unread: true,
          actionable: true,
          action_url: 'Products',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          type: 'payment',
          title: 'Payment Received ✅',
          message: '₹2,450 payment received from customer Priya Nair via UPI',
          time: '3 hours ago',
          unread: false,
          actionable: false,
          created_at: new Date(Date.now() - 10800000).toISOString(),
        },
        {
          id: '4',
          type: 'order',
          title: 'Order Delivered 📦',
          message: 'Order #KS1233 successfully delivered to Rajesh Kumar in Kochi',
          time: '5 hours ago',
          unread: false,
          actionable: true,
          action_url: 'Orders',
          created_at: new Date(Date.now() - 18000000).toISOString(),
        },
        {
          id: '5',
          type: 'system',
          title: 'Profile Updated 👤',
          message: 'Your Kerala Sellers store profile has been successfully updated',
          time: '1 day ago',
          unread: false,
          actionable: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '6',
          type: 'marketing',
          title: 'Boost Your Sales! 📈',
          message: 'Try our new marketing tools to reach more customers in Kerala',
          time: '2 days ago',
          unread: false,
          actionable: true,
          action_url: 'Dashboard',
          created_at: new Date(Date.now() - 172800000).toISOString(),
        }
      ];
      
      console.log('✅ Notifications loaded:', mockNotifications.length);
      return { data: mockNotifications };
      
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
      throw error;
    }
  }

  // ✅ Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      console.log('🔔 Getting unread notification count...');
      
      const notifications = await this.getNotifications();
      const unreadCount = notifications.data.filter(n => n.unread).length;
      
      console.log('✅ Unread notifications:', unreadCount);
      return unreadCount;
      
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0;
    }
  }

  // ✅ Mark notification as read
  async markAsRead(notificationId: string): Promise<ActionResponse> {
    try {
      console.log('🔔 Marking notification as read:', notificationId);
      
      // ✅ TODO: Replace with real API call
      // const response = await apiClient.patch(`/api/notifications/${notificationId}/`, {
      //   unread: false
      // });
      // return response.data;
      
      console.log('✅ Notification marked as read');
      return { 
        data: { 
          success: true, 
          message: 'Notification marked as read' 
        } 
      };
      
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      throw error;
    }
  }

  // ✅ Mark all notifications as read
  async markAllAsRead(): Promise<ActionResponse> {
    try {
      console.log('🔔 Marking all notifications as read...');
      
      // ✅ TODO: Replace with real API call
      // const response = await apiClient.post('/api/notifications/mark_all_read/');
      // return response.data;
      
      console.log('✅ All notifications marked as read');
      return { 
        data: { 
          success: true, 
          message: 'All notifications marked as read' 
        } 
      };
      
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error);
      throw error;
    }
  }

  // ✅ Clear all notifications
  async clearAll(): Promise<ActionResponse> {
    try {
      console.log('🔔 Clearing all notifications...');
      
      // ✅ TODO: Replace with real API call
      // const response = await apiClient.delete('/api/notifications/clear_all/');
      // return response.data;
      
      console.log('✅ All notifications cleared');
      return { 
        data: { 
          success: true, 
          message: 'All notifications cleared' 
        } 
      };
      
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
      throw error;
    }
  }
}

export default new NotificationService();
export type { Notification, NotificationResponse, ActionResponse };
