import React, { useEffect, useState } from 'react';
import { itemsApi, type UpdateItemData, } from '../../api/items.api';
import { type AdminCollectionItem, type ItemType, type ItemStatus } from '../../lib/types'
import { useLocations } from '../../actions/useLocations';
import { useBoxes } from '../../actions/useBoxes';

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

const inputBaseClass =
  'w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200';

const inputErrorClass =
  'border-red-500 focus:border-red-500 focus:ring-red-100';

const labelClass = 'mb-2 block text-sm font-medium text-neutral-800';
const sectionTitleClass = 'text-base font-semibold text-neutral-900';
const helperErrorClass = 'mt-1 text-sm text-red-600';

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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Edit Item</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Update inventory details for this item.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-2xl text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="space-y-6">
              {apiError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {apiError}
                </div>
              )}

              <section>
                <h3 className={sectionTitleClass}>Basic Details</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter item name"
                      className={`${inputBaseClass} ${
                        errors.title ? inputErrorClass : ''
                      }`}
                    />
                    {errors.title && (
                      <div className={helperErrorClass}>{errors.title}</div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>
                      MADE ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="item_code"
                      value={formData.item_code}
                      onChange={handleChange}
                      placeholder="Enter MADE ID"
                      className={`${inputBaseClass} ${
                        errors.item_code ? inputErrorClass : ''
                      }`}
                    />
                    {errors.item_code && (
                      <div className={helperErrorClass}>{errors.item_code}</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Item Type</label>
                    <select
                      name="item_type"
                      value={formData.item_type}
                      onChange={handleChange}
                      className={inputBaseClass}
                    >
                      <option value="SOFTWARE">Software</option>
                      <option value="HARDWARE">Hardware</option>
                      <option value="NON_ELECTRONIC">Non-Electronic</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Platform</label>
                    <input
                      type="text"
                      name="platform"
                      value={formData.platform}
                      onChange={handleChange}
                      placeholder="e.g. PS2, Windows, Shelf Label"
                      className={inputBaseClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add notes about the item"
                    className={`${inputBaseClass} min-h-30 resize-y`}
                  />
                </div>
              </section>

              <section>
                <h3 className={sectionTitleClass}>Inventory Settings</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className={inputBaseClass}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="CHECKED_OUT">Checked Out</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Working Condition</label>
                    <select
                      name="working_condition"
                      value={String(formData.working_condition)}
                      onChange={handleChange}
                      className={inputBaseClass}
                    >
                      <option value="true">Working</option>
                      <option value="false">Not Working</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Current Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="current_location"
                      value={formData.current_location}
                      onChange={handleChange}
                      className={`${inputBaseClass} ${
                        errors.current_location ? inputErrorClass : ''
                      }`}
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

                    {errors.current_location && (
                      <div className={helperErrorClass}>
                        {errors.current_location}
                      </div>
                    )}

                    {locationsError && (
                      <div className="mt-1 text-sm text-red-600">
                        {locationsError}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Box</label>
                    <select
                      name="box"
                      value={formData.box}
                      onChange={handleChange}
                      className={inputBaseClass}
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

                    {boxesError && (
                      <div className="mt-1 text-sm text-red-600">{boxesError}</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 text-sm text-neutral-800">
                    <input
                      type="checkbox"
                      name="is_public_visible"
                      checked={formData.is_public_visible}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                    Publicly visible
                  </label>

                  <label className="flex items-center gap-3 text-sm text-neutral-800">
                    <input
                      type="checkbox"
                      name="is_on_floor"
                      checked={formData.is_on_floor}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                    On floor
                  </label>
                </div>
              </section>
            </div>
          </div>

          <div className="border-t border-neutral-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;
