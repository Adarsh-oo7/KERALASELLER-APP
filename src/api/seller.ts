import AsyncStorage from '@react-native-async-storage/async-storage';

import api from './api';
import { asList } from '../lib/format';
import { findProductByCode, storedBarcode } from '../lib/barcode';
import { cacheProducts, enqueueLocalBill, getCachedProducts } from '../lib/offlineStore';
import { isNetworkError } from '../lib/offlineWindow';
import { mergeSellingStatus } from '../lib/sellingStatus';
import { createTtlCache } from '../lib/ttlCache';
import { isMissingRoute } from '../lib/userApiUtils';

export {
  canonicalShopPath,
  mergeSellingStatus,
  publicShopUrl,
  storeLogoUrl,
  storeProfileIsReady,
  storeWhatsapp,
} from '../lib/sellingStatus';

export type Product = {
  id: number;
  name: string;
  model_name?: string | null;
  description?: string | null;
  price: number | string;
  mrp?: number | string | null;
  total_stock: number;
  online_stock: number;
  sale_type: 'BOTH' | 'ONLINE' | 'OFFLINE';
  main_image_url?: string | null;
  thumbnail_url?: string | null;
  category?: number | { id: number; name?: string } | null;
  is_active?: boolean;
  weight_kg?: number | string | null;
  sku?: string | null;
  barcode?: string | null;
  cost_price?: number | string | null;
  hsn_code?: string | null;
  gst_rate?: number | string | null;
  show_on_homepage?: boolean;
  low_stock_threshold?: number;
  attributes?: Record<string, string | number | null> | null;
  sub_images?: ProductSubImage[];
  variants?: ProductVariant[];
};

export type ProductSubImage = {
  id?: number;
  image_url?: string | null;
  thumbnail_url?: string | null;
  cloudinary_url?: string | null;
  cloudinary_image_url?: string | null;
  cloudinary_public_id?: string | null;
};

export type ProductVariant = {
  id: number;
  name: string;
  price?: number | string | null;
  mrp?: number | string | null;
  selling_price?: number | string;
  total_stock: number;
  online_stock?: number;
  sku?: string;
  barcode?: string;
  attributes?: Record<string, string | number | null> | null;
  is_active?: boolean;
};

export type CategoryAttribute = {
  id?: number;
  name: string;
};

export type Category = {
  id: number;
  name: string;
  parent?: number | null;
  children?: { id: number; name: string }[];
  default_attributes?: CategoryAttribute[];
};

export type ProductVariantPayload = {
  name: string;
  price?: number | null;
  total_stock?: number;
  online_stock?: number;
  sku?: string;
  barcode?: string;
  attributes?: Record<string, string>;
};

export type OrderItem = {
  id: number;
  quantity: number;
  price: number | string;
  item_total?: number;
  product?: Product;
};

export type Order = {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: string;
  total_amount: number | string;
  formatted_total?: string;
  status: string;
  created_at: string;
  payment_method?: string;
  payment_status?: string;
  order_type?: string;
  shipping_provider?: string | null;
  tracking_id?: string | null;
  shipping_notes?: string | null;
  items?: OrderItem[];
  items_count?: number;
};

export type StoreProfile = {
  name?: string;
  description?: string;
  tagline?: string;
  whatsapp_number?: string;
  whatsappnumber?: string;
  instagram_link?: string | null;
  facebook_link?: string | null;
  delivery_time_local?: string;
  delivery_time_national?: string;
  accepts_cod?: boolean;
  store_slug?: string;
  seller_phone?: string | null;
  logo_url?: string | null;
  banner_1_url?: string | null;
  banner_2_url?: string | null;
  banner_3_url?: string | null;
  cloudinary_logo?: { url?: string; public_id?: string } | null;
  cloudinary_banner_1?: { url?: string; public_id?: string } | null;
  cloudinary_banner_2?: { url?: string; public_id?: string } | null;
  cloudinary_banner_3?: { url?: string; public_id?: string } | null;
  predefined_banner_1?: number | { id: number } | null;
  predefined_banner_2?: number | { id: number } | null;
  predefined_banner_3?: number | { id: number } | null;
  business_address?: string | null;
  owner_name?: string | null;
  gst_number?: string | null;
  business_license?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  verification_status?: 'pending' | 'verified' | 'rejected' | string | null;
  verification_doc_url?: string | null;
  homepage_listing_status?: 'not_requested' | 'pending' | 'approved' | 'rejected' | string | null;
  is_profile_complete?: boolean;
  terms_and_conditions?: string | null;
  privacy_policy?: string | null;
  cancellation_refund_policy?: string | null;
  shipping_delivery_policy?: string | null;
  print_paper_size?: string | null;
  print_footer_message?: string | null;
  print_copies?: number | null;
  official_url?: string | null;
  shop_name_policy?: {
    max_changes?: number;
    window_days?: number;
    changes_used?: number;
    changes_remaining?: number;
    can_change?: boolean;
    next_change_at?: string | null;
    current_slug?: string;
    preview_slug?: string;
    preview_path_url?: string | null;
    preview_subdomain_url?: string | null;
    message?: string;
  };
};

