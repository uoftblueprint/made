export interface ItemFilter {
  platform?: string;
  is_on_floor?: boolean | null;
  search?: string;
  ordering?: string;
  item_type?: string;
  status?: string;
  location_type?: string;
}