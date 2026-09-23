import {
  BASE_URL,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getTokenExpiry,
  setTokenExpiry,
  isTokenExpired,
  clearAuthStorage,
  buildAuthHeaders,
  ApiError,
  parseResponse,
  authenticatedRequest,
  AUTH_EXPIRED_EVENT,
} from './core';

// 构造最小可用的 Response mock
const makeResponse = (
  status: number,
  body: string,
  init?: { ok?: boolean }
): Response => {
  const ok = init?.ok ?? (status >= 200 && status < 300);
  return {
    status,
    ok,
    text: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
};

describe('http.ts 门面（D9 解耦后）', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('BASE_URL 仍为生产 API 地址', () => {
    expect(BASE_URL).toBe('https://api.sztufa.xyz/api/v1');
  });

  it('token 读写与过期判断可用', () => {
    setAuthToken('tok');
    expect(getAuthToken()).toBe('tok');
    setTokenExpiry(Date.now() - 1000);
    expect(isTokenExpired()).toBe(true);
    removeAuthToken();
    expect(getAuthToken()).toBeNull();
  });

  it('clearAuthStorage 清理 token/expiry/user', () => {
    setAuthToken('tok');
    setTokenExpiry(Date.now() + 10000);
    window.localStorage.setItem('user', '{}');
    clearAuthStorage();
    expect(getAuthToken()).toBeNull();
    expect(getTokenExpiry()).toBeNull();
    expect(window.localStorage.getItem('user')).toBeNull();
  });

  it('buildAuthHeaders 未过期 token 带 Bearer', () => {
    setAuthToken('tok-h');
    setTokenExpiry(Date.now() + 10000);
    const headers = buildAuthHeaders();
    expect(headers.get('Authorization')).toBe('Bearer tok-h');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('parseResponse 401 只抛 ApiError，不再跳转页面', async () => {
    const res = makeResponse(401, JSON.stringify({ message: '密码错误' }), {
      ok: false,
    });
    await expect(parseResponse(res)).rejects.toMatchObject({
      message: '密码错误',
      status: 401,
    });
    expect(window.location.href).not.toBe('/login?expired=true');
  });

  it('受保护请求 401 派发 auth-expired 事件（替代旧的 window.location 跳转）', async () => {
    const listener = jest.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);
    setAuthToken('tok-e');
    setTokenExpiry(Date.now() + 10000);
    (global.fetch as jest.Mock) = jest
      .fn()
      .mockResolvedValue(makeResponse(401, JSON.stringify({ message: '未登录' }), { ok: false }));

    await expect(authenticatedRequest<unknown>('/me')).rejects.toThrow(ApiError);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });
});
