/**
 * 认证请求门面。
 *
 * 关键边界（计划 12.3）：
 * - request<T>：公开请求（如登录），不带认证头、401 不触发会话失效事件；
 * - authenticatedRequest<T>：受保护请求，自动携带未过期 Bearer Token；
 *   仅当响应为 401 时，通过 window 事件总线派发一次 `auth-expired` 事件，
 *   由 AuthContext/Router 监听后决定清理会话与导航——本模块绝不直接
 *   window.location 跳转；
 * - multipart 时不自动设置 JSON Content-Type（由浏览器根据 FormData 自动生成）。
 */
import { BASE_URL } from './api-config';
import { ApiError } from './api-error';
import { parseResponse } from './response-parser';
import { getAuthToken, isTokenExpired } from './auth-storage';

export const AUTH_EXPIRED_EVENT = 'sztufa:auth-expired';

// 并发 401 时只派发一次失效事件；任意受保护请求成功后复位，
// 保证下次会话过期仍能再次触发。
let expiredNotified = false;

export const notifyAuthExpiredOnce = (): void => {
  if (expiredNotified) return;
  expiredNotified = true;
  if (
    typeof window !== 'undefined' &&
    typeof window.CustomEvent === 'function'
  ) {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
};

/** 供测试与重新登录成功后复位去重标记。 */
export const resetAuthExpiredNotifier = (): void => {
  expiredNotified = false;
};

export const buildAuthHeaders = (multipart = false): Headers => {
  const headers = new Headers();
  const token = getAuthToken();

  if (token && !isTokenExpired()) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!multipart) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
};

/**
 * 公开请求：不附加认证头，401 不触发全局会话失效。
 * 仅用于 staff-auth/login 等未登录即可调用的接口。
 */
export const request = async <T>(
  input: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${BASE_URL}${input}`, init);
  return parseResponse<T>(response);
};

/**
 * 受保护请求：自动携带认证头与 JSON Content-Type（multipart 除外）。
 * 401 时解析器抛出 ApiError，这里至多派发一次 auth-expired 事件后继续抛出，
 * 业务层仍可拿到原始错误信息。
 */
export const authenticatedRequest = async <T>(
  input: string,
  init: RequestInit = {},
  options: { multipart?: boolean } = {},
): Promise<T> => {
  const response = await fetch(`${BASE_URL}${input}`, {
    ...init,
    headers: buildAuthHeaders(options.multipart),
  });

  try {
    const data = await parseResponse<T>(response);
    // 请求成功，复位去重标记
    resetAuthExpiredNotifier();
    return data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      notifyAuthExpiredOnce();
    }
    throw err;
  }
};
