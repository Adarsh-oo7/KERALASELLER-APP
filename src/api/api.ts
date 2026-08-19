import axios, { type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { markLastOnlineAt } from '../lib/offlineStore';
import { clearSellerSession } from '../lib/session';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

function pathOf(url?: string): string {
  return (url || '').split('?')[0];
}

function isPublicAuthPath(url?: string): boolean {
  return /\/user\/(login|register|check-exists)\/?$/.test(pathOf(url));
}

function isRefreshPath(url?: string): boolean {
  return /\/token\/refresh\/?$/.test(pathOf(url));
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await AsyncStorage.getItem('refreshToken');
  if (!refresh) return null;
  try {
    const response = await axios.post<{ access?: string }>(
      `${API_BASE_URL}/api/token/refresh/`,
      { refresh },
      { timeout: API_TIMEOUT, headers: { Accept: 'application/json' } },
    );
    const access = response.data?.access;
    if (!access) return null;
    await AsyncStorage.setItem('accessToken', access);
    return access;
  } catch {
    return null;
  }
}

function queuedRefresh(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

api.interceptors.request.use(
  async (config) => {
    if (!isPublicAuthPath(config.url) && !isRefreshPath(config.url)) {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    void AsyncStorage.getItem('accessToken').then((token) => {
      if (token) void markLastOnlineAt();
    });
    return response;
  },
  async (error) => {
    const status = error.response?.status as number | undefined;
    const original = error.config as RetryConfig | undefined;

    if (status !== 401 || !original || isPublicAuthPath(original.url)) {
      return Promise.reject(error);
    }

    if (original._retry || isRefreshPath(original.url)) {
      await clearSellerSession();
      return Promise.reject(error);
    }

    original._retry = true;
    const access = await queuedRefresh();
    if (!access) {
      await clearSellerSession();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${access}`;
    return api(original);
  },
);

export default api;
