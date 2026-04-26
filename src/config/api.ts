import { Platform } from 'react-native';

// ─── EDIT THIS ONE LINE to change environment ───────────────────────────────
const ENV: 'development' | 'production' = 'development';

// ─── Your local machine IP for development ──────────────────────────────────
// Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to get your WiFi IP
// Your phone and PC must be on the SAME WiFi network
const DEV_IP = '192.168.1.7'; // <-- change this if your IP changes
const DEV_PORT = '8000';

// ─── Production URL ─────────────────────────────────────────────────────────
const PROD_URL = 'https://api.keralasellers.in';

// ─── Resolved base URL (used everywhere in the app) ─────────────────────────
export const API_BASE_URL =
  ENV === 'production'
    ? PROD_URL
    : `http://${DEV_IP}:${DEV_PORT}`;

export const IS_PRODUCTION = ENV === 'production';

// ─── Endpoints ───────────────────────────────────────────────────────────────
export const ENDPOINTS = {
  // Auth
  login:    '/user/login/',
  register: '/user/register/',
  sendOtp:  '/user/send-otp/',
  refresh:  '/user/token/refresh/',

  // Seller
  profile:    '/user/profile/',
  dashboard:  '/seller/dashboard/',
  stats:      '/seller/stats/',

  // Products
  products:   '/products/',
  categories: '/categories/',

  // Orders
  orders:     '/user/orders/',
};

// ─── Helper: standard headers ────────────────────────────────────────────────
export const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${token}`,
});

export const publicHeaders = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

// Legacy export for backwards compatibility
export const API_CONFIG = {
  development: { baseURL: `http://${DEV_IP}:${DEV_PORT}`, timeout: 15000 },
  production:  { baseURL: PROD_URL, timeout: 20000 },
  current: ENV,
};
export const getApiConfig = () => API_CONFIG[ENV];
