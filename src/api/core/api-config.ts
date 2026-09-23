/**
 * API Base URL 纯解析模块。
 *
 * 关键约束（计划 12.3）：
 * - 纯函数 resolveApiBaseUrl 只依赖注入的 hostname 与配置 URL，
 *   不直接访问 window/location，可在 Node/测试环境单测；
 * - 运行期 BASE_URL 只在此模块计算一次；
 * - 开发管理域名（dev/admin-dev.sztufa.xyz）固定走 api-dev；
 *   生产 *.sztufa.xyz 走 api.sztufa.xyz；其余（本地/局域网）走同源 /api/v1。
 */

declare const ADMIN_API_BASE_URL: string;

export interface ApiBaseUrlInput {
  hostname: string;
  configuredUrl: string;
}

export const resolveApiBaseUrl = ({
  hostname,
  configuredUrl,
}: ApiBaseUrlInput): string => {
  const isDevelopmentAdminHost =
    hostname.includes('dev.sztufa.xyz') ||
    hostname.includes('admin-dev.sztufa.xyz');

  const resolved = isDevelopmentAdminHost
    ? 'https://api-dev.sztufa.xyz/api/v1'
    : configuredUrl ||
      (hostname.endsWith('sztufa.xyz')
        ? 'https://api.sztufa.xyz/api/v1'
        : '/api/v1');

  return resolved.replace(/\/$/, '');
};

const configuredApiBaseUrl =
  typeof ADMIN_API_BASE_URL !== 'undefined' ? ADMIN_API_BASE_URL : '';

export const BASE_URL = resolveApiBaseUrl({
  hostname: typeof window !== 'undefined' ? window.location.hostname : '',
  configuredUrl: configuredApiBaseUrl,
});
