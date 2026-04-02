import React, { useState, useEffect, useCallback } from 'react';
import { AddItemModal, EditItemModal, DeleteItemDialog, ExportModal } from '../../components/items';
import { itemsApi } from '../../api/items.api';
import type { AdminCollectionItem, ItemType, ItemStatus } from '../../lib/types';
import { Link } from 'react-router-dom';
import { Eye, Edit2, ChevronDown, ChevronRight, MapPin, Check, AlertTriangle } from 'lucide-react';
import Button from '../../components/common/Button';
import './AdminCataloguePage.css';

interface InventoryItem {
  id: number;
  item_code: string;
  title: string;
  platform: string;
  description: string;
  item_type: ItemType;
  working_condition: boolean;
  status: ItemStatus;

  location_type: 'FLOOR' | 'STORAGE' | 'EVENT' | 'OTHER';
  location_name: string;
  box_code: string;
  is_verified: boolean;
}

const mapApiToInventoryItem = (item: AdminCollectionItem): InventoryItem => ({
  id: item.id,
  item_code: item.item_code ?? '',
  title: item.title ?? '',
  platform: item.platform ?? '',
  description: item.description ?? '',
  item_type: item.item_type ?? 'SOFTWARE',
  working_condition: item.working_condition ?? false,
  status: item.status ?? 'AVAILABLE',

  location_type: item.current_location?.location_type ?? 'OTHER',
  location_name: item.current_location?.name ?? 'Unknown',
  box_code: item.box ? String(item.box) : '--',
  is_verified: item.is_verified !== false,
});

const getLocationLabel = (locationType: InventoryItem['location_type'], locationName: string) => {
  const typeLabels: Record<InventoryItem['location_type'], string> = {
    FLOOR: 'Exhibit',
    STORAGE: 'In Storage',
    EVENT: 'Event',
    OTHER: 'Other',
  };

  const typeLabel = typeLabels[locationType];

  if (locationType === 'FLOOR' && locationName) {
    return `Exhibit - ${locationName.replace('Floor - ', '').replace('Exhibit - ', '')}`;
  }
  return typeLabel;
};

const getStatusLabel = (status?: ItemStatus) => {
  const labels: Record<ItemStatus, string> = {
    AVAILABLE: 'Available',
    IN_TRANSIT: 'In Transit',
    CHECKED_OUT: 'Checked Out',
    MAINTENANCE: 'Maintenance',
  };
  return status ? labels[status] : 'Unknown';
};

const getTypeLabel = (itemType?: ItemType) => {
  const labels: Record<ItemType, string> = {
    SOFTWARE: 'Software',
    HARDWARE: 'Hardware',
    NON_ELECTRONIC: 'Non-Electronic',
  };
  return itemType ? labels[itemType] : 'Unknown';
};

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'HARDWARE', label: 'Hardware' },
  { value: 'NON_ELECTRONIC', label: 'Non-Electronic' },
] as const;

const locationOptions = [
  { value: '', label: 'All Locations' },
  { value: 'FLOOR', label: 'On Floor' },
  { value: 'STORAGE', label: 'In Storage' },
  { value: 'EVENT', label: 'Event' },
] as const;

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'CHECKED_OUT', label: 'Checked Out' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
] as const;

type MobileFilterGroupProps = {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
};

