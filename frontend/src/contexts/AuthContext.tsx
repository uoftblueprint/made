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

  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoadingUser,
    isAuthenticated,
    isAdmin,
    isVolunteer,
    login,
    logout,
    loginError: loginMutation.error ? String(loginMutation.error) : null,
    logoutError: logoutMutation.error ? String(logoutMutation.error) : null,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

