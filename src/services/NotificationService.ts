// src/services/NotificationService.ts
import apiClient from './ApiClient';

// ── Backend types ─────────────────────────────────────────────────────────────

interface BackendNotification {
  id:         number;
  message:    string;
  link:       string | null;
  is_read:    boolean;
  created_at: string;
}

// ── App types ─────────────────────────────────────────────────────────────────

export interface Notification {
  id:          string;
  type:        'order' | 'stock' | 'payment' | 'system' | 'marketing';
  title:       string;
  message:     string;
  time:        string;
  unread:      boolean;
  actionable:  boolean;
  action_url?: string;
  created_at:  string;
}

export interface NotificationResponse { data: Notification[]; }
export interface ActionResponse       { data: { success: boolean; message?: string } }

// ── Transformer ───────────────────────────────────────────────────────────────

const TYPE_KEYWORDS: Record<Notification['type'], string[]> = {
  order:     ['order', 'delivered', 'dispatch', 'shipped'],
  stock:     ['stock', 'inventory', 'restock', 'low', 'units left'],
  payment:   ['payment', 'paid', 'received', 'refund', 'transaction'],
  marketing: ['boost', 'marketing', 'promotion', 'offer', 'campaign'],
  system:    ['profile', 'updated', 'subscription', 'account', 'setting'],
};

const SCREEN_MAP: Record<string, string> = {
  orders:       'Orders',
  products:     'Products',
  billing:      'Billing',
  subscription: 'Subscription',
  dashboard:    'Dashboard',
  profile:      'Profile',
};

const parseType = (message: string): Notification['type'] => {
  const lower = message.toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return type as Notification['type'];
  }
  return 'system';
};

const extractTitle = (message: string): string => {
  // Strip emoji characters
  const clean = message.replace(/\p{Emoji}/gu, '').trim();

  // Format: "Title - body"
  if (clean.includes(' - ')) {
    const part = clean.split(' - ')[0].trim();
    if (part.length > 0) return part;
  }

  // First sentence
  const sentence = clean.split(/[.!]/)[0].trim();
  if (sentence.length > 0 && sentence.length < 60) return sentence;

  // Truncate
  return clean.length > 50 ? clean.slice(0, 47) + '…' : clean;
};

const formatTime = (dateString: string): string => {
  const diff  = Date.now() - new Date(dateString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  <  1) return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;

  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
    ...(days > 365 ? { year: 'numeric' } : {}),
  });
};

const mapLink = (link: string | null): string | undefined => {
  if (!link) return undefined;
  const lower = link.toLowerCase();
  return Object.entries(SCREEN_MAP).find(([key]) => lower.includes(key))?.[1];
};

const transform = (n: BackendNotification): Notification => {
  const action_url = mapLink(n.link);
  return {
    id:         n.id.toString(),
    type:       parseType(n.message),
    title:      extractTitle(n.message),
    message:    n.message,
    time:       formatTime(n.created_at),
    unread:     !n.is_read,
    actionable: !!action_url,
    action_url,
    created_at: n.created_at,
  };
};

// ── Service ───────────────────────────────────────────────────────────────────

class NotificationService {

  async getNotifications(): Promise<NotificationResponse> {
    const res = await apiClient.get<BackendNotification[]>('/api/notifications/');
    return { data: (res.data ?? []).map(transform) };
  }

  async getUnreadCount(): Promise<number> {
    // Try dedicated count endpoint first — avoids fetching full payloads
    try {
      const res = await apiClient.get<{ unread_count: number }>('/api/notifications/count/');
      return res.data.unread_count ?? 0;
    } catch {
      // Endpoint not available — count from list
      try {
        const { data } = await this.getNotifications();
        return data.filter(n => n.unread).length;
      } catch {
        return 0;
      }
    }
  }

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/api/notifications/${id}/mark-as-read/`);
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/api/notifications/mark-all-read/');
  }

  async clearAll(): Promise<void> {
    await apiClient.delete('/api/notifications/clear-all/');
  }
}

export default new NotificationService();
