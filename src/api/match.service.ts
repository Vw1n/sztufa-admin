import { MatchDTO, MatchListResponse } from './types';
import { authenticatedRequest } from './core';

export const matchApi = {
  create: async (matchData: MatchDTO): Promise<MatchDTO> => {
    return authenticatedRequest<MatchDTO>('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  },

  getAll: async (
    page = 1,
    limit = 100,
    teamId?: string,
    seasonId?: string,
    stage?: string,
    groupName?: string,
    knockoutRound?: string
  ): Promise<MatchListResponse> => {
    let url = `/matches?page=${page}&limit=${limit}`;
    if (teamId) {
      url += `&teamId=${teamId}`;
    }
    if (seasonId) {
      url += `&seasonId=${seasonId}`;
    }
    if (stage) {
      url += `&stage=${stage}`;
    }
    if (groupName) {
      url += `&groupName=${groupName}`;
    }
    if (knockoutRound) {
      url += `&knockoutRound=${knockoutRound}`;
    }
    return authenticatedRequest<MatchListResponse>(url, { method: 'GET' });
  },

  getById: async (id: string): Promise<MatchDTO> => {
    return authenticatedRequest<MatchDTO>(`/matches/${id}`, { method: 'GET' });
  },

  update: async (id: string, matchData: Partial<MatchDTO>): Promise<MatchDTO> => {
    return authenticatedRequest<MatchDTO>(`/matches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(matchData),
    });
  },

  delete: async (id: string): Promise<MatchDTO> => {
    return authenticatedRequest<MatchDTO>(`/matches/${id}`, { method: 'DELETE' });
  },

  recalculatePredictions: async (matchId: string): Promise<{ settledCount?: number; count?: number; message?: string }> => {
    return authenticatedRequest<{ settledCount?: number; count?: number; message?: string }>(
      `/predictions/matches/${matchId}/recalculate`,
      { method: 'POST' },
    );
  },

  voidPredictions: async (matchId: string): Promise<{ voidedCount?: number; count?: number; message?: string }> => {
    return authenticatedRequest<{ voidedCount?: number; count?: number; message?: string }>(
      `/predictions/matches/${matchId}/void`,
      { method: 'POST' },
    );
  },
};
