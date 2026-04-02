// Movement Requests API calls
import apiClient from './apiClient';
import type { BoxMovementRequest, MovementRequest, MovementRequestStatus } from '../lib/types';

export interface MovementRequestFilter {
  status?: MovementRequestStatus;
  mine?: boolean;
}

export interface CreateMovementRequestInput {
  item: number;
  from_location: number;
  to_location: number;
  from_box?: number | null;
  to_box?: number | null;
}

export interface CreateBoxMovementRequestInput {
  box: number;
  from_location: number;
  to_location: number;
}

export interface ReviewRequestInput {
  comment?: string;
}

export interface CompleteArrivalInput {
  comment?: string;
}

export const requestsApi = {
  getAll: async (params?: MovementRequestFilter): Promise<MovementRequest[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.mine) queryParams.mine = 'true';

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

  completeArrival: async (id: number, data?: CompleteArrivalInput): Promise<MovementRequest> => {
    const response = await apiClient.post(`/movements/movement-requests/${id}/complete-arrival/`, data ?? {});
    return response.data;
  },

  verify: async (id: number, data?: ReviewRequestInput): Promise<MovementRequest> => {
    const response = await apiClient.post(`/movements/movement-requests/${id}/verify/`, data ?? {});
    return response.data;
  },
};

export const boxRequestsApi = {
  getAll: async (params?: MovementRequestFilter): Promise<BoxMovementRequest[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.mine) queryParams.mine = 'true';

    const response = await apiClient.get('/movements/box-movement-requests/', { params: queryParams });
    return response.data.results ?? response.data;
  },

  getByBoxId: async (boxId: number): Promise<BoxMovementRequest[]> => {
    const response = await apiClient.get('/movements/box-movement-requests/', {
      params: { box: boxId }
    });
    return response.data.results ?? response.data;
  },

  getPending: async (): Promise<BoxMovementRequest[]> => {
    const response = await apiClient.get('/movements/box-movement-requests/', {
      params: { status: 'WAITING_APPROVAL' }
    });
    return response.data.results ?? response.data;
  },

  create: async (data: CreateBoxMovementRequestInput): Promise<BoxMovementRequest> => {
    const response = await apiClient.post('/movements/box-movement-requests/', data);
    return response.data;
  },

  approve: async (id: number, data?: ReviewRequestInput): Promise<BoxMovementRequest> => {
    const response = await apiClient.post(`/movements/box-movement-requests/${id}/approve/`, data ?? {});
    return response.data;
  },

  reject: async (id: number, data?: ReviewRequestInput): Promise<BoxMovementRequest> => {
    const response = await apiClient.post(`/movements/box-movement-requests/${id}/reject/`, data ?? {});
    return response.data;
  },

  completeArrival: async (id: number, data?: CompleteArrivalInput): Promise<BoxMovementRequest> => {
    const response = await apiClient.post(`/movements/box-movement-requests/${id}/complete-arrival/`, data ?? {});
    return response.data;
  },

  verify: async (id: number, data?: ReviewRequestInput): Promise<BoxMovementRequest> => {
    const response = await apiClient.post(`/movements/box-movement-requests/${id}/verify/`, data ?? {});
    return response.data;
  },
};
