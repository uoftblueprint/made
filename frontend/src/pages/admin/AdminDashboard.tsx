import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Package, Archive, MapPin, Check, X } from 'lucide-react';
import { usePendingRequests } from '../../actions/useRequests';
import { useDashboardStats } from '../../actions/useStats';
import type { MovementRequest } from '../../lib/types';
import Button from '../../components/common/Button';
import './AdminDashboard.css';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

const AdminDashboard: React.FC = () => {
  const { requests: pendingRequests, loading, approve, reject } = usePendingRequests();
  const { stats, loading: statsLoading } = useDashboardStats();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleApprove = async (request: MovementRequest) => {
    setProcessingId(request.id);
    try {
      await approve(request.id);
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: MovementRequest) => {
    setProcessingId(request.id);
    try {
      await reject(request.id);
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="admin-layout">
      {/* Header */}
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p className="admin-header-subtitle">Overview of collection status and pending tasks</p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <AlertCircle className="admin-stat-icon" size={24} />
          <p className="admin-stat-value">{loading ? '...' : pendingRequests.length}</p>
          <p className="admin-stat-label">Needs Review</p>
        </div>
        <div className="admin-stat-card">
          <Package className="admin-stat-icon" size={24} />
          <p className="admin-stat-value">{statsLoading ? '...' : stats?.total_items?.toLocaleString() ?? '--'}</p>
          <p className="admin-stat-label">Total Items</p>
        </div>
        <div className="admin-stat-card">
          <Archive className="admin-stat-icon" size={24} />
          <p className="admin-stat-value">{statsLoading ? '...' : stats?.total_boxes?.toLocaleString() ?? '--'}</p>
          <p className="admin-stat-label">Containers</p>
        </div>
        <div className="admin-stat-card">
          <MapPin className="admin-stat-icon" size={24} />
          <p className="admin-stat-value">{statsLoading ? '...' : stats?.total_locations?.toLocaleString() ?? '--'}</p>
          <p className="admin-stat-label">Locations</p>
        </div>
      </div>

      {/* Records Needing Review */}
      <div className="admin-review-section">
        <div className="admin-review-header">
          <h3>Movement Requests ({loading ? '...' : pendingRequests.length})</h3>
          <Link to="/admin/requests" className="admin-see-all">See all</Link>
        </div>
        <div className="admin-review-list">
          {loading ? (
            <div className="admin-review-item">
              <p>Loading requests...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="admin-review-item">
              <p>No pending requests</p>
            </div>
          ) : (
            pendingRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="admin-review-item">
                <div className="admin-review-item-info">
                  <span className="admin-review-dot"></span>
                  <div className="admin-review-item-details">
                    <h4>{request.item_title || `Item #${request.item}`}</h4>
                    <p>
                      {request.item_platform || 'Unknown'} · {request.from_location_name} → {request.to_location_name}
                    </p>
                  </div>
                </div>
                <div className="admin-review-item-actions">
                  <span className="admin-review-time">{formatTimeAgo(request.created_at)}</span>
                  <Link
                    to={`/admin/catalogue/${request.item}?from=request`}
                    className="admin-review-btn admin-review-btn-review"
                  >
                    Review
                  </Link>
                  <button
                    className="admin-review-btn-icon admin-review-btn-approve"
                    onClick={() => handleApprove(request)}
                    disabled={processingId === request.id}
                    title="Approve"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="admin-review-btn-icon admin-review-btn-reject"
                    onClick={() => handleReject(request)}
                    disabled={processingId === request.id}
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-quick-actions">
        <Link to="/admin/catalogue" className="block">
          <Button variant="outline-black" size="lg" icon="plus" layout="stacked" fullWidth>
            Add New Item
          </Button>
        </Link>
        <Button variant="outline-black" size="lg" icon="archive" layout="stacked" fullWidth>
          Create Container
        </Button>
        <Button variant="outline-black" size="lg" icon="download" layout="stacked" fullWidth>
          Export to CSV
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;