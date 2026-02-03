import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import type { Volunteer, VolunteerApplicationInput } from '../lib/types';
import type { AxiosError } from 'axios';

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
      await apiClient.patch(`/users/volunteer-applications/${id}/`, { status: action });
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

export const useCreateVolunteer = (onSuccessCallback?: () => void, onErrorCallback?: (error: AxiosError) => void) => {
  return useMutation<void, AxiosError, VolunteerApplicationInput>({
    mutationFn: async (applicationData) => {
      await apiClient.post('/users/volunteer-applications/', applicationData);
    },
    onSuccess: () => {
      onSuccessCallback?.();
    },
    onError: (error) => {
      onErrorCallback?.(error);
    },
  });
};