// import Constants from 'expo-constants';
// import { Platform } from 'react-native';
// import {
//   SellerRegistrationData,
//   OTPRequest,
//   RegistrationRequest,
//   DjangoLoginResponse,
//   LoginResponse,
//   StoreProfile as Store,
//   Product as ProductType,
//   Order as OrderType,
//   Subscription,
//   DashboardData,
//   TopSellingProduct,
//   SubscriptionPlan,
//   ApiResponse,
//   PaginatedResponse,
// } from '../types/api.types';

// // Environment type
// export type Environment = 'development' | 'production' | 'staging';

// // Get API URL from environment
// const getApiUrl = (): string => {
//   if (process.env.EXPO_PUBLIC_API_URL) {
//     return process.env.EXPO_PUBLIC_API_URL;
//   }
  
//   if (Constants.expoConfig?.extra?.API_URL) {
//     return Constants.expoConfig.extra.API_URL;
//   }
  
//   return 'https://api.keralasellers.in';
// };

// export const API_BASE_URL: string = getApiUrl();
// export const API_TIMEOUT: number = 15000;
// export const APP_ENV: Environment = (Constants.expoConfig?.extra?.APP_ENV as Environment) || 'production';

// // API Endpoints - Seller Dashboard focused
// export const ENDPOINTS = {
//   // ==================== Authentication ====================
//   SELLER_LOGIN: '/api/seller/login/',
//   SELLER_REGISTER_OTP: '/api/seller/register/otp/',
//   SELLER_REGISTER_VERIFY: '/api/seller/register/verify/',
  
//   // ==================== Profile ====================
//   SELLER_PROFILE: '/api/seller/profile/',
//   STORE_PROFILE: '/api/seller/store-profile/',
//   UPDATE_STORE_PROFILE: '/api/seller/store-profile/update/',
  
//   // ==================== Dashboard ====================
//   DASHBOARD: '/api/seller/dashboard/',
//   ANALYTICS: '/api/seller/analytics/',
  
//   // ==================== Products ====================
//   PRODUCTS_LIST: '/api/seller/products/',
//   PRODUCT_CREATE: '/api/seller/products/create/',
//   PRODUCT_UPDATE: (id: number) => `/api/seller/products/${id}/update/`,
//   PRODUCT_DELETE: (id: number) => `/api/seller/products/${id}/delete/`,
//   PRODUCT_IMAGES_UPLOAD: '/api/seller/products/upload-images/',
  
//   // ==================== Orders ====================
//   ORDERS_LIST: '/api/seller/orders/',
//   ORDER_DETAILS: (id: number) => `/api/seller/orders/${id}/`,
//   ORDER_UPDATE_STATUS: (id: number) => `/api/seller/orders/${id}/update-status/`,
  
//   // ==================== Subscriptions ====================
//   SUBSCRIPTION_PLANS: '/api/seller/subscriptions/plans/',
//   CURRENT_SUBSCRIPTION: '/api/seller/subscriptions/current/',
//   CREATE_SUBSCRIPTION: '/api/seller/subscriptions/create/',
  
//   // ==================== Billing ====================
//   BILLING_HISTORY: '/api/seller/billing/',
//   CREATE_BILLING: '/api/seller/billing/create/',
  
//   // ==================== Payments ====================
//   RAZORPAY_CREATE_ORDER: '/api/seller/payments/razorpay/create-order/',
//   RAZORPAY_VERIFY: '/api/seller/payments/razorpay/verify/',
// } as const;

// console.log('🌐 Seller API Configuration:', {
//   baseUrl: API_BASE_URL,
//   environment: APP_ENV,
//   platform: Platform.OS
// });

// export default {
//   API_BASE_URL,
//   API_TIMEOUT,
//   APP_ENV,
//   ENDPOINTS
// };
