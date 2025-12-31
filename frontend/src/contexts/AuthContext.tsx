import { type ReactNode } from 'react';
import { AuthContext, type AuthContextType } from './AuthContext.shared';
import { useLogin, useLogout, useCurrentUser } from '../actions/useAuth';


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isVolunteer = user?.role === 'VOLUNTEER';

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoadingUser,
    isAuthenticated,
    isAdmin,
    isVolunteer,
    login,
    logout,
    loginError: loginMutation.error ? getErrorMessage(loginMutation.error) : null,
    logoutError: logoutMutation.error ? getErrorMessage(logoutMutation.error) : null,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

