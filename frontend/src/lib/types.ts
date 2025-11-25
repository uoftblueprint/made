export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'VOLUNTEER';
  access_expiry_date: string | null;
}

export interface VolunteerApplication {
  id: number;
  name: string;
  email: string;
  motivation_text: string;
  submitted_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_at: string | null;
  reviewer: string | null;
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