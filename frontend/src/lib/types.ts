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
  user_id?: number;
  expires_at?: string | null;
  days_remaining?: number | null;
}

export interface VolunteerApplicationInput {
  name: string
  email: string
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

export interface BoxSummary {
  id: number;
  box_code?: string;
  label?: string;
  description?: string;
  location?: number;
}

export interface CollectionItem {
  id: number;
  item_code: string;
  title: string;
  platform: string;
  description: string;
  item_type: ItemType;
  working_condition: boolean;
  status: ItemStatus;
  current_location: LocationInfo | number | null;
  is_public_visible: boolean;
  is_on_floor: boolean;
  box: BoxSummary | number | null;
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