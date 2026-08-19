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
  }
  return [];
}

export function apiError(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'response' in error) {
    const data = (error as { response?: { data?: Record<string, unknown> } }).response?.data;
    if (!data) return fallback;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
    if (typeof data.detail === 'string') return data.detail;
    const first = Object.values(data)[0];
    if (typeof first === 'string') return first;
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
  }
  if (error instanceof Error && error.message) return error.message;
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
