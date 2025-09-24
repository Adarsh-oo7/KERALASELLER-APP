export const API_CONFIG = {
    // Development (your local Django server)
    development: {
      baseURL: 'http://192.168.1.7:8000', // Your local IP
      timeout: 15000,
    },
    
    // Production (your deployed backend)
    production: {
      baseURL: 'https://keralaseller-backend.onrender.com', // Your Render URL
      timeout: 20000,
    },
    
    // Switch this when going live
    current: 'development' as 'development' | 'production',
  };
  
  export const getApiConfig = () => {
    return API_CONFIG[API_CONFIG.current];
  };
  
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
  