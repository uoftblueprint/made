import React, { useState } from 'react';
import { ArrowLeft, MapPin, Package, ArrowRightLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useBoxDetail } from '../../actions/useBoxes';
import { useLocations } from '../../actions/useLocations';
import { boxRequestsApi } from '../../api/requests.api';
import { useAuth } from '../../contexts';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import './BoxDetailsPage.css';

const BoxDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isJuniorVolunteer } = useAuth();
  const boxId = id ? parseInt(id) : null;
  const { box, loading, error, refetch } = useBoxDetail(boxId);
  const { locations } = useLocations();

  // Move Box modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveDestinationId, setMoveDestinationId] = useState<number | ''>('');
  const [moveError, setMoveError] = useState<string | null>(null);
  const [movingBox, setMovingBox] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        setSuccessMessage('Box moved successfully.');
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

  if (loading) {
    return (
      <div className="box-details-layout">
        <Link to="/admin/boxes" className="box-details-back">
          <ArrowLeft size={16} />
          Back to Box Management
        </Link>
        <div className="box-details-loading">Loading box details...</div>
      </div>
    );
  }

  if (error || !box) {
    return (
      <div className="box-details-layout">
        <Link to="/admin/boxes" className="box-details-back">
          <ArrowLeft size={16} />
          Back to Box Management
        </Link>
        <div className="box-details-error">{error || 'Box not found.'}</div>
      </div>
    );
  }

  return (
    <div className="box-details-layout">
      <Link to="/admin/boxes" className="box-details-back">
        <ArrowLeft size={16} />
        Back to Box Management
      </Link>

      {successMessage && (
        <div className="box-details-success-banner">{successMessage}</div>
      )}

      <div className="box-details-header">
        <div className="box-details-header-left">
          <h1>{box.label || box.box_code}</h1>
          <p className="box-details-subtitle">
            Container · {box.box_code}
          </p>
        </div>

        <div className="box-details-badges">
          <span className="item-badge type">
            <MapPin size={12} /> {locationName}
          </span>
        </div>
      </div>

      <div className="box-details-content">
        <div className="box-details-main">
          {/* Box Information */}
          <div className="box-details-card">
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
              <div className="item-field" style={{ marginTop: 'var(--spacing-md)' }}>
                <span className="item-field-label">Description</span>
                <span className="item-field-value">{box.description}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="box-details-card">
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
        <div className="box-details-sidebar">
          <button
            className="item-action-btn secondary"
            onClick={handleOpenMoveModal}
          >
            <ArrowRightLeft size={16} />
            {isJuniorVolunteer ? 'Request Move' : 'Move Box'}
          </button>

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
            <label htmlFor="move-box-destination">Destination Location <span className="required">*</span></label>
            <select
              id="move-box-destination"
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
          <Button
            variant="outline-gray"
            size="md"
            onClick={handleCloseMoveModal}
            disabled={movingBox}
          >
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
