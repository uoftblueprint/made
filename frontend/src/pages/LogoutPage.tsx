import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';

const LogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) return;
    
    hasLoggedOut.current = true;
    
    const performLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Failed to log out:', error);
      } finally {
        navigate('/login', { replace: true });
      }
    };

    performLogout();
  }, [logout, navigate]);

  return (
    <div className="logout-container">
      <p>Logging out...</p>
    </div>
  );
};

export default LogoutPage;
