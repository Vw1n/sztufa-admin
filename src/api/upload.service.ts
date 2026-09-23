import {
  ApiResponse,
  ImportExecutionResult,
  ImportPreview,
  LastImportBatch,
  UndoImportResult,
} from './types';
import { authenticatedRequest } from './core';

export const importApi = {
  preview: async (files: File[]): Promise<ImportPreview> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    return authenticatedRequest<ImportPreview>('/import/json/preview', {
      method: 'POST',
      body: formData,
    }, { multipart: true });
  },

  execute: async (
    files: File[],
    expectedDigest: string,
  ): Promise<{ message: string; result: ImportExecutionResult }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('expectedDigest', expectedDigest);

    return authenticatedRequest<{ message: string; result: ImportExecutionResult }>(
      '/import/json',
      { method: 'POST', body: formData },
      { multipart: true },
    );
  },

  getLast: async (): Promise<LastImportBatch | null> => {
    return authenticatedRequest<LastImportBatch | null>('/import/json/last', {
      method: 'GET',
    });
  },

  undoLast: async (): Promise<{ message: string; result: UndoImportResult }> => {
    return authenticatedRequest<{ message: string; result: UndoImportResult }>(
      '/import/json/undo',
      { method: 'POST' },
    );
  },
};

export const uploadApi = {
  upload: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);

    return authenticatedRequest<ApiResponse<{ url: string }>>(
      '/upload',
      { method: 'POST', body: formData },
      { multipart: true },
    );
  },

  cleanupTempKeys: async (keys: string[]): Promise<{ cleanedCount: number }> => {
    if (!keys || keys.length === 0) return { cleanedCount: 0 };
    return authenticatedRequest<{ cleanedCount: number }>('/upload/cleanup-temp', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    });
  },
};
