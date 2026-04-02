import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts';
import './LoginPage.css';

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // const [hasSubmitted, setHasSubmitted] = useState(false);
  const { login, isLoggingIn, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (isAuthenticated && user) {
  //     navigate(user.role === 'ADMIN' ? '/admin' : '/');
  //   }
  // }, [isAuthenticated, user, navigate]);

  // useEffect(() => {
  //   if (hasSubmitted && isAuthenticated && user) {
  //     navigate(user.role === 'ADMIN' ? '/admin' : '/');
  //   }
  // }, [hasSubmitted, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = '/admin';
      // replace: true prevents the user from going "back" into the login redirect loop
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        const apiError = err as ApiError;
        const errorMessage = apiError.response?.data?.detail || 'Invalid email or password.';

        setError(errorMessage);
      }
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>

      {error && (
        <div className="error-message" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoggingIn}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoggingIn}
          />
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          className="login-button"
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="login-link-text">
        Want to volunteer?{' '}
        <Link to="/volunteer_management">Apply here</Link>
      </p>
    </div>
  );
};

export default LoginPage;
