import { registrationApi } from './registration.service';
import { ApiError } from './http';

describe('registrationApi', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('tokenExpiry', (Date.now() + 3600000).toString());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('getMine calls GET /registrations/me with seasonId query', async () => {
    const mockData = { id: 'reg-1', status: 'DRAFT' };
    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockData),
    });

    const result = await registrationApi.getMine('season-1');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/registrations/me?seasonId=season-1'),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    expect(result).toEqual(mockData);
  });

  it('getMine treats a successful empty response as no registration', async () => {
    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '',
    });

    await expect(registrationApi.getMine('season-1')).resolves.toBeNull();
  });

  it('create calls POST /registrations with seasonId', async () => {
    const mockData = { id: 'reg-1', seasonId: 'season-1', status: 'DRAFT' };
    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: async () => JSON.stringify(mockData),
    });

    const result = await registrationApi.create('season-1');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/registrations'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ seasonId: 'season-1' }),
      }),
    );
    expect(result).toEqual(mockData);
  });

  it('save calls PATCH /registrations/:id', async () => {
    const mockData = { id: 'reg-1', status: 'DRAFT' };
    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockData),
    });

    const payload = { teamData: { teamName: 'Alpha' } };
    const result = await registrationApi.save('reg-1', payload);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/registrations/reg-1'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    );
    expect(result).toEqual(mockData);
  });

  it('approve throws ApiError with status 409 when concurrent conflict happens', async () => {
    (global as any).fetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () => JSON.stringify({ message: '并发审批冲突' }),
    });

    await expect(registrationApi.approve('reg-1', 'OK')).rejects.toThrow(ApiError);
  });

  it('getAdminList constructs correct query string', async () => {
    const mockList = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    (global as any).fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockList),
    });

    const result = await registrationApi.getAdminList({
      seasonId: 's-1',
      status: 'SUBMITTED',
      page: 2,
      pageSize: 10,
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/registrations/admin?seasonId=s-1&status=SUBMITTED&page=2&pageSize=10'),
      expect.any(Object),
    );
    expect(result).toEqual(mockList);
  });
});
