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

function renderProtectedRoute(children: React.ReactNode, requiredRole?: 'ADMIN' | 'VOLUNTEER' | 'SENIOR_VOLUNTEER') {
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
    renderProtectedRoute(<div>Protected</div>);
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('shows loading state while checking authentication', () => {
    localStorage.setItem('accessToken', 'token');
    mockedAuthApi.getCurrentUser.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 1000))
    );
    renderProtectedRoute(<div>Content</div>);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('allows ADMIN to access ADMIN route', async () => {
    localStorage.setItem('accessToken', 'token');
    mockedAuthApi.getCurrentUser.mockResolvedValue({
      id: 1, email: 'admin@test.com', name: 'Admin', role: 'ADMIN',
      created_at: 'now', requires_move_approval: false,
    });
    renderProtectedRoute(<div>Admin Page</div>, 'ADMIN');
    await vi.waitFor(() => expect(screen.getByText('Admin Page')).toBeTruthy());
  });

  it('blocks VOLUNTEER from ADMIN route', async () => {
    localStorage.setItem('accessToken', 'token');
    mockedAuthApi.getCurrentUser.mockResolvedValue({
      id: 2, email: 'vol@test.com', name: 'Vol', role: 'VOLUNTEER',
      created_at: 'now', requires_move_approval: false,
    });
    renderProtectedRoute(<div>Admin Page</div>, 'ADMIN');
    await vi.waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }));
  });

  it('allows senior volunteer to access SENIOR_VOLUNTEER route', async () => {
    localStorage.setItem('accessToken', 'token');
    mockedAuthApi.getCurrentUser.mockResolvedValue({
      id: 3, email: 'senior@test.com', name: 'Senior', role: 'VOLUNTEER',
      created_at: 'now', requires_move_approval: false,
    });
    renderProtectedRoute(<div>Senior Page</div>, 'SENIOR_VOLUNTEER');
    await vi.waitFor(() => expect(screen.getByText('Senior Page')).toBeTruthy());
  });

  it('blocks junior volunteer from SENIOR_VOLUNTEER route', async () => {
    localStorage.setItem('accessToken', 'token');
    mockedAuthApi.getCurrentUser.mockResolvedValue({
      id: 4, email: 'junior@test.com', name: 'Junior', role: 'VOLUNTEER',
      created_at: 'now', requires_move_approval: true,
    });
    renderProtectedRoute(<div>Senior Page</div>, 'SENIOR_VOLUNTEER');
    await vi.waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }));
  });

  it('allows any volunteer to access VOLUNTEER route', async () => {
    localStorage.setItem('accessToken', 'token');
    mockedAuthApi.getCurrentUser.mockResolvedValue({
      id: 5, email: 'junior@test.com', name: 'Junior', role: 'VOLUNTEER',
      created_at: 'now', requires_move_approval: true,
    });
    renderProtectedRoute(<div>Catalogue</div>, 'VOLUNTEER');
    await vi.waitFor(() => expect(screen.getByText('Catalogue')).toBeTruthy());
  });

  it('allows ADMIN to access VOLUNTEER route', async () => {
    localStorage.setItem('accessToken', 'token');
    mockedAuthApi.getCurrentUser.mockResolvedValue({
      id: 1, email: 'admin@test.com', name: 'Admin', role: 'ADMIN',
      created_at: 'now', requires_move_approval: false,
    });
    renderProtectedRoute(<div>Catalogue</div>, 'VOLUNTEER');
    await vi.waitFor(() => expect(screen.getByText('Catalogue')).toBeTruthy());
  });
});
