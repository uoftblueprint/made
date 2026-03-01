export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'VOLUNTEER';
  access_expiry_date: string | null;
}

export interface Volunteer {
  id: number;
  name: string;
  email: string;
  motivation_text: string;
  submitted_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at?: string;
  expires_at?: string;
  days_remaining?: number;
}

export interface VolunteerApplicationInput {
  name: string
  email: string
  motivation_text: string
}

// TODO: place holder
export interface CollectionItem {
  id: number;
  name: string;
  description: string;
}

export interface LocationInfo {
  id: number;
  name: string;
  location_type: 'FLOOR' | 'STORAGE' | 'EVENT' | 'OTHER';
  location_type_display: string;
  description?: string;
}

export type ItemType = 'SOFTWARE' | 'HARDWARE' | 'NON_ELECTRONIC';
export type ConditionType = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type CompletenessType = 'YES' | 'NO' | 'UNKNOWN';

export interface PublicCollectionItem {
  id: number;
  item_code: string;
  title: string;
  platform: string;
  description: string;
  item_type?: ItemType;
  condition?: ConditionType;
  is_complete?: CompletenessType;
  is_functional?: CompletenessType;
  date_of_entry?: string;
  working_condition?: boolean;
  status?: 'AVAILABLE' | 'IN_TRANSIT' | 'CHECKED_OUT' | 'MAINTENANCE';
  is_on_floor: boolean;
  location_name?: string;
  current_location?: LocationInfo;
  box_code?: string;
  created_at?: string;
  updated_at?: string;
  // Software-specific fields
  creator_publisher?: string;
  release_year?: string;
  version_edition?: string;
  media_type?: string;
  // Hardware-specific fields
  manufacturer?: string;
  model_number?: string;
  year_manufactured?: string;
  serial_number?: string;
  hardware_type?: string;
  // Non-Electronic-specific fields
  item_subtype?: string;
  date_published?: string;
  publisher?: string;
  volume_number?: string;
  isbn_catalogue_number?: string;
}

// TODO: place holder
export interface ItemOnFloor {
  id: number;
  item: CollectionItem;
  location: string;
}

export interface ExpiringVolunteer {
  id: number;
  name: string;
  email: string;
  access_expires_at: string;
}

export interface VolunteerStats {
  active_count: number;
  expiring_soon_count: number;
  expired_count: number;
  total_count: number;
  expiring_volunteers: ExpiringVolunteer[];
  warning_days?: number;
}

export interface RoleOption {
  value: string;
  label: string;
  permissions: string[];
}

export interface EventTypeOption {
  value: string;
  label: string;
}

export interface StatusOption {
  value: string;
  label: string;
}

export interface VolunteerOptions {
  roles: RoleOption[];
  event_types: EventTypeOption[];
  status_options?: StatusOption[];
}

export type MovementRequestStatus = 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface MovementRequest {
  id: number;
  item: number;
  item_code?: string;
  item_title?: string;
  item_platform?: string;
  requested_by: number;
  requested_by_username: string;
  from_location: number;
  from_location_name?: string;
  to_location: number;
  to_location_name?: string;
  status: MovementRequestStatus;
  admin: number | null;
  admin_username: string | null;
  admin_comment: string;
  created_at: string;
  updated_at: string;
}