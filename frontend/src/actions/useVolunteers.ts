import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import type { Volunteer } from '../lib/types';

export const useVolunteerApplications = () => {
  return useQuery<Volunteer[]>({
    queryKey: ['volunteerApplications'],
    queryFn: async () => {
      const response = await apiClient.get('/api/volunteer-applications/');
      return response?.data;
    },
  });
};

export const useUpdateVolunteerStatus = (onSuccessCallback?: () => void, onErrorCallback?: (error: unknown) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'APPROVED' | 'REJECTED' }) => {
      await apiClient.patch(`/api/volunteer-applications/${id}/`, { status: action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerApplications'] });
      onSuccessCallback?.();
    },
    onError: (error) => {
      onErrorCallback?.(error)
    }
  });
};