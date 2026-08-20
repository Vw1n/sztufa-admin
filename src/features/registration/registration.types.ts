export type RegistrationStatusType =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CHANGES_REQUESTED'
  | 'APPROVED';

export interface RegistrationTeamDataDTO {
  id?: string;
  registrationId?: string;
  teamName: string;
  teamDoctor?: string | null;
  headCoach?: string | null;
  teamLeader?: string | null;
  coachPhone?: string | null;
  leaderPhone?: string | null;
  homeJerseyColor: string;
  awayJerseyColor: string;
  teamLogo?: string | null;
  homeJersey?: string | null;
  awayJersey?: string | null;
  gender: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegistrationPlayerDTO {
  id?: string;
  registrationId?: string;
  playerId?: string | null;
  name: string;
  studentId: string;
  jerseyNumber: string;
  photo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamRegistrationDTO {
  id: string;
  seasonId: string;
  teamId: string;
  submittedById: string;
  status: RegistrationStatusType;
  reviewComment?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  createdAt: string;
  updatedAt: string;
  teamData?: RegistrationTeamDataDTO | null;
  players?: RegistrationPlayerDTO[];
  season?: { id: string; name: string; status: string } | null;
  team?: { id: string; teamName: string; gender: string } | null;
  submittedBy?: { id: string; username: string; nickname?: string } | null;
  reviewedBy?: { id: string; username: string; nickname?: string } | null;
}

export interface RegistrationListItemDTO {
  id: string;
  seasonId: string;
  seasonName: string;
  teamId: string;
  teamName: string;
  gender: string;
  teamLogo?: string | null;
  status: RegistrationStatusType;
  playerCount: number;
  reviewComment?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  updatedAt: string;
}

export interface RegistrationListResponseDTO {
  items: RegistrationListItemDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SaveRegistrationPayload {
  teamData?: Partial<RegistrationTeamDataDTO>;
  players?: RegistrationPlayerDTO[];
}

export interface ReviewRegistrationPayload {
  reviewComment?: string;
}

export interface RegistrationQueryFilter {
  seasonId?: string;
  status?: RegistrationStatusType;
  page?: number;
  pageSize?: number;
}
