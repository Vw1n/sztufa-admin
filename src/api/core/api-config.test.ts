import { resolveApiBaseUrl } from './api-config';

describe('api-config.resolveApiBaseUrl', () => {
  it('dev 管理域名固定走 api-dev', () => {
    expect(
      resolveApiBaseUrl({ hostname: 'dev.sztufa.xyz', configuredUrl: '' }),
    ).toBe('https://api-dev.sztufa.xyz/api/v1');
  });

  it('admin-dev 域名同样走 api-dev', () => {
    expect(
      resolveApiBaseUrl({ hostname: 'admin-dev.sztufa.xyz', configuredUrl: '' }),
    ).toBe('https://api-dev.sztufa.xyz/api/v1');
  });

  it('生产 *.sztufa.xyz 走 api.sztufa.xyz', () => {
    expect(
      resolveApiBaseUrl({ hostname: 'admin.sztufa.xyz', configuredUrl: '' }),
    ).toBe('https://api.sztufa.xyz/api/v1');
  });

  it('本地/局域网域名回退同源 /api/v1', () => {
    expect(
      resolveApiBaseUrl({ hostname: 'localhost', configuredUrl: '' }),
    ).toBe('/api/v1');
  });

  it('显式配置 URL 优先（非 dev 域名）', () => {
    expect(
      resolveApiBaseUrl({
        hostname: 'admin.sztufa.xyz',
        configuredUrl: 'https://staging.example.com/api/v2/',
      }),
    ).toBe('https://staging.example.com/api/v2');
  });

  it('末尾斜杠被移除', () => {
    expect(
      resolveApiBaseUrl({ hostname: 'x.sztufa.xyz', configuredUrl: 'https://api.example.com/' }),
    ).toBe('https://api.example.com');
  });
});
