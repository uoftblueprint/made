import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Layers, Archive, MapPin, Check, X, CheckCircle, XCircle, Truck, PackageCheck } from 'lucide-react';
import { useRequests } from '../../actions/useRequests';
import { useDashboardStats } from '../../actions/useStats';
import type { MovementRequest } from '../../lib/types';
import Button from '../../components/common/Button';
import { ExportModal } from '../../components/items';
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
  const { requests: allRequests, loading, approve, reject } = useRequests();
  const { stats, loading: statsLoading } = useDashboardStats();
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  type RequestTab = 'pending' | 'in_transit' | 'arrived' | 'rejected';
  const [requestTab, setRequestTab] = useState<RequestTab>('pending');

  const pendingRequests = allRequests.filter(r => r.status === 'WAITING_APPROVAL');
  const inTransitRequests = allRequests.filter(r => r.status === 'APPROVED');
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const arrivedRequests = allRequests.filter(r =>
    (r.status === 'COMPLETED_UNVERIFIED' || r.status === 'CANCELLED') &&
    new Date(r.updated_at) >= oneWeekAgo
  );
  const rejectedRequests = allRequests.filter(r => r.status === 'REJECTED');

  const tabRequestsMap: Record<RequestTab, MovementRequest[]> = {
    pending: pendingRequests,
    in_transit: inTransitRequests,
    arrived: arrivedRequests,
    rejected: rejectedRequests,
  };
  const tabRequests = tabRequestsMap[requestTab];

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
          <Layers className="admin-stat-icon" size={24} />
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

      {/* Movement Requests */}
      <div className="admin-review-section">
        <div className="admin-review-header">
          <h3>Movement Requests</h3>
        </div>

        {/* Tabs */}
        <div className="admin-request-tabs">
          {([
            { key: 'pending' as const, label: 'Pending', count: pendingRequests.length },
            { key: 'in_transit' as const, label: 'In Transit', count: inTransitRequests.length },
            { key: 'arrived' as const, label: 'Arrived', count: arrivedRequests.length },
            { key: 'rejected' as const, label: 'Rejected', count: rejectedRequests.length },
          ]).map(tab => (
            <button
              key={tab.key}
              className={`admin-request-tab ${requestTab === tab.key ? 'active' : ''}`}
              onClick={() => setRequestTab(tab.key)}
            >
              {tab.label} ({loading ? '...' : tab.count})
            </button>
          ))}
        </div>

        <div className="admin-review-list">
          {loading ? (
            <div className="admin-review-item">
              <p>Loading requests...</p>
            </div>
          ) : tabRequests.length === 0 ? (
            <div className="admin-review-item">
              <p>No {requestTab === 'pending' ? 'pending' : requestTab === 'in_transit' ? 'in transit' : requestTab === 'arrived' ? 'arrived' : 'rejected'} requests</p>
            </div>
          ) : (
            tabRequests.slice(0, 10).map((request) => (
              <div key={request.id} className="admin-review-item">
                <div className="admin-review-item-info">
                  <Layers size={16} className="admin-review-dot" />
                  <div className="admin-review-item-details">
                    <h4>{request.item_title || `Item #${request.item}`}</h4>
                    <p>
                      {request.item_platform || 'Unknown'} · {request.from_location_name} → {request.to_location_name}
                    </p>
                  </div>
                </div>
                <div className="admin-review-item-actions">
                  <span className="admin-review-time">{formatTimeAgo(request.created_at)}</span>
                  {requestTab === 'pending' && (
                    <>
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
                    </>
                  )}
                  {requestTab === 'in_transit' && (
                    <span className="admin-request-status in-transit">
                      <Truck size={14} /> In Transit
                    </span>
                  )}
                  {requestTab === 'arrived' && (
                    <span className="admin-request-status arrived">
                      <PackageCheck size={14} /> Arrived
                    </span>
                  )}
                  {requestTab === 'rejected' && (
                    <span className="admin-request-status rejected">
                      <XCircle size={14} /> Rejected
                    </span>
                  )}
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
        <Button variant="outline-black" size="lg" icon="download" layout="stacked" fullWidth onClick={() => setIsExportModalOpen(true)}>
          Export to CSV
        </Button>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;