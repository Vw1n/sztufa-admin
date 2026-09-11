import { CreateTeamWithPlayersDTO, TeamDTO, TeamListResponse, PlayerDTO } from './types';
import { authenticatedRequest } from './core';

type TeamPlayerUpdatePayload = Omit<PlayerDTO, 'teamId'> & { id?: string };

export const teamApi = {
  createWithPlayers: async (teamData: CreateTeamWithPlayersDTO): Promise<TeamDTO> => {
    return authenticatedRequest<TeamDTO>('/teams/with-players', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  create: async (teamData: TeamDTO): Promise<TeamDTO> => {
    return authenticatedRequest<TeamDTO>('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  getAll: async (page = 1, limit = 10, seasonId?: string, gender?: string): Promise<TeamListResponse> => {
    let url = `/teams/admin/manage?page=${page}&limit=${limit}`;
    if (seasonId) {
      url += `&seasonId=${seasonId}`;
    }
    if (gender) {
      url += `&gender=${gender}`;
    }
    return authenticatedRequest<TeamListResponse>(url, { method: 'GET' });
  },

  search: async (name: string): Promise<TeamDTO[]> => {
    return authenticatedRequest<TeamDTO[]>(`/teams/search?name=${encodeURIComponent(name)}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<TeamDTO> => {
    return authenticatedRequest<TeamDTO>(`/teams/${id}`, { method: 'GET' });
  },

  update: async (id: string, teamData: Partial<TeamDTO>): Promise<TeamDTO> => {
    return authenticatedRequest<TeamDTO>(`/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(teamData),
    });
  },

  updateWithPlayers: async (
    id: string,
    data: {
      seasonId: string;
      teamName?: string;
      teamDoctor?: string;
      headCoach?: string;
      teamLeader?: string;
      coachPhone?: string;
      leaderPhone?: string;
      homeJerseyColor?: string;
      awayJerseyColor?: string;
      teamLogo?: string | null;
      homeJersey?: string | null;
      awayJersey?: string | null;
      gender?: string;
      players?: TeamPlayerUpdatePayload[];
      deletePlayerIds?: string[];
    }
  ): Promise<TeamDTO> => {
    return authenticatedRequest<TeamDTO>(`/teams/${id}/with-players`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<TeamDTO> => {
    return authenticatedRequest<TeamDTO>(`/teams/${id}`, { method: 'DELETE' });
  },

  getPlayers: async (id: string, seasonId?: string): Promise<PlayerDTO[]> => {
    let url = `/teams/${id}/players`;
    if (seasonId) {
      url += `?seasonId=${seasonId}`;
    }
    return authenticatedRequest<PlayerDTO[]>(url, { method: 'GET' });
  },
};
