import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryState } from '../../hooks/useQueryState';
import { AlertCircle, Layers, Archive, Check, X, XCircle, Truck, ShieldCheck, Eye } from 'lucide-react';
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
  const navigate = useNavigate();
  const { isAdmin, isSeniorVolunteer } = useAuth();
  const canApprove = isAdmin || isSeniorVolunteer;
  // "Your Activity" — always filtered to current user
  const { requests: myItemReqs, loading: myItemLoading, completeArrival: myArriveItem, verify: myVerifyItem, startTransit: myStartTransitItem } = useRequests(undefined, true);
  const { requests: myBoxReqs, loading: myBoxLoading, completeArrival: myArriveBox, verify: myVerifyBox, startTransit: myStartTransitBox } = useBoxRequests(undefined, true);

  // "All Activity" — only for admins/seniors (shows everything with actions)
  const { requests: allItemReqs, loading: allItemLoading, approve: approveItem, reject: rejectItem, verify: verifyItem, completeArrival: arriveItem, startTransit: allStartTransitItem } = useRequests();
  const { requests: allBoxReqs, loading: allBoxLoading, approve: approveBox, reject: rejectBox, verify: verifyBox, completeArrival: arriveBox, startTransit: allStartTransitBox } = useBoxRequests();

  const { stats, loading: statsLoading } = useDashboardStats();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; section: 'my' | 'all' } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const showActionMessage = (msg: string, section: 'my' | 'all') => {
    setActionMessage({ text: msg, section });
    setTimeout(() => setActionMessage(null), 4000);
  };
  type RequestTab = 'pending' | 'approved' | 'in_transit' | 'arrived' | 'rejected';
  const [myTabParam, setMyTab] = useQueryState('myTab', canApprove ? 'in_transit' : 'pending');
  const myTab = myTabParam as RequestTab;
  const [allTabParam, setAllTab] = useQueryState('allTab', 'pending');
  const allTab = allTabParam as RequestTab;

  const myLoading = myItemLoading || myBoxLoading;
  const allLoading = allItemLoading || allBoxLoading;

  // Unified request type for display
  type UnifiedRequest = {
    id: number;
    key: string;
    type: 'item' | 'box';
    title: string;
    subtitle: string;
    from_location_name: string;
    to_location_name: string;
    status: string;
    item_status?: string;
    item_is_verified?: boolean;
    created_at: string;
    updated_at: string;
    item_id?: number;
    box_id?: number;
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
      item_status: r.item_status,
      item_is_verified: r.item_is_verified,
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
      item_status: r.items_status,
      item_is_verified: r.items_verified,
      created_at: r.created_at,
      updated_at: r.updated_at,
      box_id: r.box,
    }));

  // Build unified lists
  const myRequests = [...unifyItemReqs(myItemReqs), ...unifyBoxReqs(myBoxReqs)];
  const allRequests = [...unifyItemReqs(allItemReqs), ...unifyBoxReqs(allBoxReqs)];

  const isActiveRequest = (r: UnifiedRequest) => r.status === 'APPROVED' || r.status === 'COMPLETED_UNVERIFIED';

  const filterByTab = (reqs: UnifiedRequest[], tab: RequestTab) => {
    if (tab === 'pending') return reqs.filter(r => r.status === 'WAITING_APPROVAL');
    // Approved: request approved, item hasn't started transit (still AVAILABLE + verified)
    if (tab === 'approved') return reqs.filter(r => isActiveRequest(r) && r.item_status !== 'IN_TRANSIT' && r.item_is_verified !== false);
    // In Transit: item is physically moving
    if (tab === 'in_transit') return reqs.filter(r => isActiveRequest(r) && r.item_status === 'IN_TRANSIT');
    // Arrived: item arrived (AVAILABLE) but not yet verified
    if (tab === 'arrived') return reqs.filter(r => isActiveRequest(r) && r.item_status !== 'IN_TRANSIT' && r.item_is_verified === false);
    return reqs.filter(r => r.status === 'REJECTED');
  };

  const myTabRequests = filterByTab(myRequests, myTab);
  const allTabRequests = filterByTab(allRequests, allTab);

  // Stats from all requests
  const allPending = filterByTab(allRequests, 'pending');
  const allInTransit = filterByTab(allRequests, 'in_transit');
  const allArrived = filterByTab(allRequests, 'arrived');

  const handleApprove = async (request: UnifiedRequest) => {
    setProcessingId(request.key);
    try {
      if (request.type === 'item') await approveItem(request.id);
      else await approveBox(request.id);
      showActionMessage(`"${request.title}" approved — now in transit`, 'all');
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
      showActionMessage(`"${request.title}" rejected`, 'all');
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkArrived = async (request: UnifiedRequest, isMine: boolean) => {
    setProcessingId(request.key);
    try {
      if (isMine) {
        if (request.type === 'item') await myArriveItem(request.id);
        else await myArriveBox(request.id);
      } else {
        if (request.type === 'item') await arriveItem(request.id);
        else await arriveBox(request.id);
      }
      showActionMessage(`"${request.title}" marked as arrived — awaiting verification`, isMine ? 'my' : 'all');
    } catch (error) {
      console.error('Failed to mark as arrived:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleStartTransit = async (request: UnifiedRequest, isMine = false) => {
    setProcessingId(request.key);
    try {
      if (isMine) {
        if (request.type === 'item') await myStartTransitItem(request.id);
        else await myStartTransitBox(request.id);
      } else {
        if (request.type === 'item') await allStartTransitItem(request.id);
        else await allStartTransitBox(request.id);
      }
      showActionMessage(`"${request.title}" is now in transit`, isMine ? 'my' : 'all');
    } catch (error) {
      console.error('Failed to start transit:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerify = async (request: UnifiedRequest, isMine = false) => {
    setProcessingId(request.key);
    try {
      if (isMine) {
        if (request.type === 'item') await myVerifyItem(request.id);
        else await myVerifyBox(request.id);
      } else {
        if (request.type === 'item') await verifyItem(request.id);
        else await verifyBox(request.id);
      }
      showActionMessage(`"${request.title}" verified`, isMine ? 'my' : 'all');
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
          <p className="admin-stat-value">{allLoading ? '...' : allPending.length}</p>
          <p className="admin-stat-label">Pending Requests</p>
        </div>
        <div className="admin-stat-card">
          <Truck className="admin-stat-icon" size={24} />
          <p className="admin-stat-value">{allLoading ? '...' : allInTransit.length + allArrived.length}</p>
          <p className="admin-stat-label">In Transit / Arrived</p>
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
      </div>

      {/* Your Activity */}
      <div className="admin-review-section">
        <div className="admin-review-header">
          <h3>Your Activity</h3>
        </div>
        {actionMessage?.section === 'my' && (
          <div className="admin-action-banner">{actionMessage.text}</div>
        )}
        <div className="admin-request-tabs">
          {([
            // Juniors: Pending → Approved → In Transit → Rejected
            // Seniors/Admins: In Transit → Arrived
            ...(!canApprove ? [
              { key: 'pending' as const, label: 'Pending', count: filterByTab(myRequests, 'pending').length },
              { key: 'approved' as const, label: 'Approved', count: filterByTab(myRequests, 'approved').length },
            ] : []),
            { key: 'in_transit' as const, label: 'In Transit', count: filterByTab(myRequests, 'in_transit').length },
            ...(canApprove ? [{ key: 'arrived' as const, label: 'Arrived', count: filterByTab(myRequests, 'arrived').length }] : []),
            ...(!canApprove ? [
              { key: 'rejected' as const, label: 'Rejected', count: filterByTab(myRequests, 'rejected').length },
            ] : []),
          ]).map(tab => (
            <button
              key={tab.key}
              className={`admin-request-tab ${myTab === tab.key ? 'active' : ''}`}
              onClick={() => setMyTab(tab.key)}
            >
              {tab.label} ({myLoading ? '...' : tab.count})
            </button>
          ))}
        </div>
        <div className="admin-review-list">
          {myLoading ? (
            <div className="admin-review-item"><p>Loading...</p></div>
          ) : myTabRequests.length === 0 ? (
            <div className="admin-review-item"><p>No activity</p></div>
          ) : (
            myTabRequests.slice(0, 10).map((request) => (
              <div key={request.key} className="admin-review-item">
                <div className="admin-review-item-info">
                  {request.type === 'item' ? <Layers size={16} className="admin-review-dot" /> : <Archive size={16} className="admin-review-dot" />}
                  <div className="admin-review-item-details">
                    <h4>{request.title}</h4>
                    <p>{request.subtitle} · {request.from_location_name} → {request.to_location_name}</p>
                  </div>
                </div>
                <div className="admin-review-item-actions">
                  <span className="admin-review-time">{formatTimeAgo(request.created_at)}</span>
                  {myTab === 'pending' && <span className="admin-request-status pending"><AlertCircle size={14} /> Awaiting Approval</span>}
                  {myTab === 'approved' && (
                    <>
                      <span className="admin-request-status approved"><Check size={14} /> Approved</span>
                      <button className="admin-review-btn-icon admin-review-btn-approve" onClick={() => handleStartTransit(request, true)} disabled={processingId === request.key} title="Start Transit"><Truck size={16} /></button>
                    </>
                  )}
                  {myTab === 'in_transit' && (
                    <>
                      <span className="admin-request-status in-transit"><Truck size={14} /> In Transit</span>
                      <button className="admin-review-btn-icon admin-review-btn-approve" onClick={() => handleMarkArrived(request, true)} disabled={processingId === request.key} title="Mark Arrived"><Check size={16} /></button>
                    </>
                  )}
                  {myTab === 'arrived' && (
                    <>
                      <span className="admin-request-status arrived"><ShieldCheck size={14} /> Arrived</span>
                      <button className="admin-review-btn-icon admin-review-btn-approve" onClick={() => handleVerify(request, true)} disabled={processingId === request.key} title="Verify"><ShieldCheck size={16} /></button>
                    </>
                  )}
                  {myTab === 'rejected' && <span className="admin-request-status rejected"><XCircle size={14} /> Rejected</span>}
                  {request.type === 'item' && request.item_id ? (
                    <Link to={`/admin/catalogue/${request.item_id}`} className="admin-review-btn-icon" title="View"><Eye size={16} /></Link>
                  ) : request.type === 'box' && request.box_id ? (
                    <Link to={`/admin/boxes/${request.box_id}`} className="admin-review-btn-icon" title="View"><Eye size={16} /></Link>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* All Activity — admins and seniors */}
      {canApprove && (
        <div className="admin-review-section">
          <div className="admin-review-header">
            <h3>All Activity</h3>
          </div>
          {actionMessage?.section === 'all' && (
            <div className="admin-action-banner">{actionMessage.text}</div>
          )}
          <div className="admin-request-tabs">
            {([
              { key: 'pending' as const, label: 'Pending', count: filterByTab(allRequests, 'pending').length },
              { key: 'approved' as const, label: 'Approved', count: filterByTab(allRequests, 'approved').length },
              { key: 'in_transit' as const, label: 'In Transit', count: filterByTab(allRequests, 'in_transit').length },
              { key: 'arrived' as const, label: 'Arrived', count: filterByTab(allRequests, 'arrived').length },
              { key: 'rejected' as const, label: 'Rejected', count: filterByTab(allRequests, 'rejected').length },
            ]).map(tab => (
              <button
                key={tab.key}
                className={`admin-request-tab ${allTab === tab.key ? 'active' : ''}`}
                onClick={() => setAllTab(tab.key)}
              >
                {tab.label} ({allLoading ? '...' : tab.count})
              </button>
            ))}
          </div>
          <div className="admin-review-list">
            {allLoading ? (
              <div className="admin-review-item"><p>Loading...</p></div>
            ) : allTabRequests.length === 0 ? (
              <div className="admin-review-item"><p>No requests</p></div>
            ) : (
              allTabRequests.slice(0, 10).map((request) => (
                <div key={request.key} className="admin-review-item">
                  <div className="admin-review-item-info">
                    {request.type === 'item' ? <Layers size={16} className="admin-review-dot" /> : <Archive size={16} className="admin-review-dot" />}
                    <div className="admin-review-item-details">
                      <h4>{request.title}</h4>
                      <p>{request.subtitle} · {request.from_location_name} → {request.to_location_name}</p>
                    </div>
                  </div>
                  <div className="admin-review-item-actions">
                    <span className="admin-review-time">{formatTimeAgo(request.created_at)}</span>
                    {allTab === 'pending' && (
                      <>
                        {request.type === 'item' && request.item_id ? (
                          <Link to={`/admin/catalogue/${request.item_id}?from=request`} className="admin-review-btn admin-review-btn-review">Review</Link>
                        ) : request.type === 'box' && request.box_id ? (
                          <Link to={`/admin/boxes/${request.box_id}?from=request`} className="admin-review-btn admin-review-btn-review">Review</Link>
                        ) : null}
                        <button className="admin-review-btn-icon admin-review-btn-approve" onClick={() => handleApprove(request)} disabled={processingId === request.key} title="Approve"><Check size={16} /></button>
                        <button className="admin-review-btn-icon admin-review-btn-reject" onClick={() => handleReject(request)} disabled={processingId === request.key} title="Reject"><X size={16} /></button>
                      </>
                    )}
                    {allTab === 'approved' && (
                      <>
                        <span className="admin-request-status approved"><Check size={14} /> Approved</span>
                        <button className="admin-review-btn-icon admin-review-btn-approve" onClick={() => handleStartTransit(request, false)} disabled={processingId === request.key} title="Start Transit"><Truck size={16} /></button>
                      </>
                    )}
                    {allTab === 'in_transit' && (
                      <>
                        <span className="admin-request-status in-transit"><Truck size={14} /> In Transit</span>
                        <button className="admin-review-btn-icon admin-review-btn-approve" onClick={() => handleMarkArrived(request, false)} disabled={processingId === request.key} title="Mark Arrived"><Check size={16} /></button>
                        {request.type === 'item' && request.item_id ? (
                          <Link to={`/admin/catalogue/${request.item_id}`} className="admin-review-btn-icon" title="View"><Eye size={16} /></Link>
                        ) : request.type === 'box' && request.box_id ? (
                          <Link to={`/admin/boxes/${request.box_id}`} className="admin-review-btn-icon" title="View"><Eye size={16} /></Link>
                        ) : null}
                      </>
                    )}
                    {allTab === 'arrived' && (
                      <>
                        <span className="admin-request-status arrived"><ShieldCheck size={14} /> Awaiting Verification</span>
                        <button className="admin-review-btn-icon admin-review-btn-approve" onClick={() => handleVerify(request)} disabled={processingId === request.key} title="Verify"><ShieldCheck size={16} /></button>
                        {request.type === 'item' && request.item_id ? (
                          <Link to={`/admin/catalogue/${request.item_id}`} className="admin-review-btn-icon" title="View"><Eye size={16} /></Link>
                        ) : request.type === 'box' && request.box_id ? (
                          <Link to={`/admin/boxes/${request.box_id}`} className="admin-review-btn-icon" title="View"><Eye size={16} /></Link>
                        ) : null}
                      </>
                    )}
                    {allTab === 'rejected' && (
                      <span className="admin-request-status rejected"><XCircle size={14} /> Rejected</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="admin-quick-actions">
        <Button
          variant="outline-black"
          size="lg"
          icon="plus"
          layout="stacked"
          fullWidth
          onClick={() => navigate('/admin/catalogue', { state: { openAddModal: true } })}
        >
          Add New Item
        </Button>
        <Button
          variant="outline-black"
          size="lg"
          icon="archive"
          layout="stacked"
          fullWidth
          onClick={() => navigate('/admin/boxes', { state: { openAddBoxModal: true } })}
        >
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