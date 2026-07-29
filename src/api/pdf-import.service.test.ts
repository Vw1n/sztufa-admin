import { pdfImportApi } from './pdf-import.service';
import { setAuthToken, setTokenExpiry } from './http';

global.fetch = jest.fn();

if (typeof global.FormData === 'undefined') {
  (global as any).FormData = class MockFormData {
    append() {}
  };
}

describe('pdfImportApi', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    setAuthToken('mock_jwt_token');
    setTokenExpiry(Date.now() + 3600000);
  });

  it('preview 应先获取预签名地址、直传 PDF，再请求后端解析对象 Key', async () => {
    const mockResponse = {
      batchId: 'batch_123',
      fileHash: 'hash123',
      expiresAt: '2026-07-29T12:00:00Z',
      teams: [],
      hasLowConfidence: false,
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            uploadUrl: 'https://r2.example.com/signed-put',
            objectKey: 'temp/pdf-source/admin/source.pdf',
            expiresAt: '2026-07-29T12:00:00Z',
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

    const file = {
      name: 'test.pdf',
      type: 'application/pdf',
      size: 15 * 1024 * 1024,
    } as any;
    const result = await pdfImportApi.preview(file);

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/import/pdf/upload-url'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://r2.example.com/signed-put',
      expect.objectContaining({
        method: 'PUT',
        body: file,
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/import/pdf/preview-uploaded'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          objectKey: 'temp/pdf-source/admin/source.pdf',
          fileName: 'test.pdf',
          fileSize: file.size,
        }),
      }),
    );
    expect(result.batchId).toBe('batch_123');
  });

  it('commit 应提交 JSON 载荷', async () => {
    const mockCommitRes = {
      message: '成功',
      batchId: 'batch_123',
      createdTeamsCount: 1,
      createdPlayersCount: 2,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify(mockCommitRes),
    });

    const teams = [
      {
        teamName: { value: '工程学院', confidence: 1.0, page: 1 },
        headCoach: { value: '李教练', confidence: 1.0, page: 1 },
        coachPhone: { value: '13800000000', confidence: 1.0, page: 1 },
        teamLeader: { value: '张领队', confidence: 1.0, page: 1 },
        leaderPhone: { value: '13900000000', confidence: 1.0, page: 1 },
        teamDoctor: { value: '王医生', confidence: 1.0, page: 1 },
        homeJerseyColor: { value: '白', confidence: 1.0, page: 1 },
        awayJerseyColor: { value: '黑', confidence: 1.0, page: 1 },
        players: [],
      },
    ];

    const result = await pdfImportApi.commit('batch_123', teams);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/import/pdf/batch_123/commit'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ teams, seasonId: undefined }),
      }),
    );
    expect(result.createdTeamsCount).toBe(1);
  });

  it('cancel 应发送 POST 取消请求', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify({ message: '已取消', batchId: 'batch_123' }),
    });

    const result = await pdfImportApi.cancel('batch_123');
    expect(result.batchId).toBe('batch_123');
  });
});
