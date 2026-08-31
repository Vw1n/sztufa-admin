import { BASE_URL } from './http';

export async function diagnoseApi(): Promise<{ color: string; message: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const start = Date.now();
  try {
    // 赛季列表允许为空；不能用“必须有活跃赛季”的业务接口判断连通性。
    const response = await fetch(`${BASE_URL}/seasons`, {
      cache: 'no-store', signal: controller.signal,
    });
    if (response.status === 502 || response.status === 504) {
      return { color: '#c92a2a', message: `❌ 网关无法正常访问后端（HTTP ${response.status}），请检查本地后端和代理配置。` };
    }
    if (!response.ok) {
      return { color: '#856404', message: `⚠️ 已收到 HTTP ${response.status} 响应，但业务接口异常；请检查 API 路由、权限或后端日志。` };
    }
    const data: unknown = await response.json();
    if (!Array.isArray(data) || data.some(item => !item || typeof item.name !== 'string' || typeof item.status !== 'string')) {
      return { color: '#856404', message: '⚠️ 服务已响应，但不是预期的赛季列表，请检查 API 地址和代理配置。' };
    }
    const active = data.find(item => item.status === 'active');
    return {
      color: '#2b8a3e',
      message: `✅ API 连通成功！响应时长：${Date.now() - start}ms\n${active ? `当前活动赛季：${active.name}` : '尚无活跃赛季，可登录后创建或激活；不影响登录。'}`,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { color: '#856404', message: '⚠️ 服务已响应，但不是有效 JSON，请检查 API 地址和代理配置。' };
    }
    return { color: '#c92a2a', message: '❌ 未能取得 API 响应（网络错误或超时），请检查本地后端、代理和跨域配置。' };
  } finally {
    clearTimeout(timeout);
  }
}
