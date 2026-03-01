import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, MapPin, ExternalLink, Trash2, Check, X, Clock, ArrowRight } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { itemsApi } from '../../api/items.api';
import { useItemRequests } from '../../actions/useRequests';
import type { PublicCollectionItem, MovementRequest } from '../../lib/types';
import './ItemDetailsPage.css';

interface ItemDetails extends PublicCollectionItem {
  cataloger?: string;
  date_of_entry?: string;
  physical_description?: string;
  does_it_work?: string;
  notes?: string;
  source?: string;
}

const ItemDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isRequestView = searchParams.get('from') === 'request';
  
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
  
  const { requests: movementRequests, loading: requestsLoading, approve, reject } = useItemRequests(id ? parseInt(id) : undefined);
  const pendingRequests = movementRequests.filter(r => r.status === 'WAITING_APPROVAL');
  
  const backLink = isRequestView ? '/admin' : '/admin/catalogue';
  const backText = isRequestView ? 'Back to Dashboard' : 'Back to Catalogue';

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await itemsApi.getById(id);
        setItem(data as ItemDetails);
      } catch (err) {
        console.error('Failed to fetch item:', err);
        setError('Failed to load item details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (dateString: string): string => {
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
  };

  const handleApprove = async (request: MovementRequest) => {
    setProcessingRequestId(request.id);
    try {
      await approve(request.id);
    } catch (err) {
      console.error('Failed to approve request:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleReject = async (request: MovementRequest) => {
    setProcessingRequestId(request.id);
    try {
      await reject(request.id);
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="item-details-layout">
        <Link to={backLink} className="item-details-back">
          <ArrowLeft size={16} />
          {backText}
        </Link>
        <div className="item-details-loading">Loading item details...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="item-details-layout">
        <Link to={backLink} className="item-details-back">
          <ArrowLeft size={16} />
          {backText}
        </Link>
        <div className="item-details-error">{error || 'Item not found.'}</div>
      </div>
    );
  }

  return (
    <div className="item-details-layout">
      {/* Back Link */}
      <Link to={backLink} className="item-details-back">
        <ArrowLeft size={16} />
        {backText}
      </Link>

      {/* Header */}
      <div className="item-details-header">
        <div className="item-details-header-left">
          <h1>{item.title || 'Untitled Item'}</h1>
          <p className="item-details-subtitle">Software Work Record · {item.item_code || `MADE-SW-${id}`}</p>
        </div>
        <div className="item-details-badges">
          {isRequestView && pendingRequests.length > 0 && (
            <span className="item-badge move-requested">Move Requested</span>
          )}
          <span className="item-badge type">{item.platform || 'Software'}</span>
        </div>
      </div>

      <div className="item-details-content">
        <div className="item-details-main">
          {/* Required Information */}
          <div className="item-details-card">
            <h3>Required Information</h3>
            <div className="item-details-grid">
              <div className="item-field">
                <span className="item-field-label">MADE ID</span>
                <span className="item-field-value">{item.item_code || `MADE-SW-${id}`}</span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Title</span>
                <span className="item-field-value">{item.title || '--'}</span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Platform</span>
                <span className="item-field-value">{item.platform || '--'}</span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Location/Box ID</span>
                <span className="item-field-value">
                  <MapPin size={14} /> {item.current_location?.name || '--'}
                </span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Date of Entry</span>
                <span className="item-field-value">{formatDate(item.date_of_entry || item.created_at)}</span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Cataloger</span>
                <span className="item-field-value">{item.cataloger || '--'}</span>
              </div>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="item-details-card quick-reference">
            <h3>Quick Reference</h3>
            <div className="item-details-grid three-col">
              <div className="item-field">
                <span className="item-field-label">What do we have?</span>
                <span className="item-field-value highlight">{item.platform ? `${item.platform} Game: ${item.title}` : '--'}</span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Where is it?</span>
                <span className="item-field-value">{item.current_location?.name || '--'}</span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Does it work?</span>
                <span className="item-field-value warning">{item.does_it_work || (item.working_condition !== undefined ? (item.working_condition ? 'Yes' : 'No') : 'Not yet tested')}</span>
              </div>
            </div>
          </div>

          {/* Optional Metadata */}
          <div className="item-details-card">
            <h3>Optional Metadata</h3>
            <div className="item-field">
              <span className="item-field-label">Physical Description</span>
              <span className={`item-field-value ${!item.physical_description ? 'muted' : ''}`}>
                {item.physical_description || 'Not filled - can add during review'}
              </span>
            </div>
            <div className="item-field">
              <span className="item-field-label">Does it work?</span>
              <span className={`item-field-value ${item.does_it_work === undefined && item.working_condition === undefined ? 'muted' : ''}`}>
                {item.does_it_work || (item.working_condition !== undefined ? (item.working_condition ? 'Yes' : 'No') : 'Not tested yet')}
              </span>
            </div>
            <div className="item-field">
              <span className="item-field-label">Notes</span>
              <span className={`item-field-value ${!item.notes ? 'muted' : ''}`}>
                {item.notes || 'None'}
              </span>
            </div>
          </div>

          {/* Movement Requests - only show in request view */}
          {isRequestView && (pendingRequests.length > 0 || requestsLoading) && (
            <div className="item-details-card movement-requests-card">
              <h3>
                <Clock size={18} />
                Pending Movement Requests ({requestsLoading ? '...' : pendingRequests.length})
              </h3>
              {requestsLoading ? (
                <p className="item-details-placeholder">Loading requests...</p>
              ) : (
                <div className="movement-requests-list">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="movement-request-item">
                      <div className="movement-request-info">
                        <div className="movement-request-route">
                          <span className="movement-location">{request.from_location_name}</span>
                          <ArrowRight size={16} className="movement-arrow" />
                          <span className="movement-location">{request.to_location_name}</span>
                        </div>
                        <div className="movement-request-meta">
                          <span>Requested by {request.requested_by_username}</span>
                          <span className="movement-request-time">{formatTimeAgo(request.created_at)}</span>
                        </div>
                      </div>
                      <div className="movement-request-actions">
                        <button
                          className="movement-request-btn approve"
                          onClick={() => handleApprove(request)}
                          disabled={processingRequestId === request.id}
                        >
                          <Check size={16} />
                          Approve
                        </button>
                        <button
                          className="movement-request-btn reject"
                          onClick={() => handleReject(request)}
                          disabled={processingRequestId === request.id}
                        >
                          <X size={16} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Location History */}
          <div className="item-details-card">
            <h3>Location History</h3>
            {item.current_location?.name ? (
              <div className="item-location-history">
                <div className="location-history-entry">
                  <span className="location-history-date">{formatDate(item.date_of_entry || item.created_at)}</span>
                  <div className="location-history-details">
                    <span className="location-history-box">{item.current_location?.name}</span>
                    <span className="location-history-note">Initial Entry</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="item-details-placeholder">
                <p>No location history available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="item-details-sidebar">
          {isRequestView && pendingRequests.length > 0 && (
            <>
              <button
                className="item-action-btn approve-request"
                onClick={() => pendingRequests[0] && handleApprove(pendingRequests[0])}
                disabled={processingRequestId !== null}
              >
                <Check size={16} />
                Approve Request
              </button>
              <button
                className="item-action-btn reject-request"
                onClick={() => pendingRequests[0] && handleReject(pendingRequests[0])}
                disabled={processingRequestId !== null}
              >
                <X size={16} />
                Reject Request
              </button>
            </>
          )}
          <button className="item-action-btn secondary">
            <Edit2 size={16} />
            Edit Record
          </button>
          <button className="item-action-btn secondary">
            <MapPin size={16} />
            Update Location
          </button>
          <button className="item-action-btn secondary">
            <ExternalLink size={16} />
            View in Google Sheets
          </button>
          <button className="item-action-btn danger">
            <Trash2 size={16} />
            Archive (Recoverable)
          </button>

          {/* Metadata */}
          <div className="item-sidebar-meta">
            <div className="item-meta-field">
              <span className="item-meta-label">Source</span>
              <span className="item-meta-value">{item.source || 'Public Entry Form'}</span>
            </div>
            <div className="item-meta-field">
              <span className="item-meta-label">Created</span>
              <span className="item-meta-value">{formatDate(item.created_at)}</span>
            </div>
            <div className="item-meta-field">
              <span className="item-meta-label">Last Updated</span>
              <span className="item-meta-value">{formatDate(item.updated_at)}</span>
            </div>
          </div>

          {/* Data Safety */}
          <div className="item-sidebar-safety">
            <h4>Data Safety</h4>
            <ul>
              <li>No permanent deletion</li>
              <li>Archive is recoverable</li>
              <li>All changes logged</li>
              <li>Syncs to Google Sheets</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsPage;
