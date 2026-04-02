import React, { useState } from 'react';
import { itemsApi } from '../../api/items.api';
import './DeleteItemDialog.css';

interface DeleteItemDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemId: number | string;
    itemTitle: string;
}

const DeleteItemDialog: React.FC<DeleteItemDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    itemId,
    itemTitle,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            await itemsApi.delete(itemId);
            onConfirm();
            onClose();
        } catch (err) {
            const axiosError = err as { response?: { data?: { detail?: string } } };
            setError(
                axiosError?.response?.data?.detail ||
                (err instanceof Error ? err.message : 'Delete failed. Please try again.')
            );
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="delete-dialog-overlay" onClick={onClose}>
            <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
                <h3>Delete Item</h3>
                <p>
                    Are you sure you want to delete <span className="item-name">"{itemTitle}"</span>?
                    This action cannot be undone.
                </p>
                {error && <p className="delete-dialog-error">{error}</p>}
                <div className="delete-dialog-actions">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-delete"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteItemDialog;
