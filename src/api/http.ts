declare const ADMIN_API_BASE_URL: string;

const configuredApiBaseUrl =
  typeof ADMIN_API_BASE_URL !== 'undefined' ? ADMIN_API_BASE_URL : '';

const isDevelopmentAdminHost =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('dev.sztufa.xyz') ||
    window.location.hostname.includes('admin-dev.sztufa.xyz'));

export const BASE_URL = (
  isDevelopmentAdminHost
    ? 'https://api-dev.sztufa.xyz/api/v1'
    : configuredApiBaseUrl ||
      (typeof window !== 'undefined' && window.location.hostname.endsWith('sztufa.xyz')
        ? 'https://api.sztufa.xyz/api/v1'
        : '/api/v1')
).replace(/\/$/, '');

// P1-3: 统一的 Token 管理函数
const safeGetItem = (key: string): string | null => {
  if (typeof localStorage !== 'undefined') {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // Ignore storage error
    }
  }
  if (typeof sessionStorage !== 'undefined') {
    try {
      const val = sessionStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // Ignore storage error
    }
  }
  return null;
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
  return safeGetItem('token');
};

export const setAuthToken = (token: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeAuthToken = (): void => {
  safeRemoveItem('token');
};

export const getTokenExpiry = (): number | null => {
  const expiry = safeGetItem('tokenExpiry');
  return expiry ? parseInt(expiry, 10) : null;
};

export const setTokenExpiry = (expiry: number): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('tokenExpiry', expiry.toString());
  }
};

export const removeTokenExpiry = (): void => {
  safeRemoveItem('tokenExpiry');
};

export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() > expiry;
};

export const handleAuthError = (response: Response): void => {
  if (response.status === 401) {
    // P1-3: 清理所有可能的存储位置
    safeRemoveItem('token');
    safeRemoveItem('tokenExpiry');
    safeRemoveItem('user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login?expired=true';
    }
  }
};

export const createHeaders = (multipart = false): Headers => {
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

export const handleResponse = async <T>(response: Response): Promise<T> => {
  const isOk = response.ok;
  const status = response.status;

  if (status === 401) {
    handleAuthError(response);
  }
  
  let responseText: string;
  try {
    responseText = await response.text();
  } catch (textErr) {
    throw new Error(`无法读取服务器响应: ${status}`, { cause: textErr });
  }

  let data: { message?: string | string[] } | null = null;
  let isJson = false;
  try {
    data = JSON.parse(responseText) as { message?: string | string[] };
    isJson = true;
  } catch {
    // 不是 JSON 响应（可能是 HTML，例如 502 Bad Gateway）
  }

  if (!isOk) {
    if (isJson && data) {
      const errorMessage = Array.isArray(data.message) 
        ? data.message.join(', ') 
        : (data.message || (status === 401 ? '登录状态失效，请重新登录' : '请求失败'));
      throw new Error(errorMessage);
    } else {
      if (status === 502 || status === 504) {
        throw new Error('服务器网关或代理超时异常 (502/504)，请稍后再试');
      }
      if (status === 500) {
        throw new Error('服务器内部逻辑发生错误 (500)，请联系系统管理员');
      }
      if (status === 403) {
        throw new Error('您无权执行此操作 (403)');
      }
      if (status === 404) {
        throw new Error('请求的接口资源未找到 (404)');
      }
      throw new Error(`服务器响应失败，状态码: ${status}`);
    }
  }

  if (!isJson) {
    throw new Error('服务器返回的响应格式不正确，期望 JSON 数据');
  }

  return data as T;
};
