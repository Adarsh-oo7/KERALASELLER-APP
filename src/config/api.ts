import { Platform } from 'react-native';

const PRODUCTION_URL = 'https://api.keralasellers.in';

// For local development: replace with your PC's local IP
const LOCAL_IP = '192.168.1.7';
const DEVELOPMENT_URL = `http://${LOCAL_IP}:8000`;

// Automatically use production in release builds, development in debug
const IS_DEV = __DEV__;

export const API_CONFIG = {
  development: {
    baseURL: DEVELOPMENT_URL,
    timeout: 15000,
  },
  production: {
    baseURL: PRODUCTION_URL,
    timeout: 20000,
  },
  // Auto-switches based on build mode — no manual toggling needed
  current: IS_DEV ? 'development' : 'production' as 'development' | 'production',
};

export const getApiConfig = () => {
  return API_CONFIG[API_CONFIG.current];
};

export const BASE_URL = IS_DEV ? DEVELOPMENT_URL : PRODUCTION_URL;

// All backend endpoints
export const ENDPOINTS = {
  // Auth
  login: '/api/auth/login/',
  register: '/api/auth/register/',
  logout: '/api/auth/logout/',
  token_refresh: '/api/auth/token/refresh/',

  // User/Buyer
  profile: '/api/user/profile/',
  buyer_orders: '/api/user/orders/',

  // Seller
  seller_profile: '/api/seller/profile/',
  seller_dashboard: '/api/seller/dashboard/',
  seller_orders: '/api/seller/orders/',

  // Products
  products: '/api/products/',
  categories: '/api/categories/',

  // Cart
  cart: '/api/cart/',
  cart_add: '/api/cart/add/',

  // OTP / Phone Auth
  send_otp: '/api/auth/send-otp/',
  verify_otp: '/api/auth/verify-otp/',
};
