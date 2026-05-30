/// <reference types="vite/client" />

import { supabase } from "../services/supabaseClient";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://room-booking-pjo6.onrender.com/api";

async function getSupabaseToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getSupabaseToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData))
    headers["Content-Type"] = "application/json";

  let response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();
    if (error || !session) {
      await supabase.auth.signOut();
      throw new Error("Session expired. Please sign in again.");
    }
    headers["Authorization"] = `Bearer ${session.access_token}`;
    response = await fetch(url, { ...options, headers });
  }
  return response;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TenantAssignment {
  id: number;
  tenantId: number;
  tenantUsername: string;
  tenantEmail: string;
  roomId: number;
  roomName: string;
  roomLocation: string;
  property_name: string;
  start_date: string;
  end_date?: string | null;
  status: "active" | "ended" | "pending";
  monthly_rent: number;
  deposit: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TenantRentSchedule {
  id: number;
  room_name: string;
  tenant_name: string;
  tenant_email: string;
  monthly_rent: number;
  due_day: number;
  start_date: string;
  end_date?: string | null;
  status: string;
  payment_history: TenantRentPayment[];
}

export interface TenantRentPayment {
  id: number;
  due_date: string;
  paid_date?: string | null;
  amount: number;
  paid_amount: number;
  status: "pending" | "paid" | "overdue" | "partial";
  payment_method: string;
  notes: string;
}

export interface TenantRentReminder {
  id: string;
  scheduleId: number;
  roomName: string;
  dueDate: string;
  amount: number;
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface TenantDocumentItem {
  id: number;
  tenantId: number;
  tenantUsername: string;
  tenantEmail: string;
  name: string;
  type: string;
  description: string;
  file_url: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string;
  uploaded_at: string;
  reviewed_at?: string | null;
}

export interface AppNotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string;
  createdAt: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
}

// ─── Tenant Assignment API ──────────────────────────────────────────────────

export const tenantAssignmentApi = {
  list: async (status?: string): Promise<TenantAssignment[]> => {
    const url = status
      ? `${API_BASE_URL}/bookings/tenant-assignments/?status=${status}`
      : `${API_BASE_URL}/bookings/tenant-assignments/`;
    const res = await apiRequest(url);
    const json = await res.json();
    return json.data || [];
  },

  create: async (
    data: Partial<{
      tenant_id: number;
      room_id: number;
      property_name: string;
      start_date: string;
      end_date: string;
      monthly_rent: number;
      deposit: number;
      notes: string;
    }>
  ): Promise<TenantAssignment> => {
    const res = await apiRequest(
      `${API_BASE_URL}/bookings/tenant-assignments/`,
      { method: "POST", body: JSON.stringify(data) }
    );
    const json = await res.json();
    if (!json.success) throw new Error(JSON.stringify(json.error));
    return json.data;
  },

  update: async (
    id: number,
    data: Partial<TenantAssignment>
  ): Promise<TenantAssignment> => {
    const res = await apiRequest(
      `${API_BASE_URL}/bookings/tenant-assignments/${id}/`,
      { method: "PUT", body: JSON.stringify(data) }
    );
    const json = await res.json();
    if (!json.success) throw new Error(JSON.stringify(json.error));
    return json.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiRequest(
      `${API_BASE_URL}/bookings/tenant-assignments/${id}/`,
      { method: "DELETE" }
    );
  },

  // Tenant's own assignment
  myAssignment: async (): Promise<{
    assignment: TenantAssignment | null;
    room: any | null;
  }> => {
    const res = await apiRequest(
      `${API_BASE_URL}/bookings/my-assignment/`
    );
    const json = await res.json();
    return json.data || { assignment: null, room: null };
  },
};

// ─── Tenant Rent API ────────────────────────────────────────────────────────

export const tenantRentApi = {
  mySchedules: async (): Promise<TenantRentSchedule[]> => {
    const res = await apiRequest(
      `${API_BASE_URL}/bookings/my-rent-schedules/`
    );
    const json = await res.json();
    return json.data || [];
  },

  myReminders: async (): Promise<TenantRentReminder[]> => {
    const res = await apiRequest(
      `${API_BASE_URL}/bookings/my-rent-reminders/`
    );
    const json = await res.json();
    return json.data || [];
  },
};

// ─── Tenant Document API ────────────────────────────────────────────────────

export const tenantDocumentApi = {
  list: async (filters?: {
    tenant_id?: number;
    status?: string;
  }): Promise<TenantDocumentItem[]> => {
    const params = new URLSearchParams();
    params.set("is_tenant_level", "true");
    if (filters?.tenant_id) params.set("tenant_id", String(filters.tenant_id));
    if (filters?.status) params.set("status", filters.status);
    const url = `${API_BASE_URL}/rooms/documents/?${params.toString()}`;
    const res = await apiRequest(url);
    const json = await res.json();
    return (json.data || []).map((doc: any) => ({
      ...doc,
      file_url: doc.fileUrl,
      admin_notes: doc.adminNotes,
      uploaded_at: doc.uploadDate,
      reviewed_at: doc.reviewedAt,
    }));
  },

  create: async (data: {
    name: string;
    type: string;
    description?: string;
    file_url: string;
  }): Promise<TenantDocumentItem> => {
    const body = {
      name: data.name,
      type: data.type,
      description: data.description,
      fileUrl: data.file_url,
      propertyId: "", // Will be auto-populated by backend based on active assignment
    };
    const res = await apiRequest(
      `${API_BASE_URL}/rooms/documents/`,
      { method: "POST", body: JSON.stringify(body) }
    );
    const json = await res.json();
    if (!json.success) throw new Error(JSON.stringify(json.error));
    return {
      ...json.data,
      file_url: json.data.fileUrl,
      admin_notes: json.data.adminNotes,
      uploaded_at: json.data.uploadDate,
      reviewed_at: json.data.reviewedAt,
    };
  },

  upload: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiRequest(
      `${API_BASE_URL}/rooms/documents/upload/`,
      { method: "POST", body: formData }
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Upload failed");
    return json.data.url;
  },

  review: async (
    id: number,
    data: { status: string; admin_notes?: string }
  ): Promise<TenantDocumentItem> => {
    const body = {
      status: data.status,
      adminNotes: data.admin_notes
    };
    const res = await apiRequest(
      `${API_BASE_URL}/rooms/documents/${id}/`,
      { method: "PATCH", body: JSON.stringify(body) }
    );
    const json = await res.json();
    if (!json.success) throw new Error(JSON.stringify(json.error));
    return {
      ...json.data,
      file_url: json.data.fileUrl,
      admin_notes: json.data.adminNotes,
      uploaded_at: json.data.uploadDate,
      reviewed_at: json.data.reviewedAt,
    };
  },

  remove: async (id: number): Promise<void> => {
    await apiRequest(
      `${API_BASE_URL}/rooms/documents/${id}/`,
      { method: "DELETE" }
    );
  },
};

// ─── Notification API ───────────────────────────────────────────────────────

export const notificationApi = {
  list: async (unreadOnly = false): Promise<{
    data: AppNotificationItem[];
    unreadCount: number;
  }> => {
    const url = unreadOnly
      ? `${API_BASE_URL}/notifications/?unread=true`
      : `${API_BASE_URL}/notifications/`;
    const res = await apiRequest(url);
    const json = await res.json();
    return { data: json.data || [], unreadCount: json.unreadCount || 0 };
  },

  markRead: async (id: number): Promise<void> => {
    await apiRequest(`${API_BASE_URL}/notifications/${id}/read/`, {
      method: "PATCH",
    });
  },

  markAllRead: async (): Promise<void> => {
    await apiRequest(`${API_BASE_URL}/notifications/read-all/`, {
      method: "POST",
    });
  },
};

// ─── Users API (admin) ──────────────────────────────────────────────────────

export const usersApi = {
  list: async (role?: string): Promise<UserInfo[]> => {
    const url = role
      ? `${API_BASE_URL}/accounts/users/?role=${role}`
      : `${API_BASE_URL}/accounts/users/`;
    const res = await apiRequest(url);
    const json = await res.json();
    return json.data || [];
  },

  setRole: async (
    userId: number,
    role: string
  ): Promise<{ userId: number; role: string }> => {
    const res = await apiRequest(`${API_BASE_URL}/accounts/manage-role/`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },
};

// ─── Public API (no auth) ───────────────────────────────────────────────────

export const publicApi = {
  getProperties: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE_URL}/rooms/public/properties/`);
    const json = await res.json();
    return json.data || [];
  },

  getRooms: async (filters?: {
    location?: string;
    room_type?: string;
    min_price?: number;
    max_price?: number;
    guests?: number;
  }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.location) params.set("location", filters.location);
    if (filters?.room_type) params.set("room_type", filters.room_type);
    if (filters?.min_price)
      params.set("min_price", String(filters.min_price));
    if (filters?.max_price)
      params.set("max_price", String(filters.max_price));
    if (filters?.guests) params.set("guests", String(filters.guests));
    const res = await fetch(
      `${API_BASE_URL}/rooms/public/?${params}`
    );
    const json = await res.json();
    return json.data || [];
  },

  getRoom: async (id: number): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/rooms/public/${id}/`);
    const json = await res.json();
    return json.data;
  },

  submitInterest: async (data: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    roomId?: number;
    property_name?: string;
  }): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/rooms/public/interest/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(JSON.stringify(json.error));
    return json;
  },
};
