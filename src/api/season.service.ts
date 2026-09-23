import { SeasonDTO, SeasonDeleteResponse, SeasonGroupDTO } from './types';
import { request, authenticatedRequest } from './core';

export const seasonApi = {
  // 以下两个只读接口历史上不携带认证头，保持现状（公开赛季元数据）。
  getAll: async (): Promise<SeasonDTO[]> => {
    return request<SeasonDTO[]>('/seasons');
  },
  getActive: async (): Promise<SeasonDTO | null> => {
    return request<SeasonDTO | null>('/seasons/active');
  },
  archive: async (name: string, type: string): Promise<SeasonDTO> => {
    return authenticatedRequest<SeasonDTO>('/seasons/archive', {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    });
  },
  create: async (name: string, type: string): Promise<SeasonDTO> => {
    return authenticatedRequest<SeasonDTO>('/seasons', {
      method: 'POST',
      body: JSON.stringify({ name, type }),
    });
  },
  updateStatus: async (id: string, status: string): Promise<SeasonDTO> => {
    return authenticatedRequest<SeasonDTO>(`/seasons/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  rename: async (id: string, name: string): Promise<SeasonDTO> => {
    return authenticatedRequest<SeasonDTO>(`/seasons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },
  delete: async (id: string): Promise<SeasonDeleteResponse> => {
    return authenticatedRequest<SeasonDeleteResponse>(`/seasons/${id}`, {
      method: 'DELETE',
    });
  },
  getGroups: async (id: string): Promise<SeasonGroupDTO[]> => {
    return request<SeasonGroupDTO[]>(`/seasons/${id}/groups`);
  },
  updateGroups: async (id: string, groups: { teamId: string; groupName: string }[]): Promise<{ count?: number; message?: string }> => {
    return authenticatedRequest<{ count?: number; message?: string }>(`/seasons/${id}/groups`, {
      method: 'POST',
      body: JSON.stringify({ groups }),
    });
  },
  generateKnockout: async (id: string): Promise<{ round?: string; countCreated?: number; countUpdated?: number; createdCount?: number; message?: string }> => {
    return authenticatedRequest<{ round?: string; countCreated?: number; countUpdated?: number; createdCount?: number; message?: string }>(
      `/seasons/${id}/generate-knockout`,
      { method: 'POST' },
    );
  },
};
