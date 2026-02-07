import React, { useState, useEffect } from 'react';
import './AddItemModal.css';

interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    item: {
        id: number;
        item_code: string;
        title: string;
        platform: string;
        description: string;
    } | null;
}

interface FormData {
    item_code: string;
    title: string;
    platform: string;
    description: string;
}

interface FormErrors {
    item_code?: string;
    title?: string;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, onSuccess, item }) => {
    const [formData, setFormData] = useState<FormData>({
        item_code: '',
        title: '',
        platform: '',
        description: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pre-populate form when item changes
    useEffect(() => {
        if (item) {
            setFormData({
                item_code: item.item_code,
                title: item.title,
                platform: item.platform || '',
                description: item.description || '',
            });
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.item_code.trim()) {
            newErrors.item_code = 'Item code is required';
        }

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError(null);

        if (!validateForm()) return;

        setIsSubmitting(true);

        // Mock API call will be replaced with real API
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="add-item-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-item-modal-header">
                    <h2>Edit Item</h2>
                    <button className="modal-close-btn" onClick={handleClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="add-item-modal-body">
                        {apiError && <div className="api-error">{apiError}</div>}

                        <div className="form-group">
                            <label>
                                Item Code <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                name="item_code"
                                value={formData.item_code}
                                onChange={handleChange}
                                placeholder="Enter barcode or unique ID"
                                className={errors.item_code ? 'error' : ''}
                            />
                            {errors.item_code && <div className="form-error">{errors.item_code}</div>}
                        </div>

                        <div className="form-group">
                            <label>
                                Title <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter game/item title"
                                className={errors.title ? 'error' : ''}
                            />
                            {errors.title && <div className="form-error">{errors.title}</div>}
                        </div>

                        <div className="form-group">
                            <label>Platform</label>
                            <input
                                type="text"
                                name="platform"
                                value={formData.platform}
                                onChange={handleChange}
                                placeholder="e.g., SNES, PS2, Board Game"
                            />
                        </div>

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
