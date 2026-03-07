import api from "./api";
import type {
  TokenResponse, RegisterPayload, LoginPayload, ProfileUpdatePayload,
  User, PaginatedUsers, Complaint, ComplaintCreate, ComplaintUpdate,
  ComplaintHistory, PaginatedComplaints, Room, RoomCreate, PaginatedRooms,
  Notice, NoticeCreate, PaginatedNotices, AdminStats, UploadResponse,
} from "@/types";

// ───── Auth ─────
export const authService = {
  register: (data: RegisterPayload) => api.post<TokenResponse>("/auth/register", data),
  login: (data: LoginPayload) => api.post<TokenResponse>("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get<User>("/auth/me"),
  updateProfile: (data: ProfileUpdatePayload) => api.put<User>("/auth/me", data),
  forgotPassword: (email: string) => api.post<{ message: string }>("/auth/forgot-password", { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post<{ message: string }>("/auth/reset-password", { token, new_password }),
  googleLogin: (id_token: string) => api.post<TokenResponse>("/auth/google", { id_token }),
};

// ───── Complaints ─────
export const complaintService = {
  list: (params?: { page?: number; page_size?: number; status?: string; category?: string; search?: string }) =>
    api.get<PaginatedComplaints>("/complaints/", { params }),
  getMy: () => api.get<Complaint[]>("/complaints/my"),
  getAssigned: () => api.get<Complaint[]>("/complaints/assigned"),
  getOne: (id: number) => api.get<Complaint>(`/complaints/${id}`),
  getHistory: (id: number) => api.get<ComplaintHistory[]>(`/complaints/${id}/history`),
  create: (data: ComplaintCreate) => api.post<Complaint>("/complaints/", data),
  update: (id: number, data: ComplaintUpdate) => api.put<Complaint>(`/complaints/${id}`, data),
  assign: (id: number, worker_id: number) => api.put<Complaint>(`/complaints/${id}/assign`, { worker_id }),
  delete: (id: number) => api.delete(`/complaints/${id}`),
};

// ───── Rooms ─────
export const roomService = {
  list: (params?: { page?: number; page_size?: number; hostel_name?: string; available_only?: boolean }) =>
    api.get<PaginatedRooms>("/rooms/", { params }),
  getOne: (id: number) => api.get<Room>(`/rooms/${id}`),
  create: (data: RoomCreate) => api.post<Room>("/rooms/", data),
  update: (id: number, data: Partial<RoomCreate & { is_available: boolean }>) =>
    api.put<Room>(`/rooms/${id}`, data),
  delete: (id: number) => api.delete(`/rooms/${id}`),
  assign: (roomId: number, studentId: number) =>
    api.post(`/rooms/${roomId}/assign`, { student_id: studentId }),
  unassign: (roomId: number, studentId: number) =>
    api.delete(`/rooms/${roomId}/assign/${studentId}`),
};

// ───── Notices ─────
export const noticeService = {
  list: (params?: { page?: number; page_size?: number; search?: string }) =>
    api.get<PaginatedNotices>("/notices/", { params }),
  getOne: (id: number) => api.get<Notice>(`/notices/${id}`),
  create: (data: NoticeCreate) => api.post<Notice>("/notices/", data),
  update: (id: number, data: Partial<NoticeCreate>) => api.put<Notice>(`/notices/${id}`, data),
  delete: (id: number) => api.delete(`/notices/${id}`),
};

// ───── Admin ─────
export const adminService = {
  getStats: () => api.get<AdminStats>("/admin/stats"),
  listUsers: (params?: { page?: number; page_size?: number }) =>
    api.get<PaginatedUsers>("/users/", { params }),
  updateRole: (userId: number, role: string) =>
    api.put<User>(`/admin/users/${userId}/role`, { role }),
};

// ───── Uploads ─────
export const uploadService = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<UploadResponse>("/uploads/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
