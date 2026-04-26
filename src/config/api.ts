import { Platform } from 'react-native';

// ─── EDIT ONLY THIS LINE when your WiFi IP changes ──────────────────────────
// Run `ipconfig` on Windows → look for IPv4 Address under Wi-Fi
const DEV_IP   = '192.168.1.5';   // ← your current IP
const DEV_PORT = '8000';

// ─── Environment switch ──────────────────────────────────────────────────────
const ENV: 'development' | 'production' = 'development';
// Change to 'production' when deploying to Play Store

// ─── Production URL ──────────────────────────────────────────────────────────
const PROD_URL = 'https://api.keralasellers.in';

// ─── Resolved base URL (imported everywhere in the app) ─────────────────────
export const API_BASE_URL =
  ENV === 'production'
    ? PROD_URL
    : `http://${DEV_IP}:${DEV_PORT}`;

export const IS_PRODUCTION = ENV === 'production';

// ─── Endpoints ───────────────────────────────────────────────────────────────
export const ENDPOINTS = {
  login:      '/user/login/',
  register:   '/user/register/',
  sendOtp:    '/user/send-otp/',
  refresh:    '/user/token/refresh/',
  profile:    '/user/profile/',
  dashboard:  '/seller/dashboard/',
  stats:      '/seller/stats/',
  products:   '/products/',
  categories: '/categories/',
  orders:     '/user/orders/',
};

// ─── Auth headers helper ─────────────────────────────────────────────────────
export const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${token}`,
});

export const publicHeaders = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

// Legacy compat
export const API_CONFIG = {
  development: { baseURL: `http://${DEV_IP}:${DEV_PORT}`, timeout: 15000 },
  production:  { baseURL: PROD_URL, timeout: 20000 },
  current: ENV,
};
export const getApiConfig = () => API_CONFIG[ENV];
