import {
  BASE_URL,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getTokenExpiry,
  setTokenExpiry,
  isTokenExpired,
  handleAuthError,
  createHeaders,
  ApiError,
  handleResponse,
} from './http';

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

describe('http.ts characterization（锁定现有行为）', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    // 拦截 window.location.href 赋值，避免 jsdom 抛 "Not implemented"
    delete (window as any).location;
    (window as any).location = {
      href: '',
      hostname: 'admin.sztufa.xyz',
    };

    // 每个用例前重置 storage
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    (window as any).location = originalLocation;
    jest.restoreAllMocks();
  });

  describe('BASE_URL', () => {
    it('生产域名 admin.sztufa.xyz 解析为正式 API', () => {
      expect(BASE_URL).toBe('https://api.sztufa.xyz/api/v1');
    });
  });

  describe('token 存储', () => {
    it('setAuthToken 写 localStorage，getAuthToken 优先读 localStorage', () => {
      setAuthToken('tok-1');
      expect(getAuthToken()).toBe('tok-1');
    });

    it('removeAuthToken 同时清 localStorage 和 sessionStorage', () => {
      setAuthToken('tok-2');
      window.sessionStorage.setItem('token', 'session-tok');
      removeAuthToken();
      expect(getAuthToken()).toBeNull();
    });

    it('tokenExpiry 过期时 isTokenExpired 返回 true', () => {
      setTokenExpiry(Date.now() - 1000);
      expect(isTokenExpired()).toBe(true);
    });

    it('tokenExpiry 未过期时 isTokenExpired 返回 false', () => {
      setTokenExpiry(Date.now() + 10000);
      expect(isTokenExpired()).toBe(false);
    });

    it('无 expiry 时 isTokenExpired 返回 true', () => {
      expect(isTokenExpired()).toBe(true);
    });
  });

  describe('createHeaders', () => {
    it('无 token 时只设 Content-Type: application/json', () => {
      const headers = createHeaders();
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBeNull();
    });

    it('有未过期 token 时加 Authorization Bearer', () => {
      setAuthToken('tok-3');
      setTokenExpiry(Date.now() + 10000);
      const headers = createHeaders();
      expect(headers.get('Authorization')).toBe('Bearer tok-3');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('multipart=true 时不设 Content-Type', () => {
      setAuthToken('tok-4');
      setTokenExpiry(Date.now() + 10000);
      const headers = createHeaders(true);
      expect(headers.has('Content-Type')).toBe(false);
      expect(headers.get('Authorization')).toBe('Bearer tok-4');
    });

    it('token 已过期时不加 Authorization', () => {
      setAuthToken('expired-tok');
      setTokenExpiry(Date.now() - 1000);
      const headers = createHeaders();
      expect(headers.get('Authorization')).toBeNull();
    });
  });

  describe('handleAuthError', () => {
    it('401 时清 token/tokenExpiry/user 并跳转 /login?expired=true', () => {
      setAuthToken('tok');
      setTokenExpiry(Date.now() + 10000);
      window.localStorage.setItem('user', '{}');

      const response = { status: 401 } as Response;
      handleAuthError(response);

      expect(getAuthToken()).toBeNull();
      expect(getTokenExpiry()).toBeNull();
      expect(window.localStorage.getItem('user')).toBeNull();
      expect(window.location.href).toBe('/login?expired=true');
    });

    it('非 401 状态不跳转也不清 storage', () => {
      setAuthToken('tok');
      const response = { status: 403 } as Response;
      handleAuthError(response);
      expect(getAuthToken()).toBe('tok');
      expect(window.location.href).not.toBe('/login?expired=true');
    });
  });

  describe('handleResponse', () => {
    it('200 + JSON 返回 data', async () => {
      const res = makeResponse(200, JSON.stringify({ message: 'ok' }));
      await expect(handleResponse(res)).resolves.toEqual({ message: 'ok' });
    });

    it('200 + 空响应体返回 null', async () => {
      const res = makeResponse(200, '');
      await expect(handleResponse(res)).resolves.toBeNull();
    });

    it('204 返回 null', async () => {
      const res = makeResponse(204, '');
      await expect(handleResponse(res)).resolves.toBeNull();
    });

    it('401 触发 handleAuthError 并抛 ApiError（现状：登录 401 也会跳转）', async () => {
      setAuthToken('tok');
      setTokenExpiry(Date.now() + 10000);
      const res = makeResponse(401, JSON.stringify({ message: '密码错误' }), {
        ok: false,
      });
      await expect(handleResponse(res)).rejects.toThrow(ApiError);
      // 现状行为：401 无条件清 storage + 跳转
      expect(getAuthToken()).toBeNull();
      expect(window.location.href).toBe('/login?expired=true');
    });

    it('403 + JSON message 优先用 message 内容', async () => {
      const res = makeResponse(403, JSON.stringify({ message: 'forbidden' }), {
        ok: false,
      });
      await expect(handleResponse(res)).rejects.toThrow('forbidden');
    });

    it('403 + 非JSON body 抛 ApiError 带权限提示', async () => {
      const res = makeResponse(403, '<html>forbidden</html>', { ok: false });
      await expect(handleResponse(res)).rejects.toThrow(
        '您无权执行此操作 (403)'
      );
    });

    it('404 + 非JSON body 抛 ApiError 带未找到提示', async () => {
      const res = makeResponse(404, '<html>not found</html>', { ok: false });
      await expect(handleResponse(res)).rejects.toThrow(
        '请求的接口资源未找到 (404)'
      );
    });

    it('500 + 非JSON body 抛 ApiError 带服务器错误提示', async () => {
      const res = makeResponse(500, '<html>err</html>', { ok: false });
      await expect(handleResponse(res)).rejects.toThrow(
        '服务器内部逻辑发生错误 (500)'
      );
    });

    it('502 抛 ApiError 带网关超时提示', async () => {
      const res = makeResponse(502, '<html>Bad Gateway</html>', { ok: false });
      await expect(handleResponse(res)).rejects.toThrow(
        '服务器网关或代理超时异常 (502/504)'
      );
    });

    it('504 抛 ApiError 带网关超时提示', async () => {
      const res = makeResponse(504, '<html>Gateway Timeout</html>', {
        ok: false,
      });
      await expect(handleResponse(res)).rejects.toThrow(
        '服务器网关或代理超时异常 (502/504)'
      );
    });

    it('4xx + message 数组用逗号拼接', async () => {
      const res = makeResponse(
        400,
        JSON.stringify({ message: ['字段1错误', '字段2错误'] }),
        { ok: false }
      );
      await expect(handleResponse(res)).rejects.toThrow(
        '字段1错误, 字段2错误'
      );
    });

    it('4xx + 无 message 用默认失败提示', async () => {
      const res = makeResponse(400, JSON.stringify({}), { ok: false });
      await expect(handleResponse(res)).rejects.toThrow('请求失败');
    });

    it('成功响应但非 JSON 抛 ApiError', async () => {
      const res = makeResponse(200, '<html>not json</html>');
      await expect(handleResponse(res)).rejects.toThrow(
        '服务器返回的响应格式不正确，期望 JSON 数据'
      );
    });

    it('text() 失败抛 ApiError 带读取失败提示', async () => {
      const res = {
        status: 200,
        ok: true,
        text: jest.fn().mockRejectedValue(new Error('network')),
      } as unknown as Response;
      await expect(handleResponse(res)).rejects.toThrow(
        '无法读取服务器响应: 200'
      );
    });
  });
});
