import AsyncStorage from '@react-native-async-storage/async-storage';

import { OFFLINE_STORAGE_KEY_LIST, clearOfflineStore, markLastOnlineAt } from './offlineStore';

type SellerPayload = {
  id?: number | string;
  phone?: string;
  name?: string;
  shop_name?: string;
  store_slug?: string;
  email?: string;
};

export type SellerAuthResponse = {
  access_token: string;
  refresh_token?: string;
  api_token?: string;
  seller?: SellerPayload;
};

export const SESSION_KEYS = [
  'accessToken',
  'refreshToken',
  'apiToken',
  'userPhone',
  'userType',
  'sellerId',
  'sellerData',
];

const expiredListeners = new Set<() => void>();

export function onAuthExpired(listener: () => void): () => void {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

export async function clearSellerSession(): Promise<void> {
  await AsyncStorage.multiRemove([...SESSION_KEYS, ...OFFLINE_STORAGE_KEY_LIST]);
  await clearOfflineStore();
  expiredListeners.forEach((listener) => listener());
}

export async function persistSellerSession(
  data: SellerAuthResponse,
  phone: string,
): Promise<void> {
  await AsyncStorage.multiSet([
    ['accessToken', data.access_token],
    ['refreshToken', data.refresh_token || ''],
    ['apiToken', data.api_token || ''],
    ['userPhone', phone],
    ['userType', 'seller'],
    ['sellerId', String(data.seller?.id ?? '')],
    ['sellerData', JSON.stringify(data.seller ?? {})],
  ]);
  await markLastOnlineAt();
}
