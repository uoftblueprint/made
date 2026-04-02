import apiClient from './apiClient';
import type {
  ItemType,
  ItemStatus,
  PublicCollectionItem, 
  AdminCollectionItem,
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
  condition?: string;
  is_complete?: string;
  is_functional?: string;
  date_of_entry?: string;
  creator_publisher?: string;
  release_year?: string;
  version_edition?: string;
  media_type?: string;
  manufacturer?: string;
  model_number?: string;
  year_manufactured?: string;
  serial_number?: string;
  hardware_type?: string;
  item_subtype?: string;
  date_published?: string;
  publisher?: string;
  volume_number?: string;
  isbn_catalogue_number?: string;
}

export type UpdateItemData = Partial<CreateItemData>;

export const itemsApi = {
  // ADMIN ONLY

  getAll: async (params?: ItemFilter): Promise<AdminCollectionItem[]> => {
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
    if (params?.box) queryParams.box = String(params.box);
    if (params?.box__box_code) queryParams['box__box_code'] = params.box__box_code;
    if (params?.working_condition !== undefined && params?.working_condition !== null) {
      queryParams.working_condition = params.working_condition ? 'true' : 'false';
    }

    queryParams.page_size = '10000';

    const response = await apiClient.get('/inventory/items/', {
      params: queryParams,
    });

    const data = response.data;

    if (Array.isArray(data)) return data;
    if (data?.results && Array.isArray(data.results)) return data.results;
    return [];
  },

  getById: async (id: string | number): Promise<AdminCollectionItem> => {
    const response = await apiClient.get(`/inventory/items/${id}/`);
    return response.data;
  },

  create: async (data: CreateItemData): Promise<AdminCollectionItem> => {
    const response = await apiClient.post('/inventory/items/', data);
    return response.data;
  },

  partialUpdate: async (
    id: string | number,
    data: UpdateItemData
  ): Promise<AdminCollectionItem> => {
    const response = await apiClient.patch(`/inventory/items/${id}/`, data);
    return response.data;
  },

  delete: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/inventory/items/${id}/`);
  },

  getByItemCode: async (itemCode: string): Promise<AdminCollectionItem | null> => {
    const response = await apiClient.get('/inventory/items/', {
      params: { search: itemCode, page_size: '100' },
    });
    const data = response.data;
    const items = Array.isArray(data) ? data : data?.results ?? [];
    // Find exact match by item_code
    return items.find((item: AdminCollectionItem) => item.item_code === itemCode) ?? null;
  },
};


export const publicItemsApi = {
  getAll: async (params?: ItemFilter): Promise<PublicCollectionItem[]> => {
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

  getById: async (id: string | number): Promise<PublicCollectionItem> => {
    const response = await apiClient.get(`/inventory/public/items/${id}/`);
    return response.data;
  },
};