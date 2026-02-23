import React, { useState, useEffect } from 'react';
import './AddItemModal.css';

type ItemType = 'SOFTWARE' | 'HARDWARE' | 'NON_ELECTRONIC';
type Condition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
type Completeness = 'YES' | 'NO' | 'UNKNOWN';

interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    item: {
        id: number;
        item_code: string;
        title: string;
        item_type: ItemType;
        platform: string;
        description: string;
        condition: Condition;
        is_complete: Completeness;
        is_functional: Completeness;
        date_of_entry: string;
        creator_publisher: string;
        release_year: string;
        version_edition: string;
        media_type: string;
        manufacturer: string;
        model_number: string;
        year_manufactured: string;
        serial_number: string;
        hardware_type: string;
        item_subtype: string;
        date_published: string;
        publisher: string;
        volume_number: string;
        isbn_catalogue_number: string;
    } | null;
}

interface FormData {
    title: string;
    item_code: string;
    item_type: ItemType;
    platform: string;
    date_of_entry: string;
    condition: Condition;
    is_complete: Completeness;
    is_functional: Completeness;
    description: string;
    creator_publisher: string;
    release_year: string;
    version_edition: string;
    media_type: string;
    manufacturer: string;
    model_number: string;
    year_manufactured: string;
    serial_number: string;
    hardware_type: string;
    item_subtype: string;
    date_published: string;
    publisher: string;
    volume_number: string;
    isbn_catalogue_number: string;
}

interface FormErrors {
    item_code?: string;
    title?: string;
}

