// Stats API calls
import apiClient from './apiClient';

export interface DashboardStats {
  total_items: number;
  total_boxes: number;
  total_locations: number;
}

export const statsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/inventory/stats/');
    return response.data;
  },
};
