import React, { useState } from 'react';
import { ArrowLeft, MapPin, Package, ArrowRightLeft, Check, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useBoxDetail } from '../../actions/useBoxes';
import { useBoxDetailRequests } from '../../actions/useRequests';
import { useLocations } from '../../actions/useLocations';
import { boxRequestsApi } from '../../api/requests.api';
import { useAuth } from '../../contexts';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import './BoxDetailsPage.css';

const BoxDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRequestView = searchParams.get('from') === 'request';
  const { isAdmin, isSeniorVolunteer, isJuniorVolunteer } = useAuth();
  const canApprove = isAdmin || isSeniorVolunteer;
  const boxId = id ? parseInt(id) : null;
  const { box, loading, error, refetch } = useBoxDetail(boxId);
  const { locations } = useLocations();
  const { requests: boxRequests, approve, reject, verify } = useBoxDetailRequests(boxId);

  const pendingRequests = boxRequests.filter(r => r.status === 'WAITING_APPROVAL');
  const inTransitRequests = boxRequests.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED_UNVERIFIED');
  const hasActiveRequest = pendingRequests.length > 0 || inTransitRequests.length > 0;

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveDestinationId, setMoveDestinationId] = useState<number | ''>('');
  const [moveError, setMoveError] = useState<string | null>(null);
  const [movingBox, setMovingBox] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const locationName = locations.find(l => l.id === box?.location)?.name ?? '--';

  const handleOpenMoveModal = () => {
    setMoveDestinationId('');
    setMoveError(null);
    setShowMoveModal(true);
  };

  const handleCloseMoveModal = () => {
    setShowMoveModal(false);
    setMoveError(null);
  };

  const handleSubmitMove = async () => {
    if (!box || moveDestinationId === '') return;
    setMovingBox(true);
    setMoveError(null);
    try {
      const response = await boxRequestsApi.create({
        box: box.id,
        from_location: box.location,
        to_location: moveDestinationId,
      });
      handleCloseMoveModal();
      if (response.status === 'COMPLETED_UNVERIFIED') {
        setSuccessMessage('Box moved successfully. Awaiting verification.');
      } else {
        setSuccessMessage('Movement request submitted for approval.');
      }
      setTimeout(() => setSuccessMessage(null), 5000);
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create box movement request.';
      setMoveError(msg);
    } finally {
      setMovingBox(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    setProcessingRequestId(requestId);
    setActionError(null);
    try {
      await approve(requestId);
      await refetch();
    } catch { setActionError('Failed to approve request.'); }
    finally { setProcessingRequestId(null); }
  };

  const handleReject = async (requestId: number) => {
    setProcessingRequestId(requestId);
    setActionError(null);
    try {
      await reject(requestId);
      await refetch();
    } catch { setActionError('Failed to reject request.'); }
    finally { setProcessingRequestId(null); }
  };

  const handleVerify = async (requestId: number) => {
    setProcessingRequestId(requestId);
    setActionError(null);
    try {
      await verify(requestId);
      await refetch();
    } catch { setActionError('Failed to verify request.'); }
    finally { setProcessingRequestId(null); }
  };

  if (loading) {
    return (
      <div className="item-details-layout">
        <button onClick={() => navigate(-1)} className="item-details-back">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="item-details-loading">Loading box details...</div>
      </div>
    );
  }

  if (error || !box) {
    return (
      <div className="item-details-layout">
        <button onClick={() => navigate(-1)} className="item-details-back">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="item-details-error">{error || 'Box not found.'}</div>
      </div>
    );
  }

  return (
    <div className="item-details-layout">
      <button onClick={() => navigate(-1)} className="item-details-back">
        <ArrowLeft size={16} />
        {isRequestView ? 'Back to Dashboard' : 'Back to Box Management'}
      </button>

      <div className="item-details-header">
        <div className="item-details-header-left">
          <h1>{box.label || box.box_code}</h1>
          <p className="item-details-subtitle">
            Container · {box.box_code}
          </p>
        </div>

        <div className="item-details-badges">
          {pendingRequests.length > 0 && (
            <span className="item-badge move-requested">Move Requested</span>
          )}
          {inTransitRequests.length > 0 && (
            <span className="item-badge in-transit">In Transit</span>
          )}
          <span className="item-badge type">
            <MapPin size={12} /> {locationName}
          </span>
        </div>
      </div>

      <div className="item-details-content">
        <div className="item-details-main">
          {actionError && (
            <div className="item-details-card">
              <p className="item-arrival-error">{actionError}</p>
            </div>
          )}

          {/* Box Information */}
          <div className="item-details-card">
            <h3>Box Information</h3>
            <div className="item-details-grid">
              <div className="item-field">
                <span className="item-field-label">Box Code</span>
                <span className="item-field-value">{box.box_code}</span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Label</span>
                <span className="item-field-value">{box.label || '--'}</span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Location</span>
                <span className="item-field-value">
                  <MapPin size={14} /> {locationName}
                </span>
              </div>
              <div className="item-field">
                <span className="item-field-label">Items Count</span>
                <span className="item-field-value">{box.items?.length ?? 0}</span>
              </div>
            </div>
            {box.description && (
              <div className="item-field box-details-description-field">
                <span className="item-field-label">Description</span>
                <span className="item-field-value">{box.description}</span>
              </div>
            )}
          </div>

          {/* Movement Activity */}
          {hasActiveRequest && (
            <div className="item-details-card box-details-request-card">
              {pendingRequests.length > 0 ? (
                <>
                  <h3>Pending Move Request</h3>
                  <div className="item-details-grid">
                    <div className="item-field">
                      <span className="item-field-label">From</span>
                      <span className="item-field-value">{pendingRequests[0].from_location_name}</span>
                    </div>
                    <div className="item-field">
                      <span className="item-field-label">To</span>
                      <span className="item-field-value">{pendingRequests[0].to_location_name}</span>
                    </div>
                    <div className="item-field">
                      <span className="item-field-label">Requested By</span>
                      <span className="item-field-value">{pendingRequests[0].requested_by_username}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3>
                    <AlertTriangle size={14} /> In Transit — Awaiting Verification
                  </h3>
                  <div className="item-details-grid">
                    <div className="item-field">
                      <span className="item-field-label">From</span>
                      <span className="item-field-value">{inTransitRequests[0].from_location_name}</span>
                    </div>
                    <div className="item-field">
                      <span className="item-field-label">To</span>
                      <span className="item-field-value">{inTransitRequests[0].to_location_name}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Items Table */}
          <div className="item-details-card">
            <h3>Items ({box.items?.length ?? 0})</h3>
            {!box.items || box.items.length === 0 ? (
              <div className="box-details-empty-items">
                <Package size={32} />
                <p>No items in this box</p>
              </div>
            ) : (
              <table className="box-details-items-table">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Title</th>
                    <th>Platform</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {box.items.map((item) => (
                    <tr
                      key={item.id}
                      className="box-details-item-row"
                      onClick={() => navigate(`/admin/catalogue/${item.id}`)}
                    >
                      <td><strong>{item.item_code}</strong></td>
                      <td>{item.title}</td>
                      <td>{item.platform || '--'}</td>
                      <td>{item.item_type}</td>
                      <td>
                        <span className={`item-status ${item.working_condition ? 'working' : 'not-working'}`}>
                          {item.working_condition ? 'Working' : 'Not Working'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="item-details-sidebar">
          {canApprove && pendingRequests.length > 0 && (
            <>
              <button
                className="item-action-btn approve-request"
                onClick={() => handleApprove(pendingRequests[0].id)}
                disabled={processingRequestId !== null}
              >
                <Check size={16} />
                Approve Request
              </button>
              <button
                className="item-action-btn reject-request"
                onClick={() => handleReject(pendingRequests[0].id)}
                disabled={processingRequestId !== null}
              >
                <X size={16} />
                Reject Request
              </button>
            </>
          )}

          {canApprove && inTransitRequests.length > 0 && pendingRequests.length === 0 && (
            <button
              className="item-action-btn verify"
              onClick={() => handleVerify(inTransitRequests[0].id)}
              disabled={processingRequestId !== null}
            >
              <ShieldCheck size={16} />
              {processingRequestId === inTransitRequests[0].id ? 'Verifying...' : 'Verify Location'}
            </button>
          )}

          {successMessage ? (
            <div className="item-action-inline-success">{successMessage}</div>
          ) : (
            !hasActiveRequest && (
              <button
                className="item-action-btn secondary"
                onClick={handleOpenMoveModal}
              >
                <ArrowRightLeft size={16} />
                {isJuniorVolunteer ? 'Request Move' : 'Move Box'}
              </button>
            )
          )}

          {/* Metadata */}
          <div className="item-sidebar-meta">
            <div className="item-meta-field">
              <span className="item-meta-label">Box Code</span>
              <span className="item-meta-value">{box.box_code}</span>
            </div>
            <div className="item-meta-field">
              <span className="item-meta-label">Location</span>
              <span className="item-meta-value">{locationName}</span>
            </div>
            <div className="item-meta-field">
              <span className="item-meta-label">Total Items</span>
              <span className="item-meta-value">{box.items?.length ?? 0}</span>
            </div>
            {box.created_at && (
              <div className="item-meta-field">
                <span className="item-meta-label">Created</span>
                <span className="item-meta-value">
                  {new Date(box.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            {box.updated_at && (
              <div className="item-meta-field">
                <span className="item-meta-label">Last Updated</span>
                <span className="item-meta-value">
                  {new Date(box.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Move Box Modal */}
      <Modal open={showMoveModal} onClose={handleCloseMoveModal} title={`Move Box: ${box.box_code}`}>
        <div className="modal-form">
          {moveError && (
            <div className="box-management-modal-error">{moveError}</div>
          )}
          <div className="modal-field">
            <label>Current Location</label>
            <input type="text" value={locationName} disabled />
          </div>
          <div className="modal-field">
            <label>Destination Location <span className="required">*</span></label>
            <select
              value={moveDestinationId}
              onChange={(e) => setMoveDestinationId(e.target.value ? Number(e.target.value) : '')}
              disabled={movingBox}
            >
              <option value="">Select destination...</option>
              {locations
                .filter((location) => location.id !== box.location)
                .map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.location_type_display})
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <Button variant="outline-gray" size="md" onClick={handleCloseMoveModal} disabled={movingBox}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmitMove}
            disabled={movingBox || moveDestinationId === ''}
          >
            {movingBox ? (isJuniorVolunteer ? 'Submitting...' : 'Moving...') : (isJuniorVolunteer ? 'Submit Move Request' : 'Move Box')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default BoxDetailsPage;
