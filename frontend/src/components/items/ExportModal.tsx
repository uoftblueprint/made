import React, { useState, useEffect } from 'react';
import { boxesApi } from '../../api/boxes.api';
import type { Box } from '../../api/boxes.api';
import apiClient from '../../api/apiClient';
import './ExportModal.css';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [boxId, setBoxId] = useState('');
    const [recordType, setRecordType] = useState('');
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch boxes for the dropdown
    useEffect(() => {
        if (isOpen) {
            boxesApi.getAll()
                .then(setBoxes)
                .catch(() => setBoxes([]));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleExport = async () => {
        setError(null);
        setIsExporting(true);

        try {
            const params: Record<string, string> = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (boxId) params.box_id = boxId;
            if (recordType) params.record_type = recordType;

            const response = await apiClient.get('/inventory/export/', {
                params,
                responseType: 'blob',
            });

            // Extract filename from Content-Disposition header or use default
            const disposition = response.headers['content-disposition'] || '';
            const filenameMatch = disposition.match(/filename="?(.+?)"?$/);
            const filename = filenameMatch ? filenameMatch[1] : 'made_export.csv';

            // Download the file
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            handleClose();
        } catch (err) {
            console.error('Export failed:', err);
            setError('Failed to export data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleClose = () => {
        setStartDate('');
        setEndDate('');
        setBoxId('');
        setRecordType('');
        setError(null);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="export-modal" onClick={(e) => e.stopPropagation()}>
                <div className="export-modal-header">
                    <h2>Export Collection Data</h2>
                    <button className="modal-close-btn" onClick={handleClose}>×</button>
                </div>

                <div className="export-modal-body">
                    <p className="export-modal-description">
                        Select filters to narrow your export, or leave all fields empty to export the entire collection.
                    </p>

                    {error && <div className="export-error">{error}</div>}

                    {/* Date Range */}
                    <div className="export-date-row">
                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Box Filter */}
                    <div className="form-group">
                        <label>Box</label>
                        <select
                            value={boxId}
                            onChange={(e) => setBoxId(e.target.value)}
                        >
                            <option value="">All Boxes</option>
                            {boxes.map((box) => (
                                <option key={box.id} value={box.id}>
                                    {box.box_code}{box.label ? ` – ${box.label}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Record Type Filter */}
                    <div className="form-group">
                        <label>Record Type</label>
                        <select
                            value={recordType}
                            onChange={(e) => setRecordType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="SOFTWARE">Software</option>
                            <option value="HARDWARE">Hardware</option>
                            <option value="NON_ELECTRONIC">Non-Electronic</option>
                        </select>
                    </div>
                </div>

                <div className="export-modal-footer">
                    <button type="button" className="btn-cancel" onClick={handleClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-submit"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
