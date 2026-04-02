import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Archive, MapPin, Package, ChevronRight, ArrowRightLeft, Search, ChevronDown, Check, ShieldCheck } from 'lucide-react';
import { useLocations, useLocationDetail, useCreateLocation } from '../../actions/useLocations';
import { useBoxes, useBoxDetail, useCreateBox } from '../../actions/useBoxes';
import { useBoxRequests } from '../../actions/useRequests';
import type { CreateLocationData } from '../../api/locations.api';
import type { BoxDetail, Box } from '../../api/boxes.api';
import type { BoxMovementRequest } from '../../lib/types';
import { boxesApi } from '../../api/boxes.api';
import { boxRequestsApi } from '../../api/requests.api';
import Button from '../../components/common/Button';
import SortableHeader from '../../components/common/SortableHeader';
import { useSort } from '../../hooks/useSort';
import Modal from '../../components/common/Modal';
import { AddItemModal } from '../../components/items';
import { useAuth } from '../../contexts/AuthContext.shared';
import './BoxManagementPage.css';

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: unknown } | undefined;
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
  }

  return error instanceof Error ? error.message : fallback;
}

type BoxTransitStatus = 'available' | 'in_transit' | 'arrived';

const BoxManagementPage: React.FC = () => {
  const { isJuniorVolunteer, isAdmin, isSeniorVolunteer } = useAuth();
  const canApprove = isAdmin || isSeniorVolunteer;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedLocationId = searchParams.get('loc') ? Number(searchParams.get('loc')) : null;
  const selectedBoxId = searchParams.get('box') ? Number(searchParams.get('box')) : null;
  const activeTab = (searchParams.get('tab') || 'list') as 'list' | 'containers';
  const expandedBoxIdFromUrl = searchParams.get('expanded') ? Number(searchParams.get('expanded')) : null;

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSelectedLocationId = useCallback((id: number | null) => {
    updateParams({ loc: id !== null ? String(id) : null, box: null });
  }, [updateParams]);
  const setSelectedBoxId = useCallback((id: number | null) => {
    updateParams({ box: id !== null ? String(id) : null });
  }, [updateParams]);
  const setActiveTab = useCallback((tab: string) => {
    updateParams({ tab: tab === 'list' ? null : tab });
  }, [updateParams]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState<CreateLocationData['location_type']>('STORAGE');
  const [newLocationDescription, setNewLocationDescription] = useState('');

  // All Containers tab state
  const containerSearch = searchParams.get('q') || '';
  const setContainerSearch = useCallback((v: string) => {
    updateParams({ q: v || null });
  }, [updateParams]);
  const expandedBoxId = expandedBoxIdFromUrl;
  const setExpandedBoxId = useCallback((id: number | null) => {
    updateParams({ expanded: id !== null ? String(id) : null });
  }, [updateParams]);
  const [expandedBoxDetail, setExpandedBoxDetail] = useState<BoxDetail | null>(null);
  const [expandedBoxLoading, setExpandedBoxLoading] = useState(false);

  // Add Item modal state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemBoxId, setAddItemBoxId] = useState<number | undefined>(undefined);

  // Move Box modal state
  const [moveBoxSuccessMessage, setMoveBoxSuccessMessage] = useState<string | null>(null);
  const [showMoveBoxModal, setShowMoveBoxModal] = useState(false);
  const [moveBoxId, setMoveBoxId] = useState<number | null>(null);
  const [moveBoxCode, setMoveBoxCode] = useState('');
  const [moveBoxFromLocationId, setMoveBoxFromLocationId] = useState<number | null>(null);
  const [moveBoxDestinationId, setMoveBoxDestinationId] = useState<number | ''>('');
  const [moveBoxComment, setMoveBoxComment] = useState('');
  const [moveBoxError, setMoveBoxError] = useState<string | null>(null);
  const [movingBox, setMovingBox] = useState(false);

  const { locations, loading: locationsLoading, refetch: refetchLocations } = useLocations();
  const { location: selectedLocation, loading: locationLoading, refetch: refetchSelectedLocation } = useLocationDetail(selectedLocationId);
  const { box: selectedBox, loading: boxLoading, refetch: refetchSelectedBox } = useBoxDetail(selectedBoxId);
  const { boxes: allBoxes, loading: boxesLoading, refetch: refetchAllBoxes } = useBoxes();
  const { createLocation, creating: creatingLocation, error: createError } = useCreateLocation();
  const { createBox, creating: creatingBox, error: createBoxError } = useCreateBox();
  const { requests: boxMoveRequests, completeArrival: markBoxArrived, verify: verifyBox } = useBoxRequests();
  const [transitProcessingId, setTransitProcessingId] = useState<number | null>(null);

  // Map boxId -> active movement request
  const activeBoxRequests = useMemo(() => {
    const map = new Map<number, BoxMovementRequest>();
    for (const req of boxMoveRequests) {
      if (req.status === 'APPROVED' || req.status === 'COMPLETED_UNVERIFIED') {
        map.set(req.box, req);
      }
    }
    return map;
  }, [boxMoveRequests]);

  const getBoxTransitStatus = useCallback((boxId: number): BoxTransitStatus => {
    const req = activeBoxRequests.get(boxId);
    if (!req) return 'available';
    if (req.items_status === 'IN_TRANSIT') return 'in_transit';
    if (!req.items_verified) return 'arrived';
    return 'available';
  }, [activeBoxRequests]);

  // Inbound boxes for a location (boxes moving TO this location)
  const getInboundBoxes = useCallback((locationId: number) => {
    return boxMoveRequests.filter(req =>
      req.to_location === locationId &&
      (req.status === 'APPROVED' || req.status === 'COMPLETED_UNVERIFIED')
    );
  }, [boxMoveRequests]);

  const handleMarkBoxArrived = async (requestId: number) => {
    setTransitProcessingId(requestId);
    try {
      await markBoxArrived(requestId);
      await Promise.all([refetchLocations(), refetchAllBoxes()]);
      if (selectedLocationId) refetchSelectedLocation();
    } catch (err) { console.error('Failed to mark arrived:', err); }
    finally { setTransitProcessingId(null); }
  };

  const handleVerifyBox = async (requestId: number) => {
    setTransitProcessingId(requestId);
    try {
      await verifyBox(requestId);
      await Promise.all([refetchLocations(), refetchAllBoxes()]);
      if (selectedLocationId) refetchSelectedLocation();
    } catch (err) { console.error('Failed to verify:', err); }
    finally { setTransitProcessingId(null); }
  };

  // Add Box modal state
  const [showAddBoxModal, setShowAddBoxModal] = useState(false);
  const [newBoxCode, setNewBoxCode] = useState('');
  const [newBoxLabel, setNewBoxLabel] = useState('');
  const [newBoxDescription, setNewBoxDescription] = useState('');
  const [newBoxLocationId, setNewBoxLocationId] = useState<number | ''>('');

  const handleAddBox = async () => {
    if (!newBoxCode.trim() || newBoxLocationId === '') return;
    try {
      await createBox({
        box_code: newBoxCode.trim(),
        label: newBoxLabel.trim() || undefined,
        description: newBoxDescription.trim() || undefined,
        location: newBoxLocationId as number,
      });
      setShowAddBoxModal(false);
      setNewBoxCode('');
      setNewBoxLabel('');
      setNewBoxDescription('');
      setNewBoxLocationId('');
      await Promise.all([refetchLocations(), refetchAllBoxes()]);
      if (selectedLocationId) refetchSelectedLocation();
    } catch {
      // Error handled by hook
    }
  };

  const openAddBoxModal = (preselectedLocationId?: number) => {
    setNewBoxCode('');
    setNewBoxLabel('');
    setNewBoxDescription('');
    setNewBoxLocationId(preselectedLocationId ?? '');
    setShowAddBoxModal(true);
  };

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

  const locationMap = useMemo(() => {
    const map = new Map<number, string>();
    if (Array.isArray(locations)) {
      locations.forEach(loc => map.set(loc.id, loc.name));
    }
    return map;
  }, [locations]);

  const filteredBoxes = useMemo(() => {
    if (!Array.isArray(allBoxes)) return [];
    const query = containerSearch.toLowerCase().trim();
    if (!query) return allBoxes;
    return allBoxes.filter(box => {
      const codeMatch = box.box_code.toLowerCase().includes(query);
      const labelMatch = box.label?.toLowerCase().includes(query);
      const locationName = locationMap.get(box.location) || '';
      const locationMatch = locationName.toLowerCase().includes(query);
      return codeMatch || labelMatch || locationMatch;
    });
  }, [allBoxes, containerSearch, locationMap]);

  type BoxSortKey = 'box_code' | 'label' | 'location';

  const getBoxValue = useCallback((box: typeof filteredBoxes[number], key: BoxSortKey) => {
    switch (key) {
      case 'box_code': return box.box_code;
      case 'label': return box.label || '';
      case 'location': return locationMap.get(box.location) || '';
    }
  }, [locationMap]);

  const { sortedItems: sortedBoxes, sortConfig: boxSortConfig, requestSort: requestBoxSort } = useSort(filteredBoxes, getBoxValue);

  const handleToggleExpandBox = async (boxId: number) => {
    if (expandedBoxId === boxId) {
      setExpandedBoxId(null);
      setExpandedBoxDetail(null);
      return;
    }
    setExpandedBoxId(boxId);
    setExpandedBoxDetail(null);
    setExpandedBoxLoading(true);
    try {
      const detail = await boxesApi.getById(boxId);
      setExpandedBoxDetail(detail);
    } catch {
      // silently fail, user can retry
    } finally {
      setExpandedBoxLoading(false);
    }
  };

  // Auto-load expanded box detail when restored from URL
  useEffect(() => {
    if (expandedBoxId && !expandedBoxDetail && !expandedBoxLoading) {
      setExpandedBoxLoading(true);
      boxesApi.getById(expandedBoxId)
        .then(setExpandedBoxDetail)
        .catch(() => {})
        .finally(() => setExpandedBoxLoading(false));
    }
  }, [expandedBoxId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocationClick = (locationId: number) => {
    setSelectedLocationId(locationId);
  };

  const handleBoxClick = (boxId: number) => {
    setSelectedBoxId(boxId);
  };

  const handleOpenMoveBoxModal = (boxId: number, boxCode: string, fromLocationId: number) => {
    setMoveBoxId(boxId);
    setMoveBoxCode(boxCode);
    setMoveBoxFromLocationId(fromLocationId);
    setMoveBoxDestinationId('');
    setMoveBoxComment('');
    setMoveBoxError(null);
    setShowMoveBoxModal(true);
  };

  const handleCloseMoveBoxModal = () => {
    setShowMoveBoxModal(false);
    setMoveBoxId(null);
    setMoveBoxCode('');
    setMoveBoxFromLocationId(null);
    setMoveBoxDestinationId('');
    setMoveBoxComment('');
    setMoveBoxError(null);
  };

  const handleSubmitMoveBox = async () => {
    if (!moveBoxId || moveBoxDestinationId === '' || !moveBoxFromLocationId) return;

    setMovingBox(true);
    setMoveBoxError(null);

    try {
      const response = await boxRequestsApi.create({
        box: moveBoxId,
        from_location: moveBoxFromLocationId,
        to_location: moveBoxDestinationId,
      });
      handleCloseMoveBoxModal();
      if (response.status === 'COMPLETED_UNVERIFIED') {
        setMoveBoxSuccessMessage('Box moved successfully.');
      } else {
        setMoveBoxSuccessMessage('Movement request submitted for approval.');
      }
      setTimeout(() => setMoveBoxSuccessMessage(null), 5000);
      await Promise.all([refetchLocations(), refetchSelectedLocation(), refetchAllBoxes()]);
    } catch (err) {
      setMoveBoxError(getApiErrorMessage(err, 'Failed to create box movement request.'));
    } finally {
      setMovingBox(false);
    }
  };

  return (
    <div className="box-management-layout">
      <div className="box-management-header">
        <div className="box-management-header-left">
          <h1>Box Management</h1>
          <p className="box-management-header-subtitle">Track items, boxes, and shelf locations across the museum</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline-black" size="md" icon="plus" onClick={() => openAddBoxModal()}>
            Add Box
          </Button>
          <Button variant="primary" size="md" icon="plus" onClick={() => setShowAddModal(true)}>
            Add Location
          </Button>
        </div>
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

      {activeTab === 'containers' ? (
        <div className="all-containers-view">
          {moveBoxSuccessMessage && (
            <div className="box-management-inline-success">{moveBoxSuccessMessage}</div>
          )}
          <div className="all-containers-search-row">
            <div className="all-containers-search-wrapper">
              <Search size={16} className="all-containers-search-icon" />
              <input
                type="text"
                className="all-containers-search"
                placeholder="Search by box code, label, or location..."
                value={containerSearch}
                onChange={(e) => setContainerSearch(e.target.value)}
              />
            </div>
            <span className="all-containers-count">
              {filteredBoxes.length} container{filteredBoxes.length !== 1 ? 's' : ''}
            </span>
          </div>

          {boxesLoading ? (
            <div className="box-management-loading-dark">Loading containers...</div>
          ) : filteredBoxes.length === 0 ? (
            <div className="all-containers-empty">
              <Package size={32} />
              <p>{containerSearch ? 'No containers match your search.' : 'No containers found.'}</p>
            </div>
          ) : (
            <table className="all-containers-table">
              <thead>
                <tr>
                  <th></th>
                  <SortableHeader label="Box Code" sortKey="box_code" sortConfig={boxSortConfig} onSort={requestBoxSort} />
                  <SortableHeader label="Label" sortKey="label" sortConfig={boxSortConfig} onSort={requestBoxSort} />
                  <SortableHeader label="Location" sortKey="location" sortConfig={boxSortConfig} onSort={requestBoxSort} />
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedBoxes.map((box) => {
                  const transitStatus = getBoxTransitStatus(box.id);
                  const activeReq = activeBoxRequests.get(box.id);
                  return (
                  <React.Fragment key={box.id}>
                    <tr
                      className={`all-containers-row ${expandedBoxId === box.id ? 'expanded' : ''}`}
                      onClick={() => handleToggleExpandBox(box.id)}
                    >
                      <td className="all-containers-expand-cell">
                        <ChevronDown
                          size={16}
                          className={`all-containers-expand-icon ${expandedBoxId === box.id ? 'rotated' : ''}`}
                        />
                      </td>
                      <td><strong>{box.box_code}</strong></td>
                      <td>{box.label || '--'}</td>
                      <td>
                        {transitStatus === 'in_transit' && activeReq ? (
                          <span>{locationMap.get(activeReq.from_location) || '?'} → {locationMap.get(activeReq.to_location) || '?'}</span>
                        ) : transitStatus === 'arrived' && activeReq ? (
                          <span>{locationMap.get(activeReq.to_location) || '?'} <span className="box-transit-label">(Inbound)</span></span>
                        ) : (
                          locationMap.get(box.location) || 'Unknown'
                        )}
                      </td>
                      <td>
                        {transitStatus === 'in_transit' && <span className="box-status-badge in-transit">In Transit</span>}
                        {transitStatus === 'arrived' && <span className="box-status-badge arrived">Arrived</span>}
                        {transitStatus === 'available' && <span className="box-status-badge available">Available</span>}
                      </td>
                      <td>
                        <div className="box-actions-row">
                          {transitStatus === 'in_transit' && activeReq && (
                            <Button variant="outline-black" size="xs" onClick={(e) => { e.stopPropagation(); handleMarkBoxArrived(activeReq.id); }} disabled={transitProcessingId === activeReq.id} title="Mark Arrived">
                              <Check size={14} />
                            </Button>
                          )}
                          {transitStatus === 'arrived' && activeReq && canApprove && (
                            <Button variant="outline-black" size="xs" onClick={(e) => { e.stopPropagation(); handleVerifyBox(activeReq.id); }} disabled={transitProcessingId === activeReq.id} title="Verify">
                              <ShieldCheck size={14} />
                            </Button>
                          )}
                          {transitStatus === 'available' && (
                            <Button variant="outline-black" size="xs" onClick={(e) => { e.stopPropagation(); handleOpenMoveBoxModal(box.id, box.box_code, box.location); }} title="Move Box">
                              <ArrowRightLeft size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedBoxId === box.id && (
                      <tr className="all-containers-detail-row">
                        <td colSpan={6}>
                          <div className="all-containers-detail-content">
                            {expandedBoxLoading ? (
                              <p className="all-containers-detail-loading">Loading items...</p>
                            ) : expandedBoxDetail ? (
                              <>
                              <div className="box-management-detail-header">
                                <span className="add-item-section-title">Items ({expandedBoxDetail.items?.length || 0})</span>
                                <Button variant="outline-black" size="xs" icon="plus" onClick={() => { setAddItemBoxId(expandedBoxId!); setShowAddItemModal(true); }}>
                                  Add Item
                                </Button>
                              </div>
                              {expandedBoxDetail.items?.length === 0 ? (
                                <p className="all-containers-detail-empty">No items in this box</p>
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
                                    {expandedBoxDetail.items?.map((item) => (
                                      <tr key={item.id} className="item-row-clickable" onClick={() => navigate(`/admin/catalogue/${item.id}`)}>
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
                            ) : (
                              <p className="all-containers-detail-empty">Failed to load items.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
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
            {moveBoxSuccessMessage && (
              <div className="box-management-inline-success">{moveBoxSuccessMessage}</div>
            )}
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

                <div className="box-management-detail-header">
                  <h3 className="box-management-section-title" style={{ margin: 0 }}>
                    Boxes ({selectedLocation.boxes?.length || 0})
                  </h3>
                  <Button variant="outline-black" size="xs" icon="plus" onClick={() => openAddBoxModal(selectedLocation.id)}>
                    Add Box
                  </Button>
                </div>

                {(() => {
                  const inboundReqs = selectedLocationId ? getInboundBoxes(selectedLocationId) : [];
                  const locationBoxes = selectedLocation.boxes || [];
                  const hasBoxes = locationBoxes.length > 0 || inboundReqs.length > 0;

                  if (!hasBoxes) return (
                    <div className="box-management-empty-boxes">
                      <Package size={32} />
                      <p>No boxes in this location</p>
                    </div>
                  );

                  return (
                    <div className="box-management-boxes-grid">
                      {locationBoxes.map((box) => {
                        const transitStatus = getBoxTransitStatus(box.id);
                        const activeReq = activeBoxRequests.get(box.id);
                        const isOutbound = transitStatus !== 'available' && activeReq?.from_location === selectedLocationId;
                        return (
                          <div
                            key={box.id}
                            className={`box-card ${selectedBoxId === box.id ? 'active' : ''} ${transitStatus !== 'available' ? 'transit' : ''}`}
                            onClick={() => handleBoxClick(box.id)}
                          >
                            <div className="box-card-header">
                              <Package size={20} />
                              <span className="box-card-code">{box.box_code}</span>
                              {transitStatus === 'available' && (
                                <Button variant="outline-black" size="xs" onClick={(e) => { e.stopPropagation(); handleOpenMoveBoxModal(box.id, box.box_code, selectedLocation!.id); }} title="Move Box" className="box-card-action">
                                  <ArrowRightLeft size={14} />
                                </Button>
                              )}
                              {transitStatus === 'in_transit' && activeReq && (
                                <Button variant="outline-black" size="xs" onClick={(e) => { e.stopPropagation(); handleMarkBoxArrived(activeReq.id); }} disabled={transitProcessingId === activeReq.id} title="Mark Arrived" className="box-card-action">
                                  <Check size={14} />
                                </Button>
                              )}
                              {transitStatus === 'arrived' && activeReq && canApprove && (
                                <Button variant="outline-black" size="xs" onClick={(e) => { e.stopPropagation(); handleVerifyBox(activeReq.id); }} disabled={transitProcessingId === activeReq.id} title="Verify" className="box-card-action">
                                  <ShieldCheck size={14} />
                                </Button>
                              )}
                            </div>
                            {box.label && <p className="box-card-label">{box.label}</p>}
                            {isOutbound && activeReq && (
                              <span className="box-status-badge in-transit">Outbound → {locationMap.get(activeReq.to_location) || '?'}</span>
                            )}
                            {transitStatus === 'arrived' && !isOutbound && (
                              <span className="box-status-badge arrived">Arrived — Verify</span>
                            )}
                          </div>
                        );
                      })}
                      {inboundReqs.map((req) => (
                        <div key={`inbound-${req.id}`} className="box-card transit">
                          <div className="box-card-header">
                            <Package size={20} />
                            <span className="box-card-code">{req.box_code}</span>
                            {req.items_status === 'IN_TRANSIT' && (
                              <Button variant="outline-black" size="xs" onClick={() => handleMarkBoxArrived(req.id)} disabled={transitProcessingId === req.id} title="Mark Arrived" className="box-card-action">
                                <Check size={14} />
                              </Button>
                            )}
                            {req.items_status !== 'IN_TRANSIT' && !req.items_verified && canApprove && (
                              <Button variant="outline-black" size="xs" onClick={() => handleVerifyBox(req.id)} disabled={transitProcessingId === req.id} title="Verify" className="box-card-action">
                                <ShieldCheck size={14} />
                              </Button>
                            )}
                          </div>
                          <span className="box-status-badge in-transit">Inbound ← {locationMap.get(req.from_location) || '?'}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Box Details */}
                {selectedBoxId && (
                  <div className="box-management-box-detail">
                    {boxLoading ? (
                      <div className="box-management-loading">Loading box details...</div>
                    ) : selectedBox ? (
                      <>
                        <div className="box-management-detail-header">
                          <h3 className="box-management-section-title" style={{ margin: 0 }}>
                            Items in {selectedBox.box_code} ({selectedBox.items?.length || 0})
                          </h3>
                          <Button variant="outline-black" size="xs" icon="plus" onClick={() => { setAddItemBoxId(selectedBox.id); setShowAddItemModal(true); }}>
                            Add Item
                          </Button>
                        </div>
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
                                <tr key={item.id} className="item-row-clickable" onClick={() => navigate(`/admin/catalogue/${item.id}`)}>
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
      )}

      {/* Move Box Modal */}
      <Modal open={showMoveBoxModal} onClose={handleCloseMoveBoxModal} title={`Move Box: ${moveBoxCode}`}>
        <div className="modal-form">
          {moveBoxError && (
            <div className="add-item-error">{moveBoxError}</div>
          )}
          <div className="modal-field">
            <label>Current Location</label>
            <input
              type="text"
              value={locations.find(l => l.id === moveBoxFromLocationId)?.name || ''}
              disabled
            />
          </div>
          <div className="modal-field">
            <label htmlFor="move-box-destination">Destination Location <span className="required">*</span></label>
            <select
              id="move-box-destination"
              value={moveBoxDestinationId}
              onChange={(e) => setMoveBoxDestinationId(e.target.value ? Number(e.target.value) : '')}
              disabled={movingBox}
            >
              <option value="">Select destination...</option>
              {locations
                .filter((location) => location.id !== moveBoxFromLocationId)
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
            onClick={handleCloseMoveBoxModal}
            disabled={movingBox}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmitMoveBox}
            disabled={movingBox || moveBoxDestinationId === ''}
          >
            {movingBox ? (isJuniorVolunteer ? 'Submitting...' : 'Moving...') : (isJuniorVolunteer ? 'Submit Move Request' : 'Move Box')}
          </Button>
        </div>
      </Modal>

      {/* Add Location Modal */}
      <Modal open={showAddModal} onClose={handleCloseModal} title="Add New Location">
        <div className="modal-form">
          {createError && (
            <div className="add-item-error">{createError}</div>
          )}
          <div className="modal-field">
            <label htmlFor="location-name">Name <span className="required">*</span></label>
            <input
              id="location-name"
              type="text"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="e.g., Shelf A1, Floor - Main Exhibit"
              disabled={creatingLocation}
            />
          </div>
          <div className="modal-field">
            <label htmlFor="location-type">Type <span className="required">*</span></label>
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
          <div className="modal-field">
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
        <div className="modal-actions">
          <Button 
            variant="outline-gray" 
            size="md"
            onClick={handleCloseModal}
            disabled={creatingLocation}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            size="md"
            onClick={handleAddLocation}
            disabled={creatingLocation || !newLocationName.trim()}
          >
            {creatingLocation ? 'Creating...' : 'Create Location'}
          </Button>
        </div>
      </Modal>

      {/* Add Box Modal */}
      <Modal open={showAddBoxModal} onClose={() => setShowAddBoxModal(false)} title="Add New Box">
        <div className="modal-form">
          {createBoxError && (
            <div className="add-item-error">{createBoxError}</div>
          )}
          <div className="modal-field">
            <label htmlFor="box-code">Box Code <span className="required">*</span></label>
            <input
              id="box-code"
              type="text"
              value={newBoxCode}
              onChange={(e) => setNewBoxCode(e.target.value)}
              placeholder="e.g., BOX-001"
              disabled={creatingBox}
            />
          </div>
          <div className="modal-field">
            <label htmlFor="box-label">Label</label>
            <input
              id="box-label"
              type="text"
              value={newBoxLabel}
              onChange={(e) => setNewBoxLabel(e.target.value)}
              placeholder="Optional label"
              disabled={creatingBox}
            />
          </div>
          <div className="modal-field">
            <label htmlFor="box-location">Location <span className="required">*</span></label>
            <select
              id="box-location"
              value={newBoxLocationId}
              onChange={(e) => setNewBoxLocationId(e.target.value ? Number(e.target.value) : '')}
              disabled={creatingBox}
            >
              <option value="">Select location...</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.location_type_display})
                </option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label htmlFor="box-description">Description</label>
            <textarea
              id="box-description"
              value={newBoxDescription}
              onChange={(e) => setNewBoxDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              disabled={creatingBox}
            />
          </div>
        </div>
        <div className="modal-actions">
          <Button
            variant="outline-gray"
            size="md"
            onClick={() => setShowAddBoxModal(false)}
            disabled={creatingBox}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleAddBox}
            disabled={creatingBox || !newBoxCode.trim() || newBoxLocationId === ''}
          >
            {creatingBox ? 'Creating...' : 'Create Box'}
          </Button>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => { setShowAddItemModal(false); setAddItemBoxId(undefined); }}
        onSuccess={async () => {
          await Promise.all([refetchAllBoxes(), refetchLocations()]);
          if (selectedBoxId) refetchSelectedBox();
          if (expandedBoxId) {
            const detail = await boxesApi.getById(expandedBoxId);
            setExpandedBoxDetail(detail);
          }
        }}
        preselectedBox={addItemBoxId}
      />
    </div>
  );
};

export default BoxManagementPage;