export type PredefinedBanner = {
  id: number;
  name?: string;
  image_url: string;
  category?: string;
  is_active?: boolean;
};

export type DashboardPayload = {
  seller?: {
    id?: number;
    name?: string;
    phone?: string;
    shop_name?: string;
    email?: string;
  };
  analytics?: {
    total_revenue?: number;
    total_orders?: number;
    total_products?: number;
    total_customers?: number;
    unread_notifications_count?: number;
    new_orders_count?: number;
    top_selling_products?: { product__name?: string; total_sold?: number }[];
  };
  has_store_profile?: boolean;
};

export type NotificationItem = {
  id: number;
  title?: string;
  message?: string;
  verb?: string;
  description?: string;
  is_read?: boolean;
  created_at?: string;
};

export type StockHistoryItem = {
  id: number;
  product?: number | { id: number; name?: string };
  action?: string;
  change_total?: number;
  change_online?: number;
  note?: string;
  timestamp?: string;
};

const productsCache = createTtlCache<Product[]>(45_000);
const dashboardCache = createTtlCache<DashboardPayload>(20_000);
const sellingCache = createTtlCache<OnboardingStatus>(60_000);

export async function fetchDashboard(): Promise<DashboardPayload> {
  return dashboardCache.get(async () => {
    const response = await api.get<DashboardPayload>('/user/dashboard/');
    return response.data;
  });
}

export async function readLocalProducts(): Promise<Product[]> {
  const memory = productsCache.peek();
  if (memory?.length) return memory;
  const disk = await getCachedProducts<Product>();
  if (disk.length) productsCache.seed(disk, 0);
  return disk;
}

export function invalidateProductCache() {
  productsCache.invalidate();
}

async function rememberProduct(product: Product) {
  const disk = await getCachedProducts<Product>();
  if (!disk.length) {
    productsCache.invalidate();
    return;
  }
  const next = disk.some((row) => row.id === product.id)
    ? disk.map((row) => (row.id === product.id ? { ...row, ...product } : row))
    : [product, ...disk];
  productsCache.seed(next);
  await cacheProducts(next);
}

export async function fetchStoreProfile(): Promise<StoreProfile> {
  const response = await api.get<
    StoreProfile | { store_profile?: StoreProfile; seller?: { phone?: string } }
  >('/user/store/profile/');
  const data = response.data;
  const wrapperPhone =
    data && typeof data === 'object' && 'seller' in data
      ? (data as { seller?: { phone?: string } }).seller?.phone
      : undefined;
  if (data && typeof data === 'object' && 'store_profile' in data && data.store_profile) {
    return { ...data.store_profile, seller_phone: wrapperPhone || data.store_profile.seller_phone };
  }
  return { ...(data ?? {}), seller_phone: wrapperPhone } as StoreProfile;
}

export function predefinedBannerId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  if (value && typeof value === 'object' && 'id' in value) {
    const id = Number((value as { id: unknown }).id);
    return Number.isFinite(id) ? id : null;
  }
  return null;
}

export function selectedPredefinedBannerIds(profile: StoreProfile): number[] {
  return [
    predefinedBannerId(profile.predefined_banner_1),
    predefinedBannerId(profile.predefined_banner_2),
    predefinedBannerId(profile.predefined_banner_3),
  ].filter((id): id is number => id != null);
}

export async function fetchPredefinedBanners(): Promise<PredefinedBanner[]> {
  const response = await api.get('/api/predefined-banners/');
  return asList<PredefinedBanner>(response.data).filter(
    (banner) => banner.is_active !== false && Boolean(banner.image_url),
  );
}

