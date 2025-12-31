import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts';
import LogoutPage from './LogoutPage';

vi.mock('../api/auth.api', () => {
  return {
    authApi: {
      login: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
    },
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const { authApi } = await import('../api/auth.api');
type MockedAuthApi = {
  login: Mock;
  logout: Mock;
  getCurrentUser: Mock;
};
const mockedAuthApi = authApi as unknown as MockedAuthApi;

function renderLogoutPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <LogoutPage />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  mockNavigate.mockClear();
  mockedAuthApi.login.mockReset();
  mockedAuthApi.logout.mockReset();
  mockedAuthApi.getCurrentUser.mockReset();
});

describe('LogoutPage', () => {
  it('calls logout function on mount', async () => {
    localStorage.setItem('accessToken', 'access123');
    localStorage.setItem('refreshToken', 'refresh123');
    mockedAuthApi.logout.mockResolvedValue(undefined);

    renderLogoutPage();

    await waitFor(() => {
      expect(mockedAuthApi.logout).toHaveBeenCalledWith('refresh123');
    });
  });

  it('navigates to /login after logout', async () => {
    localStorage.setItem('accessToken', 'access123');
    localStorage.setItem('refreshToken', 'refresh123');
    mockedAuthApi.logout.mockResolvedValue(undefined);

    renderLogoutPage();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('clears tokens from localStorage', async () => {
    localStorage.setItem('accessToken', 'access123');
    localStorage.setItem('refreshToken', 'refresh123');
    mockedAuthApi.logout.mockResolvedValue(undefined);

    renderLogoutPage();

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  it('displays logging out message', () => {
    mockedAuthApi.logout.mockResolvedValue(undefined);
    const { getByText } = renderLogoutPage();

    expect(getByText('Logging out...')).toBeTruthy();
  });
});
