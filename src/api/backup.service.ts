import { BackupDTO } from './types';
import { BASE_URL, createHeaders, handleResponse } from './http';

export interface InitUploadResult {
  uploadToken: string;
  uploadUrl: string;
  key: string;
  expiresIn: number;
  requiredHeaders?: Record<string, string>;
}

export interface RetentionResult {
  dryRun: boolean;
  plannedDeletions: Array<{ key: string; filename: string; reason: string; lastModified?: string }>;
  keptCount: number;
  deletedCount: number;
}

export const backupApi = {
  create: async (): Promise<{ success: boolean; data: BackupDTO }> => {
    const response = await fetch(`${BASE_URL}/backups/create`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; data: BackupDTO }>(response);
  },
  list: async (): Promise<{ success: boolean; data: BackupDTO[] }> => {
    const response = await fetch(`${BASE_URL}/backups/list`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; data: BackupDTO[] }>(response);
  },
  getDownloadUrl: async (key: string): Promise<{ success: boolean; downloadUrl: string }> => {
    const response = await fetch(`${BASE_URL}/backups/download-url`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ key }),
    });
    return handleResponse<{ success: boolean; downloadUrl: string }>(response);
  },
  restore: async (key: string, confirmText: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${BASE_URL}/backups/restore`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ key, confirmText }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
  initUpload: async (
    filename: string,
    size: number,
    sha256: string,
  ): Promise<{ success: boolean; data: InitUploadResult }> => {
    const response = await fetch(`${BASE_URL}/backups/upload/init`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ filename, size, sha256 }),
    });
    return handleResponse<{ success: boolean; data: InitUploadResult }>(response);
  },
  completeUpload: async (uploadToken: string): Promise<{ success: boolean; data: BackupDTO }> => {
    const response = await fetch(`${BASE_URL}/backups/upload/complete`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ uploadToken }),
    });
    return handleResponse<{ success: boolean; data: BackupDTO }>(response);
  },
  deleteBackup: async (key: string, confirmText: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${BASE_URL}/backups`, {
      method: 'DELETE',
      headers: createHeaders(),
      body: JSON.stringify({ key, confirmText }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
  cleanRetention: async (
    dryRun: boolean = true,
    confirmText?: string,
  ): Promise<{ success: boolean; data: RetentionResult }> => {
    const response = await fetch(`${BASE_URL}/backups/retention/clean`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ dryRun, confirmText }),
    });
    return handleResponse<{ success: boolean; data: RetentionResult }>(response);
  },
};
