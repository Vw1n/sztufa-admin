/**
 * 纯响应解析器。
 *
 * 关键约束（计划 12.3）：
 * - 只把 Response 转成 data 或 ApiError，**绝不导航**；
 * - 登录请求走本解析器，401 只抛 ApiError，不触发会话过期跳转；
 * - 204 / 空 200 按空响应（null）处理；
 * - 非 JSON 成功响应抛 ApiError（期望 JSON）；
 * - 502/504/500/403/404 等状态码在无 JSON message 时走对应默认提示。
 *
 * 与 http.ts handleResponse 的唯一差异：401 不再调用 handleAuthError
 * 跳转页面，只抛 ApiError。会话失效跳转改由 authenticated-fetch
 * 通过事件触发（后续 PR）。
 *
 * 其余解析行为与 handleResponse 完全一致，保证 characterization test 通过。
 */
import { ApiError } from './api-error';

export const parseResponse = async <T>(response: Response): Promise<T> => {
  const isOk = response.ok;
  const status = response.status;

  let responseText: string;
  try {
    responseText = await response.text();
  } catch {
    throw new ApiError(`无法读取服务器响应: ${status}`, status);
  }

  // NestJS 控制器返回 null 时发 200 + 空响应体；
  // 成功空响应统一按 null 处理，避免"暂无数据"误报 JSON 格式错误。
  if (isOk && responseText.trim() === '') {
    return null as T;
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
        : (data.message ||
          (status === 401 ? '登录状态失效，请重新登录' : '请求失败'));
      throw new ApiError(errorMessage, status);
    } else {
      if (status === 502 || status === 504) {
        throw new ApiError('服务器网关或代理超时异常 (502/504)，请稍后再试', status);
      }
      if (status === 500) {
        throw new ApiError('服务器内部逻辑发生错误 (500)，请联系系统管理员', status);
      }
      if (status === 403) {
        throw new ApiError('您无权执行此操作 (403)', status);
      }
      if (status === 404) {
        throw new ApiError('请求的接口资源未找到 (404)', status);
      }
      throw new ApiError(`服务器响应失败，状态码: ${status}`, status);
    }
  }

  if (!isJson) {
    throw new ApiError('服务器返回的响应格式不正确，期望 JSON 数据', status);
  }

  return data as T;
};
