import apiClient from './apiClient';
import type {
  ItemType,
  ItemStatus,
  CollectionItem,
} from '../lib/types';

import type { ItemFilter } from '../lib/filters';

export interface CreateItemData {
  item_code: string;
  title: string;
  platform: string;
  description: string;
  item_type: ItemType;
  working_condition: boolean;
  status: ItemStatus;
  current_location: number;
  is_public_visible: boolean;
  is_on_floor: boolean;
  box: number | null;
}

export type UpdateItemData = Partial<CreateItemData>;

export const itemsApi = {
  getAll: async (params?: ItemFilter): Promise<CollectionItem[]> => {
    const queryParams: Record<string, string> = {};

    if (params?.platform) queryParams.platform = params.platform;
    if (params?.is_on_floor !== undefined && params?.is_on_floor !== null) {
      queryParams.is_on_floor = params.is_on_floor ? 'true' : 'false';
    }
    if (params?.search) queryParams.search = params.search;
    if (params?.ordering) queryParams.ordering = params.ordering;
    if (params?.item_type) queryParams.item_type = params.item_type;
    if (params?.status) queryParams.status = params.status;
    if (params?.location_type) queryParams.location_type = params.location_type;

    queryParams.page_size = '10000';

    const response = await apiClient.get('/inventory/public/items/', { params: queryParams });
    const data = response?.data;
    const raw = data?.results ?? data;
    return Array.isArray(raw) ? raw : [];
  },

  getById: async (id: string | number): Promise<CollectionItem> => {
    const response = await apiClient.get(`/inventory/items/${id}/`);
    return response.data;
  },

  create: async (data: CreateItemData): Promise<CollectionItem> => {
    const response = await apiClient.post('/inventory/items/', data);
    return response.data;
  },

  update: async (
    id: string | number,
    data: CreateItemData
  ): Promise<CollectionItem> => {
    const response = await apiClient.put(`/inventory/items/${id}/`, data);
    return response.data;
  },

  partialUpdate: async (
    id: string | number,
    data: UpdateItemData
  ): Promise<CollectionItem> => {
    const response = await apiClient.patch(`/inventory/items/${id}/`, data);
    return response.data;
  },
};