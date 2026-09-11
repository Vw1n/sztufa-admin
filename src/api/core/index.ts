/**
 * API core 统一出口。
 * 新代码请从本桶文件导入，避免散落的相对路径。
 */
export { BASE_URL, resolveApiBaseUrl } from './api-config';
export type { ApiBaseUrlInput } from './api-config';
export { ApiError } from './api-error';
export { parseResponse } from './response-parser';
export {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getTokenExpiry,
  setTokenExpiry,
  removeTokenExpiry,
  isTokenExpired,
  clearAuthStorage,
} from './auth-storage';
export {
  AUTH_EXPIRED_EVENT,
  request,
  authenticatedRequest,
  buildAuthHeaders,
  notifyAuthExpiredOnce,
  resetAuthExpiredNotifier,
} from './authenticated-fetch';
