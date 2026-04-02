import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { User, Scan } from 'lucide-react';
import ScanModal from '../common/ScanModal';
import './Header.css';

const Header = () => {
  const { isAuthenticated, isAdmin, isVolunteer, user } = useAuth();
  const location = useLocation();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="header-nav">
      <Link to="/" className="header-logo">
        <img src="/logo.png" alt="MADE" className="header-logo-img" />
        <span className="header-logo-text">Inventory Software</span>
      </Link>
      
      <div className="header-links">
        {/* All authenticated volunteers and admins */}
        {isAuthenticated && (isVolunteer || isAdmin) && (
          <>
            <Link
              to="/admin"
              className={`header-link ${isActive('/admin') && !isActive('/admin/catalogue') && !isActive('/admin/volunteers') && !isActive('/admin/boxes') ? 'active-dashboard' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/catalogue"
              className={`header-link ${isActive('/admin/catalogue') ? 'active' : ''}`}
            >
              Item Catalogue
            </Link>
            <Link
              to="/admin/boxes"
              className={`header-link ${isActive('/admin/boxes') ? 'active' : ''}`}
            >
              Box Management
            </Link>
          </>
        )}

        {/* Admin-only: Volunteer Management */}
        {isAuthenticated && isAdmin && (
          <Link
            to="/admin/volunteers"
            className={`header-link ${isActive('/admin/volunteers') ? 'active' : ''}`}
          >
            Volunteer Management
          </Link>
        )}
      </div>

      <div className="header-right">
        {/* Scan Button - only for authenticated users */}
        {isAuthenticated && (isVolunteer || isAdmin) && (
          <button
            className="header-scan-btn"
            onClick={() => setIsScanModalOpen(true)}
            title="Scan MADE ID"
          >
            <Scan size={18} />
            <span className="header-scan-text">Scan</span>
          </button>
        )}

        {!isAuthenticated ? (
          <Link to="/login" className="header-link">Login</Link>
        ) : (
          <>
            <div className="header-user">
              <span>{user?.name || 'Admin User'}</span>
              <div className="header-avatar">
                <User size={18} />
              </div>
            </div>
            <Link to="/logout" className="header-link-logout">Logout</Link>
          </>
        )}
      </div>

      {/* Scan Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />
    </nav>
  );
};

export default Header;