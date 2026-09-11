import { authenticatedRequest } from './core';
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
    return authenticatedRequest<TeamRegistrationDTO | null>(`/registrations/me${query}`, {
      method: 'GET',
    });
  },

  async create(seasonId: string): Promise<TeamRegistrationDTO> {
    return authenticatedRequest<TeamRegistrationDTO>('/registrations', {
      method: 'POST',
      body: JSON.stringify({ seasonId }),
    });
  },

  async save(id: string, payload: SaveRegistrationPayload): Promise<TeamRegistrationDTO> {
    return authenticatedRequest<TeamRegistrationDTO>(`/registrations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async submit(id: string, comment?: string): Promise<TeamRegistrationDTO> {
    return authenticatedRequest<TeamRegistrationDTO>(`/registrations/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  async getAdminList(filter: RegistrationQueryFilter = {}): Promise<RegistrationListResponseDTO> {
    const params = new URLSearchParams();
    if (filter.seasonId) params.append('seasonId', filter.seasonId);
    if (filter.status) params.append('status', filter.status);
    if (filter.page) params.append('page', String(filter.page));
    if (filter.pageSize) params.append('pageSize', String(filter.pageSize));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return authenticatedRequest<RegistrationListResponseDTO>(`/registrations/admin${queryString}`, {
      method: 'GET',
    });
  },

  async getDetail(id: string): Promise<TeamRegistrationDTO> {
    return authenticatedRequest<TeamRegistrationDTO>(`/registrations/${id}`, {
      method: 'GET',
    });
  },

  async approve(id: string, reviewComment?: string): Promise<TeamRegistrationDTO> {
    const payload: ReviewRegistrationPayload = { reviewComment };
    return authenticatedRequest<TeamRegistrationDTO>(`/registrations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async requestChanges(id: string, reviewComment?: string): Promise<TeamRegistrationDTO> {
    const payload: ReviewRegistrationPayload = { reviewComment };
    return authenticatedRequest<TeamRegistrationDTO>(`/registrations/${id}/request-changes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
