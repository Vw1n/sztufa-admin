import { PlayerDTO, PlayerListResponse } from './types';
import { authenticatedRequest } from './core';

export const playerApi = {
  create: async (playerData: PlayerDTO): Promise<PlayerDTO> => {
    return authenticatedRequest<PlayerDTO>('/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  },

  getAll: async (page = 1, limit = 10, teamId?: string): Promise<PlayerListResponse> => {
    let url = `/players/admin/manage?page=${page}&limit=${limit}`;
    if (teamId) {
      url += `&teamId=${teamId}`;
    }
    return authenticatedRequest<PlayerListResponse>(url, { method: 'GET' });
  },

  search: async (name: string): Promise<PlayerDTO[]> => {
    return authenticatedRequest<PlayerDTO[]>(`/players/search?name=${encodeURIComponent(name)}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<PlayerDTO> => {
    return authenticatedRequest<PlayerDTO>(`/players/${id}`, { method: 'GET' });
  },

  update: async (id: string, playerData: Partial<PlayerDTO>): Promise<PlayerDTO> => {
    return authenticatedRequest<PlayerDTO>(`/players/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(playerData),
    });
  },

  delete: async (id: string): Promise<PlayerDTO> => {
    return authenticatedRequest<PlayerDTO>(`/players/${id}`, { method: 'DELETE' });
  },
};
