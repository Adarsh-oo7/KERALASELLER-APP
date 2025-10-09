const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.4:8000'  // Your local IP from Django settings
  : 'https://your-render-url.onrender.com';  // Your production URL

export default API_BASE_URL;

export const ENDPOINTS = {
  // Auth endpoints - matching your Django URLs
  LOGIN: '/user/login/',
  REGISTER: '/user/register/',
  SEND_OTP: '/user/send-otp/',
  
  // Store endpoints
  STORE_PROFILE: '/api/store/profile/',
  STORE_PRODUCTS: '/api/store/products/',
  
  // Orders endpoints  
  ORDERS: '/user/orders/',
  
  // Other endpoints
  NOTIFICATIONS: '/api/notifications/',
} as const;
