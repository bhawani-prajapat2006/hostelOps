// ───── User types ─────
export type UserRole = "student" | "worker" | "warden" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  hostel_name?: string | null;
  room_number?: string | null;
  batch?: string | null;
  created_at?: string | null;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  page_size: number;
}

// ───── Auth types ─────
export interface TokenResponse {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ProfileUpdatePayload {
  username?: string;
  phone?: string;
  hostel_name?: string;
  room_number?: string;
  batch?: string;
}

// ───── Complaint types ─────
export type ComplaintStatus = "open" | "in_progress" | "closed";
export type ComplaintCategory = "plumbing" | "electrical" | "cleanliness" | "furniture" | "network" | "other";

export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: ComplaintCategory;
  created_by: number;
  assigned_to?: number | null;
  status: ComplaintStatus;
  image_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ComplaintCreate {
  title: string;
  description: string;
  category: ComplaintCategory;
  image_url?: string;
}

export interface ComplaintUpdate {
  title?: string;
  description?: string;
  status?: ComplaintStatus;
}

export interface ComplaintHistory {
  id: number;
  complaint_id: number;
  changed_by: number;
  old_status?: string | null;
  new_status?: string | null;
  comment?: string | null;
  created_at?: string | null;
}

export interface PaginatedComplaints {
  complaints: Complaint[];
  total: number;
  page: number;
  page_size: number;
}

// ───── Room types ─────
export interface Room {
  id: number;
  room_number: string;
  hostel_name: string;
  capacity: number;
  floor?: number | null;
  is_available: boolean;
  created_at?: string | null;
  occupants: number;
}

export interface RoomCreate {
  room_number: string;
  hostel_name: string;
  capacity: number;
  floor?: number;
}

export interface PaginatedRooms {
  rooms: Room[];
  total: number;
  page: number;
  page_size: number;
}

// ───── Notice types ─────
export interface Notice {
  id: number;
  title: string;
  content: string;
  posted_by: number;
  is_pinned: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface NoticeCreate {
  title: string;
  content: string;
  is_pinned?: boolean;
}

export interface PaginatedNotices {
  notices: Notice[];
  total: number;
  page: number;
  page_size: number;
}

// ───── Admin types ─────
export interface AdminStats {
  total_users: number;
  total_complaints: number;
  open_complaints: number;
  in_progress_complaints: number;
  closed_complaints: number;
  total_rooms: number;
}

// ───── Upload types ─────
export interface UploadResponse {
  filename: string;
  original_name: string | null;
  url: string;
  size: number;
}
