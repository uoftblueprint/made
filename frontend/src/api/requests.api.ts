// Movement Requests API calls
import apiClient from './apiClient';
import type { MovementRequest, MovementRequestStatus } from '../lib/types';

export interface MovementRequestFilter {
  status?: MovementRequestStatus;
}

export interface CreateMovementRequestInput {
  item: number;
  from_location: number;
  to_location: number;
}

export interface ReviewRequestInput {
  comment?: string;
}

export const requestsApi = {
  getAll: async (params?: MovementRequestFilter): Promise<MovementRequest[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;

    const response = await apiClient.get('/movements/movement-requests/', { params: queryParams });
    return response.data.results ?? response.data;
  },

  getByItemId: async (itemId: number): Promise<MovementRequest[]> => {
    const response = await apiClient.get('/movements/movement-requests/', {
      params: { item: itemId }
    });
    return response.data.results ?? response.data;
  },

  getPending: async (): Promise<MovementRequest[]> => {
    const response = await apiClient.get('/movements/movement-requests/', {
      params: { status: 'WAITING_APPROVAL' }
    });
    return response.data.results ?? response.data;
  },

  getById: async (id: number): Promise<MovementRequest> => {
    const response = await apiClient.get(`/movements/movement-requests/${id}/`);
    return response.data;
  },

  create: async (data: CreateMovementRequestInput): Promise<MovementRequest> => {
    const response = await apiClient.post('/movements/movement-requests/', data);
    return response.data;
  },

  approve: async (id: number, data?: ReviewRequestInput): Promise<MovementRequest> => {
    const response = await apiClient.post(`/movements/movement-requests/${id}/approve/`, data ?? {});
    return response.data;
  },

  reject: async (id: number, data?: ReviewRequestInput): Promise<MovementRequest> => {
    const response = await apiClient.post(`/movements/movement-requests/${id}/reject/`, data ?? {});
    return response.data;
  },
};
