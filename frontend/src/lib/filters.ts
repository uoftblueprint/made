import type { ItemStatus, ItemType, LocationInfo } from './types';

export interface ItemFilter {
  search?: string;
  platform?: string;
  is_on_floor?: boolean | null;
  ordering?: string;
  item_type?: ItemType;
  status?: ItemStatus;
  location_type?: LocationInfo['location_type'];
}