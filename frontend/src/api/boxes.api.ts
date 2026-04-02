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
  created_at?: string;
  updated_at?: string;
}

export interface BoxDetail extends Box {
  items: BoxItem[];
}

export interface MarkBoxArrivedInput {
  location: number;
  comment?: string;
}

export interface MarkBoxArrivedResponse {
  box: BoxDetail;
  moved_items: number;
}

export interface CreateBoxInput {
  box_code: string;
  label?: string;
  description?: string;
  location: number;
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

  create: async (data: CreateBoxInput): Promise<Box> => {
    const response = await apiClient.post('/boxes/', data);
    return response.data;
  },

  markArrived: async (id: number, data: MarkBoxArrivedInput): Promise<MarkBoxArrivedResponse> => {
    const response = await apiClient.post(`/boxes/${id}/mark-arrived/`, data);
    return response.data;
  },

  getByBoxCode: async (boxCode: string): Promise<Box | null> => {
    const response = await apiClient.get('/boxes/');
    const data = response.data;
    const boxes: Box[] = Array.isArray(data) ? data : data?.results ?? [];
    return boxes.find((box) => box.box_code === boxCode) ?? null;
  },
};
