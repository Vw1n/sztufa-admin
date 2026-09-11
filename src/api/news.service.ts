import { authenticatedRequest } from './core';

export interface NewsDTO {
  id?: string;
  title: string;
  category: string;
  description: string;
  coverImage?: string | null;
  wechatUrl: string;
  date: string;
}

export const newsApi = {
  create: async (newsData: NewsDTO): Promise<NewsDTO> => {
    return authenticatedRequest<NewsDTO>('/news', {
      method: 'POST',
      body: JSON.stringify(newsData),
    });
  },

  getAll: async (page = 1, limit = 10, category = 'all'): Promise<{ data: NewsDTO[]; total: number; page: number; limit: number }> => {
    let url = `/news?page=${page}&limit=${limit}`;
    if (category && category !== 'all') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    return authenticatedRequest<{ data: NewsDTO[]; total: number; page: number; limit: number }>(url, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<NewsDTO> => {
    return authenticatedRequest<NewsDTO>(`/news/${id}`, { method: 'GET' });
  },

  update: async (id: string, newsData: Partial<NewsDTO>): Promise<NewsDTO> => {
    return authenticatedRequest<NewsDTO>(`/news/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(newsData),
    });
  },

  delete: async (id: string): Promise<NewsDTO> => {
    return authenticatedRequest<NewsDTO>(`/news/${id}`, { method: 'DELETE' });
  },
};