const initialFormData: FormData = {
    title: '',
    item_code: '',
    item_type: 'SOFTWARE',
    platform: '',
    date_of_entry: '',
    condition: 'GOOD',
    is_complete: 'UNKNOWN',
    is_functional: 'UNKNOWN',
    description: '',
    creator_publisher: '',
    release_year: '',
    version_edition: '',
    media_type: '',
    manufacturer: '',
    model_number: '',
    year_manufactured: '',
    serial_number: '',
    hardware_type: '',
    item_subtype: '',
    date_published: '',
    publisher: '',
    volume_number: '',
    isbn_catalogue_number: '',
};

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, onSuccess, item }) => {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                title: item.title || '',
                item_code: item.item_code || '',
                item_type: item.item_type || 'SOFTWARE',
                platform: item.platform || '',
                date_of_entry: item.date_of_entry || '',
                condition: item.condition || 'GOOD',
                is_complete: item.is_complete || 'UNKNOWN',
                is_functional: item.is_functional || 'UNKNOWN',
                description: item.description || '',
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
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.item_code.trim()) {
            newErrors.item_code = 'MADE ID is required';
        }

        if (!formData.title.trim()) {
            newErrors.title = 'Item name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError(null);

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 500));

            console.log('Item updated (mocked):', { id: item.id, ...formData });
            onSuccess();
            handleClose();
        } catch {
            setApiError('Failed to update item. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setErrors({});
        setApiError(null);
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const renderSoftwareFields = () => (
        <div className="form-section">
            <div className="form-section-title">Software Details</div>
            <div className="form-row">
                <div className="form-group">
                    <label>Creator/Publisher</label>
                    <input
                        type="text"
                        name="creator_publisher"
                        value={formData.creator_publisher}
                        onChange={handleChange}
                        placeholder="Enter creator or publisher"
                    />
                </div>
                <div className="form-group">
                    <label>Release Year</label>
                    <input
                        type="text"
                        name="release_year"
                        value={formData.release_year}
                        onChange={handleChange}
                        placeholder="e.g., 1995"
                    />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Version/Edition</label>
                    <input
                        type="text"
                        name="version_edition"
                        value={formData.version_edition}
                        onChange={handleChange}
                        placeholder="e.g., 1.0, Collector's Edition"
                    />
                </div>
                <div className="form-group">
                    <label>Media Type</label>
                    <input
                        type="text"
                        name="media_type"
                        value={formData.media_type}
                        onChange={handleChange}
                        placeholder="e.g., CD, Cartridge, Digital"
                    />
                </div>
            </div>
        </div>
    );

    const renderHardwareFields = () => (
        <div className="form-section">
            <div className="form-section-title">Hardware Details</div>
            <div className="form-row">
                <div className="form-group">
                    <label>Manufacturer</label>
                    <input
                        type="text"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleChange}
                        placeholder="e.g., Nintendo, Sony"
                    />
                </div>
                <div className="form-group">
                    <label>Model Number</label>
                    <input
                        type="text"
                        name="model_number"
                        value={formData.model_number}
                        onChange={handleChange}
                        placeholder="Enter model number"
                    />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Year Manufactured</label>
                    <input
                        type="text"
                        name="year_manufactured"
                        value={formData.year_manufactured}
                        onChange={handleChange}
                        placeholder="e.g., 1996"
                    />
                </div>
                <div className="form-group">
                    <label>Serial Number</label>
                    <input
                        type="text"
                        name="serial_number"
                        value={formData.serial_number}
                        onChange={handleChange}
                        placeholder="Enter serial number"
                    />
                </div>
            </div>
            <div className="form-group">
                <label>Hardware Type</label>
                <input
                    type="text"
                    name="hardware_type"
                    value={formData.hardware_type}
                    onChange={handleChange}
                    placeholder="e.g., Console, Controller, Peripheral"
                />
            </div>
        </div>
    );

    const renderNonElectronicFields = () => (
        <div className="form-section">
            <div className="form-section-title">Non-Electronic Details</div>
            <div className="form-row">
                <div className="form-group">
                    <label>Item Type</label>
                    <input
                        type="text"
                        name="item_subtype"
                        value={formData.item_subtype}
                        onChange={handleChange}
                        placeholder="e.g., Book, Magazine, Board Game"
                    />
                </div>
                <div className="form-group">
                    <label>Model Number</label>
                    <input
                        type="text"
                        name="model_number"
                        value={formData.model_number}
                        onChange={handleChange}
                        placeholder="Enter model number"
                    />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Date Published</label>
                    <input
                        type="text"
                        name="date_published"
                        value={formData.date_published}
                        onChange={handleChange}
                        placeholder="e.g., 1990"
                    />
                </div>
                <div className="form-group">
                    <label>Publisher</label>
                    <input
                        type="text"
                        name="publisher"
                        value={formData.publisher}
                        onChange={handleChange}
                        placeholder="Enter publisher"
                    />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Volume Number</label>
                    <input
                        type="text"
                        name="volume_number"
                        value={formData.volume_number}
                        onChange={handleChange}
                        placeholder="e.g., Vol. 1"
                    />
                </div>
                <div className="form-group">
                    <label>ISBN/Catalogue Number</label>
                    <input
                        type="text"
                        name="isbn_catalogue_number"
                        value={formData.isbn_catalogue_number}
                        onChange={handleChange}
                        placeholder="Enter ISBN or catalogue number"
                    />
                </div>
            </div>
        </div>
    );

    const renderConditionSection = () => (
        <div className="form-section">
            <div className="form-group">
                <label>Condition</label>
                <div className="radio-group">
                    {(['EXCELLENT', 'GOOD', 'FAIR', 'POOR'] as Condition[]).map((c) => (
                        <label key={c} className="radio-label">
                            <input
                                type="radio"
                                name="condition"
                                value={c}
                                checked={formData.condition === c}
                                onChange={handleChange}
                            />
                            <span>{c.charAt(0) + c.slice(1).toLowerCase()}</span>
                        </label>
                    ))}
                </div>
            </div>

            {formData.item_type === 'HARDWARE' ? (
                <div className="form-group">
                    <label>Is Functional?</label>
                    <div className="radio-group">
                        {(['YES', 'NO', 'UNKNOWN'] as Completeness[]).map((c) => (
                            <label key={c} className="radio-label">
                                <input
                                    type="radio"
                                    name="is_functional"
                                    value={c}
                                    checked={formData.is_functional === c}
                                    onChange={handleChange}
                                />
                                <span>{c.charAt(0) + c.slice(1).toLowerCase()}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="form-group">
                    <label>Is Complete?</label>
                    <div className="radio-group">
                        {(['YES', 'NO', 'UNKNOWN'] as Completeness[]).map((c) => (
                            <label key={c} className="radio-label">
                                <input
                                    type="radio"
                                    name="is_complete"
                                    value={c}
                                    checked={formData.is_complete === c}
                                    onChange={handleChange}
                                />
                                <span>{c.charAt(0) + c.slice(1).toLowerCase()}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const getFormTitle = () => {
        switch (formData.item_type) {
            case 'SOFTWARE':
                return 'Edit Software';
            case 'HARDWARE':
                return 'Edit Hardware';
            case 'NON_ELECTRONIC':
                return 'Edit Non-Electronic Item';
            default:
                return 'Edit Item';
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="add-item-modal add-item-modal-wide" onClick={(e) => e.stopPropagation()}>
                <div className="add-item-modal-header">
                    <h2>{getFormTitle()}</h2>
                    <button className="modal-close-btn" onClick={handleClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="add-item-modal-body">
                        {apiError && <div className="api-error">{apiError}</div>}

                        {/* Item Type Selector */}
                        <div className="form-group">
                            <label>Item Type <span className="required">*</span></label>
                            <select
                                name="item_type"
                                value={formData.item_type}
                                onChange={handleChange}
                            >
                                <option value="SOFTWARE">Software</option>
                                <option value="HARDWARE">Hardware</option>
                                <option value="NON_ELECTRONIC">Non-Electronic</option>
                            </select>
                        </div>

                        {/* Common Required Fields */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Item Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Enter item name"
                                    className={errors.title ? 'error' : ''}
                                />
                                {errors.title && <div className="form-error">{errors.title}</div>}
                            </div>
                            <div className="form-group">
                                <label>MADE ID <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="item_code"
                                    value={formData.item_code}
                                    onChange={handleChange}
                                    placeholder="Enter MADE ID"
                                    className={errors.item_code ? 'error' : ''}
                                />
                                {errors.item_code && <div className="form-error">{errors.item_code}</div>}
                            </div>
                        </div>

                        <div className="form-row">
                            {formData.item_type === 'SOFTWARE' && (
                                <div className="form-group">
                                    <label>Platform</label>
                                    <input
                                        type="text"
                                        name="platform"
                                        value={formData.platform}
                                        onChange={handleChange}
                                        placeholder="e.g., SNES, PS2"
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Date of Entry</label>
                                <input
                                    type="date"
                                    name="date_of_entry"
                                    value={formData.date_of_entry}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Type-specific fields */}
                        {formData.item_type === 'SOFTWARE' && renderSoftwareFields()}
                        {formData.item_type === 'HARDWARE' && renderHardwareFields()}
                        {formData.item_type === 'NON_ELECTRONIC' && renderNonElectronicFields()}

                        {/* Condition Section */}
                        {renderConditionSection()}

                        {/* Description */}
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Additional notes about this item"
                            />
                        </div>
                    </div>

                    <div className="add-item-modal-footer">
                        <button type="button" className="btn-cancel" onClick={handleClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditItemModal;
