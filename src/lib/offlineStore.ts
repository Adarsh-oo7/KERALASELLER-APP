import AsyncStorage from '@react-native-async-storage/async-storage';

import { applyBillToProducts, type BillLine, type StockedProduct } from './offlineWindow';

export const OFFLINE_STORAGE_KEYS = {
  lastOnlineAt: 'ks.lastOnlineAt',
  products: 'ks.cachedProducts',
  pendingBills: 'ks.pendingLocalBills',
} as const;

export const OFFLINE_STORAGE_KEY_LIST = Object.values(OFFLINE_STORAGE_KEYS);

export type PendingLocalBill = {
  local_id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  seller_phone: string;
  items: BillLine[];
  total_amount: number;
};

const listeners = new Set<() => void>();

export function onOfflineStoreChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function markLastOnlineAt(at = Date.now()): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_STORAGE_KEYS.lastOnlineAt, String(at));
  emit();
}

export async function getLastOnlineAt(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.lastOnlineAt);
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) ? value : null;
}

export async function cacheProducts<T extends StockedProduct>(products: T[]): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_STORAGE_KEYS.products, JSON.stringify(products));
  emit();
}

export async function getCachedProducts<T extends StockedProduct = StockedProduct>(): Promise<T[]> {
  const raw = await AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.products);
  const parsed = parseJson<T[]>(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export async function getPendingLocalBills(): Promise<PendingLocalBill[]> {
  const raw = await AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.pendingBills);
  const parsed = parseJson<PendingLocalBill[]>(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

async function setPendingLocalBills(bills: PendingLocalBill[]): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_STORAGE_KEYS.pendingBills, JSON.stringify(bills));
  emit();
}

export async function enqueueLocalBill(payload: {
  customer_name: string;
  customer_phone: string;
  seller_phone: string;
  items: BillLine[];
}): Promise<{ bill_id: string; total_amount: number; queued: true }> {
  const products = await getCachedProducts();
  const applied = applyBillToProducts(products, payload.items);
  if (applied.error) {
    throw new Error(applied.error);
  }
  await cacheProducts(applied.products);

  const total_amount = payload.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const local_id = `OFF${Date.now().toString(36).toUpperCase()}`;
  const pending = await getPendingLocalBills();
  pending.push({
    local_id,
    created_at: new Date().toISOString(),
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone,
    seller_phone: payload.seller_phone,
    items: payload.items,
    total_amount,
  });
  await setPendingLocalBills(pending);
  return { bill_id: local_id, total_amount, queued: true };
}

export async function flushPendingLocalBills(
  send: (bill: PendingLocalBill) => Promise<void>,
): Promise<{ synced: number; remaining: number }> {
  const pending = await getPendingLocalBills();
  if (pending.length === 0) return { synced: 0, remaining: 0 };

  const leftover: PendingLocalBill[] = [];
  let synced = 0;
  for (const bill of pending) {
    try {
      await send(bill);
      synced += 1;
    } catch {
      leftover.push(bill);
    }
  }
  await setPendingLocalBills(leftover);
  return { synced, remaining: leftover.length };
}

export async function clearOfflineStore(): Promise<void> {
  await AsyncStorage.multiRemove(OFFLINE_STORAGE_KEY_LIST);
  emit();
}
