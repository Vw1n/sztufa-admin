import { AuthResponse, AuthUser } from './types';
import { request, authenticatedRequest } from './core';

export const authApi = {
  // 登录走公开请求：401 只抛 ApiError，不触发会话过期导航，
  // 让登录页能正常显示"密码错误"等业务提示。
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    return request<AuthResponse>('/staff-auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify(credentials),
    });
  },

  // 管理员创建用户（需要携带 Token）
  createUser: async (credentials: { username: string; password: string; role?: string; teamId?: string; studentId?: string }): Promise<{ user: AuthUser }> => {
    return authenticatedRequest<{ user: AuthUser }>('/staff-auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // 获取当前登录用户信息
  getCurrentUser: async (): Promise<AuthUser> => {
    return authenticatedRequest<AuthUser>('/staff-auth/me', { method: 'GET' });
  },
};

export const userApi = {
  getAll: async (): Promise<AuthUser[]> => {
    return authenticatedRequest<AuthUser[]>('/staff-auth/users', { method: 'GET' });
  },

  updateRole: async (id: string, role: string, teamId: string | null): Promise<AuthUser> => {
    return authenticatedRequest<AuthUser>(`/staff-auth/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, teamId }),
    });
  },

  delete: async (id: string): Promise<{ message?: string }> => {
    return authenticatedRequest<{ message?: string }>(`/staff-auth/users/${id}`, {
      method: 'DELETE',
    });
  },

  resetPassword: async (id: string, password: string): Promise<{ message?: string }> => {
    return authenticatedRequest<{ message?: string }>(`/staff-auth/users/${id}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
  },

  updateStudentId: async (id: string, studentId: string): Promise<AuthUser> => {
    return authenticatedRequest<AuthUser>(`/staff-auth/users/${id}/student-id`, {
      method: 'PATCH',
      body: JSON.stringify({ studentId }),
    });
  },
};
