import {
  ApiResponse,
  ImportExecutionResult,
  ImportPreview,
  LastImportBatch,
  UndoImportResult,
} from './types';
import { BASE_URL, handleResponse, createHeaders } from './http';

export const importApi = {
  preview: async (files: File[]): Promise<ImportPreview> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(`${BASE_URL}/import/json/preview`, {
      method: 'POST',
      headers: createHeaders(true),
      body: formData,
    });
    return handleResponse<ImportPreview>(response);
  },

  execute: async (
    files: File[],
    expectedDigest: string,
  ): Promise<{ message: string; result: ImportExecutionResult }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('expectedDigest', expectedDigest);

    const response = await fetch(`${BASE_URL}/import/json`, {
      method: 'POST',
      headers: createHeaders(true),
      body: formData,
    });
    return handleResponse<{ message: string; result: ImportExecutionResult }>(response);
  },

  getLast: async (): Promise<LastImportBatch | null> => {
    const response = await fetch(`${BASE_URL}/import/json/last`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<LastImportBatch | null>(response);
  },

  undoLast: async (): Promise<{ message: string; result: UndoImportResult }> => {
    const response = await fetch(`${BASE_URL}/import/json/undo`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return handleResponse<{ message: string; result: UndoImportResult }>(response);
  },
};

export const uploadApi = {
  upload: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: createHeaders(true), // multipart = true
      body: formData,
    });
    return handleResponse<ApiResponse<{ url: string }>>(response);
  },

  cleanupTempKeys: async (keys: string[]): Promise<{ cleanedCount: number }> => {
    if (!keys || keys.length === 0) return { cleanedCount: 0 };
    const response = await fetch(`${BASE_URL}/upload/cleanup-temp`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ keys }),
    });
    return handleResponse<{ cleanedCount: number }>(response);
  },
};
