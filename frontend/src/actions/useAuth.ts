import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

export const currentUserQueryKey = ['auth', 'me'];

export const useCurrentUser = () => {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: authApi.getCurrentUser,
    enabled: !!localStorage.getItem('accessToken'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      // Storing tokens in localStorage is vulnerable to XSS attacks
      // Consider using httpOnly cookies
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    },
    // Use onSettled (not onSuccess) to ensure local logout happens even if API call fails
    // Users can always log out locally even if network is down
    onSettled: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.removeQueries({ queryKey: currentUserQueryKey });
    },
  });
};