export async function patchStoreProfile(payload: Partial<StoreProfile>): Promise<StoreProfile> {
  const response = await api.patch('/user/store/profile/', payload);
  const data = response.data as StoreProfile | { store_profile?: StoreProfile };
  if (data && typeof data === 'object' && 'store_profile' in data && data.store_profile) {
    return data.store_profile;
  }
  return (data ?? {}) as StoreProfile;
}

export type HomepageListing = {
  status: 'not_requested' | 'pending' | 'approved' | 'rejected' | string;
  verification_status?: string;
  listed?: boolean;
  can_submit?: boolean;
  missing?: string[];
  missing_labels?: string[];
  note?: string;
  requested_at?: string | null;
  reviewed_at?: string | null;
  location?: {
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: string | null;
    longitude?: string | null;
    business_address?: string;
  };
  business?: {
    owner_name?: string;
    gst_number?: string;
    business_license?: string;
    verification_doc_url?: string | null;
  };
  message?: string;
  error?: string;
  products?: {
    id: number;
    name: string;
    sale_type?: string;
    eligible?: boolean;
    show_on_homepage?: boolean;
  }[];
};

export async function fetchHomepageListing(): Promise<HomepageListing> {
  const response = await api.get<HomepageListing>('/user/store/homepage-listing/');
  return response.data;
}

export async function saveHomepageListing(payload: Record<string, unknown>): Promise<HomepageListing> {
  const response = await api.patch<HomepageListing>('/user/store/homepage-listing/', payload);
  return response.data;
}

export async function submitHomepageListing(payload: Record<string, unknown>): Promise<HomepageListing> {
  const response = await api.post<HomepageListing>('/user/store/homepage-listing/', payload);
  return response.data;
}

export type DeliveryConfig = {
  id?: number;
  enabled?: boolean;
  fallback_flat_charge?: number | string | null;
  cod_extra_charge?: number | string | null;
  free_delivery_above?: number | string | null;
};

export type WeightSlab = {
  id?: number | string;
  min_weight_kg: number | string;
  max_weight_kg?: number | string | null;
  pricing_type: 'FIXED' | 'PER_KG';
  fixed_price?: number | string | null;
  price_per_kg?: number | string | null;
  base_fee?: number | string | null;
  sort_order?: number;
  is_new?: boolean;
};

export const TYPICAL_KERALA_SLABS: WeightSlab[] = [
  { min_weight_kg: 0, max_weight_kg: 0.5, pricing_type: 'FIXED', fixed_price: 40, price_per_kg: 0, base_fee: 0 },
  { min_weight_kg: 0.5, max_weight_kg: 1, pricing_type: 'FIXED', fixed_price: 50, price_per_kg: 0, base_fee: 0 },
  { min_weight_kg: 1, max_weight_kg: 2, pricing_type: 'FIXED', fixed_price: 70, price_per_kg: 0, base_fee: 0 },
  { min_weight_kg: 2, max_weight_kg: 5, pricing_type: 'FIXED', fixed_price: 100, price_per_kg: 0, base_fee: 0 },
  { min_weight_kg: 5, max_weight_kg: null, pricing_type: 'PER_KG', fixed_price: 0, price_per_kg: 20, base_fee: 40 },
];

