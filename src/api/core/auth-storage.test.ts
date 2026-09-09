import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getTokenExpiry,
  setTokenExpiry,
  removeTokenExpiry,
  isTokenExpired,
  clearAuthStorage,
} from './auth-storage';

describe('auth-storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  describe('token', () => {
    it('setAuthToken 写 localStorage，getAuthToken 读到', () => {
      setAuthToken('tok-1');
      expect(getAuthToken()).toBe('tok-1');
      expect(window.localStorage.getItem('token')).toBe('tok-1');
    });

    it('removeAuthToken 同时清 localStorage 和 sessionStorage', () => {
      setAuthToken('tok-2');
      window.sessionStorage.setItem('token', 'session-tok');
      removeAuthToken();
      expect(getAuthToken()).toBeNull();
    });

    it('读时 localStorage 优先，回退 sessionStorage', () => {
      window.sessionStorage.setItem('token', 'fallback-tok');
      expect(getAuthToken()).toBe('fallback-tok');
      // 写 localStorage 后优先读 local
      setAuthToken('local-tok');
      expect(getAuthToken()).toBe('local-tok');
    });
  });

  describe('expiry', () => {
    it('setTokenExpiry 写 localStorage，getTokenExpiry 读到', () => {
      setTokenExpiry(1234567890);
      expect(getTokenExpiry()).toBe(1234567890);
    });

    it('removeTokenExpiry 清掉 expiry', () => {
      setTokenExpiry(1234567890);
      removeTokenExpiry();
      expect(getTokenExpiry()).toBeNull();
    });

    it('expiry 与 token 始终从同一 storage 读取', () => {
      window.localStorage.setItem('token', 'local-token');
      window.sessionStorage.setItem('tokenExpiry', '1234567890');

      expect(getAuthToken()).toBe('local-token');
      expect(getTokenExpiry()).toBeNull();
    });

    it('session token 不受 localStorage 残留 expiry 影响', () => {
      window.localStorage.setItem('tokenExpiry', '1');
      window.sessionStorage.setItem('token', 'session-token');
      window.sessionStorage.setItem('tokenExpiry', '1234567890');

      expect(getAuthToken()).toBe('session-token');
      expect(getTokenExpiry()).toBe(1234567890);
    });
  });

  describe('isTokenExpired', () => {
    it('无 expiry 返回 true', () => {
      expect(isTokenExpired()).toBe(true);
    });

    it('过去时间返回 true', () => {
      setTokenExpiry(Date.now() - 1000);
      expect(isTokenExpired()).toBe(true);
    });

    it('未来时间返回 false', () => {
      setTokenExpiry(Date.now() + 10000);
      expect(isTokenExpired()).toBe(false);
    });
  });

  describe('clearAuthStorage', () => {
    it('清 token + expiry + user 三个 key', () => {
      setAuthToken('tok');
      setTokenExpiry(Date.now() + 10000);
      window.localStorage.setItem('user', '{}');

      clearAuthStorage();

      expect(getAuthToken()).toBeNull();
      expect(getTokenExpiry()).toBeNull();
      expect(window.localStorage.getItem('user')).toBeNull();
    });
  });
});
