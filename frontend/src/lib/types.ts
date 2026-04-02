export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'VOLUNTEER';
  access_expiry_date: string | null;
  requires_move_approval: boolean;
}

export interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  motivation_text: string;
  submitted_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at?: string;
  user_id?: number;
  expires_at?: string | null;
  days_remaining?: number | null;
  requires_move_approval?: boolean;
  user_role?: 'ADMIN' | 'VOLUNTEER' | null;
}

export interface VolunteerApplicationInput {
  name: string
  email: string
  password: string
  motivation_text: string
}
export type ItemType = 'SOFTWARE' | 'HARDWARE' | 'NON_ELECTRONIC';
export type ItemStatus = 'AVAILABLE' | 'IN_TRANSIT' | 'CHECKED_OUT' | 'MAINTENANCE';
export type ConditionType = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type CompletenessType = 'YES' | 'NO' | 'UNKNOWN';

export interface LocationInfo {
  id: number;
  name: string;
  location_type: 'FLOOR' | 'STORAGE' | 'EVENT' | 'OTHER';
  location_type_display: string;
  description?: string;
}

export interface BaseCollectionItem {
  id: number;
  item_code: string;
  title: string;
  platform: string;
  description: string;
  item_type: ItemType;
  working_condition: boolean;
  status: ItemStatus;
  current_location: LocationInfo | null;
  is_on_floor: boolean;
  is_verified?: boolean;
}

export interface PublicCollectionItem extends BaseCollectionItem {
  location_name?: string | null;
  box_code?: string | null;
}

export interface AdminCollectionItem extends BaseCollectionItem {
  is_public_visible: boolean;
  box: number | null;
  created_at?: string;
  updated_at?: string;
  condition?: ConditionType;
  is_complete?: CompletenessType;
  is_functional?: CompletenessType;
  date_of_entry?: string;
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

export type MovementRequestStatus = 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED_UNVERIFIED';

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
  from_box?: number | null;
  from_box_code?: string | null;
  to_box?: number | null;
  to_box_code?: string | null;
  status: MovementRequestStatus;
  admin: number | null;
  admin_username: string | null;
  item_is_verified?: boolean;
  item_status?: string;
  admin_comment: string;
  created_at: string;
  updated_at: string;
}

export interface BoxMovementRequest {
  id: number;
  box: number;
  box_code: string;
  box_label: string;
  requested_by: number;
  requested_by_username: string;
  from_location: number;
  from_location_name: string;
  to_location: number;
  to_location_name: string;
  status: MovementRequestStatus;
  admin: number | null;
  admin_username: string | null;
  admin_comment: string;
  items_status?: string;
  items_verified?: boolean;
  created_at: string;
  updated_at: string;
}