function money(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function previewDeliveryCharge(
  weightKg: number,
  subtotal: number,
  isCod: boolean,
  config: DeliveryConfig,
  slabs: WeightSlab[],
): number {
  if (!config.enabled || slabs.length === 0) return 0;
  const freeAbove = money(config.free_delivery_above);
  if (freeAbove > 0 && subtotal >= freeAbove) {
    return isCod ? money(config.cod_extra_charge) : 0;
  }
  const match = [...slabs].sort((a, b) => money(a.min_weight_kg) - money(b.min_weight_kg)).find((slab) => {
    const min = money(slab.min_weight_kg);
    const max = slab.max_weight_kg == null || slab.max_weight_kg === '' ? null : money(slab.max_weight_kg);
    return weightKg >= min && (max == null || weightKg <= max);
  });
  let charge = 0;
  if (!match) {
    charge = money(config.fallback_flat_charge);
  } else if (match.pricing_type === 'PER_KG') {
    charge = money(match.base_fee) + weightKg * money(match.price_per_kg);
  } else {
    charge = money(match.fixed_price);
  }
  if (isCod) charge += money(config.cod_extra_charge);
  return Math.round(charge * 100) / 100;
}

export async function fetchDeliveryConfig(): Promise<DeliveryConfig> {
  const response = await api.get<DeliveryConfig>('/user/store/delivery-slabs/config/');
  return response.data;
}

export async function saveDeliveryConfig(payload: Partial<DeliveryConfig>): Promise<DeliveryConfig> {
  const response = await api.post<{ config?: DeliveryConfig } | DeliveryConfig>(
    '/user/store/delivery-slabs/update_config/',
    payload,
  );
  const data = response.data;
  if (data && typeof data === 'object' && 'config' in data && data.config) return data.config;
  return (data ?? {}) as DeliveryConfig;
}

export async function fetchDeliverySlabs(): Promise<WeightSlab[]> {
  const response = await api.get('/user/store/delivery-slabs/slabs/');
  return asList<WeightSlab>(response.data);
}

export async function createDeliverySlab(payload: Omit<WeightSlab, 'id' | 'is_new'>): Promise<WeightSlab> {
  const response = await api.post<WeightSlab>('/user/store/delivery-slabs/create_slab/', payload);
  return response.data;
}

export async function updateDeliverySlab(id: number, payload: Partial<WeightSlab>): Promise<WeightSlab> {
  const response = await api.patch<WeightSlab>(`/user/store/delivery-slabs/${id}/update_slab/`, payload);
  return response.data;
}

export async function deleteDeliverySlab(id: number): Promise<void> {
  await api.delete(`/user/store/delivery-slabs/${id}/delete_slab/`);
}

export async function fetchProducts(params?: { page_size?: number; fresh?: boolean }): Promise<Product[]> {
  const pageSize = params?.page_size ?? 200;
  if (!params?.fresh && !productsCache.peek()) {
    await readLocalProducts();
  }
  try {
    return await productsCache.get(async () => {
      const response = await api.get('/user/store/products/', { params: { page_size: pageSize } });
      const list = asList<Product>(response.data);
      await cacheProducts(list);
      return list;
    }, params?.fresh);
  } catch (error) {
    if (isNetworkError(error)) {
      const cached = await readLocalProducts();
      if (cached.length > 0) return cached;
    }
    throw error;
  }
}

export async function fetchProduct(id: number): Promise<Product> {
  const response = await api.get<Product>(`/user/store/products/${id}/`);
  return response.data;
}

export async function saveProduct(payload: Record<string, unknown>, id?: number): Promise<Product> {
  const response = id
    ? await api.patch<Product>(`/user/store/products/${id}/`, payload)
    : await api.post<Product>('/user/store/products/', payload);
  invalidateProductCache();
  const saved = response.data;
  if (saved?.id) await rememberProduct(saved);
  return saved;
}

export async function lookupProductByCode(raw: string): Promise<{ product: Product; variantId?: number } | null> {
  const code = storedBarcode(raw);
  if (!code) return null;
  const response = await api.get('/user/store/products/', { params: { barcode: code, page_size: 20 } });
  return findProductByCode(asList<Product>(response.data), code);
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/user/store/products/${id}/`);
  invalidateProductCache();
}

export async function updateStock(
  id: number,
  payload: { total_stock?: number; online_stock?: number; note?: string },
): Promise<void> {
  await api.patch(`/user/store/products/${id}/update-stock/`, payload);
  invalidateProductCache();
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get('/api/categories/');
  return asList<Category>(response.data);
}

export async function createCategory(payload: { name: string; parent?: number | null }): Promise<Category> {
  const response = await api.post<Category>('/api/categories/', {
    name: payload.name.trim(),
    parent: payload.parent ?? null,
  });
  return response.data;
}

export async function addCategoryAttribute(categoryId: number, name: string): Promise<CategoryAttribute> {
  const response = await api.post<CategoryAttribute>(`/api/categories/${categoryId}/attributes/`, {
    name: name.trim(),
  });
  return response.data;
}

export async function saveProductVariant(
  productId: number,
  payload: ProductVariantPayload,
  variantId?: number,
): Promise<ProductVariant> {
  const response = variantId
    ? await api.patch<ProductVariant>(`/user/store/products/${productId}/variants/${variantId}/`, payload)
    : await api.post<ProductVariant>(`/user/store/products/${productId}/variants/`, payload);
  invalidateProductCache();
  return response.data;
}

export async function deleteProductVariant(productId: number, variantId: number): Promise<void> {
  await api.delete(`/user/store/products/${productId}/variants/${variantId}/`);
  invalidateProductCache();
}

export async function fetchOrders(params?: Record<string, string>): Promise<Order[]> {
  const response = await api.get('/user/orders/', { params: { page_size: 50, ...params } });
  return asList<Order>(response.data);
}

export async function fetchOrder(id: number): Promise<Order> {
  const response = await api.get<Order>(`/user/orders/${id}/`);
  return response.data;
}

export async function updateOrderStatus(
  id: number,
  payload: {
    status: string;
    shipping_provider?: string;
    tracking_id?: string;
    shipping_notes?: string;
  },
): Promise<Order> {
  const response = await api.patch<Order>(`/user/orders/${id}/update_status/`, payload);
  return response.data;
}

export async function postLocalBillToApi(payload: {
  customer_name: string;
  customer_phone: string;
  items: { id: number; quantity: number; price: number; variant_id?: number }[];
  seller_phone?: string;
  payment_method?: string;
  payments?: { method: string; amount: number }[];
  coupon_code?: string;
  loyalty_points?: number;
}): Promise<LocalBill> {
  const sellerPhone = payload.seller_phone || (await AsyncStorage.getItem('userPhone')) || '';
  const response = await api.post<LocalBill>('/user/orders/create-local-bill/', {
    ...payload,
    seller_phone: sellerPhone,
  });
  return response.data;
}

export type LocalBillItem = {
  id?: number;
  product_id?: number;
  variant_id?: number | null;
  name?: string;
  variant_name?: string;
  quantity: number;
  sku?: string;
  price: number | string;
};

export type LocalBill = {
  id?: number;
  bill_id: string;
  bill_number?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount: number | string;
  created_at?: string | null;
  queued?: boolean;
  items?: LocalBillItem[];
  print_url?: string;
  pdf_url?: string;
};

type LocalBillPayload = {
  customer_name: string;
  customer_phone: string;
  items: { id: number; quantity: number; price: number; variant_id?: number }[];
  payment_method?: string;
  payments?: { method: string; amount: number }[];
  coupon_code?: string;
  loyalty_points?: number;
};

export async function fetchLocalBills(): Promise<LocalBill[]> {
  const response = await api.get('/user/orders/local-bills/');
  return asList<LocalBill>(response.data);
}

export async function fetchLocalBill(id: number): Promise<LocalBill> {
  const response = await api.get<LocalBill>(`/user/orders/local-bills/${id}/`);
  return response.data;
}

export async function updateLocalBill(id: number, payload: LocalBillPayload): Promise<LocalBill> {
  const sellerPhone = (await AsyncStorage.getItem('userPhone')) || '';
  const response = await api.post<LocalBill>(`/user/orders/local-bills/${id}/update/`, {
    ...payload,
    seller_phone: sellerPhone,
  });
  return response.data;
}

export async function cancelLocalBill(id: number): Promise<LocalBill> {
  const response = await api.post<LocalBill>(`/user/orders/local-bills/${id}/cancel/`, {});
  return response.data;
}

async function ordersGet<T>(path: string, config?: { params?: Record<string, string>; responseType?: 'text' | 'arraybuffer' | 'blob'; headers?: Record<string, string>; transformResponse?: ((data: unknown) => unknown)[] }) {
  const normalised = path.replace(/^\/+/, '');
  try {
    return await api.get<T>(`/user/orders/${normalised}`, config);
  } catch (error) {
    if (!isMissingRoute(error)) throw error;
    return api.get<T>(`/api/orders/${normalised}`, config);
  }
}

export async function fetchLocalBillHtml(id: number, opts?: { size?: string; layout?: string }): Promise<string> {
  const params: Record<string, string> = { size: opts?.size || 'A4' };
  if (opts?.layout) params.layout = opts.layout;
  const response = await ordersGet<string>(`local-bills/${id}/print/`, {
    params,
    responseType: 'text',
    headers: { Accept: 'text/html' },
    transformResponse: [(data) => data],
  });
  return typeof response.data === 'string' ? response.data : String(response.data ?? '');
}

export async function fetchLocalBillEscpos(id: number, size?: string): Promise<string> {
  const response = await ordersGet<{ escpos_base64?: string; data?: string }>(`local-bills/${id}/escpos/`, {
    params: { size: size || '80mm' },
  });
  return String(response.data?.escpos_base64 || response.data?.data || '');
}

export async function createLocalBill(
  payload: LocalBillPayload,
  opts?: { queueIfOffline?: boolean; forceQueue?: boolean },
): Promise<LocalBill> {
  const sellerPhone = (await AsyncStorage.getItem('userPhone')) || '';
  const body = { ...payload, seller_phone: sellerPhone };

  if (opts?.forceQueue) {
    return enqueueLocalBill(body);
  }

  try {
    return await postLocalBillToApi(body);
  } catch (error) {
    if (opts?.queueIfOffline && isNetworkError(error)) {
      return enqueueLocalBill(body);
    }
    throw error;
  }
}

export async function deleteSellerAccount(): Promise<void> {
  await api.post('/user/seller/delete-account/', {});
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const response = await api.get('/api/notifications/');
  return asList<NotificationItem>(response.data);
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/api/notifications/${id}/mark-as-read/`, {});
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/api/notifications/mark-all-read/', {});
}

