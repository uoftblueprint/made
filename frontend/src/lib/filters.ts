export interface ItemFilter {
  search?: string | null;
  platform?: string | null;
  is_on_floor?: boolean | null;
  ordering?: string | null;
  item_type?: 'SOFTWARE' | 'HARDWARE' | null;
  status?: 'AVAILABLE' | 'IN_TRANSIT' | 'CHECKED_OUT' | 'MAINTENANCE' | null;
  location_type?: 'FLOOR' | 'STORAGE' | 'EVENT' | 'OTHER' | null;
}