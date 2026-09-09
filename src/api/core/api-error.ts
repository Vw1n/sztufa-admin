/**
 * 统一 API 错误类型。
 *
 * 所有 response-parser 抛出的错误都是 ApiError，携带 HTTP 状态码，
 * 方便调用方按 status 分支处理（例如 401 触发会话失效、4xx 显示业务提示）。
 *
 * 设计约束：本模块是纯类型定义，不访问 storage、window 或 fetch，
 * 可在任意环境（Node/jsdom/浏览器）单测。
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
