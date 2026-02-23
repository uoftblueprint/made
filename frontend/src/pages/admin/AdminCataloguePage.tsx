import React, { useState, useEffect, useCallback } from 'react';
import { AddItemModal, EditItemModal, DeleteItemDialog } from '../../components/items';
import { itemsApi } from '../../api/items.api';
import type { PublicCollectionItem } from '../../lib/types';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit2, Download, ChevronDown } from 'lucide-react';
import './AdminCataloguePage.css';

type ItemType = 'SOFTWARE' | 'HARDWARE' | 'NON_ELECTRONIC';
type Condition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
type Completeness = 'YES' | 'NO' | 'UNKNOWN';

interface InventoryItem {
    id: number;
    item_code: string;
    title: string;
    platform: string;
    description: string;
    item_type: ItemType;
    condition: Condition;
    is_complete: Completeness;
    is_functional: Completeness;
    date_of_entry: string;
    working_condition: boolean;
    status: 'AVAILABLE' | 'IN_TRANSIT' | 'CHECKED_OUT' | 'MAINTENANCE';
    location_type: 'FLOOR' | 'STORAGE' | 'EVENT' | 'OTHER';
    location_name: string;
    box_code: string;
    // Software fields
    creator_publisher: string;
    release_year: string;
    version_edition: string;
    media_type: string;
    // Hardware fields
    manufacturer: string;
    model_number: string;
    year_manufactured: string;
    serial_number: string;
    hardware_type: string;
    // Non-Electronic fields
    item_subtype: string;
    date_published: string;
    publisher: string;
    volume_number: string;
    isbn_catalogue_number: string;
}

const mapApiToInventoryItem = (item: PublicCollectionItem): InventoryItem => ({
    id: item.id,
    item_code: item.item_code,
    title: item.title,
    platform: item.platform || '',
    description: item.description || '',
    item_type: (item.item_type as ItemType) ?? 'SOFTWARE',
    condition: (item.condition as Condition) ?? 'GOOD',
    is_complete: (item.is_complete as Completeness) ?? 'UNKNOWN',
    is_functional: (item.is_functional as Completeness) ?? 'UNKNOWN',
    date_of_entry: item.date_of_entry || '',
    working_condition: item.working_condition ?? true,
    status: item.status ?? 'AVAILABLE',
    location_type: item.current_location?.location_type || 'OTHER',
    location_name: item.current_location?.name || 'Unknown',
    box_code: item.box_code || '--',
    creator_publisher: item.creator_publisher || '',
    release_year: item.release_year || '',
    version_edition: item.version_edition || '',
    media_type: item.media_type || '',
    manufacturer: item.manufacturer || '',
    model_number: item.model_number || '',
    year_manufactured: item.year_manufactured || '',
    serial_number: item.serial_number || '',
    hardware_type: item.hardware_type || '',
    item_subtype: item.item_subtype || '',
    date_published: item.date_published || '',
    publisher: item.publisher || '',
    volume_number: item.volume_number || '',
    isbn_catalogue_number: item.isbn_catalogue_number || '',
});

const getLocationLabel = (locationType: InventoryItem['location_type'], locationName: string) => {
    const typeLabels: Record<string, string> = {
        'FLOOR': 'Exhibit',
        'STORAGE': 'In Storage',
        'EVENT': 'Event',
        'OTHER': 'Other',
    };
    const typeLabel = typeLabels[locationType] || 'Unknown';
    if (locationType === 'FLOOR' && locationName) {
        return `Exhibit - ${locationName.replace('Floor - ', '').replace('Exhibit - ', '')}`;
    }
    return typeLabel;
};

const getStatusLabel = (status: InventoryItem['status']) => {
    const labels: Record<string, string> = {
        'AVAILABLE': 'Available',
        'IN_TRANSIT': 'In Transit',
        'CHECKED_OUT': 'Checked Out',
        'MAINTENANCE': 'Maintenance',
    };
    return labels[status] || status;
};

const getTypeLabel = (itemType: InventoryItem['item_type']) => {
    const labels: Record<ItemType, string> = {
        'SOFTWARE': 'Software',
        'HARDWARE': 'Hardware',
        'NON_ELECTRONIC': 'Non-Electronic',
    };
    return labels[itemType] || itemType;
};

