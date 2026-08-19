export function canUseTool(
  allowed: string[] | null,
  permission: string | string[] | undefined,
  isOwner = true,
): boolean {
  if (!permission) return true;
  const needed = Array.isArray(permission) ? permission : [permission];
  if (allowed === null) return isOwner;
  return needed.some((code) => allowed.includes(code));
}

export function ownerToolsWhenStaffMeMissing(
  isOwner: boolean,
  allowed: string[] | undefined,
): string[] | null {
  if (!isOwner) return allowed || [];
  if (allowed && allowed.length > 0) return allowed;
  return null;
}
