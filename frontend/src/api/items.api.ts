// Collection Items API calls
import apiClient from './apiClient';
import type { PublicCollectionItem } from '../lib/types';
import type { ItemFilter } from '../lib/filters';

export const itemsApi = {
  getAll: async (params?: ItemFilter): Promise<PublicCollectionItem[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.platform) queryParams.platform = params.platform;
    if (params?.is_on_floor !== undefined && params?.is_on_floor !== null)
      queryParams.is_on_floor = params.is_on_floor ? 'true' : 'false';
    if (params?.search) queryParams.search = params.search;
    if (params?.ordering) queryParams.ordering = params.ordering;

    const response = await apiClient.get('/public/items/', { params: queryParams });
    return response.data.results; // Extract the `results` field
  }
};