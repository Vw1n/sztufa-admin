import { TeamDTO, PlayerDTO } from '../../../api/types';
import { Team, Player } from '../../../types';
import { generateId } from '../../../utils';

export function mapPlayerDtoToModel(p: PlayerDTO): Player {
  return {
    id: p.id || generateId(),
    name: p.name,
    studentId: p.studentId,
    jerseyNumber: p.jerseyNumber,
    photo: p.photo || null,
    status: p.status || 'active',
    yellowCards: p.yellowCards || 0,
    redCards: p.redCards || 0,
    teamId: p.teamId || '',
  };
}

export function mapTeamDtoToModel(t: TeamDTO): Team {
  return {
    id: t.id || generateId(),
    teamName: t.teamName,
    teamDoctor: t.teamDoctor,
    headCoach: t.headCoach,
    teamLeader: t.teamLeader,
    coachPhone: t.coachPhone,
    leaderPhone: t.leaderPhone,
    homeJerseyColor: t.homeJerseyColor,
    awayJerseyColor: t.awayJerseyColor,
    teamLogo: t.teamLogo || null,
    homeJersey: t.homeJersey || null,
    awayJersey: t.awayJersey || null,
    gender: t.gender || 'MALE',
    players: t.players?.map((p: PlayerDTO) => mapPlayerDtoToModel(p)) || [],
  };
}

export function buildPlayerPayload(players: Player[]) {
  return players.map((p) => ({
    id: p.id.startsWith('temp_') ? undefined : p.id,
    name: p.name,
    studentId: p.studentId,
    jerseyNumber: p.jerseyNumber,
    status: p.status || 'active',
    yellowCards: Number(p.yellowCards) || 0,
    redCards: Number(p.redCards) || 0,
    photo: p.photo || null,
  }));
}

export function calculateDeletedPlayerIds(originalPlayers: Player[], currentPlayers: Player[]): string[] {
  return originalPlayers
    .filter((op) => !currentPlayers.some((cp) => cp.id === op.id))
    .map((p) => p.id);
}
