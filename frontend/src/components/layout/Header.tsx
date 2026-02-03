import { Link } from 'react-router-dom';

// Header/Navigation component
const NavigationLinks = () => (
  <nav style={{ marginBottom: '1rem' }}>
    <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
    <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
    <Link to="/catalogue" style={{ marginRight: '1rem' }}>Catalogue</Link>
    <Link to="/volunteer_application" style={{ marginRight: '1rem' }}>Volunteer Application</Link>
    <Link to="/admin" style={{ marginRight: '1rem' }}>Admin Dashboard</Link>
    <Link to="/logout">Logout</Link>
  </nav>
);

export default NavigationLinks;