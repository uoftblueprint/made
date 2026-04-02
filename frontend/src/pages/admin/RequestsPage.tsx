import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, CheckCircle, XCircle, Filter, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useRequests, useBoxRequests } from '../../actions/useRequests';
import type { MovementRequest, MovementRequestStatus, BoxMovementRequest } from '../../lib/types';
import Button from '../../components/common/Button';
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
    case 'COMPLETED_UNVERIFIED':
      return <span className="request-status-badge pending" style={{ background: '#fef3c7', color: '#92400e' }}><AlertTriangle size={12} /> Unverified</span>;
    case 'CANCELLED':
      return <span className="request-status-badge cancelled">Cancelled</span>;
    default:
      return <span className="request-status-badge">{status}</span>;
  }
}

const RequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'items' | 'boxes'>('items');
  const [statusFilter, setStatusFilter] = useState<MovementRequestStatus | undefined>(undefined);
  const { requests, loading, error, approve, reject, verify } = useRequests(statusFilter);
  const {
    requests: boxRequests,
    loading: boxLoading,
    error: boxError,
    approve: approveBox,
    reject: rejectBox,
    verify: verifyBox,
  } = useBoxRequests(statusFilter);
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

  const handleVerify = async (request: MovementRequest) => {
    setProcessingId(request.id);
    try {
      await verify(request.id);
    } catch (err) {
      console.error('Failed to verify request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveBox = async (request: BoxMovementRequest) => {
    setProcessingId(request.id);
    try {
      await approveBox(request.id);
    } catch (err) {
      console.error('Failed to approve box request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectBox = async (request: BoxMovementRequest) => {
    setProcessingId(request.id);
    try {
      await rejectBox(request.id);
    } catch (err) {
      console.error('Failed to reject box request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerifyBox = async (request: BoxMovementRequest) => {
    setProcessingId(request.id);
    try {
      await verifyBox(request.id);
    } catch (err) {
      console.error('Failed to verify box request:', err);
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
          <p className="requests-subtitle">Manage item and box movement approvals</p>
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
            <option value="COMPLETED_UNVERIFIED">Unverified</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="requests-tabs" style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e5e7eb', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('items')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'items' ? 600 : 400,
            color: activeTab === 'items' ? '#1a56db' : '#6b7280',
            borderBottom: activeTab === 'items' ? '2px solid #1a56db' : '2px solid transparent',
            marginBottom: '-2px',
          }}
        >
          Item Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('boxes')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'boxes' ? 600 : 400,
            color: activeTab === 'boxes' ? '#1a56db' : '#6b7280',
            borderBottom: activeTab === 'boxes' ? '2px solid #1a56db' : '2px solid transparent',
            marginBottom: '-2px',
          }}
        >
          Box Requests ({boxRequests.length})
        </button>
      </div>

      {/* Item Requests List */}
      {activeTab === 'items' && (
        <div className="requests-list-container">
          {loading ? (
            <div className="requests-loading">Loading requests...</div>
          ) : error ? (
            <div className="requests-error">{error}</div>
          ) : requests.length === 0 ? (
            <div className="requests-empty">No item movement requests found</div>
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
                          <Button
                            variant="success"
                            size="xs"
                            onClick={() => handleApprove(request)}
                            disabled={processingId === request.id}
                            title="Approve"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => handleReject(request)}
                            disabled={processingId === request.id}
                            title="Reject"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : request.status === 'COMPLETED_UNVERIFIED' ? (
                        <div className="request-actions">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleVerify(request)}
                            disabled={processingId === request.id}
                            title="Verify Location"
                          >
                            <ShieldCheck size={16} />
                          </Button>
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
      )}

      {/* Box Requests List */}
      {activeTab === 'boxes' && (
        <div className="requests-list-container">
          {boxLoading ? (
            <div className="requests-loading">Loading box requests...</div>
          ) : boxError ? (
            <div className="requests-error">{boxError}</div>
          ) : boxRequests.length === 0 ? (
            <div className="requests-empty">No box movement requests found</div>
          ) : (
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Box</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {boxRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="request-item-link">
                        <strong>{request.box_code}</strong>
                        <span className="request-item-platform">{request.box_label || 'No label'}</span>
                      </div>
                    </td>
                    <td>{request.from_location_name}</td>
                    <td>{request.to_location_name}</td>
                    <td>{request.requested_by_username}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td className="request-time">{formatTimeAgo(request.created_at)}</td>
                    <td>
                      {request.status === 'WAITING_APPROVAL' ? (
                        <div className="request-actions">
                          <Button
                            variant="success"
                            size="xs"
                            onClick={() => handleApproveBox(request)}
                            disabled={processingId === request.id}
                            title="Approve"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => handleRejectBox(request)}
                            disabled={processingId === request.id}
                            title="Reject"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : request.status === 'COMPLETED_UNVERIFIED' ? (
                        <div className="request-actions">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleVerifyBox(request)}
                            disabled={processingId === request.id}
                            title="Verify Location"
                          >
                            <ShieldCheck size={16} />
                          </Button>
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
      )}
    </div>
  );
};

export default RequestsPage;
