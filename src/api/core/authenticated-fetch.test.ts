import {
  AUTH_EXPIRED_EVENT,
  authenticatedRequest,
  buildAuthHeaders,
  notifyAuthExpiredOnce,
  request,
  resetAuthExpiredNotifier,
} from './authenticated-fetch';
import { ApiError } from './api-error';
import { setAuthToken, setTokenExpiry, clearAuthStorage } from './auth-storage';

const makeResponse = (
  status: number,
  body: string,
  init?: { ok?: boolean },
): Response => {
  const ok = init?.ok ?? (status >= 200 && status < 300);
  return {
    status,
    ok,
    text: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
};

describe('authenticated-fetch', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    resetAuthExpiredNotifier();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('buildAuthHeaders', () => {
    it('无 token 时只设 JSON Content-Type', () => {
      const headers = buildAuthHeaders();
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBeNull();
    });

    it('未过期 token 带 Bearer', () => {
      setAuthToken('tok-1');
      setTokenExpiry(Date.now() + 10000);
      const headers = buildAuthHeaders();
      expect(headers.get('Authorization')).toBe('Bearer tok-1');
    });

    it('multipart 不自动设 JSON Content-Type', () => {
      setAuthToken('tok-2');
      setTokenExpiry(Date.now() + 10000);
      const headers = buildAuthHeaders(true);
      expect(headers.has('Content-Type')).toBe(false);
      expect(headers.get('Authorization')).toBe('Bearer tok-2');
    });

    it('过期 token 不加 Authorization', () => {
      setAuthToken('expired');
      setTokenExpiry(Date.now() - 1000);
      expect(buildAuthHeaders().get('Authorization')).toBeNull();
    });
  });

  describe('request（公开请求）', () => {
    it('不附加认证头，401 不派发 auth-expired 事件', async () => {
      const listener = jest.fn();
      window.addEventListener(AUTH_EXPIRED_EVENT, listener);
      (global.fetch as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce(makeResponse(401, JSON.stringify({ message: '密码错误' }), { ok: false }));

      await expect(request<unknown>('/staff-auth/login', { method: 'POST' })).rejects.toThrow(
        ApiError,
      );
      expect(listener).not.toHaveBeenCalled();
      expect(window.location.href).not.toBe('/login?expired=true');
      window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
    });
  });

  describe('authenticatedRequest（受保护请求）', () => {
    it('成功返回解析数据并复位去重标记', async () => {
      const listener = jest.fn();
      window.addEventListener(AUTH_EXPIRED_EVENT, listener);
      setAuthToken('tok');
      setTokenExpiry(Date.now() + 10000);
      (global.fetch as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce(makeResponse(200, JSON.stringify({ ok: true })));

      const data = await authenticatedRequest<{ ok: boolean }>('/teams');
      expect(data).toEqual({ ok: true });
      expect(listener).not.toHaveBeenCalled();
      window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
    });

    it('401 派发一次 auth-expired 事件并抛出 ApiError', async () => {
      const listener = jest.fn();
      window.addEventListener(AUTH_EXPIRED_EVENT, listener);
      setAuthToken('tok');
      setTokenExpiry(Date.now() + 10000);
      (global.fetch as jest.Mock) = jest
        .fn()
        .mockResolvedValue(makeResponse(401, JSON.stringify({ message: '未登录' }), { ok: false }));

      await expect(authenticatedRequest<unknown>('/me')).rejects.toThrow(
        '未登录',
      );
      await expect(authenticatedRequest<unknown>('/me')).rejects.toThrow(
        '未登录',
      );
      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
    });

    it('非 401 错误不派发失效事件', async () => {
      const listener = jest.fn();
      window.addEventListener(AUTH_EXPIRED_EVENT, listener);
      setAuthToken('tok');
      setTokenExpiry(Date.now() + 10000);
      (global.fetch as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce(makeResponse(500, '', { ok: false }));

      await expect(authenticatedRequest<unknown>('/me')).rejects.toThrow(ApiError);
      expect(listener).not.toHaveBeenCalled();
      window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
    });

    it('multipart 请求不被自动加 JSON Content-Type', async () => {
      setAuthToken('tok');
      setTokenExpiry(Date.now() + 10000);
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(makeResponse(200, JSON.stringify({ url: 'x' })));
      (global.fetch as unknown) = fetchMock;
      const form = new FormData();
      await authenticatedRequest<{ url: string }>('/upload', { method: 'POST', body: form }, { multipart: true });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect((init.headers as Headers).has('Content-Type')).toBe(false);
      expect((init.headers as Headers).get('Authorization')).toBe('Bearer tok');
    });
  });

  describe('notifyAuthExpiredOnce', () => {
    it('同一轮多次调用只派发一次事件', () => {
      const listener = jest.fn();
      window.addEventListener(AUTH_EXPIRED_EVENT, listener);
      notifyAuthExpiredOnce();
      notifyAuthExpiredOnce();
      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
    });

    it('复位后可再次派发', () => {
      const listener = jest.fn();
      window.addEventListener(AUTH_EXPIRED_EVENT, listener);
      notifyAuthExpiredOnce();
      resetAuthExpiredNotifier();
      notifyAuthExpiredOnce();
      expect(listener).toHaveBeenCalledTimes(2);
      window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
    });
  });

  afterAll(() => {
    clearAuthStorage();
  });
});
