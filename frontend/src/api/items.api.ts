// Collection Items API calls
import apiClient from './apiClient';
import type { PublicCollectionItem } from '../lib/types';

export const itemsApi = {
  getAll: async (params?: {
    platform?: string;
    is_on_floor?: boolean;
    search?: string;
    ordering?: string;
  }): Promise<PublicCollectionItem[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.platform) queryParams.platform = params.platform;
    if (params?.is_on_floor !== undefined) queryParams.is_on_floor = params.is_on_floor ? 'true' : 'false';
    if (params?.search) queryParams.search = params.search;
    if (params?.ordering) queryParams.ordering = params.ordering;

    const response = await apiClient.get<PublicCollectionItem[]>('/public/items/', { params: queryParams });
    return response.data;
  }
};
