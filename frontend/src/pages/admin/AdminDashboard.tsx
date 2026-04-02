import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Layers, Archive, MapPin, Check, X, XCircle, Truck, PackageCheck, ShieldCheck } from 'lucide-react';
import { useRequests, useBoxRequests } from '../../actions/useRequests';
import { useDashboardStats } from '../../actions/useStats';
import type { MovementRequest, BoxMovementRequest } from '../../lib/types';
import Button from '../../components/common/Button';
import { ExportModal } from '../../components/items';
import { useAuth } from '../../contexts';
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
  const { isAdmin, isSeniorVolunteer } = useAuth();
  const canApprove = isAdmin || isSeniorVolunteer;
  const { requests: itemRequests, loading: itemLoading, approve: approveItem, reject: rejectItem, verify: verifyItem } = useRequests();
  const { requests: boxReqs, loading: boxLoading, approve: approveBox, reject: rejectBox, verify: verifyBox } = useBoxRequests();
  const { stats, loading: statsLoading } = useDashboardStats();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  type RequestTab = 'pending' | 'in_transit' | 'rejected';
  const [requestTab, setRequestTab] = useState<RequestTab>('pending');

  const loading = itemLoading || boxLoading;

  // Unified request type for display
  type UnifiedRequest = {
    id: number;
    key: string; // unique key: 'item-1' or 'box-1'
    type: 'item' | 'box';
    title: string;
    subtitle: string;
    from_location_name: string;
    to_location_name: string;
    status: string;
    created_at: string;
    updated_at: string;
    item_id?: number; // for linking to item detail
    box_id?: number; // for linking to box detail
  };

  const unifyItemReqs = (reqs: MovementRequest[]): UnifiedRequest[] =>
    reqs.map(r => ({
      id: r.id,
      key: `item-${r.id}`,
      type: 'item' as const,
      title: r.item_title || `Item #${r.item}`,
      subtitle: r.item_platform || 'Unknown',
      from_location_name: r.from_location_name || '',
      to_location_name: r.to_location_name || '',
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      item_id: r.item,
    }));

  const unifyBoxReqs = (reqs: BoxMovementRequest[]): UnifiedRequest[] =>
    reqs.map(r => ({
      id: r.id,
      key: `box-${r.id}`,
      type: 'box' as const,
      title: `Box ${r.box_code}`,
      subtitle: r.box_label || 'Container',
      from_location_name: r.from_location_name || '',
      to_location_name: r.to_location_name || '',
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      box_id: r.box,
    }));

  const allRequests = [
    ...unifyItemReqs(itemRequests),
    ...unifyBoxReqs(boxReqs),
  ];

  const pendingRequests = allRequests.filter(r => r.status === 'WAITING_APPROVAL');
  const inTransitRequests = allRequests.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED_UNVERIFIED');
  const rejectedRequests = allRequests.filter(r => r.status === 'REJECTED');

  const tabRequestsMap: Record<RequestTab, UnifiedRequest[]> = {
    pending: pendingRequests,
    in_transit: inTransitRequests,
    rejected: rejectedRequests,
  };
  const tabRequests = tabRequestsMap[requestTab];

  const handleApprove = async (request: UnifiedRequest) => {
    setProcessingId(request.key);
    try {
      if (request.type === 'item') await approveItem(request.id);
      else await approveBox(request.id);
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: UnifiedRequest) => {
    setProcessingId(request.key);
    try {
      if (request.type === 'item') await rejectItem(request.id);
      else await rejectBox(request.id);
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerify = async (request: UnifiedRequest) => {
    setProcessingId(request.key);
    try {
      if (request.type === 'item') await verifyItem(request.id);
      else await verifyBox(request.id);
    } catch (error) {
      console.error('Failed to verify request:', error);
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
              <p>No {requestTab === 'pending' ? 'pending' : requestTab === 'in_transit' ? 'in transit' : 'rejected'} requests</p>
            </div>
          ) : (
            tabRequests.slice(0, 10).map((request) => (
              <div key={request.key} className="admin-review-item">
                <div className="admin-review-item-info">
                  {request.type === 'item' ? (
                    <Layers size={16} className="admin-review-dot" />
                  ) : (
                    <Archive size={16} className="admin-review-dot" />
                  )}
                  <div className="admin-review-item-details">
                    <h4>{request.title}</h4>
                    <p>
                      {request.subtitle} · {request.from_location_name} → {request.to_location_name}
                    </p>
                  </div>
                </div>
                <div className="admin-review-item-actions">
                  <span className="admin-review-time">{formatTimeAgo(request.created_at)}</span>
                  {requestTab === 'pending' && (
                    <>
                      {request.type === 'item' && request.item_id ? (
                        <Link
                          to={`/admin/catalogue/${request.item_id}?from=request`}
                          className="admin-review-btn admin-review-btn-review"
                        >
                          Review
                        </Link>
                      ) : request.type === 'box' && request.box_id ? (
                        <Link
                          to={`/admin/boxes/${request.box_id}`}
                          className="admin-review-btn admin-review-btn-review"
                        >
                          Review
                        </Link>
                      ) : null}
                      {canApprove && (
                        <>
                          <button
                            className="admin-review-btn-icon admin-review-btn-approve"
                            onClick={() => handleApprove(request)}
                            disabled={processingId === request.key}
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="admin-review-btn-icon admin-review-btn-reject"
                            onClick={() => handleReject(request)}
                            disabled={processingId === request.key}
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {requestTab === 'in_transit' && (
                    <>
                      {request.status === 'COMPLETED_UNVERIFIED' ? (
                        <span className="admin-request-status arrived">
                          <PackageCheck size={14} /> Arrived
                        </span>
                      ) : (
                        <span className="admin-request-status in-transit">
                          <Truck size={14} /> In Transit
                        </span>
                      )}
                      {request.status === 'COMPLETED_UNVERIFIED' && canApprove && (
                        <button
                          className="admin-review-btn-icon admin-review-btn-approve"
                          onClick={() => handleVerify(request)}
                          disabled={processingId === request.key}
                          title="Verify arrival"
                        >
                          <ShieldCheck size={16} />
                        </button>
                      )}
                      {request.type === 'item' && request.item_id && (
                        <Link
                          to={`/admin/catalogue/${request.item_id}`}
                          className="admin-review-btn admin-review-btn-review"
                        >
                          Review
                        </Link>
                      )}
                    </>
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