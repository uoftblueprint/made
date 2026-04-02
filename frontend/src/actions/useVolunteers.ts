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
    mutationFn: async ({ id, action, access_expires_at }: { id: number; action: 'APPROVED' | 'REJECTED'; access_expires_at?: string | null }) => {
      const body: Record<string, unknown> = { status: action };
      if (action === 'APPROVED') {
        body.access_expires_at = access_expires_at ?? null;
      }
      await apiClient.patch(`/users/volunteer-applications/${id}/`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerApplications'] });
      queryClient.invalidateQueries({ queryKey: ['volunteerStats'] });
      onSuccessCallback?.();
    },
    onError: (error) => {
      onErrorCallback?.(error);
    },
  });
};

export const useExtendVolunteerAccess = (onSuccessCallback?: () => void, onErrorCallback?: (error: unknown) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, access_expires_at }: { userId: number; access_expires_at: string | null }) => {
      await apiClient.patch(`/users/${userId}/`, { access_expires_at });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteerApplications'] });
      queryClient.invalidateQueries({ queryKey: ['volunteerStats'] });
      onSuccessCallback?.();
    },
    onError: (error) => {
      onErrorCallback?.(error);
    },
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