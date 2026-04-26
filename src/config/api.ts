// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// KERALA SELLERS APP — API CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Step 1: Set environment ─────────────────────────────────────────────────
// 'development' → connects to your local PC (needs same WiFi)
// 'production'  → connects to live server api.keralasellers.in
const ENV: 'development' | 'production' = 'production';

// ── Step 2: Your local PC WiFi IP (only used when ENV = 'development') ──────
// Run `ipconfig` on Windows → IPv4 Address under Wi-Fi
const DEV_IP   = '192.168.1.5';
const DEV_PORT = '8000';

// ── Step 3: Live server URL ─────────────────────────────────────────────────
const PROD_URL = 'https://api.keralasellers.in';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DO NOT EDIT BELOW THIS LINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const API_BASE_URL =
  ENV === 'production'
    ? PROD_URL
    : `http://${DEV_IP}:${DEV_PORT}`;

export const IS_PRODUCTION = ENV === 'production';

// ── Endpoints (matched to your Django urls.py) ──────────────────────────────
export const ENDPOINTS = {
  // Auth
  login:           '/user/login/',
  register:        '/user/register/',
  sendOtp:         '/user/send-otp/',
  verifyOtp:       '/user/verify-otp/',
  tokenRefresh:    '/user/token/refresh/',
  logout:          '/user/logout/',

  // User / Buyer
  profile:         '/user/profile/',
  updateProfile:   '/user/profile/update/',
  changePassword:  '/user/change-password/',

  // Seller
  sellerProfile:   '/seller/profile/',
  sellerDashboard: '/seller/dashboard/',
  sellerStats:     '/seller/stats/',
  sellerOrders:    '/seller/orders/',

  // Products
  products:        '/products/',
  productDetail:   (id: number | string) => `/products/${id}/`,
  categories:      '/categories/',

  // Orders (buyer)
  orders:          '/user/orders/',
  orderDetail:     (id: number | string) => `/user/orders/${id}/`,
  placeOrder:      '/user/orders/place/',

  // Cart
  cart:            '/user/cart/',
  cartAdd:         '/user/cart/add/',
  cartRemove:      (id: number | string) => `/user/cart/remove/${id}/`,

  // Wishlist
  wishlist:        '/wishlist/',
  wishlistToggle:  '/wishlist/toggle/',

  // Payments
  createPayment:   '/payments/create/',
  verifyPayment:   '/payments/verify/',

  // Subscriptions
  subscription:    '/subscriptions/my/',
  subscriptionPlans: '/subscriptions/plans/',

  // Notifications
  notifications:   '/notifications/',
  notifMarkRead:   '/notifications/mark-read/',
};

// ── Request helpers ──────────────────────────────────────────────────────────
export const publicHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

export const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// ── Full URL builder ─────────────────────────────────────────────────────────
export const apiUrl = (endpoint: string) =>
  `${API_BASE_URL}${endpoint}`;

// ── Legacy compat (older screens that import API_CONFIG) ─────────────────────
export const API_CONFIG = {
  development: { baseURL: `http://${DEV_IP}:${DEV_PORT}`, timeout: 15000 },
  production:  { baseURL: PROD_URL, timeout: 20000 },
  current: ENV,
};
export const getApiConfig = () => API_CONFIG[ENV];
