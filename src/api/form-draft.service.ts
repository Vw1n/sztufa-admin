import { BASE_URL, createHeaders, handleResponse } from './http';

export interface AdminFormDraftDTO {
  id?: string;
  draftId?: string;
  formType: 'TEAM' | 'MATCH';
  payload: Record<string, unknown>;
  seasonId?: string | null;
  officialRecordId?: string | null;
  status?: string;
  lastError?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveDraftResponse {
  draftId: string;
  saveStatus: 'DRAFT' | 'MATERIALIZED';
  officialRecordId?: string | null;
  lastError?: string | null;
  draft: AdminFormDraftDTO;
}

export const formDraftApi = {
  saveDraft: async (data: Partial<AdminFormDraftDTO>, draftId?: string): Promise<SaveDraftResponse> => {
    const targetId = data.draftId || draftId;
    const url = targetId ? `${BASE_URL}/admin/form-drafts/${targetId}` : `${BASE_URL}/admin/form-drafts`;
    const method = targetId ? 'PATCH' : 'POST';
    const response = await fetch(url, {
      method,
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<SaveDraftResponse>(response);
  },

  getDraft: async (id: string): Promise<AdminFormDraftDTO> => {
    const response = await fetch(`${BASE_URL}/admin/form-drafts/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<AdminFormDraftDTO>(response);
  },

  listDrafts: async (formType?: 'TEAM' | 'MATCH'): Promise<AdminFormDraftDTO[]> => {
    const url = formType ? `${BASE_URL}/admin/form-drafts?formType=${formType}` : `${BASE_URL}/admin/form-drafts`;
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<AdminFormDraftDTO[]>(response);
  },

  materializeDraft: async (id: string): Promise<{ success: boolean; officialRecordId?: string; error?: string }> => {
    const response = await fetch(`${BASE_URL}/admin/form-drafts/${id}/materialize`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; officialRecordId?: string; error?: string }>(response);
  },

  deleteDraft: async (id: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${BASE_URL}/admin/form-drafts/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean }>(response);
  },
};
