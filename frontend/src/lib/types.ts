export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'VOLUNTEER';
  access_expiry_date: string | null;
}

// TODO: place holder
export interface CollectionItem {
  id: number;
  name: string;
  description: string;
}

export interface PublicCollectionItem {
  id: number;
  item_code: string;
  title: string;
  platform: string;
  description: string;
  is_on_floor: boolean;
}

// TODO: place holder
export interface ItemOnFloor {
  id: number;
  item: CollectionItem;
  location: string;
}