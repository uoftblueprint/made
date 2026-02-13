import React, { useState } from 'react';
import './DeleteItemDialog.css';

interface DeleteItemDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemTitle: string;
}

const DeleteItemDialog: React.FC<DeleteItemDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    itemTitle,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        setIsDeleting(true);

        // Mock API call - will be replaced with real API
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));

            console.log('Item deleted (mocked):', itemTitle);
            onConfirm();
            onClose();
        } catch (error) {
            console.error('Delete failed:', error);
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
