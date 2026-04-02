import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ArrowLeft, Edit2, MapPin, Check, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { itemsApi } from '../../api/items.api';
import { useItemRequests } from '../../actions/useRequests';
import type { AdminCollectionItem, MovementRequest } from '../../lib/types';
import './ItemDetailsPage.css';
import { ItemDetailsCard } from '../../components/items/ItemDetailCard';
import EditItemModal from '../../components/items/EditItemModal';

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: unknown } | undefined;
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
  }

  return error instanceof Error ? error.message : fallback;
}

interface ItemDetails extends AdminCollectionItem {
  cataloger?: string;
  date_of_entry?: string;
  physical_description?: string;
  does_it_work?: string;
  notes?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

const ItemDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isRequestView = searchParams.get('from') === 'request';
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
  const [arrivalError, setArrivalError] = useState<string | null>(null);

  const { requests: movementRequests, approve, reject, completeArrival, verify } = useItemRequests(id ? parseInt(id) : undefined);
  const pendingRequests = movementRequests.filter(r => r.status === 'WAITING_APPROVAL');
  const approvedRequests = movementRequests.filter(r => r.status === 'APPROVED');
  const unverifiedRequests = movementRequests.filter(r => r.status === 'COMPLETED_UNVERIFIED');
  const activeTransitRequest = approvedRequests[0] ?? null;
  const isInTransit = item?.status === 'IN_TRANSIT';
  const isUnverified = item?.is_verified === false;

  const backLink = isRequestView ? '/admin' : '/admin/catalogue';
  const backText = isRequestView ? 'Back to Dashboard' : 'Back to Catalogue';

  const fetchItem = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleApprove = async (request: MovementRequest) => {
    setProcessingRequestId(request.id);
    setArrivalError(null);
    try {
      await approve(request.id);
      await fetchItem();
    } catch (err) {
      console.error('Failed to approve request:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleReject = async (request: MovementRequest) => {
    setProcessingRequestId(request.id);
    setArrivalError(null);
    try {
      await reject(request.id);
      await fetchItem();
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleVerify = async () => {
    const unverifiedRequest = unverifiedRequests[0];
    if (!unverifiedRequest) return;
    setProcessingRequestId(unverifiedRequest.id);
    setArrivalError(null);
    try {
      await verify(unverifiedRequest.id, { comment: 'Location verified from item details.' });
      await fetchItem();
    } catch (err) {
      setArrivalError(getApiErrorMessage(err, 'Failed to verify location.'));
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleMarkArrived = async () => {
    if (!activeTransitRequest) {
      return;
    }
    setProcessingRequestId(activeTransitRequest.id);
    setArrivalError(null);
    try {
      await completeArrival(activeTransitRequest.id, {
        comment: `Marked as arrived from item details for ${item?.item_code ?? 'item'}.`
      });
      await fetchItem();
    } catch (err) {
      setArrivalError(getApiErrorMessage(err, 'Failed to mark item as arrived.'));
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

  const locationName = item.current_location?.name ?? '--';

  const workStatus =
    item.does_it_work !== undefined
      ? item.does_it_work
      : item.working_condition
      ? 'Yes'
      : 'No';

  return (
    <div className="item-details-layout">
      <Link to={backLink} className="item-details-back">
        <ArrowLeft size={16} />
        {backText}
      </Link>

      <div className="item-details-header mt-5 md:mt-0">
        <div className="item-details-header-left">
          <h1>{item.title || 'Untitled Item'}</h1>
          <p className="item-details-subtitle hidden md:block">
            Software Work Record · {item.item_code || `MADE-SW-${id}`}
          </p>
        </div>

        <div className="item-details-badges">
          {isRequestView && pendingRequests.length > 0 && (
            <span className="item-badge move-requested">Move Requested</span>
          )}
          {isInTransit && (
            <span className="item-badge in-transit">In Transit</span>
          )}
          {isUnverified && (
            <span className="item-badge in-transit" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' }}>
              <AlertTriangle size={12} /> Unverified Location
            </span>
          )}
          <span className="item-badge type hidden md:block">
            {item.platform || 'Software'}
          </span>
        </div>
      </div>

      <div className="item-details-content">
        <div className="item-details-main">
          {(arrivalError) && (
            <div className="item-details-card">
              {arrivalError && <p className="item-arrival-error">{arrivalError}</p>}
            </div>
          )}

          {/* Required Information */}
          <div className="item-details-card hidden md:flex">
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
                  <MapPin size={14} /> {locationName}
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
            <h3 className="hidden md:block">Quick Reference</h3>
            <div className="item-details-grid three-col">
              <div className="item-field">
                <span className="item-field-label">What do we have?</span>
                <span className="item-field-value highlight">{item.platform ? `${item.platform} Game: ${item.title}` : '--'}</span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Where is it?</span>
                <span className="item-field-value">{locationName}</span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Does it work?</span>
                <span className="item-field-value warning">{workStatus}</span>
              </div>
            </div>
          </div>

          {/* Optional Metadata */}
          <div className="item-details-card hidden md:block">
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

          <div className="item-details-card hidden md:block">
            
            <h3>Location History</h3>
            {locationName !== '--' ? (
              <div className="item-location-history">
                <div className="location-history-entry">
                  <span className="location-history-date">{formatDate(item.date_of_entry || item.created_at)}</span>
                  <div className="location-history-details">
                    <span className="location-history-box">{locationName}</span>
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
          <div className="md:hidden">
            <ItemDetailsCard
              item={{
                madeId: item.item_code || `MADE-SW-${id}`,
                platform: item.platform || 'Software',
                location: locationName !== '--' ? locationName : 'None',
              }}
              onUpdateLocation={() => console.log('open modal')}
            />
          </div>

          <button
            className="item-action-btn primary"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 size={16} />
            Edit Record
          </button>
          <button className="item-action-btn secondary">
            <MapPin size={16} />
            Update Location
          </button>
          {isInTransit && activeTransitRequest && (
            <button
              className="item-action-btn arrival"
              onClick={handleMarkArrived}
              disabled={processingRequestId === activeTransitRequest.id}
            >
              <Check size={16} />
              {processingRequestId === activeTransitRequest.id ? 'Marking...' : 'Mark as Arrived'}
            </button>
          )}
          {isUnverified && unverifiedRequests.length > 0 && (
            <button
              className="item-action-btn primary"
              onClick={handleVerify}
              disabled={processingRequestId === unverifiedRequests[0]?.id}
              style={{ background: '#f59e0b', borderColor: '#d97706' }}
            >
              <ShieldCheck size={16} />
              {processingRequestId === unverifiedRequests[0]?.id ? 'Verifying...' : 'Verify Location'}
            </button>
          )}

          {/* Metadata */}
          <div className="item-sidebar-meta hidden md:block">
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
          <div className="item-sidebar-safety hidden md:block">
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

      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={async () => {
          if (!id) return;
          const data = await itemsApi.getById(id);
          setItem(data as ItemDetails);
          setIsEditModalOpen(false);
        }}
        item={item}
      />
    </div>
  );
};

export default ItemDetailsPage;
