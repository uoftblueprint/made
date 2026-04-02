import React, { useEffect, useState } from 'react';
import { itemsApi, type UpdateItemData, } from '../../api/items.api';
import { type AdminCollectionItem, type ItemType, type ItemStatus } from '../../lib/types'
import { useLocations } from '../../actions/useLocations';
import { useBoxes } from '../../actions/useBoxes';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: AdminCollectionItem | null;
}

interface FormData {
  title: string;
  item_code: string;
  item_type: ItemType;
  platform: string;
  description: string;
  working_condition: boolean;
  status: ItemStatus;
  current_location: number | '';
  is_public_visible: boolean;
  is_on_floor: boolean;
  box: number | '';
}

interface FormErrors {
  item_code?: string;
  title?: string;
  current_location?: string;
}

const initialFormData: FormData = {
  title: '',
  item_code: '',
  item_type: 'SOFTWARE',
  platform: '',
  description: '',
  working_condition: true,
  status: 'AVAILABLE',
  current_location: '',
  is_public_visible: true,
  is_on_floor: false,
  box: '',
};

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, onSuccess, item }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { locations, loading: locationsLoading, error: locationsError } = useLocations();
  const { boxes, loading: boxesLoading, error: boxesError } = useBoxes();

  useEffect(() => {
    if (!item) return;

    setFormData({
      title: item.title || '',
      item_code: item.item_code || '',
      item_type: item.item_type || 'SOFTWARE',
      platform: item.platform || '',
      description: item.description || '',
      working_condition: item.working_condition ?? true,
      status: item.status || 'AVAILABLE',
      current_location: item.current_location?.id ?? '',
      is_public_visible: item.is_public_visible ?? true,
      is_on_floor: item.is_on_floor ?? false,
      box: item.box ?? '',
    });
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

    if (formData.current_location === '') {
      newErrors.current_location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setErrors({});
    setApiError(null);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'current_location' || name === 'box'
          ? value === ''
            ? ''
            : Number(value)
          : name === 'working_condition'
          ? value === 'true'
          : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm() || !item) return;

    setIsSubmitting(true);

    try {
      const payload: UpdateItemData = {
        item_code: formData.item_code.trim(),
        title: formData.title.trim(),
        item_type: formData.item_type,
        platform: formData.platform.trim(),
        description: formData.description.trim(),
        working_condition: formData.working_condition,
        status: formData.status,
        current_location: Number(formData.current_location),
        is_public_visible: formData.is_public_visible,
        is_on_floor: formData.is_on_floor,
        box: formData.box === '' ? null : Number(formData.box),
      };

      await itemsApi.partialUpdate(item.id, payload);

      onSuccess();
      handleClose();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: Record<string, string | string[]> } };
      const responseData = axiosError?.response?.data;
      const getFirstError = (value?: string | string[]): string | undefined => {
        if (!value) return undefined;
        return Array.isArray(value) ? value[0] : value;
      };
      const errorMessage =
        getFirstError(responseData?.detail) ||
        getFirstError(responseData?.item_code) ||
        getFirstError(responseData?.title) ||
        getFirstError(responseData?.current_location) ||
        getFirstError(responseData?.non_field_errors) ||
        (error instanceof Error ? error.message : 'Failed to update item. Please try again.');

      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="Edit Item" wide>
      <form onSubmit={handleSubmit}>
        <p className="modal-subtitle">Update inventory details for this item.</p>
        <div className="modal-form">
          {apiError && <div className="add-item-error">{apiError}</div>}

          {/* Basic Details */}
          <div className="modal-row">
            <div className="modal-field">
              <label>Item Name <span className="required">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter item name"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="modal-field-error">{errors.title}</span>}
            </div>
            <div className="modal-field">
              <label>MADE ID <span className="required">*</span></label>
              <input
                type="text"
                name="item_code"
                value={formData.item_code}
                onChange={handleChange}
                placeholder="Enter MADE ID"
                className={errors.item_code ? 'error' : ''}
              />
              {errors.item_code && <span className="modal-field-error">{errors.item_code}</span>}
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label>Item Type</label>
              <select name="item_type" value={formData.item_type} onChange={handleChange}>
                <option value="SOFTWARE">Software</option>
                <option value="HARDWARE">Hardware</option>
                <option value="NON_ELECTRONIC">Non-Electronic</option>
              </select>
            </div>
            <div className="modal-field">
              <label>Platform</label>
              <input
                type="text"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                placeholder="e.g. PS2, Windows, Shelf Label"
              />
            </div>
          </div>

          <div className="modal-field">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes about the item"
            />
          </div>

          {/* Inventory Settings */}
          <div className="modal-row">
            <div className="modal-field">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="AVAILABLE">Available</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div className="modal-field">
              <label>Working Condition</label>
              <select
                name="working_condition"
                value={String(formData.working_condition)}
                onChange={handleChange}
              >
                <option value="true">Working</option>
                <option value="false">Not Working</option>
              </select>
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label>Current Location <span className="required">*</span></label>
              <select
                name="current_location"
                value={formData.current_location}
                onChange={handleChange}
                className={errors.current_location ? 'error' : ''}
                disabled={locationsLoading}
              >
                <option value="">
                  {locationsLoading ? 'Loading locations...' : 'Select a location'}
                </option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                    {'location_type_display' in location && location.location_type_display
                      ? ` (${location.location_type_display})`
                      : ''}
                  </option>
                ))}
              </select>
              {errors.current_location && <span className="modal-field-error">{errors.current_location}</span>}
              {locationsError && <span className="modal-field-error">{locationsError}</span>}
            </div>
            <div className="modal-field">
              <label>Box</label>
              <select
                name="box"
                value={formData.box}
                onChange={handleChange}
                disabled={boxesLoading}
              >
                <option value="">
                  {boxesLoading ? 'Loading boxes...' : 'No box'}
                </option>
                {boxes.map((box) => (
                  <option key={box.id} value={box.id}>
                    {'box_code' in box && box.box_code
                      ? box.box_code
                      : `Box #${box.id}`}
                    {'label' in box && box.label ? ` - ${box.label}` : ''}
                  </option>
                ))}
              </select>
              {boxesError && <span className="modal-field-error">{boxesError}</span>}
            </div>
          </div>

          <div className="modal-field modal-checkbox-field">
            <label>
              <input
                type="checkbox"
                name="is_public_visible"
                checked={formData.is_public_visible}
                onChange={handleChange}
              />
              Publicly visible
            </label>
          </div>
          <div className="modal-field modal-checkbox-field">
            <label>
              <input
                type="checkbox"
                name="is_on_floor"
                checked={formData.is_on_floor}
                onChange={handleChange}
              />
              On floor
            </label>
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="outline-gray" size="md" onClick={handleClose} type="button">Cancel</Button>
          <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditItemModal;
