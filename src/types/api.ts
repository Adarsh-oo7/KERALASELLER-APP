// ================================
// Registration & Authentication Types
// ================================

export interface SellerRegistrationData {
  name: string;
  shop_name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface OTPRequest {
  phone: string;
  name: string;
  shop_name: string;
  email: string;
}

export interface RegistrationRequest extends SellerRegistrationData {
  otp: string;
}

// ✅ Updated to match your Django response structure
export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    phone: string;
    shop_name: string;
    name: string;
    email: string;
  };
}

// ✅ Your actual Django response structure
export interface DjangoLoginResponse {
  message: string;
  seller: {
    id: number;
    phone: string;
    name: string;
    shop_name: string;
    email: string;
  };
  api_token: string;
  access_token: string;
  refresh_token: string;
  user_type: string;
  debug_info: {
    admin_user_id: number;
    admin_user_email: string;
    token_length: number;
  };
}

// ================================
// API Error Handling Types
// ================================

export interface ApiError {
  error?: string;
  message?: string;
  phone?: string[];
  email?: string[];
  otp?: string[];
  confirmPassword?: string[];
  name?: string[];
  shop_name?: string[];
  password?: string[];
  non_field_errors?: string[];
  detail?: string;
  [key: string]: any;
}

// ================================
// Store Profile Types
// ================================

export interface StoreProfile {
  id: number;
  name: string;
  description: string;
  whatsapp_number: string;
  tagline?: string;
  instagram_link?: string;
  facebook_link?: string;
  delivery_time_local?: string;
  delivery_time_national?: string;
  payment_method: string;
  accepts_cod: boolean;
  gst_number?: string;
  business_license?: string;
  owner_name?: string;
  business_address?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  logo_url?: string;
  banner_image_url?: string;
}

// ================================
// User & Seller Types
// ================================

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  shop_name: string;
  user_type: 'seller' | 'buyer' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface Seller extends User {
  store_profile?: StoreProfile;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_active: boolean;
}

// ================================
// Dashboard & Analytics Types
// ================================

export interface DashboardData {
  seller: Seller;
  has_store_profile: boolean;
  analytics: {
    total_revenue: number;
    total_orders: number;
    total_products: number;
    new_orders_count: number;
    top_selling_products: TopSellingProduct[];
  };
  recent_orders?: Order[];
  store_profile?: StoreProfile;
}

export interface TopSellingProduct {
  product__name: string;
  total_sold: number;
  product_id: number;
  revenue: number;
}

// ================================
// Product Types
// ================================

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discounted_price?: number;
  stock_quantity: number;
  category: string;
  subcategory?: string;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  seller: number;
  sku?: string;
  weight?: number;
  dimensions?: string;
  tags?: string[];
}

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  discounted_price?: string;
  stock_quantity: string;
  category: string;
  subcategory?: string;
  sku?: string;
  weight?: string;
  dimensions?: string;
  tags?: string;
}

// ================================
// Order Types
// ================================

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'cod' | 'razorpay' | 'upi';
  shipping_address: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  price: number;
  total_amount: number;
}

// ================================
// Subscription Types
// ================================

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
  product_limit: number | null;
  features: string[];
  is_popular: boolean;
}

export interface Subscription {
  id: number;
  plan: SubscriptionPlan;
  seller: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  payment_status: 'pending' | 'paid' | 'failed';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  days_remaining: number;
  auto_renew: boolean;
}

// ================================
// Billing & Payment Types
// ================================

export interface BillingInfo {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  billing_address?: string;
  items: BillingItem[];
  total_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  payment_method: 'cash' | 'card' | 'upi';
}

export interface BillingItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ================================
// API Response Types
// ================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ================================
// Form State Types
// ================================

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// ================================
// Navigation Types
// ================================

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  CreateShop: undefined;
  Dashboard: undefined;
  Products: undefined;
  AddProduct: undefined;
  Orders: undefined;
  OrderDetails: { orderId: number };
  History: undefined;
  Billing: undefined;
  Subscription: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Products: undefined;
  AddProduct: undefined;
  Orders: undefined;
  History: undefined;
};

// ================================
// Utility Types
// ================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ================================
// File Upload Types
// ================================

export interface FileUpload {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

export interface ImageUpload extends FileUpload {
  width?: number;
  height?: number;
}

// ================================
// Configuration Types
// ================================

export interface AppConfig {
  API_BASE_URL: string;
  ENVIRONMENT: 'development' | 'production';
  VERSION: string;
  FEATURES: {
    REGISTRATION_ENABLED: boolean;
    PAYMENTS_ENABLED: boolean;
    ANALYTICS_ENABLED: boolean;
  };
}

// ================================
// Export all types for easy importing
// ================================

export type {
  // Re-export main types for convenience
  SellerRegistrationData as RegistrationData,
  DjangoLoginResponse as AuthResponse,
  StoreProfile as Store,
  Product as ProductType,
  Order as OrderType,
};
