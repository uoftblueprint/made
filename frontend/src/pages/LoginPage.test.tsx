import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { AuthProvider } from '../contexts';
import LoginPage from './LoginPage';

vi.mock('../api/auth.api', () => {
  return {
    authApi: {
      login: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
    },
  };
});

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
  return render(ui, { wrapper: Wrapper });
}

const { authApi } = await import('../api/auth.api');
type MockedAuthApi = { login: Mock; logout: Mock; getCurrentUser: Mock };
const mockedAuthApi = authApi as unknown as MockedAuthApi;

beforeEach(() => {
  navigateMock.mockReset();
  localStorage.clear();
  mockedAuthApi.login.mockReset();
  mockedAuthApi.getCurrentUser.mockReset();
});

describe('LoginPage', () => {
  it('logs in ADMIN and redirects to /admin', async () => {
    mockedAuthApi.login.mockResolvedValue({ access: 'access123', refresh: 'refresh123' });
    mockedAuthApi.getCurrentUser.mockResolvedValue({ id: 1, email: 'admin@example.com', name: 'Admin', role: 'ADMIN', created_at: 'now', requires_move_approval: false });

    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/admin', { replace: true }));
  });

  it('logs in VOLUNTEER and redirects to /admin', async () => {
    mockedAuthApi.login.mockResolvedValue({ access: 'access123', refresh: 'refresh123' });
    mockedAuthApi.getCurrentUser.mockResolvedValue({ id: 2, email: 'vol@example.com', name: 'Vol', role: 'VOLUNTEER', created_at: 'now', requires_move_approval: false });

    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'vol@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/admin', { replace: true }));
  });

  it('shows error on invalid credentials', async () => {
    mockedAuthApi.login.mockRejectedValue(new Error('Invalid credentials'));

    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument());
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('redirects already authenticated ADMIN away from login page', async () => {
    localStorage.setItem('accessToken', 'access123');
    mockedAuthApi.getCurrentUser.mockResolvedValue({ id: 1, email: 'admin@example.com', name: 'Admin', role: 'ADMIN', created_at: 'now', requires_move_approval: false });

    renderWithProviders(<LoginPage />);
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/admin', { replace: true }));
  });

  it('redirects already authenticated VOLUNTEER away from login page', async () => {
    localStorage.setItem('accessToken', 'access123');
    mockedAuthApi.getCurrentUser.mockResolvedValue({ id: 2, email: 'vol@example.com', name: 'Vol', role: 'VOLUNTEER', created_at: 'now', requires_move_approval: true });

    renderWithProviders(<LoginPage />);
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/admin', { replace: true }));
  });
});
