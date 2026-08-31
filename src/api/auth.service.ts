import { AuthResponse, AuthUser } from './types';
import { BASE_URL, createHeaders, handleResponse } from './http';

export const authApi = {
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${BASE_URL}/staff-auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify(credentials),
    });
    return handleResponse<AuthResponse>(response);
  },

  // 管理员创建用户（需要携带 Token）
  createUser: async (credentials: { username: string; password: string; role?: string; teamId?: string; studentId?: string }): Promise<{ user: AuthUser }> => {
    const response = await fetch(`${BASE_URL}/staff-auth/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(credentials),
    });
    return handleResponse<{ user: AuthUser }>(response);
  },

  // 获取当前登录用户信息
  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await fetch(`${BASE_URL}/staff-auth/me`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<AuthUser>(response);
  },
};

export const userApi = {
  getAll: async (): Promise<AuthUser[]> => {
    const response = await fetch(`${BASE_URL}/staff-auth/users`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<AuthUser[]>(response);
  },

  updateRole: async (id: string, role: string, teamId: string | null): Promise<AuthUser> => {
    const response = await fetch(`${BASE_URL}/staff-auth/users/${id}/role`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ role, teamId }),
    });
    return handleResponse<AuthUser>(response);
  },

  delete: async (id: string): Promise<{ message?: string }> => {
    const response = await fetch(`${BASE_URL}/staff-auth/users/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<{ message?: string }>(response);
  },

  resetPassword: async (id: string, password: string): Promise<{ message?: string }> => {
    const response = await fetch(`${BASE_URL}/staff-auth/users/${id}/reset-password`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ password }),
    });
    return handleResponse<{ message?: string }>(response);
  },

  updateStudentId: async (id: string, studentId: string): Promise<AuthUser> => {
    const response = await fetch(`${BASE_URL}/staff-auth/users/${id}/student-id`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ studentId }),
    });
    return handleResponse<AuthUser>(response);
  },
};
