/**
 * Single source of truth for the mobile app's backend base URL.
 *
 * Set EXPO_PUBLIC_API_BASE_URL (for example to http://<your-LAN-IP>:8000) when
 * running against a local Django server. Release builds fall back to the
 * production API, so no developer machine address can ship to users.
 */

import { PRODUCTION_API_BASE_URL } from './public';

const PRODUCTION_BASE_URL = PRODUCTION_API_BASE_URL;

const envBaseURL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

/**
 * Release / Play builds always hit the live API. A LAN address in `.env`
 * must never ship inside the AAB.
 */
export const API_BASE_URL = (
  !__DEV__ ? PRODUCTION_BASE_URL : envBaseURL || PRODUCTION_BASE_URL
).replace(/\/+$/, '');

export const API_TIMEOUT = 20000;

export const getApiConfig = () => ({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

  // Your actual backend endpoints
  export const ENDPOINTS = {
    // Auth endpoints
    login: '/auth/login/',           // Your Django auth login
    register: '/auth/register/',     // Your Django auth register
    
    // User/Seller endpoints
    profile: '/user/profile/',       // User profile
    seller_profile: '/seller/profile/', // Seller specific profile
    
    // Product endpoints (for sellers)
    products: '/products/',          // CRUD operations for products
    categories: '/categories/',      // Product categories
    
    // Orders endpoints
    orders: '/orders/',              // Seller orders
    
    // Dashboard/Stats
    dashboard: '/seller/dashboard/', // Seller dashboard stats
  };
  