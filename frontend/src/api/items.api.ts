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
    if (params?.item_type) queryParams.item_type = params.item_type;
    if (params?.status) queryParams.status = params.status;
    if (params?.location_type) queryParams.location_type = params.location_type;
    
    // Fetch all items by setting a large page size
    queryParams.page_size = '10000';

    const response = await apiClient.get('/inventory/public/items/', { params: queryParams });
    return response.data.results ?? response.data;
  },

  getById: async (id: string | number): Promise<PublicCollectionItem> => {
    const response = await apiClient.get(`/inventory/public/items/${id}/`);
    return response.data;
  }
};