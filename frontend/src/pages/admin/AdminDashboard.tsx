import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, Admin. Manage your collection, volunteers, and requests here.</p>

      <div className="quick-stats" style={{ margin: '2rem 0' }}>
        <h2>Quick Stats</h2>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div className="stat-card" style={{ padding: '1rem', border: '1px solid #ccc' }}>
            <strong>10</strong>
            <p>Pending Requests</p>
          </div>
          <div className="stat-card" style={{ padding: '1rem', border: '1px solid #ccc' }}>
            <strong>5</strong>
            <p>New Volunteers</p>
          </div>
          <div className="stat-card" style={{ padding: '1rem', border: '1px solid #ccc' }}>
            <strong>1200</strong>
            <p>Total Collection Items</p>
          </div>
        </div>
      </div>

      <div className="management-links">
        <h2>Management Tools</h2>
        <nav>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li style={{ margin: '10px 0' }}>
              <Link to="/admin/inventory">Manage Inventory (Add, Edit, Remove)</Link>
            </li>
            <li style={{ margin: '10px 0' }}>
              <Link to="/admin/volunteers">Manage Volunteers (Approve, Remove)</Link>
            </li>
            <li style={{ margin: '10px 0' }}>
              <Link to="/admin/requests">Review Move Requests</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default AdminDashboard;