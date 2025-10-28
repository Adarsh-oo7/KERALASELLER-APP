// services/NotificationService.ts
import apiClient from './ApiClient';

// ===================================================================
// ✅ BACKEND TYPES (what Django sends)
// ===================================================================
interface BackendNotification {
  id: number;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ===================================================================
// ✅ APP TYPES (what your screens expect)
// ===================================================================
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

// ===================================================================
// ✅ HELPER FUNCTIONS - Transform backend data to app format
// ===================================================================
class NotificationTransformer {
  
  /**
   * ✅ Parse notification type from message
   */
  static parseType(message: string): Notification['type'] {
    const lower = message.toLowerCase();
    
    if (lower.includes('order') || lower.includes('🎉') || lower.includes('📦')) {
      return 'order';
    } else if (lower.includes('stock') || lower.includes('⚠️') || lower.includes('low')) {
      return 'stock';
    } else if (lower.includes('payment') || lower.includes('₹') || lower.includes('✅')) {
      return 'payment';
    } else if (lower.includes('profile') || lower.includes('👤') || lower.includes('subscription')) {
      return 'system';
    } else if (lower.includes('boost') || lower.includes('marketing') || lower.includes('📈')) {
      return 'marketing';
    }
    return 'system';
  }

  /**
   * ✅ Extract title from message
   */
  static extractTitle(message: string): string {
    // Remove emojis for title extraction
    const withoutEmojis = message.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    
    // Try splitting by dash
    if (withoutEmojis.includes(' - ')) {
      const title = withoutEmojis.split(' - ')[0].trim();
      return title || withoutEmojis.substring(0, 50);
    }
    
    // Try first sentence
    const firstSentence = withoutEmojis.split(/[.!]/) [0].trim();
    if (firstSentence.length > 0 && firstSentence.length < 60) {
      return firstSentence;
    }
    
    // Fallback: first 50 chars
    return withoutEmojis.length > 50 
      ? withoutEmojis.substring(0, 47) + '...' 
      : withoutEmojis;
  }

  /**
   * ✅ Format relative time
   */
  static formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * ✅ Map backend link to app screen name
   */
  static mapLinkToScreen(link: string | null): string | undefined {
    if (!link) return undefined;

    const lowerLink = link.toLowerCase();
    
    if (lowerLink.includes('orders')) return 'Orders';
    if (lowerLink.includes('products')) return 'Products';
    if (lowerLink.includes('billing')) return 'Billing';
    if (lowerLink.includes('subscription')) return 'Subscription';
    if (lowerLink.includes('dashboard')) return 'Dashboard';
    if (lowerLink.includes('profile')) return 'Profile';
    
    return undefined;
  }

  /**
   * ✅ Transform backend notification to app format
   */
  static transform(backend: BackendNotification): Notification {
    const type = this.parseType(backend.message);
    const title = this.extractTitle(backend.message);
    const time = this.formatTime(backend.created_at);
    const action_url = this.mapLinkToScreen(backend.link);

    return {
      id: backend.id.toString(),
      type,
      title,
      message: backend.message,
      time,
      unread: !backend.is_read,
      actionable: !!action_url,
      action_url,
      created_at: backend.created_at,
    };
  }
}

// ===================================================================
// ✅ NOTIFICATION SERVICE - Fetches REAL DATA from backend
// ===================================================================
class NotificationService {
  
  /**
   * ✅ Get all notifications from backend
   */
  async getNotifications(): Promise<NotificationResponse> {
    try {
      console.log('🔔 NotificationService: Fetching notifications from backend...');
      
      // ✅ REAL API CALL
      const response = await apiClient.get<BackendNotification[]>('/api/notifications/');
      const backendNotifications = response.data || [];
      
      console.log(`📡 Backend returned ${backendNotifications.length} notifications`);
      
      // ✅ Transform backend data to app format
      const appNotifications = backendNotifications.map(n => 
        NotificationTransformer.transform(n)
      );
      
      console.log(`✅ Transformed ${appNotifications.length} notifications for app`);
      
      return { data: appNotifications };
      
    } catch (error: any) {
      console.error('❌ NotificationService: Failed to fetch notifications', error);
      
      // ✅ Return empty array (component will show empty state)
      return { data: [] };
    }
  }

  /**
   * ✅ Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      console.log('🔔 NotificationService: Getting unread count...');
      
      // ✅ Option 1: Use dedicated count endpoint (if available)
      try {
        const response = await apiClient.get<{ unread_count: number }>('/api/notifications/count/');
        console.log(`✅ Unread count from API: ${response.data.unread_count}`);
        return response.data.unread_count;
      } catch (countError) {
        // ✅ Fallback: Get all notifications and count locally
        console.log('⚠️ Count endpoint unavailable, counting locally...');
        const notifications = await this.getNotifications();
        const unreadCount = notifications.data.filter(n => n.unread).length;
        console.log(`✅ Unread count (local): ${unreadCount}`);
        return unreadCount;
      }
      
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * ✅ Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ActionResponse> {
    try {
      console.log(`🔔 Marking notification ${notificationId} as read...`);
      
      // ✅ REAL API CALL
      await apiClient.patch(`/api/notifications/${notificationId}/mark-as-read/`);
      
      console.log(`✅ Notification ${notificationId} marked as read`);
      
      return { 
        data: { 
          success: true, 
          message: 'Notification marked as read' 
        } 
      };
      
    } catch (error: any) {
      console.error(`❌ Failed to mark notification ${notificationId} as read:`, error);
      throw error;
    }
  }

  /**
   * ✅ Mark all notifications as read
   */
  async markAllAsRead(): Promise<ActionResponse> {
    try {
      console.log('🔔 Marking all notifications as read...');
      
      // ✅ REAL API CALL
      await apiClient.patch('/api/notifications/mark-all-read/');
      
      console.log('✅ All notifications marked as read');
      
      return { 
        data: { 
          success: true, 
          message: 'All notifications marked as read' 
        } 
      };
      
    } catch (error: any) {
      console.error('❌ Failed to mark all as read:', error);
      throw error;
    }
  }

  /**
   * ✅ Clear all notifications
   */
  async clearAll(): Promise<ActionResponse> {
    try {
      console.log('🔔 Clearing all notifications...');
      
      // ✅ REAL API CALL
      await apiClient.delete('/api/notifications/clear-all/');
      
      console.log('✅ All notifications cleared');
      
      return { 
        data: { 
          success: true, 
          message: 'All notifications cleared' 
        } 
      };
      
    } catch (error: any) {
      console.error('❌ Failed to clear notifications:', error);
      throw error;
    }
  }
}

export default new NotificationService();
export type { Notification, NotificationResponse, ActionResponse };
