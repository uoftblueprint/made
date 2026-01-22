import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts';
import ProtectedRoute from './ProtectedRoute';

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
    Navigate: ({ to, replace }: { to: string; replace: boolean }) => {
      mockNavigate(to, { replace });
      return <div data-testid="navigate">{to}</div>;
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

function renderProtectedRoute(children: React.ReactNode, requiredRole?: 'ADMIN' | 'VOLUNTEER') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute requiredRole={requiredRole}>{children}</ProtectedRoute>
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

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    mockedAuthApi.getCurrentUser.mockResolvedValue(null);

    renderProtectedRoute(<div>Protected Content</div>);

    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('shows loading state while checking authentication', () => {
    localStorage.setItem('accessToken', 'token123');
    mockedAuthApi.getCurrentUser.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 1000))
    );

    renderProtectedRoute(<div>Protected Content</div>);

    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('redirects VOLUNTEER to / when ADMIN role required', async () => {
    localStorage.setItem('accessToken', 'token123');
    mockedAuthApi.getCurrentUser.mockResolvedValue({
      id: 2,
      email: 'volunteer@example.com',
      name: 'Volunteer',
      role: 'VOLUNTEER',
      created_at: 'now',
    });

    renderProtectedRoute(<div>Admin Content</div>, 'ADMIN');

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('allows ADMIN to access content when ADMIN role required', async () => {
    localStorage.setItem('accessToken', 'token123');
    mockedAuthApi.getCurrentUser.mockResolvedValue({
      id: 1,
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
      created_at: 'now',
    });

    renderProtectedRoute(<div>Admin Dashboard</div>, 'ADMIN');

    await vi.waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('allows VOLUNTEER to access content when VOLUNTEER role required', async () => {
    localStorage.setItem('accessToken', 'token123');
    mockedAuthApi.getCurrentUser.mockResolvedValue({
      id: 2,
      email: 'volunteer@example.com',
      name: 'Volunteer',
      role: 'VOLUNTEER',
      created_at: 'now',
    });

    renderProtectedRoute(<div>Welcome to the Collection Catalog</div>, 'VOLUNTEER');

    await vi.waitFor(() => {
      expect(screen.getByText('Welcome to the Collection Catalog')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
