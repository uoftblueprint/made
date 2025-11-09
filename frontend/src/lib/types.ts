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

// TODO: place holder
export interface ItemOnFloor {
  id: number;
  item: CollectionItem;
  location: string;
}