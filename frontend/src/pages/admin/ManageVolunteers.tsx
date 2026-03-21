import { useVolunteerApplications, useUpdateVolunteerStatus, useExtendVolunteerAccess, useVolunteerStats, useVolunteerOptions } from '../../actions/useVolunteers';
import { useState, useMemo } from 'react'
import { AlertCircle, Mail, Trash2, CheckCircle, Clock, XCircle, ExternalLink, ChevronDown } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import type { Volunteer } from '../../lib/types';
import './ManageVolunteers.css';

const DEFAULT_STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
];

const plusDays = (days: number, from?: string | null) => {
    const base = from ? new Date(from) : new Date();
    base.setDate(base.getDate() + days);
    return base.toISOString().slice(0, 10);
};

/** HTML date input is YYYY-MM-DD; API expects a full ISO datetime. */
const dateToEndOfDayIso = (dateStr: string): string =>
    new Date(`${dateStr}T23:59:59`).toISOString();

const ManageVolunteers = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    type ExpiryModal =
        | { mode: 'approve'; applicationId: number }
        | { mode: 'extend'; volunteer: Volunteer }
        | null;

    const [expiryModal, setExpiryModal] = useState<ExpiryModal>(null);
    const [expiryDate, setExpiryDate] = useState('');
    const [noExpiry, setNoExpiry] = useState(false);
    const [renewModalOpen, setRenewModalOpen] = useState(false);

    const { data = [], isLoading, isError } = useVolunteerApplications();
    const { data: stats } = useVolunteerStats();
    const { data: options } = useVolunteerOptions();
    const approveMutation = useUpdateVolunteerStatus();
    const extendMutation = useExtendVolunteerAccess();

    const openExpiryModal = (next: ExpiryModal) => {
        if (!next) return;
        const currentExpiry = next.mode === 'extend' ? next.volunteer.expires_at : null;
        setExpiryDate(plusDays(30, currentExpiry));
        setNoExpiry(false);
        setRenewModalOpen(false);
        setExpiryModal(next);
    };

    const closeExpiryModal = () => setExpiryModal(null);

    const submitExpiryModal = () => {
        const expiry =
            noExpiry ? null : expiryDate ? dateToEndOfDayIso(expiryDate) : null;
        if (expiryModal?.mode === 'approve') {
            approveMutation.mutate(
                { id: expiryModal.applicationId, action: 'APPROVED', access_expires_at: expiry },
                { onSuccess: closeExpiryModal }
            );
        } else if (expiryModal?.mode === 'extend' && expiryModal.volunteer.user_id) {
            extendMutation.mutate(
                { userId: expiryModal.volunteer.user_id, access_expires_at: expiry },
                { onSuccess: closeExpiryModal }
            );
        }
    };

    const onReject = (id: number) => {
        approveMutation.mutate({ id, action: 'REJECTED' });
    };

    const isPending = approveMutation.isPending || extendMutation.isPending;

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
                <Button variant="primary" size="md" icon="plus" onClick={() => setShowAddModal(true)}>
                    Add Volunteer
                </Button>
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
                    <button className="volunteers-renew-btn" onClick={() => setRenewModalOpen(true)}>Renew Access</button>
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
                                        {volunteer.days_remaining != null && volunteer.days_remaining > 0 && (
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
                                                <Button variant="success" size="xs" className="!text-black !border !border-border" onClick={() => openExpiryModal({ mode: 'approve', applicationId: volunteer.id })}>
                                                    Approve
                                                </Button>
                                                <Button variant="danger" size="xs" onClick={() => onReject(volunteer.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </>
                                        )}
                                        {volunteer.status === 'APPROVED' && (
                                            <>
                                                <button className="volunteers-action-btn icon-btn">
                                                    <ExternalLink size={14} />
                                                </button>
                                                <button className="volunteers-action-btn extend" onClick={() => openExpiryModal({ mode: 'extend', volunteer })}>Extend</button>
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
                                                <button className="volunteers-action-btn renew" onClick={() => openExpiryModal({ mode: 'approve', applicationId: volunteer.id })}>
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

            {/* Approve / Extend shared modal */}
            <Modal
                open={expiryModal !== null}
                onClose={closeExpiryModal}
                title={expiryModal?.mode === 'approve' ? 'Approve Volunteer' : 'Extend Access'}
            >
                {expiryModal?.mode === 'extend' && expiryModal.volunteer.expires_at && (
                    <p className="modal-subtitle">
                        Current expiry for <strong>{expiryModal.volunteer.name}</strong>:{' '}
                        {new Date(expiryModal.volunteer.expires_at).toLocaleDateString('en-CA')}
                    </p>
                )}
                <div className="modal-form">
                    <div className="modal-field">
                        <label>Expiry Date</label>
                        <input
                            type="date"
                            value={expiryDate}
                            min={new Date().toISOString().slice(0, 10)}
                            disabled={noExpiry}
                            onChange={(e) => setExpiryDate(e.target.value)}
                        />
                    </div>
                    <div className="modal-field modal-checkbox-field">
                        <label>
                            <input
                                type="checkbox"
                                checked={noExpiry}
                                onChange={(e) => setNoExpiry(e.target.checked)}
                            />
                            No expiry
                        </label>
                    </div>
                </div>
                <div className="modal-actions">
                    <Button
                        variant={expiryModal?.mode === 'approve' ? 'success' : 'primary'}
                        size="md"
                        onClick={submitExpiryModal}
                        disabled={isPending || (expiryModal?.mode === 'extend' && !expiryModal.volunteer.user_id)}
                        className="!text-black"
                    >
                        {isPending
                            ? expiryModal?.mode === 'approve' ? 'Approving…' : 'Extending…'
                            : expiryModal?.mode === 'approve' ? 'Approve & Set Expiry' : 'Extend Access'}
                    </Button>
                    <Button variant="outline-gray" size="md" onClick={closeExpiryModal}>Cancel</Button>
                </div>
            </Modal>

            {/* Renew Access Banner Modal */}
            <Modal open={renewModalOpen} onClose={() => setRenewModalOpen(false)} title="Renew Access">
                <p className="modal-subtitle">Volunteers expiring within {warningDays} days.</p>
                <div className="volunteers-renew-list">
                    {expiringVolunteers.map((v) => {
                        const appRow = data.find((a) => a.email === v.email);
                        return (
                            <div key={v.id} className="volunteers-renew-item">
                                <div>
                                    <strong>{v.name}</strong>
                                    <span className="volunteers-renew-expiry"> — expires {new Date(v.access_expires_at).toLocaleDateString('en-CA')}</span>
                                </div>
                                <Button
                                    variant="outline-gray"
                                    size="xs"
                                    onClick={() => appRow && openExpiryModal({ mode: 'extend', volunteer: appRow })}
                                    disabled={!appRow?.user_id}
                                >
                                    Extend
                                </Button>
                            </div>
                        );
                    })}
                </div>
                <div className="modal-actions">
                    <Button variant="outline-gray" size="md" onClick={() => setRenewModalOpen(false)}>Close</Button>
                </div>
            </Modal>

            {/* Add Volunteer Modal */}
            <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Grant Access to New Volunteer">
                <h2 className="text-xl font-semibold text-primary mb-2">Grant Access to New Volunteer</h2>
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
                    <Button variant="outline-gray" size="md" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button variant="primary" size="md">Create Volunteer</Button>
                </div>
            </Modal>
        </div>
    );
}

export default ManageVolunteers;