import React, { useState, useMemo } from 'react';
import { Archive, MapPin, Package, ChevronRight, X } from 'lucide-react';
import { useLocations, useLocationDetail, useCreateLocation } from '../../actions/useLocations';
import { useBoxDetail } from '../../actions/useBoxes';
import type { CreateLocationData } from '../../api/locations.api';
import './BoxManagementPage.css';

const BoxManagementPage: React.FC = () => {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'containers'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState<CreateLocationData['location_type']>('STORAGE');
  const [newLocationDescription, setNewLocationDescription] = useState('');

  const { locations, loading: locationsLoading, refetch: refetchLocations } = useLocations();
  const { location: selectedLocation, loading: locationLoading } = useLocationDetail(selectedLocationId);
  const { box: selectedBox, loading: boxLoading } = useBoxDetail(selectedBoxId);
  const { createLocation, creating: creatingLocation, error: createError } = useCreateLocation();

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    try {
      await createLocation({
        name: newLocationName.trim(),
        location_type: newLocationType,
        description: newLocationDescription.trim(),
      });
      setShowAddModal(false);
      setNewLocationName('');
      setNewLocationType('STORAGE');
      setNewLocationDescription('');
      refetchLocations();
    } catch {
      // Error is already handled by the hook
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewLocationName('');
    setNewLocationType('STORAGE');
    setNewLocationDescription('');
  };

  const totalBoxes = useMemo(() => {
    if (!Array.isArray(locations)) return 0;
    return locations.reduce((sum, loc) => sum + loc.box_count, 0);
  }, [locations]);

  const totalItems = useMemo(() => {
    if (!Array.isArray(locations)) return 0;
    return locations.reduce((sum, loc) => sum + loc.item_count, 0);
  }, [locations]);

  const handleLocationClick = (locationId: number) => {
    setSelectedLocationId(locationId);
    setSelectedBoxId(null);
  };

  const handleBoxClick = (boxId: number) => {
    setSelectedBoxId(boxId);
  };

  return (
    <div className="box-management-layout">
      <div className="box-management-header">
        <div className="box-management-header-left">
          <h1>Box Management</h1>
          <p className="box-management-header-subtitle">Track items, boxes, and shelf locations across the museum</p>
        </div>
        <button className="box-management-add-btn" onClick={() => setShowAddModal(true)}>
          + Add New Location
        </button>
      </div>

      {/* View Toggle */}
      <div className="box-management-tabs">
        <button 
          className={`box-management-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          List View
        </button>
        <button 
          className={`box-management-tab ${activeTab === 'containers' ? 'active' : ''}`}
          onClick={() => setActiveTab('containers')}
        >
          All Containers
        </button>
      </div>

      <div className="box-management-content">
        <div className="box-management-sidebar">
          <div className="box-management-sidebar-header">
            <Archive size={16} />
            <span>All Locations ({locationsLoading ? '...' : (Array.isArray(locations) ? locations.length : 0)})</span>
          </div>
          
          {locationsLoading ? (
            <div className="box-management-loading">Loading locations...</div>
          ) : !Array.isArray(locations) || locations.length === 0 ? (
            <div className="box-management-empty-state">
              <p>No locations found.</p>
            </div>
          ) : (
            <ul className="box-management-location-list">
              {locations.map((location) => (
                <li 
                  key={location.id}
                  className={`box-management-location-item ${selectedLocationId === location.id ? 'active' : ''}`}
                  onClick={() => handleLocationClick(location.id)}
                >
                  <div className="location-item-info">
                    <span className="location-item-name">{location.name}</span>
                    <span className="location-item-type">{location.location_type_display}</span>
                  </div>
                  <div className="location-item-counts">
                    <span>{location.box_count} boxes</span>
                    <span>{location.item_count} items</span>
                  </div>
                  <ChevronRight size={16} className="location-item-arrow" />
                </li>
              ))}
            </ul>
          )}

          <div className="box-management-summary">
            <h4>System Summary</h4>
            <div className="box-management-summary-item">
              <span>Total Locations</span>
              <span>{locationsLoading ? '--' : locations.length}</span>
            </div>
            <div className="box-management-summary-item">
              <span>Total Containers</span>
              <span>{locationsLoading ? '--' : totalBoxes}</span>
            </div>
            <div className="box-management-summary-item">
              <span>Total Items</span>
              <span>{locationsLoading ? '--' : totalItems}</span>
            </div>
          </div>
        </div>

        <div className="box-management-main">
          {!selectedLocationId ? (
            <div className="box-management-placeholder">
              <MapPin size={48} />
              <h3>Select a Location</h3>
              <p>Choose a location from the sidebar to view its containers and items.</p>
            </div>
          ) : locationLoading ? (
            <div className="box-management-loading">Loading location details...</div>
          ) : selectedLocation ? (
            <div className="box-management-detail">
              <div className="box-management-detail-header">
                <h2>{selectedLocation.name}</h2>
                <span className="location-type-badge">{selectedLocation.location_type_display}</span>
              </div>
              {selectedLocation.description && (
                <p className="box-management-detail-description">{selectedLocation.description}</p>
              )}
              
              <h3 className="box-management-section-title">
                Boxes ({selectedLocation.boxes?.length || 0})
              </h3>
              
              {selectedLocation.boxes?.length === 0 ? (
                <div className="box-management-empty-boxes">
                  <Package size={32} />
                  <p>No boxes in this location</p>
                </div>
              ) : (
                <div className="box-management-boxes-grid">
                  {selectedLocation.boxes?.map((box) => (
                    <div 
                      key={box.id} 
                      className={`box-card ${selectedBoxId === box.id ? 'active' : ''}`}
                      onClick={() => handleBoxClick(box.id)}
                    >
                      <div className="box-card-header">
                        <Package size={20} />
                        <span className="box-card-code">{box.box_code}</span>
                      </div>
                      {box.label && <p className="box-card-label">{box.label}</p>}
                      {box.description && <p className="box-card-description">{box.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Box Details */}
              {selectedBoxId && (
                <div className="box-management-box-detail">
                  {boxLoading ? (
                    <div className="box-management-loading">Loading box details...</div>
                  ) : selectedBox ? (
                    <>
                      <h3 className="box-management-section-title">
                        Items in {selectedBox.box_code} ({selectedBox.items?.length || 0})
                      </h3>
                      {selectedBox.items?.length === 0 ? (
                        <p className="box-management-empty-items">No items in this box</p>
                      ) : (
                        <table className="box-management-items-table">
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
                            {selectedBox.items?.map((item) => (
                              <tr key={item.id}>
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
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="box-management-modal-overlay" onClick={handleCloseModal}>
          <div className="box-management-modal" onClick={(e) => e.stopPropagation()}>
            <div className="box-management-modal-header">
              <h2>Add New Location</h2>
              <button className="box-management-modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <div className="box-management-modal-body">
              {createError && (
                <div className="box-management-modal-error">{createError}</div>
              )}
              <div className="box-management-form-group">
                <label htmlFor="location-name">Name *</label>
                <input
                  id="location-name"
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g., Shelf A1, Floor - Main Exhibit"
                  disabled={creatingLocation}
                />
              </div>
              <div className="box-management-form-group">
                <label htmlFor="location-type">Type *</label>
                <select
                  id="location-type"
                  value={newLocationType}
                  onChange={(e) => setNewLocationType(e.target.value as CreateLocationData['location_type'])}
                  disabled={creatingLocation}
                >
                  <option value="FLOOR">Floor</option>
                  <option value="STORAGE">Storage</option>
                  <option value="EVENT">Event</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="box-management-form-group">
                <label htmlFor="location-description">Description</label>
                <textarea
                  id="location-description"
                  value={newLocationDescription}
                  onChange={(e) => setNewLocationDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  disabled={creatingLocation}
                />
              </div>
            </div>
            <div className="box-management-modal-footer">
              <button 
                className="box-management-modal-cancel" 
                onClick={handleCloseModal}
                disabled={creatingLocation}
              >
                Cancel
              </button>
              <button 
                className="box-management-modal-submit" 
                onClick={handleAddLocation}
                disabled={creatingLocation || !newLocationName.trim()}
              >
                {creatingLocation ? 'Creating...' : 'Create Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoxManagementPage;
