import { AuditLogDTO } from './types';
import { authenticatedRequest } from './core';

export const auditLogApi = {
  getAll: async (page = 1, limit = 20, username = '', action = ''): Promise<{ data: AuditLogDTO[]; total: number; page: number; limit: number }> => {
    let url = `/audit-logs?page=${page}&limit=${limit}`;
    if (username) url += `&username=${encodeURIComponent(username)}`;
    if (action) url += `&action=${encodeURIComponent(action)}`;
    return authenticatedRequest<{ data: AuditLogDTO[]; total: number; page: number; limit: number }>(url, {
      method: 'GET',
    });
  },
};
