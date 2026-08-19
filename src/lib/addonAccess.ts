function featureLabel(code: string): string {
  return code
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export type AddonLike = {
  id: number;
  name: string;
  slug?: string;
  price?: number | string;
  description?: string;
  billing_period?: string;
  extra_product_limit?: number | null;
  extra_staff_limit?: number | null;
  extra_branch_limit?: number | null;
  extra_category_limit?: number | null;
  feature_codes?: string[];
  compatible_plan_ids?: number[];
};

export type AddonCatalogSources = {
  entitlementsAddons?: AddonLike[] | null;
  publicAddons?: AddonLike[] | null;
  activeAddons?: Array<Partial<AddonLike> & { id?: number; name?: string; price?: number | string }> | null;
};

export type AddonPartition = {
  compatible: AddonLike[];
  onPlan: AddonLike[];
  included: AddonLike[];
  otherPlans: AddonLike[];
};

export function addonFitsPlan(addon: AddonLike, planId?: number | null): boolean {
  const ids = addon.compatible_plan_ids || [];
  if (!ids.length) return true;
  if (planId == null) return true;
  return ids.includes(planId);
}

export function addonCapacityLines(addon: AddonLike): string[] {
  const lines: string[] = [];
  if (addon.extra_product_limit) lines.push(`+${addon.extra_product_limit} products`);
  if (addon.extra_staff_limit) lines.push(`+${addon.extra_staff_limit} staff logins`);
  if (addon.extra_branch_limit) {
    lines.push(`+${addon.extra_branch_limit} location${addon.extra_branch_limit === 1 ? '' : 's'}`);
  }
  if (addon.extra_category_limit) lines.push(`+${addon.extra_category_limit} categories`);
  (addon.feature_codes || []).forEach((code) => lines.push(featureLabel(code)));
  return lines;
}

export function addonIsOwned(addon: AddonLike, activeIds: Iterable<number>): boolean {
  return new Set(activeIds).has(addon.id);
}

export function addonHasCapacityBump(addon: AddonLike): boolean {
  return Boolean(
    addon.extra_product_limit
    || addon.extra_staff_limit
    || addon.extra_branch_limit
    || addon.extra_category_limit,
  );
}

export function addonIncludedInPlan(
  addon: AddonLike,
  featureCodes?: Iterable<string> | null,
): boolean {
  const codes = addon.feature_codes || [];
  if (!codes.length || addonHasCapacityBump(addon)) return false;
  const have = new Set(featureCodes || []);
  if (!have.size) return false;
  return codes.every((code) => have.has(code));
}

function catalogRowFromActive(
  row: Partial<AddonLike> & { id?: number; name?: string; price?: number | string },
): AddonLike | null {
  if (row.id == null || !row.name) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price ?? 0,
    description: row.description,
    billing_period: row.billing_period,
    extra_product_limit: row.extra_product_limit,
    extra_staff_limit: row.extra_staff_limit,
    extra_branch_limit: row.extra_branch_limit,
    extra_category_limit: row.extra_category_limit,
    feature_codes: row.feature_codes,
    compatible_plan_ids: row.compatible_plan_ids,
  };
}

export function mergeAddonCatalog(...lists: Array<AddonLike[] | null | undefined>): AddonLike[] {
  const byId = new Map<number, AddonLike>();
  for (const list of lists) {
    for (const addon of list || []) {
      if (addon == null || addon.id == null) continue;
      const prev = byId.get(addon.id);
      byId.set(addon.id, prev ? { ...prev, ...addon } : addon);
    }
  }
  return [...byId.values()].sort((a, b) => {
    const priceDiff = Number(a.price || 0) - Number(b.price || 0);
    if (priceDiff !== 0) return priceDiff;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

export function collectAddonCatalog(sources: AddonCatalogSources = {}): AddonLike[] {
  const fromActive = (sources.activeAddons || [])
    .map(catalogRowFromActive)
    .filter((row): row is AddonLike => Boolean(row));
  return mergeAddonCatalog(fromActive, sources.publicAddons, sources.entitlementsAddons);
}

export function addonPurchaseCounts(
  activeAddons?: Array<{ id?: number } | null> | null,
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const row of activeAddons || []) {
    if (row?.id == null) continue;
    counts.set(row.id, (counts.get(row.id) || 0) + 1);
  }
  return counts;
}

export function addonBuyLabel(addon: AddonLike, purchasedCount = 0): string {
  if (addonHasCapacityBump(addon) && purchasedCount > 0) return 'Add another';
  return `Add ${addon.name}`;
}

export function addonNeedHint(addon: AddonLike, purchasedCount = 0): string | null {
  if (addonHasCapacityBump(addon)) {
    if (purchasedCount > 0) {
      return `Already on this shop ×${purchasedCount}. Add another if this shop needs a higher cap.`;
    }
    return 'Buy this only if this shop needs extra capacity. You can add it more than once.';
  }
  return 'Buy this only if this shop needs it. One purchase is enough.';
}

export function partitionAddons(
  addons: AddonLike[],
  opts: {
    planId?: number | null;
    activeIds?: Iterable<number>;
    featureCodes?: Iterable<string> | null;
  } = {},
): AddonPartition {
  const active = new Set(opts.activeIds || []);
  const compatible: AddonLike[] = [];
  const onPlan: AddonLike[] = [];
  const included: AddonLike[] = [];
  const otherPlans: AddonLike[] = [];
  for (const addon of addons || []) {
    if (!addonFitsPlan(addon, opts.planId)) {
      otherPlans.push(addon);
      continue;
    }
    if (addonHasCapacityBump(addon)) {
      compatible.push(addon);
      continue;
    }
    if (addonIsOwned(addon, active)) included.push(addon);
    else if (addonIncludedInPlan(addon, opts.featureCodes)) onPlan.push(addon);
    else compatible.push(addon);
  }
  return { compatible, onPlan, included, otherPlans };
}

export function addonCatalogIsEmpty(groups: AddonPartition): boolean {
  return groups.compatible.length === 0
    && groups.onPlan.length === 0
    && groups.included.length === 0
    && groups.otherPlans.length === 0;
}
