import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ArrowLeft, Edit2, MapPin, Check, X, AlertTriangle, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { itemsApi } from '../../api/items.api';
import { requestsApi } from '../../api/requests.api';
import { useItemRequests } from '../../actions/useRequests';
import { useLocations } from '../../actions/useLocations';
import { useBoxes } from '../../actions/useBoxes';
import type { AdminCollectionItem, MovementRequest } from '../../lib/types';
import { useAuth } from '../../contexts';
import './ItemDetailsPage.css';
import { ItemDetailsCard } from '../../components/items/ItemDetailCard';
import EditItemModal from '../../components/items/EditItemModal';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: unknown } | undefined;
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
  }

  return error instanceof Error ? error.message : fallback;
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  IN_TRANSIT: 'In Transit',
  CHECKED_OUT: 'Checked Out',
  MAINTENANCE: 'Maintenance',
};

const TYPE_LABELS: Record<string, string> = {
  SOFTWARE: 'Software',
  HARDWARE: 'Hardware',
  NON_ELECTRONIC: 'Non-Electronic',
};

const getStatusLabel = (status?: string) => {
  if (!status) return '--';
  return STATUS_LABELS[status] || status;
};

const getTypeLabel = (type?: string) => {
  if (!type) return '--';
  return TYPE_LABELS[type] || type;
};

type ItemDetails = AdminCollectionItem;

