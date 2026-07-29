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

interface PdfUploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
}

export const pdfImportApi = {
  preview: async (file: File): Promise<PdfPreviewResponse> => {
    const mimeType = file.type || 'application/pdf';
    const uploadUrlResponse = await fetch(`${BASE_URL}/import/pdf/upload-url`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        mimeType,
      }),
    });
    const upload = await handleResponse<PdfUploadUrlResponse>(uploadUrlResponse);

    let directUploadResponse: Response;
    try {
      directUploadResponse = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: file,
      });
    } catch {
      throw new Error(
        'PDF 直传对象存储失败，请检查 R2/S3 CORS 配置或网络连接',
      );
    }
    if (!directUploadResponse.ok) {
      throw new Error(`PDF 直传对象存储失败（${directUploadResponse.status}）`);
    }

    const response = await fetch(`${BASE_URL}/import/pdf/preview-uploaded`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        objectKey: upload.objectKey,
        fileName: file.name,
        fileSize: file.size,
      }),
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
