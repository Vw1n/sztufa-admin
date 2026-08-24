import { BASE_URL, createHeaders, handleResponse } from './http';
import {
  RegistrationListResponseDTO,
  RegistrationQueryFilter,
  ReviewRegistrationPayload,
  SaveRegistrationPayload,
  TeamRegistrationDTO,
} from '../features/registration/registration.types';

export const registrationApi = {
  async getMine(seasonId?: string): Promise<TeamRegistrationDTO | null> {
    const query = seasonId ? `?seasonId=${encodeURIComponent(seasonId)}` : '';
    const res = await fetch(`${BASE_URL}/registrations/me${query}`, {
      headers: createHeaders(),
    });
    return handleResponse<TeamRegistrationDTO | null>(res);
  },

  async create(seasonId: string): Promise<TeamRegistrationDTO> {
    const res = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ seasonId }),
    });
    return handleResponse<TeamRegistrationDTO>(res);
  },

  async save(id: string, payload: SaveRegistrationPayload): Promise<TeamRegistrationDTO> {
    const res = await fetch(`${BASE_URL}/registrations/${id}`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<TeamRegistrationDTO>(res);
  },

  async submit(id: string, comment?: string): Promise<TeamRegistrationDTO> {
    const res = await fetch(`${BASE_URL}/registrations/${id}/submit`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ comment }),
    });
    return handleResponse<TeamRegistrationDTO>(res);
  },

  async getAdminList(filter: RegistrationQueryFilter = {}): Promise<RegistrationListResponseDTO> {
    const params = new URLSearchParams();
    if (filter.seasonId) params.append('seasonId', filter.seasonId);
    if (filter.status) params.append('status', filter.status);
    if (filter.page) params.append('page', String(filter.page));
    if (filter.pageSize) params.append('pageSize', String(filter.pageSize));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/registrations/admin${queryString}`, {
      headers: createHeaders(),
    });
    return handleResponse<RegistrationListResponseDTO>(res);
  },

  async getDetail(id: string): Promise<TeamRegistrationDTO> {
    const res = await fetch(`${BASE_URL}/registrations/${id}`, {
      headers: createHeaders(),
    });
    return handleResponse<TeamRegistrationDTO>(res);
  },

  async approve(id: string, reviewComment?: string): Promise<TeamRegistrationDTO> {
    const payload: ReviewRegistrationPayload = { reviewComment };
    const res = await fetch(`${BASE_URL}/registrations/${id}/approve`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<TeamRegistrationDTO>(res);
  },

  async requestChanges(id: string, reviewComment?: string): Promise<TeamRegistrationDTO> {
    const payload: ReviewRegistrationPayload = { reviewComment };
    const res = await fetch(`${BASE_URL}/registrations/${id}/request-changes`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<TeamRegistrationDTO>(res);
  },
};
