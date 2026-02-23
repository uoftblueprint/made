// Boxes API calls
import apiClient from './apiClient';

export interface BoxItem {
  id: number;
  item_code: string;
  title: string;
  platform: string;
  item_type: string;
  working_condition: boolean;
  status: string;
}

export interface Box {
  id: number;
  box_code: string;
  label: string;
  description: string;
  location: number;
}

export interface BoxDetail extends Box {
  items: BoxItem[];
}

export const boxesApi = {
  getAll: async (): Promise<Box[]> => {
    const response = await apiClient.get('/boxes/');
    // Handle paginated response or direct array
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data?.results && Array.isArray(data.results)) return data.results;
    return [];
  },

  getById: async (id: number): Promise<BoxDetail> => {
    const response = await apiClient.get(`/boxes/${id}/`);
    return response.data;
  },
};
