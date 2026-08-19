export type PlanFeature = {
  code: string;
  name: string;
  description?: string | null;
  is_implemented?: boolean;
};

export type PlanLimits = {
  max_products?: number | null;
  max_staff?: number | null;
  max_branches?: number | null;
  max_categories?: number | null;
};

export type CatalogPlan = {
  id?: number;
  name?: string;
  description?: string | null;
  product_limit?: number | null;
  max_staff?: number | null;
  max_branches?: number | null;
  allows_custom_subdomain?: boolean;
  features?: Array<PlanFeature | string> | null;
  feature_codes?: string[];
};

export type CurrentPlanSource = {
  plan_name?: string;
  product_limit?: number | null;
  plan?: CatalogPlan | null;
  entitlements?: {
    features?: string[];
    limits?: PlanLimits;
    official_url?: string | null;
    path_url?: string | null;
  } | null;
};

export type PlanDetailLine = {
  key: string;
  text: string;
};

function hasOwn(obj: object | null | undefined, key: string): boolean {
  return Boolean(obj) && Object.prototype.hasOwnProperty.call(obj, key);
}

export function limitLabel(
  count: number | null | undefined,
  singular: string,
  plural: string,
  unlimited: string,
): string {
  if (count == null) return unlimited;
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

export function humanizeFeatureCode(code: string): string {
  return code
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizePlanFeatures(features: unknown): PlanFeature[] {
  if (!Array.isArray(features)) return [];
  return features.flatMap((item, index) => {
    if (typeof item === 'string' && item.trim()) {
      return [{ code: item, name: item }];
    }
    if (item && typeof item === 'object') {
      const row = item as PlanFeature;
      if (row.is_implemented === false) return [];
      const name = (row.name || row.code || '').trim();
      if (!name) return [];
      return [{
        code: row.code || String(index),
        name,
        description: row.description,
        is_implemented: row.is_implemented,
      }];
    }
    return [];
  });
}

export function catalogPlanFor(
  current: CurrentPlanSource | null | undefined,
  plans: CatalogPlan[],
): CatalogPlan | null {
  const id = current?.plan?.id;
  if (id != null) {
    const match = plans.find((plan) => plan.id === id);
    if (match) return match;
  }
  const name = current?.plan_name || current?.plan?.name;
  if (name) {
    const match = plans.find((plan) => plan.name === name);
    if (match) return match;
  }
  return current?.plan || null;
}

export function namedFeaturesFor(
  plan: CatalogPlan | null | undefined,
  entitlementCodes?: string[] | null,
): PlanFeature[] {
  const fromPlan = normalizePlanFeatures(plan?.features);
  const names = new Map(fromPlan.map((item) => [item.code, item.name]));
  if (entitlementCodes?.length) {
    return entitlementCodes.map((code) => ({
      code,
      name: names.get(code) || humanizeFeatureCode(code),
    }));
  }
  return fromPlan;
}

export function planDetailLines(
  plan: CatalogPlan | null | undefined,
  extras?: { limits?: PlanLimits | null; officialUrl?: string | null; pathUrl?: string | null },
): PlanDetailLine[] {
  const lines: PlanDetailLine[] = [];
  const limits = extras?.limits || {};
  const products = hasOwn(limits, 'max_products')
    ? limits.max_products
    : plan?.product_limit;
  const staff = hasOwn(limits, 'max_staff') ? limits.max_staff : plan?.max_staff;
  const branches = hasOwn(limits, 'max_branches') ? limits.max_branches : plan?.max_branches;

  if (plan?.description) {
    lines.push({ key: 'description', text: plan.description });
  }
  if (products !== undefined) {
    lines.push({
      key: 'products',
      text: products != null ? `Up to ${products} products` : 'Unlimited products',
    });
  }
  if (staff !== undefined) {
    lines.push({
      key: 'staff',
      text: limitLabel(staff, 'staff login', 'staff logins', 'Unlimited staff logins'),
    });
  }
  if (branches !== undefined) {
    lines.push({
      key: 'locations',
      text: limitLabel(branches, 'location', 'locations', 'Unlimited locations'),
    });
  }
  if (plan?.allows_custom_subdomain !== undefined) {
    lines.push({
      key: 'url',
      text: plan.allows_custom_subdomain
        ? 'Custom URL: {slug}.keralasellers.in once active'
        : 'Store URL: keralasellers.in/shop/{slug}/',
    });
  }
  const liveUrl = extras?.officialUrl || extras?.pathUrl;
  if (liveUrl) {
    lines.push({ key: 'live-url', text: liveUrl });
  }
  return lines;
}