export async function fetchStockHistory(): Promise<StockHistoryItem[]> {
  const response = await api.get('/user/store/stock-history/');
  return asList<StockHistoryItem>(response.data);
}

export type PlanFeature = {
  code: string;
  name: string;
  description?: string | null;
  is_implemented?: boolean;
};

export type SubscriptionPlan = {
  id: number;
  name: string;
  price: number | string;
  product_limit?: number | null;
  max_staff?: number | null;
  max_branches?: number | null;
  duration_days?: number;
  yearly_price?: number;
  yearly_savings?: number;
  is_popular?: boolean;
  allows_custom_subdomain?: boolean;
  description?: string;
  features?: PlanFeature[];
  feature_codes?: string[];
};

export type ActiveAddon = {
  id?: number;
  purchase_id?: number;
  name: string;
  slug?: string;
  price: number | string;
  billing_period?: string;
  end_date?: string | null;
};

export type CurrentSubscription = {
  id?: number;
  plan_name?: string;
  is_active?: boolean;
  days_remaining?: number;
  product_limit?: number | null;
  plan?: SubscriptionPlan | null;
  seller?: { name?: string; email?: string };
  entitlements?: {
    plan_id?: number | null;
    plan_name?: string;
    features?: string[];
    limits?: {
      max_products?: number | null;
      max_staff?: number | null;
      max_branches?: number | null;
    };
    official_url?: string | null;
    path_url?: string | null;
    can_use_custom_subdomain?: boolean;
    billing?: {
      base_plan_price?: string;
      addons_price?: string;
      monthly_total?: string;
      active_addons?: ActiveAddon[];
    };
  };
};

