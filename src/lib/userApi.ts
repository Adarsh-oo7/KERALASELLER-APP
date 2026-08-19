import type { AxiosResponse } from 'axios';

import api from '../api/api';
import { isMissingRoute } from './userApiUtils';

export { isMissingRoute };

/**
 * Production mounts auth at `/user/…`. Local newdata also serves `/api/user/…`.
 * Retry the app-compat prefix only when the route itself is missing.
 */
export async function postUser<T>(path: string, body: unknown): Promise<AxiosResponse<T>> {
  const normalised = path.replace(/^\/+/, '');
  try {
    return await api.post<T>(`/user/${normalised}`, body);
  } catch (error: unknown) {
    if (!isMissingRoute(error)) throw error;
    return api.post<T>(`/api/user/${normalised}`, body);
  }
}
