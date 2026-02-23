import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useRequests } from '../../actions/useRequests';
import type { MovementRequest, MovementRequestStatus } from '../../lib/types';
import './RequestsPage.css';

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

function getStatusBadge(status: MovementRequestStatus) {
  switch (status) {
    case 'WAITING_APPROVAL':
      return <span className="request-status-badge pending"><Clock size={12} /> Pending</span>;
    case 'APPROVED':
      return <span className="request-status-badge approved"><CheckCircle size={12} /> Approved</span>;
    case 'REJECTED':
      return <span className="request-status-badge rejected"><XCircle size={12} /> Rejected</span>;
    case 'CANCELLED':
      return <span className="request-status-badge cancelled">Cancelled</span>;
    default:
      return <span className="request-status-badge">{status}</span>;
  }
}

const RequestsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<MovementRequestStatus | undefined>(undefined);
  const { requests, loading, error, approve, reject } = useRequests(statusFilter);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleApprove = async (request: MovementRequest) => {
    setProcessingId(request.id);
    try {
      await approve(request.id);
    } catch (err) {
      console.error('Failed to approve request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: MovementRequest) => {
    setProcessingId(request.id);
    try {
      await reject(request.id);
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="requests-layout">
      {/* Back Link */}
      <Link to="/admin" className="requests-back">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="requests-header">
        <div className="requests-header-left">
          <h1>Movement Requests</h1>
          <p className="requests-subtitle">Manage item movement approvals</p>
        </div>
        <div className="requests-filter">
          <Filter size={16} />
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value as MovementRequestStatus || undefined)}
          >
            <option value="">All Requests</option>
            <option value="WAITING_APPROVAL">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="requests-list-container">
        {loading ? (
          <div className="requests-loading">Loading requests...</div>
        ) : error ? (
          <div className="requests-error">{error}</div>
        ) : requests.length === 0 ? (
          <div className="requests-empty">No movement requests found</div>
        ) : (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>From</th>
                <th>To</th>
                <th>Requested By</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <Link to={`/admin/catalogue/${request.item}?from=request`} className="request-item-link">
                      <strong>{request.item_title || `Item #${request.item}`}</strong>
                      <span className="request-item-platform">{request.item_platform || 'Unknown'}</span>
                    </Link>
                  </td>
                  <td>{request.from_location_name}</td>
                  <td>{request.to_location_name}</td>
                  <td>{request.requested_by_username}</td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td className="request-time">{formatTimeAgo(request.created_at)}</td>
                  <td>
                    {request.status === 'WAITING_APPROVAL' ? (
                      <div className="request-actions">
                        <button
                          className="request-action-btn approve"
                          onClick={() => handleApprove(request)}
                          disabled={processingId === request.id}
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="request-action-btn reject"
                          onClick={() => handleReject(request)}
                          disabled={processingId === request.id}
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="request-processed">
                        {request.admin_username && `by ${request.admin_username}`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RequestsPage;
