/**
 * 认证 Token 与过期时间的统一存储层。
 *
 * 关键约束（计划 12.3）：
 * - token 与 tokenExpiry 必须来自同一存储位置（localStorage 优先，
 *   读时回退 sessionStorage），避免 local/session 交叉配对；
 * - clearToken 统一清两个 storage，避免残留；
 * - 本模块只负责读写，不负责「401 跳转」等页面副作用——
 *   那是 authenticated-fetch 的职责，通过事件触发，由 Router 监听。
 *
 * 现有行为保持不变：读时 localStorage 优先、回退 sessionStorage；
 * 写时只写 localStorage（与原 http.ts 一致）。
 */

const TOKEN_KEY = 'token';
const EXPIRY_KEY = 'tokenExpiry';

const safeGetItem = (storage: Storage | undefined, key: string): string | null => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const getAuthStorage = (): Storage | undefined => {
  const local = typeof localStorage !== 'undefined' ? localStorage : undefined;
  const session = typeof sessionStorage !== 'undefined' ? sessionStorage : undefined;

  if (safeGetItem(local, TOKEN_KEY) !== null) return local;
  if (safeGetItem(session, TOKEN_KEY) !== null) return session;
  return local ?? session;
};

const safeRemoveItem = (key: string): void => {
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
  if (typeof sessionStorage !== 'undefined') {
    try { sessionStorage.removeItem(key); } catch { /* ignore */ }
  }
};

export const getAuthToken = (): string | null => {
  return safeGetItem(getAuthStorage(), TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const removeAuthToken = (): void => {
  safeRemoveItem(TOKEN_KEY);
};

export const getTokenExpiry = (): number | null => {
  const expiry = safeGetItem(getAuthStorage(), EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : null;
};

export const setTokenExpiry = (expiry: number): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(EXPIRY_KEY, expiry.toString());
  }
};

export const removeTokenExpiry = (): void => {
  safeRemoveItem(EXPIRY_KEY);
};

export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() > expiry;
};

/**
 * 统一清理认证相关 storage（token + expiry + user）。
 * 供 401 失效链路调用，保证不残留半个会话。
 */
export const clearAuthStorage = (): void => {
  safeRemoveItem(TOKEN_KEY);
  safeRemoveItem(EXPIRY_KEY);
  safeRemoveItem('user');
};
