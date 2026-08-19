export const OFFLINE_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

export type ConnectivityMode = 'online' | 'offline_grace' | 'offline_locked';

export type BillLine = {
  id: number;
  quantity: number;
  price: number;
};

export type StockedProduct = {
  id: number;
  name: string;
  total_stock: number;
  online_stock: number;
};

export function isNetworkError(error: unknown): boolean {
  const err = error as { message?: string; code?: string; response?: unknown };
  if (err?.response) return false;
  const message = String(err?.message || err?.code || '').toLowerCase();
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('offline') ||
    err?.code === 'ECONNABORTED' ||
    err?.code === 'ERR_NETWORK'
  );
}

export function resolveConnectivityMode(args: {
  isConnected: boolean;
  lastOnlineAt: number | null;
  now?: number;
}): ConnectivityMode {
  if (args.isConnected) return 'online';
  const last = args.lastOnlineAt;
  if (last == null) return 'offline_locked';
  const now = args.now ?? Date.now();
  if (now - last <= OFFLINE_GRACE_MS) return 'offline_grace';
  return 'offline_locked';
}

export function remainingGraceMs(lastOnlineAt: number | null, now = Date.now()): number {
  if (lastOnlineAt == null) return 0;
  return Math.max(0, lastOnlineAt + OFFLINE_GRACE_MS - now);
}

export function formatRemainingGrace(ms: number): string {
  if (ms <= 0) return '0 hours';
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  if (ms >= day) {
    const days = Math.ceil(ms / day);
    return days === 1 ? '1 day' : `${days} days`;
  }
  const hours = Math.max(1, Math.ceil(ms / hour));
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

export function applyBillToProducts<T extends StockedProduct>(
  products: T[],
  items: BillLine[],
): { products: T[]; error?: string } {
  const next = products.map((product) => ({ ...product }));
  for (const item of items) {
    const product = next.find((entry) => entry.id === item.id);
    if (!product) {
      return { products, error: `Product ${item.id} is not in the cached catalogue.` };
    }
    const quantity = Number(item.quantity) || 0;
    if (quantity <= 0) {
      return { products, error: `Invalid quantity for ${product.name}.` };
    }
    if (product.total_stock < quantity) {
      return {
        products,
        error: `Insufficient stock for ${product.name}. Available: ${product.total_stock}.`,
      };
    }
    product.total_stock -= quantity;
    if (product.online_stock >= quantity) {
      product.online_stock -= quantity;
    } else {
      product.online_stock = Math.max(0, product.online_stock);
    }
  }
  return { products: next };
}

export function connectivityCopy(mode: ConnectivityMode, remainingMs: number, pendingCount = 0): {
  title: string;
  message: string;
  tone: 'info' | 'warning';
} | null {
  const pending =
    pendingCount > 0
      ? ` ${pendingCount} local ${pendingCount === 1 ? 'bill' : 'bills'} will sync when you are back online.`
      : '';

  if (mode === 'offline_grace') {
    return {
      title: 'Offline · local billing on',
      message: `Walk-in billing still works for ${formatRemainingGrace(remainingMs)}. Online orders, payments, and shop updates need the internet.${pending}`,
      tone: 'info',
    };
  }
  if (mode === 'offline_locked') {
    return {
      title: 'Reconnect to continue',
      message: `Offline billing lasts 3 days after the last online sync. Connect to the internet to restore billing, payments, and shop updates.${pending}`,
      tone: 'warning',
    };
  }
  if (pendingCount > 0) {
    return {
      title: 'Syncing local bills',
      message: `${pendingCount} walk-in ${pendingCount === 1 ? 'bill is' : 'bills are'} waiting to reach the server.`,
      tone: 'info',
    };
  }
  return null;
}