const AdminCataloguePage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

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
            setItems(apiItems.map(mapApiToInventoryItem));
        } catch (err) {
            console.error('Failed to fetch items:', err);
            setError('Failed to load items. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch]);

    // Fetch when debounced search changes
    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleAddSuccess = () => {
        fetchItems();
    };

    const handleEditClick = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        fetchItems();
    };

    const handleMoveClick = (item: InventoryItem) => {
        console.log('Move item:', item.title);
    };

    const handleDeleteConfirm = () => {
        // Mock delete removes local state (will replace with call once Issue #30 is done)
        if (selectedItem) {
            setItems(items.filter(i => i.id !== selectedItem.id));
        }
        setSelectedItem(null);
    };

    // Stats from all items (not filtered)
    const stats = {
        onFloor: items.filter(i => i.location_type === 'FLOOR').length,
        inStorage: items.filter(i => i.location_type === 'STORAGE').length,
        checkedOut: items.filter(i => i.status === 'CHECKED_OUT').length,
        total: items.length,
    };

    // Filter states
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [locationFilter, setLocationFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Apply filters to items
    const filteredItems = items.filter(item => {
        if (typeFilter && item.item_type !== typeFilter) return false;
        if (locationFilter && item.location_type !== locationFilter) return false;
        if (statusFilter && item.status !== statusFilter) return false;
        return true;
    });

    // Export CSV handler
    const handleExportCSV = () => {
        const headers = ['Game Title', 'MADE ID', 'System', 'Type', 'Box ID', 'Location', 'Working Condition', 'Status'];
        const csvRows = [headers.join(',')];
        items.forEach(item => {
            const row = [
                `"${item.title}"`,
                item.item_code,
                item.platform,
                getTypeLabel(item.item_type),
                item.box_code,
                getLocationLabel(item.location_type, item.location_name),
                item.working_condition ? 'Yes' : 'No',
                getStatusLabel(item.status)
            ];
            csvRows.push(row.join(','));
        });
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'collection_catalogue.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="catalogue-layout">
            {/* Header */}
            <div className="catalogue-header">
                <div className="catalogue-header-left">
                    <h1>Collection Catalogue</h1>
                    <p className="catalogue-header-subtitle">Search, filter, and manage items</p>
                </div>
                <button
                    className="catalogue-add-btn"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <Plus size={16} />
                    Add New Item
                </button>
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
                <div className="catalogue-filters">
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
                            <option value="">All Types</option>
                            <option value="SOFTWARE">Software</option>
                            <option value="HARDWARE">Hardware</option>
                            <option value="NON_ELECTRONIC">Non-Electronic</option>
                        </select>
                        <ChevronDown size={14} className="dropdown-icon" />
                    </div>
                    <div className="catalogue-filter-dropdown">
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="catalogue-filter-select"
                        >
                            <option value="">Exhibit</option>
                            <option value="FLOOR">On Floor</option>
                            <option value="STORAGE">In Storage</option>
                            <option value="EVENT">Event</option>
                        </select>
                        <ChevronDown size={14} className="dropdown-icon" />
                    </div>
                    <div className="catalogue-filter-dropdown">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="catalogue-filter-select"
                        >
                            <option value="">All Status</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="IN_TRANSIT">In Transit</option>
                            <option value="CHECKED_OUT">Checked Out</option>
                            <option value="MAINTENANCE">Maintenance</option>
                        </select>
                        <ChevronDown size={14} className="dropdown-icon" />
                    </div>
                    <button className="catalogue-export-btn" onClick={handleExportCSV}>
                        <Download size={14} />
                        Export CSV
                    </button>
                </div>

                {/* Item Count */}
                <div className="catalogue-item-count">
                    Showing {filteredItems.length} of {stats.total.toLocaleString()} items
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="catalogue-loading">Loading items...</div>
                )}

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
                            {filteredItems.map((item) => (
                                <tr key={item.id}>
                                    <td><strong>{item.title}</strong></td>
                                    <td>{item.item_code}</td>
                                    <td>{item.platform}</td>
                                    <td>{getTypeLabel(item.item_type)}</td>
                                    <td>{item.box_code}</td>
                                    <td>
                                        <span className={`location-badge ${item.location_type.toLowerCase()}`}>
                                            {getLocationLabel(item.location_type, item.location_name)}
                                        </span>
                                    </td>
                                    <td className={item.working_condition ? 'condition-yes' : 'condition-no'}>
                                        {item.working_condition ? 'Yes' : 'No'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${item.status.toLowerCase().replace('_', '-')}`}>
                                            {getStatusLabel(item.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="catalogue-actions">
                                            <Link
                                                to={`/admin/catalogue/${item.id}`}
                                                className="catalogue-action-btn"
                                                title="View"
                                            >
                                                <Eye size={14} />
                                            </Link>
                                            <button
                                                className="catalogue-action-btn"
                                                onClick={() => handleEditClick(item)}
                                                title="Edit"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                className="catalogue-action-btn catalogue-move-btn"
                                                onClick={() => handleMoveClick(item)}
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

                {/* Empty State */}
                {!isLoading && !error && filteredItems.length === 0 && (
                    <div className="catalogue-empty-state">
                        <p>No items found. Click add item button to add first item.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
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
                item={selectedItem ? {
                    id: selectedItem.id,
                    item_code: selectedItem.item_code,
                    title: selectedItem.title,
                    item_type: selectedItem.item_type,
                    platform: selectedItem.platform,
                    description: selectedItem.description,
                    condition: selectedItem.condition,
                    is_complete: selectedItem.is_complete,
                    is_functional: selectedItem.is_functional,
                    date_of_entry: selectedItem.date_of_entry,
                    creator_publisher: selectedItem.creator_publisher,
                    release_year: selectedItem.release_year,
                    version_edition: selectedItem.version_edition,
                    media_type: selectedItem.media_type,
                    manufacturer: selectedItem.manufacturer,
                    model_number: selectedItem.model_number,
                    year_manufactured: selectedItem.year_manufactured,
                    serial_number: selectedItem.serial_number,
                    hardware_type: selectedItem.hardware_type,
                    item_subtype: selectedItem.item_subtype,
                    date_published: selectedItem.date_published,
                    publisher: selectedItem.publisher,
                    volume_number: selectedItem.volume_number,
                    isbn_catalogue_number: selectedItem.isbn_catalogue_number,
                } : null}
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
        </div>
    );
};

export default AdminCataloguePage;
