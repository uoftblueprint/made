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

// TODO: place holder
export interface ItemOnFloor {
  id: number;
  item: CollectionItem;
  location: string;
}