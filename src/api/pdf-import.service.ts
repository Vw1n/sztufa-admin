import { BASE_URL, authenticatedRequest, buildAuthHeaders, parseResponse } from './core';

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
    const upload = await authenticatedRequest<PdfUploadUrlResponse>(
      '/import/pdf/upload-url',
      {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType,
        }),
      },
    );

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

    return authenticatedRequest<PdfPreviewResponse>('/import/pdf/preview-uploaded', {
      method: 'POST',
      body: JSON.stringify({
        objectKey: upload.objectKey,
        fileName: file.name,
        fileSize: file.size,
      }),
    });
  },

  commit: async (
    batchId: string,
    teams: ParsedTeam[],
    seasonId?: string,
  ): Promise<PdfCommitResponse> => {
    return authenticatedRequest<PdfCommitResponse>(`/import/pdf/${batchId}/commit`, {
      method: 'POST',
      body: JSON.stringify({ teams, seasonId }),
    });
  },

  uploadPhoto: async (batchId: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    return authenticatedRequest<{ url: string }>(
      `/import/pdf/${batchId}/photo`,
      { method: 'POST', body: formData },
      { multipart: true },
    );
  },

  downloadAsset: async (batchId: string, url: string): Promise<Blob> => {
    const response = await fetch(`${BASE_URL}/import/pdf/${batchId}/asset`, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      await parseResponse(response);
    }
    return response.blob();
  },

  cancel: async (batchId: string): Promise<{ message: string; batchId: string }> => {
    return authenticatedRequest<{ message: string; batchId: string }>(
      `/import/pdf/${batchId}/cancel`,
      { method: 'POST' },
    );
  },
};
