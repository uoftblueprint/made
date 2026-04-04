import React, { useState, useRef } from 'react';
import apiClient from '../../api/apiClient';
import './ExportModal.css'; // reuse same modal styles

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete?: () => void; // optional callback to refresh item list
}

interface ImportResult {
    imported: number;
    skipped: string[];
    errors: string[];
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] ?? null;
        setFile(selected);
        setError(null);
        setResult(null);
    };

    const handleImport = async () => {
        if (!file) {
            setError('Please select a CSV file first.');
            return;
        }

        setError(null);
        setIsImporting(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post('/inventory/import/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data as ImportResult);
            onImportComplete?.();
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                ?? 'Import failed. Please check your file and try again.';
            setError(msg);
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setError(null);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="export-modal" onClick={(e) => e.stopPropagation()}>
                <div className="export-modal-header">
                    <h2>Import from CSV</h2>
                    <button className="modal-close-btn" onClick={handleClose}>×</button>
                </div>

                <div className="export-modal-body">
                    {!result ? (
                        <>
                            <p className="export-modal-description">
                                Upload a legacy museum inventory CSV file. Items will be imported
                                and flagged for review. Duplicate MADE IDs will be skipped.
                            </p>

                            {error && <div className="export-error">{error}</div>}

                            <div className="form-group">
                                <label>CSV File</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="file-input"
                                />
                                {file && (
                                    <p className="file-name-hint">
                                        Selected: <strong>{file.name}</strong>
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Results summary */
                        <div className="import-results">
                            <div className="import-stat import-stat--success">
                                <span className="import-stat-number">{result.imported}</span>
                                <span className="import-stat-label">items imported</span>
                            </div>
                            <div className="import-stat import-stat--warning">
                                <span className="import-stat-number">{result.skipped.length}</span>
                                <span className="import-stat-label">rows skipped</span>
                            </div>
                            {result.errors.length > 0 && (
                                <div className="import-stat import-stat--error">
                                    <span className="import-stat-number">{result.errors.length}</span>
                                    <span className="import-stat-label">errors</span>
                                </div>
                            )}

                            {result.skipped.length > 0 && (
                                <div className="import-skipped">
                                    <p><strong>Skipped MADE IDs:</strong></p>
                                    <ul>
                                        {result.skipped.slice(0, 10).map((id, i) => (
                                            <li key={i}>{id}</li>
                                        ))}
                                        {result.skipped.length > 10 && (
                                            <li>…and {result.skipped.length - 10} more</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {result.errors.length > 0 && (
                                <div className="import-skipped">
                                    <p><strong>Errors:</strong></p>
                                    <ul>
                                        {result.errors.slice(0, 5).map((e, i) => (
                                            <li key={i}>{e}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <p className="import-review-note">
                                All imported items have been flagged for review in the catalogue.
                            </p>
                        </div>
                    )}
                </div>

                <div className="export-modal-footer">
                    <button type="button" className="btn-cancel" onClick={handleClose}>
                        {result ? 'Close' : 'Cancel'}
                    </button>
                    {!result && (
                        <button
                            type="button"
                            className="btn-submit"
                            onClick={handleImport}
                            disabled={isImporting || !file}
                        >
                            {isImporting ? 'Importing...' : 'Import CSV'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
