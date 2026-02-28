import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="admin-layout">
      {/* Header */}
      <div className="admin-header">
        <h1>MADE - Collection Catalogue</h1>
        <p className="admin-header-subtitle">Admin Interface for Collection Managers</p>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button className="admin-tab active">Dashboard</button>
        <Link to="/admin/catalogue" className="admin-tab">Catalogue</Link>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        <div className="admin-content-header">
          <h2>Dashboard</h2>
          <div className="admin-user-badge">
            <div className="admin-user-avatar"></div>
            <span>{user?.name || 'Admin'}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <p className="admin-stat-value">--</p>
            <p className="admin-stat-label">On Floor</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-value">--</p>
            <p className="admin-stat-label">In Storage</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-value">--</p>
            <p className="admin-stat-label">Checked Out</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-value">--</p>
            <p className="admin-stat-label">Total Items</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-section">
          <h3 className="admin-section-title">Recent Activity</h3>
          <p className="admin-placeholder-text">Activity will appear here when connected to the API.</p>
        </div>

        {/* Quick Actions */}
        <div className="admin-section">
          <h3 className="admin-section-title">Quick Actions</h3>
          <div className="admin-quick-actions">
            <Link to="/admin/catalogue" className="admin-quick-action-btn">
              Add New Item
            </Link>
            <button className="admin-quick-action-btn">Move Items</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;