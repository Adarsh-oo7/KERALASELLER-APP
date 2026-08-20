export function formatInr(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return '₹0';
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.results)) return record.results as T[];
    if (Array.isArray(record.plans)) return record.plans as T[];
    if (Array.isArray(record.products)) return record.products as T[];
    if (Array.isArray(record.notifications)) return record.notifications as T[];
    if (Array.isArray(record.items)) return record.items as T[];
    if (Array.isArray(record.bills)) return record.bills as T[];
    if (Array.isArray(record.addons)) return record.addons as T[];
    if (Array.isArray(record.expenses)) return record.expenses as T[];
  }
  return [];
}

export function httpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error && 'response' in error) {
    return (error as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

function looksLikeNetworkError(error: unknown): boolean {
  const err = error as { message?: string; code?: string; response?: unknown };
  if (err?.response) return false;
  const message = String(err?.message || err?.code || '').toLowerCase();
  return (
    message.includes('network')
    || message.includes('timeout')
    || err?.code === 'ECONNABORTED'
    || err?.code === 'ERR_NETWORK'
  );
}

function looksLikeHtml(value: string): boolean {
  const start = value.trim().slice(0, 32).toLowerCase();
  return start.startsWith('<!doctype') || start.startsWith('<html') || start.startsWith('<?xml');
}

function messageFromPayload(data: unknown, depth = 0): string | null {
  if (data == null || depth > 3) return null;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed || looksLikeHtml(trimmed)) return null;
    if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length > 1) {
      try {
        return messageFromPayload(JSON.parse(trimmed), depth + 1);
      } catch {
        return null;
      }
    }
    if (trimmed.length > 280) return null;
    return trimmed;
  }
  if (typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  for (const key of ['error', 'message', 'detail', 'title']) {
    const value = record[key];
    if (typeof value !== 'string') continue;
    const text = value.trim();
    if (!text || text === '{' || text === '{}' || text === '[object Object]' || looksLikeHtml(text)) continue;
    if (text.startsWith('{') && text.length < 12) continue;
    return text;
  }
  return null;
}

export function apiError(error: unknown, fallback: string): string {
  if (looksLikeNetworkError(error)) return fallback;
  if (typeof error === 'object' && error && 'response' in error) {
    const fromBody = messageFromPayload((error as { response?: { data?: unknown } }).response?.data);
    if (fromBody) return fromBody;
  }
  if (error instanceof Error && error.message) {
    const message = error.message.trim();
    if (message && message !== '{}' && message !== '{' && message !== '[object Object]' && !looksLikeHtml(message)) {
      if (!(message.startsWith('{') && message.length < 12)) return message;
    }
  }
  const fromSelf = messageFromPayload(error);
  if (fromSelf) return fromSelf;
  return fallback;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
