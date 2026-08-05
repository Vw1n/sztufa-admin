import { BASE_URL, createHeaders, handleResponse } from './http';
import { SeasonDTO, SeasonDeleteResponse, SeasonGroupDTO } from './types';

export const seasonApi = {
  getAll: async (): Promise<SeasonDTO[]> => {
    const response = await fetch(`${BASE_URL}/seasons`);
    return handleResponse<SeasonDTO[]>(response);
  },
  getActive: async (): Promise<SeasonDTO | null> => {
    const response = await fetch(`${BASE_URL}/seasons/active`);
    return handleResponse<SeasonDTO | null>(response);
  },
  archive: async (name: string, type: string): Promise<SeasonDTO> => {
    const response = await fetch(`${BASE_URL}/seasons/archive`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ name, type }),
    });
    return handleResponse<SeasonDTO>(response);
  },
  create: async (name: string, type: string): Promise<SeasonDTO> => {
    const response = await fetch(`${BASE_URL}/seasons`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ name, type }),
    });
    return handleResponse<SeasonDTO>(response);
  },
  updateStatus: async (id: string, status: string): Promise<SeasonDTO> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}/status`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<SeasonDTO>(response);
  },
  rename: async (id: string, name: string): Promise<SeasonDTO> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse<SeasonDTO>(response);
  },
  delete: async (id: string): Promise<SeasonDeleteResponse> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<SeasonDeleteResponse>(response);
  },
  getGroups: async (id: string): Promise<SeasonGroupDTO[]> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}/groups`);
    return handleResponse<SeasonGroupDTO[]>(response);
  },
  updateGroups: async (id: string, groups: { teamId: string; groupName: string }[]): Promise<{ count?: number; message?: string }> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}/groups`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ groups }),
    });
    return handleResponse<{ count?: number; message?: string }>(response);
  },
  generateKnockout: async (id: string): Promise<{ round?: string; countCreated?: number; countUpdated?: number; createdCount?: number; message?: string }> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}/generate-knockout`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return handleResponse<{ round?: string; countCreated?: number; countUpdated?: number; createdCount?: number; message?: string }>(response);
  },
};
