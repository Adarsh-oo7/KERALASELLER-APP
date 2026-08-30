import type { MainStackParamList } from '../navigation/types';

export const DAILY_TOOL_IDS = [
  'new_bill',
  'scan_bill',
  'add_product',
  'payments',
  'settings',
  'notifications',
  'analytics',
  'barcodes',
  'printers',
  'customers',
  'expenses',
  'purchases',
  'staff',
  'loyalty',
  'locations',
  'subscription',
  'addons',
] as const;

export type DailyToolId = (typeof DAILY_TOOL_IDS)[number];

export const DEFAULT_DAILY_TOOL_IDS: DailyToolId[] = [
  'new_bill',
  'scan_bill',
  'add_product',
  'payments',
  'settings',
  'notifications',
  'analytics',
];

export type DailyToolDef = {
  id: DailyToolId;
  label: string;
  hint: string;
  icon: string;
  permission?: string | string[];
  route: keyof MainStackParamList;
  params?: object;
  needsOnline?: boolean;
  needsLiveShop?: boolean;
};

export const DAILY_TOOLS: DailyToolDef[] = [
  { id: 'new_bill', label: 'New bill', hint: 'Walk-in · 3-day offline', icon: 'cash-outline', route: 'Billing', params: {}, permission: 'billing.access_pos' },
  { id: 'scan_bill', label: 'Scan bill', hint: 'Camera till', icon: 'scan-outline', route: 'Billing', params: { openScanner: true }, permission: 'billing.access_pos' },
  { id: 'add_product', label: 'Add product', hint: 'Catalogue', icon: 'add-circle-outline', route: 'ProductForm', params: {}, permission: 'products.create', needsOnline: true, needsLiveShop: true },
  { id: 'payments', label: 'Payments', hint: 'Razorpay & payouts', icon: 'card-outline', route: 'Payments' },
  { id: 'settings', label: 'Store settings', hint: 'Basic, advanced, delivery', icon: 'settings-outline', route: 'Settings' },
  { id: 'notifications', label: 'Alerts', hint: 'Buyer messages', icon: 'notifications-outline', route: 'Notifications' },
  { id: 'analytics', label: 'Analytics', hint: 'Sales snapshot', icon: 'stats-chart-outline', route: 'Analytics', permission: 'reports.view_basic' },
  { id: 'barcodes', label: 'Barcodes', hint: 'Packet codes', icon: 'barcode-outline', route: 'Barcodes', permission: ['products.view', 'billing.access_pos'] },
  { id: 'printers', label: 'Printers', hint: 'Bluetooth and thermal', icon: 'print-outline', route: 'Printers', permission: 'billing.access_pos' },
  { id: 'customers', label: 'Customers', hint: 'From bills and orders', icon: 'people-outline', route: 'Customers', permission: 'customers.view' },
  { id: 'expenses', label: 'Expenses', hint: 'Rent, petrol, other costs', icon: 'wallet-outline', route: 'Expenses', permission: 'expenses.view' },
  { id: 'purchases', label: 'Receive stock', hint: 'Purchase in', icon: 'download-outline', route: 'Purchases', permission: 'inventory.manage_purchases' },
  { id: 'staff', label: 'Staff', hint: 'Cashier logins', icon: 'people-circle-outline', route: 'Staff', permission: 'staff.view' },
  { id: 'loyalty', label: 'Loyalty', hint: 'Points on phone', icon: 'star-outline', route: 'Loyalty', permission: 'loyalty.view' },
  { id: 'locations', label: 'Locations', hint: 'Extra counters', icon: 'business-outline', route: 'Locations', permission: 'branches.view' },
  { id: 'subscription', label: 'Subscription', hint: 'Plan and extras', icon: 'sparkles-outline', route: 'Subscription' },
  { id: 'addons', label: 'Add-ons', hint: 'Buy only what this shop needs', icon: 'extension-puzzle-outline', route: 'Addons', permission: 'account.manage_subscription' },
];

const KNOWN = new Set<string>(DAILY_TOOL_IDS);

export function normalizeDailyToolIds(ids: unknown): DailyToolId[] {
  const unique: DailyToolId[] = [];
  if (Array.isArray(ids)) {
    for (const id of ids) {
      if (typeof id === 'string' && KNOWN.has(id) && !unique.includes(id as DailyToolId)) {
        unique.push(id as DailyToolId);
      }
    }
  }
  return unique;
}

export function visibleDailyTools(
  selectedIds: unknown,
  canUse: (permission?: string | string[]) => boolean,
): DailyToolDef[] {
  const selected = normalizeDailyToolIds(selectedIds);
  const ids = selected.length ? selected : DEFAULT_DAILY_TOOL_IDS;
  return ids
    .map((id) => DAILY_TOOLS.find((tool) => tool.id === id))
    .filter((tool): tool is DailyToolDef => Boolean(tool) && canUse(tool.permission));
}

export function moveDailyTool(ids: DailyToolId[], id: DailyToolId, direction: -1 | 1): DailyToolId[] {
  const index = ids.indexOf(id);
  if (index < 0) return ids;
  const next = index + direction;
  if (next < 0 || next >= ids.length) return ids;
  const copy = ids.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}
