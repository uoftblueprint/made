// Locations API calls
import apiClient from './apiClient';

export interface Location {
  id: number;
  name: string;
  location_type: 'FLOOR' | 'STORAGE' | 'EVENT' | 'OTHER';
  location_type_display: string;
  description: string;
  box_count: number;
  item_count: number;
}

export interface Box {
  id: number;
  box_code: string;
  label: string;
  description: string;
  location: number;
}

export interface LocationDetail extends Location {
  boxes: Box[];
}

export interface CreateLocationData {
  name: string;
  location_type: 'FLOOR' | 'STORAGE' | 'EVENT' | 'OTHER';
  description?: string;
}

export const locationsApi = {
  getAll: async (): Promise<Location[]> => {
    const response = await apiClient.get('/locations/');
    // Handle paginated response or direct array
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data?.results && Array.isArray(data.results)) return data.results;
    return [];
  },

  getById: async (id: number): Promise<LocationDetail> => {
    const response = await apiClient.get(`/locations/${id}/`);
    return response.data;
  },

  create: async (data: CreateLocationData): Promise<Location> => {
    const response = await apiClient.post('/locations/', data);
    return response.data;
  },
};
