import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts';

type RequiredRole = 'ADMIN' | 'TRUSTED_VOLUNTEER' | 'VOLUNTEER';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: RequiredRole;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, isAdmin, isTrustedVolunteer } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'ADMIN' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'TRUSTED_VOLUNTEER' && !isAdmin && !isTrustedVolunteer) {
    return <Navigate to="/" replace />;
  }

  // 'VOLUNTEER' means any authenticated user (admin or volunteer of either tier)
  // No additional check needed beyond isAuthenticated

  return <>{children}</>;
};

export default ProtectedRoute;
