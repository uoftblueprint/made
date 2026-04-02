import React, { useEffect, useState } from 'react';
import { itemsApi, type UpdateItemData, } from '../../api/items.api';
import { type AdminCollectionItem, type ItemType, type ItemStatus, type ConditionType, type CompletenessType } from '../../lib/types'
import { useLocations } from '../../actions/useLocations';
import { useBoxes } from '../../actions/useBoxes';
import Modal from '../common/Modal';
import Button from '../common/Button';
import './AddItemModal.css';

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
  date_of_entry: string;
  condition: ConditionType;
  is_complete: CompletenessType;
  is_functional: CompletenessType;
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
  date_of_entry: '',
  condition: 'GOOD',
  is_complete: 'UNKNOWN',
  is_functional: 'UNKNOWN',
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

  const { locations, loading: locationsLoading, error: locationsError } = useLocations();
  const { boxes, loading: boxesLoading, error: boxesError } = useBoxes();

  useEffect(() => {
    if (!item) return;

    const extItem = item as AdminCollectionItem & {
      date_of_entry?: string;
      condition?: ConditionType;
      is_complete?: CompletenessType;
      is_functional?: CompletenessType;
      creator_publisher?: string;
      release_year?: string;
      version_edition?: string;
      media_type?: string;
      manufacturer?: string;
      model_number?: string;
      year_manufactured?: string;
      serial_number?: string;
      hardware_type?: string;
      item_subtype?: string;
      date_published?: string;
      publisher?: string;
      volume_number?: string;
      isbn_catalogue_number?: string;
    };

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
      date_of_entry: extItem.date_of_entry || '',
      condition: extItem.condition || 'GOOD',
      is_complete: extItem.is_complete || 'UNKNOWN',
      is_functional: extItem.is_functional || 'UNKNOWN',
      creator_publisher: extItem.creator_publisher || '',
      release_year: extItem.release_year || '',
      version_edition: extItem.version_edition || '',
      media_type: extItem.media_type || '',
      manufacturer: extItem.manufacturer || '',
      model_number: extItem.model_number || '',
      year_manufactured: extItem.year_manufactured || '',
      serial_number: extItem.serial_number || '',
      hardware_type: extItem.hardware_type || '',
      item_subtype: extItem.item_subtype || '',
      date_published: extItem.date_published || '',
      publisher: extItem.publisher || '',
      volume_number: extItem.volume_number || '',
      isbn_catalogue_number: extItem.isbn_catalogue_number || '',
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
        condition: formData.condition,
        is_complete: formData.is_complete,
        is_functional: formData.is_functional,
      };

      if (formData.date_of_entry) {
        payload.date_of_entry = formData.date_of_entry;
      }

      // Add type-specific fields
      if (formData.item_type === 'SOFTWARE') {
        if (formData.creator_publisher) payload.creator_publisher = formData.creator_publisher.trim();
        if (formData.release_year) payload.release_year = formData.release_year.trim();
        if (formData.version_edition) payload.version_edition = formData.version_edition.trim();
        if (formData.media_type) payload.media_type = formData.media_type.trim();
      } else if (formData.item_type === 'HARDWARE') {
        if (formData.manufacturer) payload.manufacturer = formData.manufacturer.trim();
        if (formData.model_number) payload.model_number = formData.model_number.trim();
        if (formData.year_manufactured) payload.year_manufactured = formData.year_manufactured.trim();
        if (formData.serial_number) payload.serial_number = formData.serial_number.trim();
        if (formData.hardware_type) payload.hardware_type = formData.hardware_type.trim();
      } else if (formData.item_type === 'NON_ELECTRONIC') {
        if (formData.item_subtype) payload.item_subtype = formData.item_subtype.trim();
        if (formData.publisher) payload.publisher = formData.publisher.trim();
        if (formData.date_published) payload.date_published = formData.date_published.trim();
        if (formData.volume_number) payload.volume_number = formData.volume_number.trim();
        if (formData.isbn_catalogue_number) payload.isbn_catalogue_number = formData.isbn_catalogue_number.trim();
      }

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

          {/* Type-specific fields */}
          {formData.item_type === 'SOFTWARE' && (
            <>
              <h3>Software Details</h3>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Creator/Publisher</label>
                  <input type="text" name="creator_publisher" value={formData.creator_publisher} onChange={handleChange} placeholder="Enter creator or publisher" />
                </div>
                <div className="modal-field">
                  <label>Release Year</label>
                  <input type="text" name="release_year" value={formData.release_year} onChange={handleChange} placeholder="e.g., 1995" />
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Version/Edition</label>
                  <input type="text" name="version_edition" value={formData.version_edition} onChange={handleChange} placeholder="e.g., 1.0, Collector's Edition" />
                </div>
                <div className="modal-field">
                  <label>Media Type</label>
                  <input type="text" name="media_type" value={formData.media_type} onChange={handleChange} placeholder="e.g., CD, Cartridge, Digital" />
                </div>
              </div>
            </>
          )}

          {formData.item_type === 'HARDWARE' && (
            <>
              <h3>Hardware Details</h3>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Manufacturer</label>
                  <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} placeholder="e.g., Nintendo, Sony" />
                </div>
                <div className="modal-field">
                  <label>Model Number</label>
                  <input type="text" name="model_number" value={formData.model_number} onChange={handleChange} placeholder="Enter model number" />
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Year Manufactured</label>
                  <input type="text" name="year_manufactured" value={formData.year_manufactured} onChange={handleChange} placeholder="e.g., 1996" />
                </div>
                <div className="modal-field">
                  <label>Serial Number</label>
                  <input type="text" name="serial_number" value={formData.serial_number} onChange={handleChange} placeholder="Enter serial number" />
                </div>
              </div>
              <div className="modal-field">
                <label>Hardware Type</label>
                <input type="text" name="hardware_type" value={formData.hardware_type} onChange={handleChange} placeholder="e.g., Console, Controller, Peripheral" />
              </div>
            </>
          )}

          {formData.item_type === 'NON_ELECTRONIC' && (
            <>
              <h3>Non-Electronic Details</h3>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Item Subtype</label>
                  <input type="text" name="item_subtype" value={formData.item_subtype} onChange={handleChange} placeholder="e.g., Book, Magazine, Board Game" />
                </div>
                <div className="modal-field">
                  <label>Publisher</label>
                  <input type="text" name="publisher" value={formData.publisher} onChange={handleChange} placeholder="Enter publisher" />
                </div>
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Date Published</label>
                  <input type="text" name="date_published" value={formData.date_published} onChange={handleChange} placeholder="e.g., 1990" />
                </div>
                <div className="modal-field">
                  <label>Volume Number</label>
                  <input type="text" name="volume_number" value={formData.volume_number} onChange={handleChange} placeholder="e.g., Vol. 1" />
                </div>
              </div>
              <div className="modal-field">
                <label>ISBN/Catalogue Number</label>
                <input type="text" name="isbn_catalogue_number" value={formData.isbn_catalogue_number} onChange={handleChange} placeholder="Enter ISBN or catalogue number" />
              </div>
            </>
          )}

          {/* Condition & Completeness */}
          <h3>Item Condition</h3>
          <div className="modal-row">
            <div className="modal-field">
              <label>Condition</label>
              <select name="condition" value={formData.condition} onChange={handleChange}>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
            <div className="modal-field">
              <label>{formData.item_type === 'HARDWARE' ? 'Functional' : 'Complete'}</label>
              <select
                name={formData.item_type === 'HARDWARE' ? 'is_functional' : 'is_complete'}
                value={formData.item_type === 'HARDWARE' ? formData.is_functional : formData.is_complete}
                onChange={handleChange}
              >
                <option value="YES">Yes</option>
                <option value="NO">No</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label>Date of Entry</label>
              <input
                type="date"
                name="date_of_entry"
                value={formData.date_of_entry}
                onChange={handleChange}
              />
            </div>
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
