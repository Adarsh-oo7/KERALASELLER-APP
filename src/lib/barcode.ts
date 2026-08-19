export type BarModule = {
  kind: 'bar' | 'gap';
  width: number;
};

const CODE39: Record<string, string> = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  '*': 'nwnnwnwnn',
  $: 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
};

export function sanitizeBarcode(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z. $/+%*-]/g, '').trim();
}

export function encodeCode39(value: string): BarModule[] {
  const payload = sanitizeBarcode(value);
  if (!payload) return [];
  const chars = `*${payload}*`;
  const modules: BarModule[] = [];
  for (let i = 0; i < chars.length; i += 1) {
    const pattern = CODE39[chars[i]];
    if (!pattern) continue;
    if (i > 0) modules.push({ kind: 'gap', width: 1 });
    for (let j = 0; j < pattern.length; j += 1) {
      modules.push({
        kind: j % 2 === 0 ? 'bar' : 'gap',
        width: pattern[j] === 'w' ? 3 : 1,
      });
    }
  }
  return modules;
}

export function storedBarcode(value: string): string {
  return value.trim();
}

export function generateShopBarcode(taken: Iterable<string> = []): string {
  const used = new Set(Array.from(taken, (item) => sanitizeBarcode(item)));
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const stamp = Date.now().toString(36).toUpperCase().replace(/[^0-9A-Z]/g, '');
    const rand = Math.floor(Math.random() * 900 + 100).toString();
    const code = sanitizeBarcode(`KS${stamp}${rand}`).slice(0, 12);
    if (code.length >= 8 && !used.has(code)) return code;
  }
  return sanitizeBarcode(`KS${Date.now()}`);
}

export function codesFromProduct(product: {
  sku?: string | null;
  barcode?: string | null;
  variants?: Array<{ sku?: string | null; barcode?: string | null }>;
}): string[] {
  return [
    product.barcode,
    product.sku,
    ...(product.variants || []).flatMap((variant) => [variant.barcode, variant.sku]),
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim().toLowerCase());
}

export function findProductByCode<T extends {
  id: number;
  sku?: string | null;
  barcode?: string | null;
  variants?: Array<{ id: number; sku?: string | null; barcode?: string | null }>;
}>(products: T[], raw: string): { product: T; variantId?: number } | null {
  const code = raw.trim().toLowerCase();
  if (!code) return null;
  for (const product of products) {
    for (const variant of product.variants || []) {
      if ((variant.barcode || '').toLowerCase() === code || (variant.sku || '').toLowerCase() === code) {
        return { product, variantId: variant.id };
      }
    }
    if ((product.barcode || '').toLowerCase() === code || (product.sku || '').toLowerCase() === code) {
      return { product };
    }
  }
  return null;
}
