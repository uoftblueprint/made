import { useVolunteerApplications, useUpdateVolunteerStatus, useVolunteerStats, useVolunteerOptions } from '../../actions/useVolunteers';
import { useState, useMemo } from 'react'
import { AlertCircle, Mail, Trash2, CheckCircle, Clock, XCircle, ExternalLink, ChevronDown, Plus } from 'lucide-react';
import './ManageVolunteers.css';

const DEFAULT_STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
];

const ManageVolunteers = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const { data = [], isLoading, isError } = useVolunteerApplications();
    const { data: stats } = useVolunteerStats();
    const { data: options } = useVolunteerOptions();
    const mutation = useUpdateVolunteerStatus();
    
    const onApprove = (id: number) => {
        mutation.mutate({id, action: "APPROVED"})
    }
    const onReject = (id: number) => {
        mutation.mutate({id, action: "REJECTED"})
    }

    const activeCount = stats?.active_count ?? 0;
    const expiringSoonCount = stats?.expiring_soon_count ?? 0;
    const expiredCount = stats?.expired_count ?? 0;
    const totalCount = stats?.total_count ?? data.length;
    const expiringVolunteers = stats?.expiring_volunteers ?? [];
    const warningDays = stats?.warning_days ?? 7;

    const roles = options?.roles ?? [];
    const eventTypes = options?.event_types ?? [];
    const statusOptions = options?.status_options?.length 
        ? [{ value: '', label: 'All Status' }, ...options.status_options]
        : DEFAULT_STATUS_OPTIONS;

    const filteredVolunteers = useMemo(() => {
        return data.filter(volunteer => {
            const matchesSearch = !searchQuery || 
                volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                volunteer.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = !statusFilter || volunteer.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [data, searchQuery, statusFilter]);

    const getStatusLabel = (status: string) => {
        const option = statusOptions.find(opt => opt.value === status);
        return option?.label || status;
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'active';
            case 'REJECTED': return 'expired';
            case 'PENDING': return 'pending';
            default: return '';
        }
    };

    const getRoleBadgeClass = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'editor';
            case 'REJECTED': return 'viewer';
            case 'PENDING': return 'pending';
            default: return '';
        }
    };

    const getRoleLabel = (status: string) => {
        const role = roles.find(r => {
            if (status === 'APPROVED') return r.value === 'editor';
            if (status === 'PENDING') return r.value === 'viewer';
            return r.value === 'viewer';
        });
        if (status === 'PENDING') return 'Pending';
        return role?.label || (status === 'APPROVED' ? 'Editor' : 'Viewer');
    };

    return (
        <div className="volunteers-layout">
            {/* Header */}
            <div className="volunteers-header">
                <div className="volunteers-header-left">
                    <h1>Volunteer Management</h1>
                    <p className="volunteers-header-subtitle">Manage volunteer access, roles, and expiration</p>
                </div>
                <button className="volunteers-add-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={16} />
                    Add Volunteer
                </button>
            </div>

            {/* Stats Bar */}
            <div className="volunteers-stats-bar">
                <div className="volunteers-stat-item">
                    <span className="label">Active:</span>
                    <span className="value">{activeCount.toLocaleString()}</span>
                </div>
                <div className="volunteers-stat-item">
                    <span className="label">Expiring Soon (≤{warningDays} days):</span>
                    <span className="value warning">{expiringSoonCount.toLocaleString()}</span>
                </div>
                <div className="volunteers-stat-item">
                    <span className="label">Expired:</span>
                    <span className="value error">{expiredCount.toLocaleString()}</span>
                </div>
                <div className="volunteers-stat-item">
                    <span className="label">Total:</span>
                    <span className="value">{totalCount.toLocaleString()}</span>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="volunteers-filters">
                <div className="volunteers-search-wrapper">
                    <input
                        type="text"
                        className="volunteers-search"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="volunteers-filter-dropdown">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="volunteers-filter-select"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="dropdown-icon" />
                </div>
            </div>

            {/* Warning Banner */}
            {expiringSoonCount > 0 && expiringVolunteers.length > 0 && (
                <div className="volunteers-warning-banner">
                    <div className="volunteers-warning-content">
                        <AlertCircle className="volunteers-warning-icon" size={16} />
                        <span className="volunteers-warning-text">
                            {expiringSoonCount} volunteer{expiringSoonCount > 1 ? 's' : ''} expiring within {warningDays} days: {expiringVolunteers.map(v => v.name).join(', ')}
                        </span>
                    </div>
                    <button className="volunteers-renew-btn">Renew Access</button>
                </div>
            )}

            {/* Item Count */}
            <div className="volunteers-item-count">
                Showing {filteredVolunteers.length} of {totalCount.toLocaleString()} volunteers
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="volunteers-loading">Loading volunteers...</div>
            )}

            {/* Error State */}
            {isError && (
                <div className="volunteers-error">Failed to load volunteers. Please try again.</div>
            )}

            {/* Volunteers Table */}
            {!isLoading && !isError && filteredVolunteers.length > 0 && (
                <table className="volunteers-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Granted Date</th>
                            <th>Expires</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVolunteers.map((volunteer) => (
                            <tr key={volunteer.id}>
                                <td><strong>{volunteer.name}</strong></td>
                                <td>
                                    <span className="volunteer-email">
                                        <Mail size={14} />
                                        {volunteer.email}
                                    </span>
                                </td>
                                <td>
                                    <span className={`role-badge ${getRoleBadgeClass(volunteer.status)}`}>
                                        {getRoleLabel(volunteer.status)}
                                    </span>
                                </td>
                                <td>{(volunteer.created_at || volunteer.submitted_at) ? new Date(volunteer.created_at || volunteer.submitted_at).toLocaleDateString('en-CA') : '-'}</td>
                                <td>
                                    <div className="volunteer-expires">
                                        <span className="volunteer-expires-date">
                                            {volunteer.expires_at ? new Date(volunteer.expires_at).toLocaleDateString('en-CA') : '-'}
                                        </span>
                                        {volunteer.days_remaining !== undefined && volunteer.days_remaining > 0 && (
                                            <span className="volunteer-expires-remaining">
                                                {volunteer.days_remaining} days remaining
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className={`volunteer-status ${getStatusClass(volunteer.status)}`}>
                                        {volunteer.status === 'APPROVED' && <CheckCircle size={16} className="volunteer-status-icon" />}
                                        {volunteer.status === 'REJECTED' && <XCircle size={16} className="volunteer-status-icon" />}
                                        {volunteer.status === 'PENDING' && <Clock size={16} className="volunteer-status-icon" />}
                                        {getStatusLabel(volunteer.status)}
                                    </span>
                                </td>
                                <td>
                                    <div className="volunteers-actions">
                                        {volunteer.status === 'PENDING' && (
                                            <>
                                                <button className="volunteers-action-btn approve" onClick={() => onApprove(volunteer.id)}>
                                                    Approve
                                                </button>
                                                <button className="volunteers-action-btn delete" onClick={() => onReject(volunteer.id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                        {volunteer.status === 'APPROVED' && (
                                            <>
                                                <button className="volunteers-action-btn icon-btn">
                                                    <ExternalLink size={14} />
                                                </button>
                                                <button className="volunteers-action-btn extend">Extend</button>
                                                <button className="volunteers-action-btn delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                        {volunteer.status === 'REJECTED' && (
                                            <>
                                                <button className="volunteers-action-btn icon-btn">
                                                    <ExternalLink size={14} />
                                                </button>
                                                <button className="volunteers-action-btn renew" onClick={() => onApprove(volunteer.id)}>
                                                    Renew
                                                </button>
                                                <button className="volunteers-action-btn delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Empty State */}
            {!isLoading && !isError && filteredVolunteers.length === 0 && (
                <div className="volunteers-empty-state">
                    <p>No volunteers found. Click "Add Volunteer" to add a new volunteer.</p>
                </div>
            )}

            {/* Add Volunteer Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="volunteers-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Grant Access to New Volunteer</h2>
                        <p className="modal-subtitle">Fill out fields marked with * to create an entry. Everything else is optional and can be added later.</p>
                        
                        <div className="modal-form">
                            <div className="modal-row">
                                <div className="modal-field">
                                    <label>First Name <span className="required">*</span></label>
                                    <input type="text" placeholder="" />
                                </div>
                                <div className="modal-field">
                                    <label>Last Name <span className="required">*</span></label>
                                    <input type="text" placeholder="" />
                                </div>
                            </div>
                            <div className="modal-row">
                                <div className="modal-field">
                                    <label>Email Address <span className="required">*</span></label>
                                    <input type="email" placeholder="This will be used for login credentials" />
                                </div>
                                <div className="modal-field">
                                    <label>Available Start Date <span className="required">*</span></label>
                                    <input type="date" />
                                </div>
                            </div>
                            
                            <h3>Volunteer Details</h3>
                            <div className="modal-row">
                                <div className="modal-field">
                                    <label>Preferred Role <span className="required">*</span></label>
                                    <select>
                                        <option value="">Please select a role</option>
                                        {roles.filter(r => r.value !== 'admin').map((role) => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="modal-field">
                                    <label>Phone Number <span className="required">*</span></label>
                                    <input type="tel" placeholder="" />
                                </div>
                            </div>
                            <div className="modal-field">
                                <label>Interested Event Types</label>
                                <select>
                                    <option value="">Select option</option>
                                    {eventTypes.map((eventType) => (
                                        <option key={eventType.value} value={eventType.value}>{eventType.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="modal-btn secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="modal-btn primary">Create Volunteer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageVolunteers;