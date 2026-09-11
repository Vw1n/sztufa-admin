import { authenticatedRequest } from './core';

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
    const url = targetId ? `/admin/form-drafts/${targetId}` : '/admin/form-drafts';
    const method = targetId ? 'PATCH' : 'POST';
    return authenticatedRequest<SaveDraftResponse>(url, {
      method,
      body: JSON.stringify(data),
    });
  },

  getDraft: async (id: string): Promise<AdminFormDraftDTO> => {
    return authenticatedRequest<AdminFormDraftDTO>(`/admin/form-drafts/${id}`, {
      method: 'GET',
    });
  },

  listDrafts: async (formType?: 'TEAM' | 'MATCH'): Promise<AdminFormDraftDTO[]> => {
    const url = formType ? `/admin/form-drafts?formType=${formType}` : '/admin/form-drafts';
    return authenticatedRequest<AdminFormDraftDTO[]>(url, { method: 'GET' });
  },

  materializeDraft: async (id: string): Promise<{ success: boolean; officialRecordId?: string; error?: string }> => {
    return authenticatedRequest<{ success: boolean; officialRecordId?: string; error?: string }>(
      `/admin/form-drafts/${id}/materialize`,
      { method: 'POST' },
    );
  },

  deleteDraft: async (id: string): Promise<{ success: boolean }> => {
    return authenticatedRequest<{ success: boolean }>(`/admin/form-drafts/${id}`, {
      method: 'DELETE',
    });
  },
};
