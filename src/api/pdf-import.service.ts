import { BASE_URL, createHeaders, handleResponse } from './http';

export interface ParsedField<T = string> {
  value: T | null;
  confidence: number;
  page: number;
  warnings?: string[];
  manuallyConfirmed?: boolean;
}

export interface ParsedPlayer {
  name: ParsedField<string>;
  studentId: ParsedField<string>;
  jerseyNumber: ParsedField<string>;
  photo: ParsedField<string>;
  needsManualConfirm: boolean;
}

export interface ParsedTeam {
  teamName: ParsedField<string>;
  headCoach: ParsedField<string>;
  coachPhone: ParsedField<string>;
  teamLeader: ParsedField<string>;
  leaderPhone: ParsedField<string>;
  teamDoctor: ParsedField<string>;
  homeJerseyColor: ParsedField<string>;
  awayJerseyColor: ParsedField<string>;
  logo?: ParsedField<string>;
  homeJerseyPhoto?: ParsedField<string>;
  awayJerseyPhoto?: ParsedField<string>;
  players: ParsedPlayer[];
}

export interface PdfPreviewResponse {
  batchId: string;
  fileHash: string;
  expiresAt: string;
  teams: ParsedTeam[];
  hasLowConfidence: boolean;
}

export interface PdfCommitResponse {
  message: string;
  batchId: string;
  createdTeamsCount: number;
  createdPlayersCount: number;
}

export const pdfImportApi = {
  preview: async (file: File): Promise<PdfPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/import/pdf/preview`, {
      method: 'POST',
      headers: createHeaders(true),
      body: formData,
    });
    return handleResponse<PdfPreviewResponse>(response);
  },

  commit: async (
    batchId: string,
    teams: ParsedTeam[],
    seasonId?: string,
  ): Promise<PdfCommitResponse> => {
    const response = await fetch(`${BASE_URL}/import/pdf/${batchId}/commit`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ teams, seasonId }),
    });
    return handleResponse<PdfCommitResponse>(response);
  },

  uploadPhoto: async (batchId: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/import/pdf/${batchId}/photo`, {
      method: 'POST',
      headers: createHeaders(true),
      body: formData,
    });
    return handleResponse<{ url: string }>(response);
  },

  cancel: async (batchId: string): Promise<{ message: string; batchId: string }> => {
    const response = await fetch(`${BASE_URL}/import/pdf/${batchId}/cancel`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return handleResponse<{ message: string; batchId: string }>(response);
  },
};
