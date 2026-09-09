import { parseResponse } from './response-parser';
import { ApiError } from './api-error';

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

describe('response-parser', () => {
  describe('成功响应', () => {
    it('200 + JSON 返回 data', async () => {
      const res = makeResponse(200, JSON.stringify({ message: 'ok' }));
      await expect(parseResponse(res)).resolves.toEqual({ message: 'ok' });
    });

    it('200 + 空响应体返回 null', async () => {
      const res = makeResponse(200, '');
      await expect(parseResponse(res)).resolves.toBeNull();
    });

    it('204 返回 null', async () => {
      const res = makeResponse(204, '');
      await expect(parseResponse(res)).resolves.toBeNull();
    });

    it('成功但非 JSON 抛 ApiError', async () => {
      const res = makeResponse(200, '<html>not json</html>');
      await expect(parseResponse(res)).rejects.toThrow(
        '服务器返回的响应格式不正确，期望 JSON 数据'
      );
    });

    it('text() 失败抛 ApiError 带读取失败提示', async () => {
      const res = {
        status: 200,
        ok: true,
        text: jest.fn().mockRejectedValue(new Error('network')),
      } as unknown as Response;
      await expect(parseResponse(res)).rejects.toThrow(
        '无法读取服务器响应: 200'
      );
    });
  });

  describe('错误响应', () => {
    it('401 抛 ApiError 但不跳转页面（核心：登录 401 不触发会话过期）', async () => {
      const res = makeResponse(401, JSON.stringify({ message: '密码错误' }), {
        ok: false,
      });
      await expect(parseResponse(res)).rejects.toThrow(ApiError);
      await expect(parseResponse(res)).rejects.toMatchObject({
        message: '密码错误',
        status: 401,
      });
      // 关键：parseResponse 不触碰 window.location
      expect(window.location.href).not.toBe('/login?expired=true');
    });

    it('401 无 message 用默认失效提示', async () => {
      const res = makeResponse(401, JSON.stringify({}), { ok: false });
      await expect(parseResponse(res)).rejects.toThrow('登录状态失效，请重新登录');
    });

    it('403 + JSON message 优先用 message', async () => {
      const res = makeResponse(403, JSON.stringify({ message: 'forbidden' }), {
        ok: false,
      });
      await expect(parseResponse(res)).rejects.toThrow('forbidden');
    });

    it('403 + 非JSON body 抛权限提示', async () => {
      const res = makeResponse(403, '<html>forbidden</html>', { ok: false });
      await expect(parseResponse(res)).rejects.toThrow('您无权执行此操作 (403)');
    });

    it('404 + 非JSON body 抛未找到提示', async () => {
      const res = makeResponse(404, '<html>not found</html>', { ok: false });
      await expect(parseResponse(res)).rejects.toThrow(
        '请求的接口资源未找到 (404)'
      );
    });

    it('500 + 非JSON body 抛服务器错误提示', async () => {
      const res = makeResponse(500, '<html>err</html>', { ok: false });
      await expect(parseResponse(res)).rejects.toThrow(
        '服务器内部逻辑发生错误 (500)'
      );
    });

    it('502 抛网关超时提示', async () => {
      const res = makeResponse(502, '<html>Bad Gateway</html>', { ok: false });
      await expect(parseResponse(res)).rejects.toThrow(
        '服务器网关或代理超时异常 (502/504)'
      );
    });

    it('504 抛网关超时提示', async () => {
      const res = makeResponse(504, '<html>Gateway Timeout</html>', {
        ok: false,
      });
      await expect(parseResponse(res)).rejects.toThrow(
        '服务器网关或代理超时异常 (502/504)'
      );
    });

    it('4xx + message 数组用逗号拼接', async () => {
      const res = makeResponse(
        400,
        JSON.stringify({ message: ['字段1错误', '字段2错误'] }),
        { ok: false }
      );
      await expect(parseResponse(res)).rejects.toThrow('字段1错误, 字段2错误');
    });

    it('4xx + 无 message 用默认失败提示', async () => {
      const res = makeResponse(400, JSON.stringify({}), { ok: false });
      await expect(parseResponse(res)).rejects.toThrow('请求失败');
    });

    it('其他状态码抛通用失败提示', async () => {
      const res = makeResponse(418, '<html>teapot</html>', { ok: false });
      await expect(parseResponse(res)).rejects.toThrow(
        '服务器响应失败，状态码: 418'
      );
    });
  });

  describe('抛出的错误都是 ApiError 实例', () => {
    it('成功路径不抛', async () => {
      const res = makeResponse(200, JSON.stringify({ a: 1 }));
      await expect(parseResponse(res)).resolves.toEqual({ a: 1 });
    });

    it('错误路径抛 ApiError 且带 status', async () => {
      const res = makeResponse(403, '<html>no</html>', { ok: false });
      try {
        await parseResponse(res);
        fail('应抛错');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(403);
      }
    });
  });
});
