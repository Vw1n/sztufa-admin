import { memberRequest, cardPreview } from './members';
import { BASE_URL } from './http';

describe('Admin Members API 客户端测试', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    global.localStorage = {
      getItem: jest.fn().mockReturnValue('admin-test-token'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('memberRequest 正确发送 GET 请求与查询参数', async () => {
    const mockMembersResponse = {
      data: [{ id: 'm1', username: 'student1', verificationStatus: 'PENDING' }],
      total: 1,
      page: 1,
      limit: 20,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockMembersResponse)),
      json: jest.fn().mockResolvedValueOnce(mockMembersResponse),
    });

    const result = await memberRequest('?page=1&limit=20&status=PENDING', 'GET');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/admin/members?page=1&limit=20&status=PENDING`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers),
      }),
    );
    expect(result).toEqual(mockMembersResponse);
  });

  it('memberRequest 正确发送 PATCH 审核请求与请求体', async () => {
    const mockAuditResult = {
      id: 'm1',
      verificationStatus: 'APPROVED',
      studentId: '20261111',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: jest.fn().mockResolvedValueOnce(JSON.stringify(mockAuditResult)),
      json: jest.fn().mockResolvedValueOnce(mockAuditResult),
    });

    const reviewPayload = { decision: 'APPROVED', version: 1 };
    const result = await memberRequest('/m1/review', 'PATCH', reviewPayload);

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/admin/members/m1/review`,
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.any(Headers),
        body: JSON.stringify(reviewPayload),
      }),
    );
    expect(result).toEqual(mockAuditResult);
  });

  it('cardPreview 成功获取二进制图片 Blob', async () => {
    const fakeBlob = new Blob(['image-webp-data'], { type: 'image/webp' });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      blob: jest.fn().mockResolvedValueOnce(fakeBlob),
    });

    const blob = await cardPreview('member-1', 'asset-1');

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/admin/members/member-1/cards/asset-1`,
      expect.objectContaining({
        cache: 'no-store',
        headers: expect.any(Headers),
      }),
    );
    expect(blob).toBe(fakeBlob);
  });

  it('cardPreview 在材料已清理或无权限时抛出错误', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: jest.fn().mockResolvedValueOnce(JSON.stringify({ message: '材料已清理' })),
      json: jest.fn().mockResolvedValueOnce({ message: '材料已清理' }),
    });

    await expect(cardPreview('member-1', 'asset-1')).rejects.toThrow('材料已清理');
  });
});
