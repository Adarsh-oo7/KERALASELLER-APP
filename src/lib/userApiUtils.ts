export function isMissingRoute(error: unknown): boolean {
  const response = (error as {
    response?: { status?: number; data?: unknown };
  })?.response;
  if (response?.status !== 404) return false;
  const data = response.data;
  // Production login returns 404 JSON when the phone is unknown. That is an
  // application error, not a missing URL.
  if (data && typeof data === 'object' && 'error' in data) return false;
  return true;
}