export type SubscriptionOrder = {
  order_id: string;
  amount: number;
  currency?: string;
  plan_name?: string;
  billing_cycle?: string;
};

export async function fetchSubscription(): Promise<CurrentSubscription | null> {
  try {
    const response = await api.get<CurrentSubscription>('/api/subscriptions/current/');
    return response.data;
  } catch {
    return null;
  }
}

export async function fetchPlans(): Promise<SubscriptionPlan[]> {
  const response = await api.get('/api/subscriptions/plans/');
  return asList<SubscriptionPlan>(response.data);
}

export async function createSubscriptionOrder(payload: {
  plan_id: number;
  billing_cycle: 'monthly' | 'yearly';
  addon_ids?: number[];
}): Promise<SubscriptionOrder> {
  const response = await api.post<SubscriptionOrder>('/api/subscriptions/create-order/', payload);
  return response.data;
}

export async function verifySubscriptionPayment(payload: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  plan_id: number;
  billing_cycle: 'monthly' | 'yearly';
}): Promise<void> {
  await api.post('/api/subscriptions/verify-payment/', payload);
}

export type CatalogAddon = {
  id: number;
  name: string;
  slug?: string;
  price: number | string;
  description?: string;
  billing_period?: string;
  extra_product_limit?: number | null;
  extra_staff_limit?: number | null;
  extra_branch_limit?: number | null;
  extra_category_limit?: number | null;
  feature_codes?: string[];
  compatible_plan_ids?: number[];
};

