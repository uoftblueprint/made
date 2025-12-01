import { Navigate, Outlet } from 'react-router-dom';

const isAuthenticated = (): boolean => {
  const token = true
  return token // placeholder authentication
}

const SecureRoute: React.FC = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/" replace />;
}

export default SecureRoute;