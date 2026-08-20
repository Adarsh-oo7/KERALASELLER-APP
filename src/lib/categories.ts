export type CategoryNode = {
  id: number;
  name: string;
  parent?: number | null;
  children?: { id: number; name: string }[];
  default_attributes?: { id?: number; name: string }[] | string[];
};

export const SELL_UNITS = ['Piece', 'Kg', 'Litre'] as const;
export type SellUnit = (typeof SELL_UNITS)[number];
export const UNIT_ATTRIBUTE = 'unit';

export function childrenOf(all: CategoryNode[], parentId: number | null): CategoryNode[] {
  return all
    .filter((cat) => (parentId == null ? !cat.parent : cat.parent === parentId))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function hasChildren(all: CategoryNode[], id: number): boolean {
  return all.some((cat) => cat.parent === id);
}

export function findCategory(all: CategoryNode[], id: number | null | undefined): CategoryNode | undefined {
  if (id == null) return undefined;
  return all.find((cat) => cat.id === id);
}

export function pathTo(all: CategoryNode[], id: number | null | undefined): CategoryNode[] {
  const path: CategoryNode[] = [];
  let current = findCategory(all, id);
  const seen = new Set<number>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.parent ? findCategory(all, current.parent) : undefined;
  }
  return path;
}

export function attributeNames(category?: CategoryNode | null): string[] {
  return (category?.default_attributes || [])
    .map((attr) => (typeof attr === 'string' ? attr : attr.name))
    .map((name) => name.trim())
    .filter((name) => name && name.toLowerCase() !== UNIT_ATTRIBUTE);
}

export function seedAttributes(
  previous: Record<string, string>,
  defaults: string[],
): Record<string, string> {
  const next = { ...previous };
  for (const name of defaults) {
    if (next[name] == null) next[name] = '';
  }
  return next;
}

export function compactAttributes(
  attributes: Record<string, string>,
  unit: string,
): Record<string, string> {
  const next: Record<string, string> = {};
  const trimmedUnit = unit.trim();
  if (trimmedUnit) next[UNIT_ATTRIBUTE] = trimmedUnit;
  for (const [key, value] of Object.entries(attributes)) {
    const name = key.trim();
    const text = value.trim();
    if (!name || name.toLowerCase() === UNIT_ATTRIBUTE || !text) continue;
    next[name] = text;
  }
  return next;
}