export type EntitlementsPayload = {
  commercially_active?: boolean;
  official_url?: string | null;
  path_url?: string | null;
  can_use_custom_subdomain?: boolean;
  subdomain_provisioning_status?: string | null;
  features?: string[];
  plan_id?: number | null;
  plan_name?: string | null;
  addons?: CatalogAddon[];
  billing?: {
    base_plan_price?: string;
    addons_price?: string;
    monthly_total?: string;
    active_addons?: ActiveAddon[];
  };
};

export async function fetchEntitlements(): Promise<EntitlementsPayload> {
  const response = await api.get<EntitlementsPayload>('/api/subscriptions/entitlements/');
  return response.data;
}

export async function fetchAddons(): Promise<CatalogAddon[]> {
  const response = await api.get('/api/subscriptions/addons/');
  return asList<CatalogAddon>(response.data);
}

export async function createAddonOrder(addonId: number): Promise<SubscriptionOrder & { key_id?: string; addon_name?: string }> {
  const response = await api.post<SubscriptionOrder & { key_id?: string; addon_name?: string }>(
    '/api/subscriptions/addons/create-order/',
    { addon_id: addonId },
  );
  return response.data;
}

export async function verifyAddonPayment(payload: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  addon_id: number;
}): Promise<void> {
  await api.post('/api/subscriptions/addons/verify-payment/', payload);
}

export async function cancelAddon(payload: { purchase_id?: number; addon_id?: number }): Promise<EntitlementsPayload> {
  const response = await api.post<EntitlementsPayload & { entitlements?: EntitlementsPayload }>(
    '/api/subscriptions/addons/cancel/',
    payload,
  );
  return response.data.entitlements || response.data;
}

export async function fetchGatewayStatus(): Promise<Record<string, unknown>> {
  const response = await api.get('/api/payments/account/gateway_status/');
  return response.data ?? {};
}

export async function fetchPayoutHistory(): Promise<unknown> {
  const response = await api.get('/api/payments/payouts/history/');
  return response.data;
}

export async function connectRazorpay(payload: {
  key_id: string;
  key_secret: string;
  webhook_secret?: string | null;
}): Promise<void> {
  await api.post('/api/payments/account/connect_razorpay/', payload);
}

export type OnboardingStatus = {
  is_ready_to_sell?: boolean;
  shop_link_live?: boolean;
  store_url?: string | null;
  missing_steps?: string[];
  missing_step_messages?: string[];
  can_add_products?: boolean;
  store_setup_completed?: boolean;
  has_active_subscription?: boolean;
  subscription_active?: boolean;
  razorpay_connected?: boolean;
  seller_phone?: string | null;
  requirements?: {
    store_profile?: {
      complete?: boolean;
      profile_complete?: boolean;
      logo_uploaded?: boolean;
    };
    payment_gateway?: { complete?: boolean };
    subscription?: { complete?: boolean };
    is_live?: boolean;
  };
};

export async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  const response = await api.get<OnboardingStatus>('/user/seller/onboarding/status/');
  return response.data ?? {};
}

export async function fetchSellingStatus(): Promise<OnboardingStatus> {
  return sellingCache.get(async () => {
    const [status, profile, subscription, gateway] = await Promise.all([
      fetchOnboardingStatus().catch(() => null),
      fetchStoreProfile().catch(() => null),
      fetchSubscription().catch(() => null),
      fetchGatewayStatus().catch(() => ({}) as Record<string, unknown>),
    ]);
    return mergeSellingStatus({ status, profile, subscription, gateway });
  });
}

export async function fetchNotificationCount(): Promise<{ orders?: number; notifications?: number } | number> {
  const response = await api.get('/api/notifications/count/');
  return response.data;
}

export type StoreStaffMember = {
  id: number;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
  is_store_owner: boolean;
  permissions?: string[];
};

export type StaffCatalog = {
  staff: StoreStaffMember[];
  max_staff?: number | null;
  staff_used?: number;
  catalog?: { roles?: { code: string; name: string }[] };
};

export async function fetchStaff(): Promise<StaffCatalog> {
  const response = await api.get<StaffCatalog>('/user/staff/');
  return response.data;
}

