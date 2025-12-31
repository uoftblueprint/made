import apiClient from './apiClient';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'VOLUNTEER';
  created_at: string;
}

export const authApi = {
  login: async (email: string, password: string) => {
    if (typeof email !== 'string' || email.trim().length === 0) {
      throw new Error('Email is required and must be a non-empty string.');
    }
    if (typeof password !== 'string' || password.trim().length === 0) {
      throw new Error('Password is required and must be a non-empty string.');
    }
    const response = await apiClient.post('/auth/login/', { email, password });
    return response.data;
  },

  logout: async (refreshToken: string) => {
    await apiClient.post('/auth/logout/', { refresh: refreshToken });
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me/');
    return response.data as User;
  },
};
