import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import type { Volunteer, VolunteerApplicationInput, VolunteerStats, VolunteerOptions } from '../lib/types';
import type { AxiosError } from 'axios';

export const useVolunteerApplications = () => {
  return useQuery<Volunteer[]>({
    queryKey: ['volunteerApplications'],
    queryFn: async () => {
      const response = await apiClient.get('/users/volunteer-applications/');
      return response?.data?.results ?? response?.data ?? [];
    },
  });
};

export const useUpdateVolunteerStatus = (onSuccessCallback?: () => void, onErrorCallback?: (error: unknown) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'APPROVED' | 'REJECTED' }) => {
      await apiClient.patch(`/api/users/volunteer-applications/${id}/`, { status: action });
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
      await apiClient.post('/api/users/volunteer-applications/', applicationData);
    },
    onSuccess: () => {
      onSuccessCallback?.();
    },
    onError: (error) => {
      onErrorCallback?.(error);
    },
  });
};

export const useVolunteerStats = () => {
  return useQuery<VolunteerStats>({
    queryKey: ['volunteerStats'],
    queryFn: async () => {
      const response = await apiClient.get('/users/volunteer-stats/');
      return response?.data;
    },
  });
};

export const useVolunteerOptions = () => {
  return useQuery<VolunteerOptions>({
    queryKey: ['volunteerOptions'],
    queryFn: async () => {
      const response = await apiClient.get('/users/volunteer-options/');
      return response?.data;
    },
  });
};