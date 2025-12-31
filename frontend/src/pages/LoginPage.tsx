import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { login, isLoggingIn, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'ADMIN' ? '/admin' : '/');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (hasSubmitted && isAuthenticated && user) {
      navigate(user.role === 'ADMIN' ? '/admin' : '/');
    }
  }, [hasSubmitted, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setHasSubmitted(true);

    try {
      await login(email, password);
    } catch (err) {
      const errorMessage = 
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setHasSubmitted(false);
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
    </div>
  );
};

export default LoginPage;