const ItemDetailsPage: React.FC = () => {
  const { isAdmin, isSeniorVolunteer } = useAuth();
  const canEdit = isAdmin || isSeniorVolunteer;
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isRequestView = searchParams.get('from') === 'request';
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
  const [arrivalError, setArrivalError] = useState<string | null>(null);

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveDestinationType, setMoveDestinationType] = useState<'location' | 'box'>('location');
  const [moveToLocationId, setMoveToLocationId] = useState<number | ''>('');
  const [moveToBoxId, setMoveToBoxId] = useState<number | ''>('');
  const [moveError, setMoveError] = useState<string | null>(null);
  const [movingItem, setMovingItem] = useState(false);
  const [moveSuccessMessage, setMoveSuccessMessage] = useState<string | null>(null);

  const { locations: allLocations } = useLocations();
  const { boxes: allBoxes } = useBoxes();

  const { requests: movementRequests, approve, reject, completeArrival, verify } = useItemRequests(id ? parseInt(id) : undefined);
  const pendingRequests = movementRequests.filter(r => r.status === 'WAITING_APPROVAL');
  const approvedRequests = movementRequests.filter(r => r.status === 'APPROVED');
  const unverifiedRequests = movementRequests.filter(r => r.status === 'COMPLETED_UNVERIFIED');
  const activeTransitRequest = approvedRequests[0] ?? null;
  const isInTransit = item?.status === 'IN_TRANSIT';
  const isUnverified = item?.is_verified === false;

  const navigate = useNavigate();

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

  const handleOpenMoveModal = () => {
    setMoveDestinationType('location');
    setMoveToLocationId('');
    setMoveToBoxId('');
    setMoveError(null);
    setShowMoveModal(true);
  };

  const handleCloseMoveModal = () => {
    setShowMoveModal(false);
    setMoveError(null);
  };

  const handleSubmitMove = async () => {
    if (!item) return;

    let toLocationId: number;
    let toBoxId: number | null = null;
    const fromBoxId: number | null = item.box ?? null;

    if (moveDestinationType === 'box') {
      if (moveToBoxId === '') return;
      const selectedBox = allBoxes.find(b => b.id === moveToBoxId);
      if (!selectedBox) return;
      toLocationId = selectedBox.location;
      toBoxId = selectedBox.id;
    } else {
      if (moveToLocationId === '') return;
      toLocationId = moveToLocationId as number;
    }

    setMovingItem(true);
    setMoveError(null);

    try {
      const response = await requestsApi.create({
        item: item.id,
        from_location: item.current_location?.id ?? 0,
        to_location: toLocationId,
        from_box: fromBoxId,
        to_box: toBoxId,
      });
      handleCloseMoveModal();
      if (response.status === 'COMPLETED_UNVERIFIED') {
        setMoveSuccessMessage('Item moved successfully.');
      } else {
        setMoveSuccessMessage('Movement request submitted for approval.');
      }
      setTimeout(() => setMoveSuccessMessage(null), 5000);
      await fetchItem();
    } catch (err) {
      setMoveError(getApiErrorMessage(err, 'Failed to create movement request.'));
    } finally {
      setMovingItem(false);
    }
  };

  if (isLoading) {
    return (
      <div className="item-details-layout">
        <button onClick={() => navigate(-1)} className="item-details-back">
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="item-details-loading">Loading item details...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="item-details-layout">
        <button onClick={() => navigate(-1)} className="item-details-back">
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="item-details-error">{error || 'Item not found.'}</div>
      </div>
    );
  }

  const locationName = item.current_location?.name ?? '--';

  const workStatus = item.working_condition ? 'Yes' : 'No';

  return (
    <div className="item-details-layout">
      <button onClick={() => navigate(-1)} className="item-details-back">
        <ArrowLeft size={16} />
        Back
      </button>

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
          {!isInTransit && isUnverified && (
            <span className="item-badge unverified">
              <AlertTriangle size={12} /> Unverified
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

          {/* Pending Move Request Info */}
          {pendingRequests.length > 0 && (() => {
            const req = pendingRequests[0];
            return (
            <div className="item-details-card item-details-warning-card">
              <h3>Move Request — Pending</h3>
              <div className="item-details-grid">
                <div className="item-field">
                  <span className="item-field-label">From</span>
                  <span className="item-field-value">{req.from_location_name}{req.from_box_code ? ` / ${req.from_box_code}` : ''}</span>
                </div>
                <div className="item-field">
                  <span className="item-field-label">To</span>
                  <span className="item-field-value">{req.to_location_name}{req.to_box_code ? ` / ${req.to_box_code}` : ''}</span>
                </div>
                <div className="item-field">
                  <span className="item-field-label">Requested By</span>
                  <span className="item-field-value">{req.requested_by_username || '--'}</span>
                </div>
              </div>
            </div>
            );
          })()}

          {/* In Transit Info */}
          {isInTransit && (approvedRequests.length > 0 || unverifiedRequests.length > 0) && (() => {
            const req = approvedRequests[0] || unverifiedRequests[0];
            return (
            <div className="item-details-card item-details-warning-card">
              <h3>In Transit — Awaiting Arrival</h3>
              <div className="item-details-grid">
                <div className="item-field">
                  <span className="item-field-label">From</span>
                  <span className="item-field-value">{req?.from_location_name}{req?.from_box_code ? ` / ${req.from_box_code}` : ''}</span>
                </div>
                <div className="item-field">
                  <span className="item-field-label">To</span>
                  <span className="item-field-value">{req?.to_location_name}{req?.to_box_code ? ` / ${req.to_box_code}` : ''}</span>
                </div>
                <div className="item-field">
                  <span className="item-field-label">Moved By</span>
                  <span className="item-field-value">{req?.requested_by_username || '--'}</span>
                </div>
              </div>
            </div>
            );
          })()}

          {/* Required Information */}
          <div className="item-details-card hidden md:block">
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
                <span className="item-field-label">Type</span>
                <span className="item-field-value">{getTypeLabel(item.item_type)}</span>
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
              <span className="item-field-label">Description</span>
              <span className={`item-field-value ${!item.description ? 'muted' : ''}`}>
                {item.description || 'Not filled - can add during review'}
              </span>
            </div>
            <div className="item-field">
              <span className="item-field-label">Working Condition</span>
              <span className="item-field-value">
                {item.working_condition ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="item-field">
              <span className="item-field-label">Status</span>
              <span className="item-field-value">
                {getStatusLabel(item.status)}
              </span>
            </div>
          </div>

          <div className="item-details-card hidden md:block">
            
            <h3>Location History</h3>
            {locationName !== '--' ? (
              <div className="item-location-history">
                <div className="location-history-entry">
                  <span className="location-history-date">{formatDate(item.created_at)}</span>
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
          {canEdit && isRequestView && pendingRequests.length > 0 && (
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
              onUpdateLocation={handleOpenMoveModal}
            />
          </div>

          {canEdit && (
            <button
              className="item-action-btn primary"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit2 size={16} />
              Edit Record
            </button>
          )}
          {moveSuccessMessage ? (
            <div className="item-action-inline-success">{moveSuccessMessage}</div>
          ) : (
            <button
              className="item-action-btn secondary"
              onClick={handleOpenMoveModal}
            >
              <ArrowRightLeft size={16} />
              {canEdit ? 'Move Item' : 'Request Move'}
            </button>
          )}
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
          {canEdit && isUnverified && unverifiedRequests.length > 0 && (
            <button
              className="item-action-btn verify"
              onClick={handleVerify}
              disabled={processingRequestId === unverifiedRequests[0]?.id}
            >
              <ShieldCheck size={16} />
              {processingRequestId === unverifiedRequests[0]?.id ? 'Verifying...' : 'Verify Location'}
            </button>
          )}

          {/* Metadata */}
          <div className="item-sidebar-meta hidden md:block">
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

      {/* Move Item Modal */}
      <Modal open={showMoveModal} onClose={handleCloseMoveModal} title={`Move: ${item?.title || 'Item'}`}>
        <div className="modal-form">
          {moveError && (
            <div className="volunteers-error">{moveError}</div>
          )}

          <div className="modal-field">
            <label>Current Location</label>
            <input type="text" value={item?.current_location?.name || 'Unknown'} disabled />
          </div>

          {item?.box && (
            <div className="modal-field">
              <label>Current Box</label>
              <input type="text" value={`Box #${item.box}`} disabled />
            </div>
          )}

          <div className="modal-field">
            <label>Destination Type</label>
            <div className="modal-radio-group">
              <label className="modal-radio-label">
                <input
                  type="radio"
                  name="destType"
                  checked={moveDestinationType === 'location'}
                  onChange={() => { setMoveDestinationType('location'); setMoveToBoxId(''); }}
                />
                Location
              </label>
              <label className="modal-radio-label">
                <input
                  type="radio"
                  name="destType"
                  checked={moveDestinationType === 'box'}
                  onChange={() => { setMoveDestinationType('box'); setMoveToLocationId(''); }}
                />
                Box
              </label>
            </div>
          </div>

          {moveDestinationType === 'location' ? (
            <div className="modal-field">
              <label>Destination Location <span className="required">*</span></label>
              <select
                value={moveToLocationId}
                onChange={(e) => setMoveToLocationId(e.target.value ? Number(e.target.value) : '')}
                disabled={movingItem}
              >
                <option value="">Select location...</option>
                {allLocations
                  .filter(l => l.id !== item?.current_location?.id)
                  .map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.location_type_display})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="modal-field">
              <label>Destination Box <span className="required">*</span></label>
              <select
                value={moveToBoxId}
                onChange={(e) => setMoveToBoxId(e.target.value ? Number(e.target.value) : '')}
                disabled={movingItem}
              >
                <option value="">Select box...</option>
                {allBoxes
                  .filter(b => b.id !== item?.box)
                  .map(b => (
                    <option key={b.id} value={b.id}>
                      {b.box_code} {b.label ? `- ${b.label}` : ''}
                    </option>
                  ))}
              </select>
              {moveToBoxId !== '' && (
                <p className="modal-subtitle">
                  Location: {allLocations.find(l => l.id === allBoxes.find(b => b.id === moveToBoxId)?.location)?.name || 'Unknown'}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <Button variant="outline-gray" size="md" onClick={handleCloseMoveModal} disabled={movingItem}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmitMove}
            disabled={
              movingItem ||
              (moveDestinationType === 'location' && moveToLocationId === '') ||
              (moveDestinationType === 'box' && moveToBoxId === '')
            }
          >
            {movingItem ? (canEdit ? 'Moving...' : 'Submitting...') : (canEdit ? 'Move Item' : 'Submit Move Request')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ItemDetailsPage;