const MobileFilterGroup: React.FC<MobileFilterGroupProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  return (
    <div className="catalogue-mobile-filter-group">
      <div className="catalogue-mobile-filter-label">{label}</div>
      <div className="catalogue-mobile-filter-options">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value || 'all'}
              type="button"
              className={`catalogue-mobile-filter-option ${isActive ? 'active' : ''}`}
              onClick={() => onChange(option.value)}
            >
              <span>{option.label}</span>
              {isActive && <Check size={14} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const AdminCataloguePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<AdminCollectionItem[]>([]);
  const inventoryItems = items.map((item) => ({
    raw: item,
    display: mapApiToInventoryItem(item),
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AdminCollectionItem | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  const [typeFilter, setTypeFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch items from API
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiItems = await itemsApi.getAll({ search: debouncedSearch || undefined });
      setItems(apiItems || []);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('Failed to load items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddSuccess = () => {
    fetchItems();
  };

  const handleEditClick = (item: AdminCollectionItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };
  const handleEditSuccess = () => {
    fetchItems();
  };

  const handleMoveClick = (item: AdminCollectionItem) => {
    console.log('Move item:', item.title);
  };

  const handleDeleteConfirm = () => {
    // Mock delete removes local state (will replace with call once Issue #30 is done)
    if (selectedItem) {
      setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
    }
    setSelectedItem(null);
  };

  // Stats from all items (not filtered)
  const stats = {
    onFloor: inventoryItems.filter(({ display }) => display.location_type === 'FLOOR').length,
    inStorage: inventoryItems.filter(({ display }) => display.location_type === 'STORAGE').length,
    checkedOut: inventoryItems.filter(({ display }) => display.status === 'CHECKED_OUT').length,
    total: inventoryItems.length,
  };

  const filteredItems = inventoryItems.filter(({ display }) => {
    if (typeFilter && display.item_type !== typeFilter) return false;
    if (locationFilter && display.location_type !== locationFilter) return false;
    if (statusFilter && display.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="catalogue-layout">
      {/* Header */}
      <div className="catalogue-header">
        <div className="catalogue-header-left">
          <h1>Collection Catalogue</h1>
          <p className="catalogue-header-subtitle">Search, filter, and manage items</p>
        </div>

        <h1 className="catalogue-header-mobile">Search Items</h1>

        <Button
          hideMobile={true}
          variant="primary"
          size="md"
          icon="plus"
          onClick={() => setIsAddModalOpen(true)}
        >
          Add New Item
        </Button>
      </div>

      {/* Main Content */}
      <div className="catalogue-content">
        
        {/* Stats Bar */}
        <div className="catalogue-stats-bar">
          <div className="catalogue-stat-item">
            <span className="label">On Floor:</span>
            <span className="value">{stats.onFloor.toLocaleString()}</span>
          </div>
          <div className="catalogue-stat-item">
            <span className="label">In Storage:</span>
            <span className="value">{stats.inStorage.toLocaleString()}</span>
          </div>
          <div className="catalogue-stat-item">
            <span className="label">Checked Out:</span>
            <span className="value">{stats.checkedOut.toLocaleString()}</span>
          </div>
          <div className="catalogue-stat-item">
            <span className="label">Total Items:</span>
            <span className="value">{stats.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="catalogue-filters-desktop">
          <input
            type="text"
            className="catalogue-search"
            placeholder="Search by Title, MADE ID, or Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="catalogue-filter-dropdown">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="catalogue-filter-select"
            >
              {typeOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>))}</select>
            <ChevronDown size={14} className="dropdown-icon" />
          </div>
          <div className="catalogue-filter-dropdown">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="catalogue-filter-select"
            >
              {locationOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>))}
            </select>
            <ChevronDown size={14} className="dropdown-icon" />
          </div>
          <div className="catalogue-filter-dropdown">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="catalogue-filter-select"
            >
              {statusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>))}
            </select>
            <ChevronDown size={14} className="dropdown-icon" />
          </div>
          <Button className="catalogue-export-mobile-hide" variant="outline-black" size="sm" icon="download" onClick={() => setIsExportModalOpen(true)}>
            Export CSV
          </Button>
        </div>

        <div className="catalogue-filters-mobile">
          <input
            type="text"
            className="catalogue-search"
            placeholder="Search by Title, MADE ID, or Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="catalogue-filters-wrapper">
            <button
              type="button"
              className="catalogue-filters-button"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              Filters
              <ChevronDown
                size={14}
                className={`filters-icon ${showFilters ? 'open' : ''}`}
              />
            </button>

            {showFilters && (
              <div className="catalogue-filters-panel">
                <MobileFilterGroup
                  label="Type"
                  value={typeFilter}
                  options={typeOptions}
                  onChange={setTypeFilter}
                />

                <MobileFilterGroup
                  label="Location"
                  value={locationFilter}
                  options={locationOptions}
                  onChange={setLocationFilter}
                />

                <MobileFilterGroup
                  label="Status"
                  value={statusFilter}
                  options={statusOptions}
                  onChange={setStatusFilter}
                />

                <button
                  type="button"
                  className="catalogue-clear-filters"
                  onClick={() => {
                    setTypeFilter('');
                    setLocationFilter('');
                    setStatusFilter('');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="catalogue-item-count">
          Showing {filteredItems.length} of {stats.total.toLocaleString()} items
        </div>

        {/* Loading State */}
        {isLoading && <div className="catalogue-loading">Loading items...</div>}

        {/* Error State */}
        {error && (
          <div className="catalogue-error">
            {error}
            <button onClick={fetchItems}>Retry</button>
          </div>
        )}

        {/* Inventory Table */}
        {!isLoading && !error && filteredItems.length > 0 && (
          <table className="catalogue-table">
            <thead>
              <tr>
                <th>Game Title</th>
                <th>MADE ID</th>
                <th>System</th>
                <th>Type</th>
                <th>Box ID</th>
                <th>Location</th>
                <th>Working Condition</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(({ raw, display }) => (
                <tr key={raw.id}>
                  <td>
                    <strong>{display.title}</strong>
                  </td>
                  <td>{display.item_code}</td>
                  <td>{display.platform}</td>
                  <td>{getTypeLabel(display.item_type)}</td>
                  <td>{display.box_code}</td>
                  <td>
                    <span className={`location-badge ${display.location_type.toLowerCase()}`}>
                      {getLocationLabel(display.location_type, display.location_name)}
                    </span>
                  </td>
                  <td className={display.working_condition ? 'condition-yes' : 'condition-no'}>
                    {display.working_condition ? 'Yes' : 'No'}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${display.status.toLowerCase().replace('_', '-')}`}
                    >
                      {display.status ? getStatusLabel(display.status) : 'Unknown'}
                    </span>
                    {!display.is_verified && (
                      <span className="status-badge unverified" title="Location not verified">
                        <AlertTriangle size={12} /> Unverified
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="catalogue-actions">
                      <Link
                        to={`/admin/catalogue/${raw.id}`}
                        className="catalogue-action-btn"
                        title="View"
                      >
                        <Eye size={14} />
                      </Link>
                      <button
                        className="catalogue-action-btn"
                        onClick={() => handleEditClick(raw)}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="catalogue-action-btn catalogue-move-btn"
                        onClick={() => handleMoveClick(raw)}
                      >
                        Move
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && !error && filteredItems.length > 0 && (
          <div className="catalogue-mobile-list">
            {filteredItems.map(({ raw, display }) => (
              <Link
                key={raw.id}
                to={`/admin/catalogue/${raw.id}`}
                className="catalogue-mobile-card"
              >
                <div className="catalogue-mobile-card-top">
                  <div className="catalogue-mobile-card-text">
                    <h3 className="catalogue-mobile-card-title">{display.title}</h3>
                    <p className="catalogue-mobile-card-id">{display.item_code}</p>
                  </div>

                  <ChevronRight size={20} className="catalogue-mobile-card-chevron" />
                </div>

                <div className="catalogue-mobile-card-meta">
                  <span className="catalogue-mobile-type-pill">
                    {getTypeLabel(display.item_type)}
                  </span>
                  {!display.is_verified && (
                    <span className="status-badge unverified" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                      <AlertTriangle size={10} /> Unverified
                    </span>
                  )}

                  <span className="catalogue-mobile-location">
                    <MapPin size={16} />
                    {display.box_code !== '--'
                      ? `Box ${display.box_code}`
                      : getLocationLabel(display.location_type, display.location_name)}
                  </span>
                </div>

                <div className="catalogue-mobile-divider" />

                <div className="catalogue-mobile-card-bottom">
                  <span className="catalogue-mobile-works-label">Works?</span>
                  <span
                    className={`catalogue-mobile-works-value ${
                      display.working_condition ? 'yes' : 'unknown'
                    }`}
                  >
                    {display.working_condition ? 'Yes' : 'No'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && !error && filteredItems.length === 0 && (
          <div className="catalogue-empty-state">
            <p>No items found. Click add item button to add first item.</p>
          </div>
        )}
      </div>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={handleEditSuccess}
        item={selectedItem}
      />

      <DeleteItemDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemTitle={selectedItem?.title || ''}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default AdminCataloguePage;
