import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AddItemModal, EditItemModal, DeleteItemDialog } from '../../components/items';
import { itemsApi } from '../../api/items.api';
import type { PublicCollectionItem } from '../../lib/types';
import './AdminCataloguePage.css';

interface InventoryItem {
    id: number;
    item_code: string;
    title: string;
    category: string;
    description: string;
    location: 'on-floor' | 'in-storage' | 'checked-out';
    boxNumber: string;
    players: string;
}

const mapApiToInventoryItem = (item: PublicCollectionItem): InventoryItem => ({
    id: item.id,
    item_code: item.item_code,
    title: item.title,
    category: item.platform || 'Uncategorized',
    description: item.description || '',
    location: item.is_on_floor ? 'on-floor' : 'in-storage',
    boxNumber: item.location_name || 'Unknown',
    players: '--',
});

const getLocationLabel = (location: InventoryItem['location']) => {
    switch (location) {
        case 'on-floor': return 'On Floor';
        case 'in-storage': return 'In Storage';
        case 'checked-out': return 'Checked Out';
    }
};

const AdminCataloguePage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    // Fetch items from API
    const fetchItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const apiItems = await itemsApi.getAll({ search: searchQuery || undefined });
            setItems(apiItems.map(mapApiToInventoryItem));
        } catch (err) {
            console.error('Failed to fetch items:', err);
            setError('Failed to load items. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchItems();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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

    // Stats from current items
    const stats = {
        onFloor: items.filter(i => i.location === 'on-floor').length,
        inStorage: items.filter(i => i.location === 'in-storage').length,
        checkedOut: items.filter(i => i.location === 'checked-out').length,
        total: items.length,
    };

    return (
        <div className="catalogue-layout">
            {/* Header */}
            <div className="catalogue-header">
                <h1>MADE - Collection Catalogue</h1>
                <p className="catalogue-header-subtitle">Admin Interface for Collection Managers</p>
            </div>

            {/* Tab Navigation */}
            <div className="catalogue-tabs">
                <button className="catalogue-tab">Admin Process</button>
                <Link to="/admin" className="catalogue-tab">Dashboard</Link>
                <button className="catalogue-tab active">Catalogue</button>
                <button className="catalogue-tab">Item Detail</button>
                <button className="catalogue-tab">Box Management</button>
                <button className="catalogue-tab">Volunteers</button>
            </div>

            {/* Main Content */}
            <div className="catalogue-content">
                <div className="catalogue-content-header">
                    <h2>Collection Catalogue</h2>
                    <button
                        className="catalogue-add-btn"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        + Add New Item
                    </button>
                </div>

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
                        placeholder="Search by game name, category, or box number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="catalogue-filter-btn">
                        All Categories
                    </button>
                    <button className="catalogue-filter-btn">
                        All Locations
                    </button>
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
                {!isLoading && !error && items.length > 0 && (
                    <table className="catalogue-table">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Box Number</th>
                                <th>Category</th>
                                <th>Location</th>
                                <th>Players</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td><strong>{item.title}</strong></td>
                                    <td>{item.boxNumber}</td>
                                    <td>{item.category}</td>
                                    <td>
                                        <span className={`location-badge ${item.location}`}>
                                            {getLocationLabel(item.location)}
                                        </span>
                                    </td>
                                    <td>{item.players}</td>
                                    <td>
                                        <div className="catalogue-actions">
                                            <button
                                                className="catalogue-action-btn"
                                                onClick={() => handleEditClick(item)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="catalogue-action-btn"
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
                {!isLoading && !error && items.length === 0 && (
                    <div className="catalogue-empty-state">
                        <p>No items found. Click "+ Add New Item" to add your first item.</p>
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
                    platform: selectedItem.category,
                    description: selectedItem.description,
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
