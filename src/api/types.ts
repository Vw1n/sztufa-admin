export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface PlayerDTO {
  id?: string;
  name: string;
  studentId: string;
  jerseyNumber: string;
  photo?: string | null;
  status?: string;
  yellowCards?: number;
  redCards?: number;
  teamId: string;
  team?: TeamDTO;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateTeamPlayerDTO = Omit<
  PlayerDTO,
  'id' | 'teamId' | 'team' | 'createdAt' | 'updatedAt'
>;

export type CreateTeamWithPlayersDTO = Omit<TeamDTO, 'id' | 'players' | 'createdAt' | 'updatedAt'> & {
  seasonId: string;
  players: CreateTeamPlayerDTO[];
};

export interface SeasonDTO {
  id: string;
  name: string;
  status: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamDTO {
  id?: string;
  teamName: string;
  teamDoctor?: string;
  headCoach?: string;
  teamLeader?: string;
  coachPhone?: string;
  leaderPhone?: string;
  homeJerseyColor: string;
  awayJerseyColor: string;
  teamLogo?: string | null;
  homeJersey?: string | null;
  awayJersey?: string | null;
  players?: PlayerDTO[];
  gender?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoalDTO {
  playerName: string;
  goalTime: string;
  jerseyNumber: string;
}

export interface MatchDTO {
  id?: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  winnerTeamId?: string | null;
  decidedBy?: 'REGULAR' | 'EXTRA_TIME' | 'PENALTIES' | null;
  matchDate: string;
  location: string;
  status?: 'scheduled' | 'ongoing' | 'finished' | 'cancelled' | 'completed';
  homeTeam?: TeamDTO;
  awayTeam?: TeamDTO;
  goals?: any[];
  events?: any[];
  mvpPlayerId?: string | null;
  mvpPlayerName?: string | null;
  seasonId?: string | null;
  lineups?: any[];
  stage?: string;
  groupName?: string;
  knockoutRound?: string;
  knockoutMatchIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamListResponse {
  data: TeamDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface MatchListResponse {
  data: MatchDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface PlayerListResponse {
  data: PlayerDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface ImportEntityCounts {
  seasons: number;
  teams: number;
  players: number;
  matches: number;
  events: number;
}

export interface ImportFileSummary {
  name: string;
  type: 'season' | 'supplemental' | 'manifest';
  season?: string;
}

export interface ImportPreview {
  digest: string;
  canImport: boolean;
  files: ImportFileSummary[];
  records: ImportEntityCounts;
  create: ImportEntityCounts;
  update: ImportEntityCounts;
  warnings: string[];
  errors: string[];
}

export interface ImportExecutionResult {
  digest: string;
  created: ImportEntityCounts;
  updated: ImportEntityCounts;
  warnings: string[];
}

export interface LastImportBatch {
  id: string;
  digest: string;
  username: string;
  status: string;
  summary: ImportExecutionResult;
  createdAt: string;
}

export interface UndoImportResult {
  batchId: string;
  affectedSeasons: number;
  restoredMatches: number;
  deletedMatches: number;
  restoredPlayers: number;
  deletedPlayers: number;
  warnings: string[];
}

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  teamId?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface AuditLogDTO {
  id: string;
  username: string;
  action: string;
  details: string;
  createdAt: string;
  subLogs?: { id: string; details: string; createdAt: string }[];
}

export interface BackupDTO {
  key: string;
  filename: string;
  size: number;
  lastModified: string;
  formatVersion?: string;
  compressed?: boolean;
  checksum?: string;
  purpose?: string;
  protected?: boolean;
  validated?: boolean;
}


export const validateResponse = (response: ApiResponse | ErrorResponse): response is ApiResponse => {
  return 'data' in response && 'message' in response;
};
