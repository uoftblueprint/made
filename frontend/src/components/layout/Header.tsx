import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <nav style={{ marginBottom: '1rem' }}>
      <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
      <Link to="/catalogue" style={{ marginRight: '1rem' }}>Catalogue</Link>
      <Link to="/volunteer_application" style={{ marginRight: '1rem' }}>Volunteer Application</Link>
        <Link to="/admin" style={{ marginRight: '1rem' }}>Admin Dashboard</Link>
      <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
        <Link to="/logout" style={{ marginRight: '1rem' }}>Logout</Link>
    </nav>
  );
};

export default Header;