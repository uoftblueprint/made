import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { AuthProvider } from '../contexts';
import { useAuth } from './AuthContext.shared';

vi.mock('../api/auth.api', () => {
  return {
    authApi: {
      login: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
    },
  };
});

const { authApi } = await import('../api/auth.api');
type MockedAuthApi = {
  login: Mock;
  logout: Mock;
  getCurrentUser: Mock;
};
const mockedAuthApi = authApi as unknown as MockedAuthApi;

function renderAuthHook() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useAuth(), { wrapper: Wrapper });
}

beforeEach(() => {
  localStorage.clear();
  mockedAuthApi.login.mockReset();
  mockedAuthApi.logout.mockReset();
  mockedAuthApi.getCurrentUser.mockReset();
});

describe('AuthContext', () => {
  it('session persists when accessToken exists', async () => {
    localStorage.setItem('accessToken', 'access123');
    mockedAuthApi.getCurrentUser.mockResolvedValue({ id: 3, email: 'x@y.com', name: 'User', role: 'VOLUNTEER', created_at: 'now' });

    const { result } = renderAuthHook();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.isVolunteer).toBe(true);
  });

  it('logout clears tokens', async () => {
    localStorage.setItem('accessToken', 'access123');
    localStorage.setItem('refreshToken', 'refresh123');
    mockedAuthApi.getCurrentUser.mockResolvedValue({ id: 3, email: 'x@y.com', name: 'User', role: 'VOLUNTEER', created_at: 'now' });
    mockedAuthApi.logout.mockResolvedValue(undefined);

    const { result } = renderAuthHook();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
