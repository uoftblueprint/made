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
      const destination = user.role === 'ADMIN' ? '/admin' : '/';
      // replace: true prevents the user from going "back" into the login redirect loop
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password); 
      
      setHasSubmitted(true);
    } catch (err: any) {
      console.error("Login failed:", err);
      const errorMessage = err.response?.data?.detail || 'Invalid email or password.';
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