export async function createStaff(payload: {
  name: string;
  phone: string;
  password: string;
  role: string;
}): Promise<StoreStaffMember> {
  const response = await api.post<StoreStaffMember>('/user/staff/', payload);
  return response.data;
}

export async function updateStaff(id: number, payload: { is_active?: boolean; role?: string }): Promise<StoreStaffMember> {
  const response = await api.patch<StoreStaffMember>(`/user/staff/${id}/`, payload);
  return response.data;
}

export type StaffMe = {
  is_owner?: boolean;
  allowed_permissions?: string[];
  entitlements?: EntitlementsPayload;
};

export async function fetchStaffMe(): Promise<StaffMe> {
  const response = await api.get<StaffMe>('/user/staff/me/');
  return response.data;
}

export async function fetchReportSummary(): Promise<Record<string, any>> {
  const response = await api.get('/user/orders/reports/summary/');
  return response.data;
}

export async function fetchReportAdvanced(): Promise<Record<string, any>> {
  const response = await api.get('/user/orders/reports/advanced/');
  return response.data;
}

export async function fetchReportProfit(): Promise<Record<string, any>> {
  const response = await api.get('/user/orders/reports/profit/');
  return response.data;
}

export async function fetchStoreCustomers(): Promise<{ phone: string; name: string; orders: number; total_purchases: number }[]> {
  const response = await api.get('/user/orders/customers/');
  return response.data.customers || [];
}

export async function fetchCustomerHistory(phone: string): Promise<{ orders: { id: number; bill_number?: string; order_type: string; total_amount: number }[] }> {
  const response = await api.get(`/user/orders/customers/${phone}/history/`);
  return response.data;
}

async function storeGet<T>(path: string) {
  const normalised = path.replace(/^\/+/, '');
  try {
    return await api.get<T>(`/user/store/${normalised}`);
  } catch (error) {
    if (!isMissingRoute(error)) throw error;
    return api.get<T>(`/api/store/${normalised}`);
  }
}

async function storePost<T>(path: string, body: unknown) {
  const normalised = path.replace(/^\/+/, '');
  try {
    return await api.post<T>(`/user/store/${normalised}`, body);
  } catch (error) {
    if (!isMissingRoute(error)) throw error;
    return api.post<T>(`/api/store/${normalised}`, body);
  }
}

export type StoreExpense = {
  id: number;
  title: string;
  amount: number;
  category: string;
  spent_on?: string;
};

export async function fetchExpenses(): Promise<StoreExpense[]> {
  const response = await storeGet<{ expenses?: StoreExpense[] } | StoreExpense[]>('expenses/');
  return asList<StoreExpense>(response.data);
}

export async function createExpense(payload: { title: string; amount: number; category?: string }): Promise<void> {
  await storePost('expenses/', payload);
}

export async function fetchSuppliers(): Promise<{ id: number; name: string; phone?: string }[]> {
  const response = await api.get('/user/store/suppliers/');
  return response.data.suppliers || [];
}

export async function createSupplier(payload: { name: string; phone?: string }): Promise<{ id: number; name: string }> {
  const response = await api.post('/user/store/suppliers/', payload);
  return response.data;
}

export async function fetchPurchases(): Promise<{ id: number; status: string; items: { name: string; quantity: number }[] }[]> {
  const response = await api.get('/user/store/purchases/');
  return response.data.purchases || [];
}

export async function createPurchase(payload: {
  supplier_id?: number;
  items: { product_id: number; quantity: number; unit_cost?: number }[];
}): Promise<void> {
  await api.post('/user/store/purchases/', payload);
}

export async function fetchBranches(): Promise<{ id: number; name: string; address?: string; is_primary: boolean }[]> {
  const response = await api.get('/user/store/branches/');
  return response.data.branches || [];
}

export async function createBranch(payload: { name: string; address?: string }): Promise<void> {
  await api.post('/user/store/branches/', payload);
}

export async function lookupLoyalty(phone: string): Promise<{ phone: string; balance: number }> {
  const response = await api.get('/user/store/loyalty/', { params: { phone } });
  return response.data;
}

export async function adjustLoyalty(payload: { phone: string; points: number; note?: string }): Promise<{ balance: number }> {
  const response = await api.post('/user/store/loyalty/adjust/', payload);
  return response.data;
}
