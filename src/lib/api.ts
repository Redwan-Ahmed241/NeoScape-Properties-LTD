// Vite environment variable typing for TypeScript
/// <reference types="vite/client" />

import { supabase } from "../services/supabaseClient";
import type { PropertyDocument, RentSchedule, RentPayment, RentReminder } from "./documentTypes";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://room-booking-pjo6.onrender.com/api"

// Room type
interface Room {
  id: string
  name: string
  type: string
  price: number
  rating: number
  reviews: number
  images: string[]
  amenities: string[]
  description: string
  location: string
  maxGuests: number
  bedrooms: number
  bathrooms: number
  size: number
  available: boolean
  presenceStatus?: "occupied" | "vacant"
}

type RentScheduleApi = {
  id: number | string
  room_name: string
  tenant_name: string
  tenant_email: string
  tenant_phone: string
  monthly_rent: number
  due_day: number
  start_date: string
  end_date?: string | null
  status: "active" | "paused" | "completed"
  payment_history: RentPaymentApi[]
}

type RentPaymentApi = {
  id: number | string
  schedule_id?: number | string
  due_date: string
  paid_date?: string | null
  amount: number
  paid_amount?: number
  status: "pending" | "paid" | "overdue" | "partial"
  payment_method?: string
  notes?: string
}

const mapPaymentFromApi = (payment: RentPaymentApi): RentPayment => ({
  id: String(payment.id),
  scheduleId: String(payment.schedule_id ?? ""),
  dueDate: payment.due_date,
  paidDate: payment.paid_date || undefined,
  amount: Number(payment.amount),
  paidAmount: payment.paid_amount ? Number(payment.paid_amount) : undefined,
  status: payment.status,
  paymentMethod: payment.payment_method || "",
  notes: payment.notes || "",
});

const mapScheduleFromApi = (schedule: RentScheduleApi): RentSchedule => ({
  id: String(schedule.id),
  roomId: String(schedule.id),
  roomName: schedule.room_name,
  tenantName: schedule.tenant_name,
  tenantEmail: schedule.tenant_email,
  tenantPhone: schedule.tenant_phone,
  monthlyRent: Number(schedule.monthly_rent),
  dueDay: schedule.due_day,
  startDate: schedule.start_date,
  endDate: schedule.end_date || undefined,
  status: schedule.status,
  paymentHistory: (schedule.payment_history || []).map(mapPaymentFromApi),
});

const mapScheduleToApi = (schedule: Partial<RentSchedule>) => ({
  room_name: schedule.roomName,
  tenant_name: schedule.tenantName,
  tenant_email: schedule.tenantEmail,
  tenant_phone: schedule.tenantPhone,
  monthly_rent: schedule.monthlyRent,
  due_day: schedule.dueDay,
  start_date: schedule.startDate,
  end_date: schedule.endDate || null,
  status: schedule.status,
});

const mapDocumentFromApi = (doc: any): PropertyDocument => ({
  id: String(doc.id),
  propertyId: doc.propertyId || "",
  roomId: doc.roomId || undefined,
  tenantId: doc.tenantId || undefined,
  tenantUsername: doc.tenantUsername || undefined,
  tenantEmail: doc.tenantEmail || undefined,
  assignmentId: doc.assignmentId || undefined,
  uploadedBy: doc.uploadedBy || undefined,
  name: doc.name,
  type: doc.type,
  description: doc.description || "",
  fileUrl: doc.fileUrl,
  uploadDate: doc.uploadDate || "",
  expiryDate: doc.expiryDate || undefined,
  renewalDate: doc.renewalDate || undefined,
  reviewedAt: doc.reviewedAt || undefined,
  status: doc.status,
  reminderDays: doc.reminderDays || undefined,
  notes: doc.notes || "",
  adminNotes: doc.adminNotes || "",
  metadata: doc.metadata || undefined,
});

const mapDocumentToApi = (doc: Partial<PropertyDocument>) => ({
  propertyId: doc.propertyId,
  roomId: doc.roomId || null,
  tenantId: doc.tenantId || null,
  assignmentId: doc.assignmentId || null,
  name: doc.name,
  type: doc.type,
  description: doc.description || "",
  fileUrl: doc.fileUrl,
  expiryDate: doc.expiryDate || null,
  renewalDate: doc.renewalDate || null,
  status: doc.status,
  reminderDays: doc.reminderDays || 30,
  notes: doc.notes || "",
  adminNotes: doc.adminNotes || "",
  metadata: doc.metadata || {},
});

/**
 * Get the current Supabase JWT access token.
 * Supabase automatically refreshes it when expired, so this always
 * returns a valid token (or null if user is signed out).
 */
async function getSupabaseToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * API request wrapper.
 * Attaches the Supabase JWT as a Bearer token on every request.
 * On 401, forces a session refresh and retries once.
 */
async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getSupabaseToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  let response = await fetch(url, { ...options, headers })

  // If unauthorized, try to refresh the Supabase session and retry once
  if (response.status === 401) {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error || !session) {
      // Refresh failed — sign out and throw
      await supabase.auth.signOut();
      throw new Error("Session expired. Please sign in again.");
    }
    headers['Authorization'] = `Bearer ${session.access_token}`;
    response = await fetch(url, { ...options, headers });
  }

  return response
}

// Room API functions
export const roomsApi = {
  // Get all rooms with filters
  getRooms: async (filters?: {
    location?: string
    checkIn?: string
    checkOut?: string
    guests?: number
    minPrice?: number
    maxPrice?: number
    roomType?: string
    amenities?: string[]
  }) => {
    const params = new URLSearchParams()

    if (filters?.location) params.append("location", filters.location)
    if (filters?.checkIn) params.append("check_in", filters.checkIn)
    if (filters?.checkOut) params.append("check_out", filters.checkOut)
    if (filters?.guests) params.append("guests", filters.guests.toString())
    if (filters?.minPrice) params.append("min_price", filters.minPrice.toString())
    if (filters?.maxPrice) params.append("max_price", filters.maxPrice.toString())
    if (filters?.roomType) params.append("room_type", filters.roomType)
    if (filters?.amenities) {
      filters.amenities.forEach((amenity) => params.append("amenities", amenity))
    }

    const response = await apiRequest(`${API_BASE_URL}/rooms/?${params}`)
    if (!response.ok) {
      throw new Error("Failed to fetch rooms")
    }
    return response.json()
  },

  // Get single room by ID
  getRoom: async (id: string) => {
    const response = await apiRequest(`${API_BASE_URL}/rooms/${id}/`)
    if (!response.ok) {
      throw new Error("Failed to fetch room")
    }
    return response.json()
  },

  // Create new room (admin only)
  createRoom: async (roomData: Partial<Room>) => {
    const response = await apiRequest(`${API_BASE_URL}/rooms/`, {
      method: "POST",
      body: JSON.stringify(roomData),
    })
    if (!response.ok) {
      throw new Error("Failed to create room")
    }
    return response.json()
  },

  // Update room (admin only)
  updateRoom: async (id: string, roomData: Partial<Room>) => {
    const response = await apiRequest(`${API_BASE_URL}/rooms/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(roomData),
    })
    if (!response.ok) {
      throw new Error("Failed to update room")
    }
    return response.json()
  },

  // Delete room (admin only)
  deleteRoom: async (id: string) => {
    const response = await apiRequest(`${API_BASE_URL}/rooms/${id}/`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Failed to delete room")
    }
    // Handle cases where response may have no body (204)
    const text = await response.text()
    return text ? JSON.parse(text) : { success: true }
  },
}

// Booking API functions (admin-only)
export const bookingsApi = {
  // Get all bookings (admin only)
  getBookings: async () => {
    const response = await apiRequest(`${API_BASE_URL}/bookings/`)
    if (!response.ok) {
      throw new Error("Failed to fetch bookings")
    }
    return response.json()
  },

  // Update booking status (admin only)
  updateBookingStatus: async (id: string, status: string) => {
    const response = await apiRequest(`${API_BASE_URL}/bookings/${id}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    if (!response.ok) {
      throw new Error("Failed to update booking status")
    }
    return response.json()
  },
}

export const rentSchedulesApi = {
  list: async (): Promise<RentSchedule[]> => {
    const response = await apiRequest(`${API_BASE_URL}/bookings/rent-schedules/`)
    if (!response.ok) {
      throw new Error("Failed to fetch rent schedules")
    }
    const data = await response.json()
    return (data.data || []).map(mapScheduleFromApi)
  },
  create: async (schedule: Partial<RentSchedule>): Promise<RentSchedule> => {
    const response = await apiRequest(`${API_BASE_URL}/bookings/rent-schedules/`, {
      method: "POST",
      body: JSON.stringify(mapScheduleToApi(schedule)),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to create rent schedule")
    }
    const data = await response.json()
    return mapScheduleFromApi(data.data)
  },
  update: async (id: string, schedule: Partial<RentSchedule>): Promise<RentSchedule> => {
    const response = await apiRequest(`${API_BASE_URL}/bookings/rent-schedules/${id}/`, {
      method: "PUT",
      body: JSON.stringify(mapScheduleToApi(schedule)),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to update rent schedule")
    }
    const data = await response.json()
    return mapScheduleFromApi(data.data)
  },
  remove: async (id: string): Promise<void> => {
    const response = await apiRequest(`${API_BASE_URL}/bookings/rent-schedules/${id}/`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Failed to delete rent schedule")
    }
  },
  recordPayment: async (scheduleId: string, payment: Partial<RentPayment>): Promise<RentPayment> => {
    const response = await apiRequest(`${API_BASE_URL}/bookings/rent-schedules/${scheduleId}/payments/`, {
      method: "POST",
      body: JSON.stringify({
        due_date: payment.dueDate,
        paid_date: payment.paidDate,
        amount: payment.amount,
        paid_amount: payment.paidAmount,
        status: payment.status,
        payment_method: payment.paymentMethod,
        notes: payment.notes,
      }),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to record payment")
    }
    const data = await response.json()
    return mapPaymentFromApi(data.data)
  },
  reminders: async (): Promise<RentReminder[]> => {
    const response = await apiRequest(`${API_BASE_URL}/bookings/rent-reminders/`)
    if (!response.ok) {
      throw new Error("Failed to fetch rent reminders")
    }
    const data = await response.json()
    return data.data || []
  },
}

export const documentsApi = {
  list: async (filters?: string | {
    roomId?: string;
    propertyId?: string;
    tenantId?: string;
    isPropertyLevel?: boolean;
    isRoomLevel?: boolean;
    isTenantLevel?: boolean;
  }): Promise<PropertyDocument[]> => {
    const params = new URLSearchParams()
    if (typeof filters === "string") {
      params.append("room_id", filters)
    } else if (filters) {
      if (filters.roomId) params.append("room_id", filters.roomId)
      if (filters.propertyId) params.append("property_id", filters.propertyId)
      if (filters.tenantId) params.append("tenant_id", filters.tenantId)
      if (filters.isPropertyLevel) params.append("is_property_level", "true")
      if (filters.isRoomLevel) params.append("is_room_level", "true")
      if (filters.isTenantLevel) params.append("is_tenant_level", "true")
    }
    
    const query = params.toString() ? `?${params.toString()}` : ""
    const response = await apiRequest(`${API_BASE_URL}/rooms/documents/${query}`)
    if (!response.ok) {
      throw new Error("Failed to fetch documents")
    }
    const data = await response.json()
    return (data.data || []).map(mapDocumentFromApi)
  },
  create: async (doc: Partial<PropertyDocument>): Promise<PropertyDocument> => {
    const response = await apiRequest(`${API_BASE_URL}/rooms/documents/`, {
      method: "POST",
      body: JSON.stringify(mapDocumentToApi(doc)),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to create document")
    }
    const data = await response.json()
    return mapDocumentFromApi(data.data)
  },
  update: async (id: string, doc: Partial<PropertyDocument>): Promise<PropertyDocument> => {
    const response = await apiRequest(`${API_BASE_URL}/rooms/documents/${id}/`, {
      method: "PUT",
      body: JSON.stringify(mapDocumentToApi(doc)),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to update document")
    }
    const data = await response.json()
    return mapDocumentFromApi(data.data)
  },
  remove: async (id: string): Promise<void> => {
    const response = await apiRequest(`${API_BASE_URL}/rooms/documents/${id}/`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Failed to delete document")
    }
  },
  upload: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await apiRequest(`${API_BASE_URL}/rooms/documents/upload/`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to upload document")
    }
    const data = await response.json()
    return data.data.url
  },
}


// Upload API functions (admin-only)
export const uploadApi = {
  // Upload room images
  uploadImages: async (files: FileList) => {
    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append("images", file)
    })

    const response = await apiRequest(`${API_BASE_URL}/upload/images`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload images")
    }

    return response.json()
  },
}

// ── Property Images API ──────────────────────────────────────────────────────

export interface PropertyImageRecord {
  id: number | string
  property_name: string
  image_url: string
  caption: string
  is_primary: boolean
  sort_order: number
  created_at: string
}

export const propertyImagesApi = {
  list: async (propertyName?: string): Promise<PropertyImageRecord[]> => {
    const params = propertyName ? `?property_name=${encodeURIComponent(propertyName)}` : ""
    const response = await apiRequest(`${API_BASE_URL}/rooms/property-images/${params}`)
    if (!response.ok) {
      throw new Error("Failed to fetch property images")
    }
    const data = await response.json()
    return data.data || []
  },
  create: async (record: Partial<PropertyImageRecord>): Promise<PropertyImageRecord> => {
    const response = await apiRequest(`${API_BASE_URL}/rooms/property-images/`, {
      method: "POST",
      body: JSON.stringify(record),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to create property image")
    }
    const data = await response.json()
    return data.data
  },
  update: async (id: string | number, record: Partial<PropertyImageRecord>): Promise<PropertyImageRecord> => {
    const response = await apiRequest(`${API_BASE_URL}/rooms/property-images/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(record),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to update property image")
    }
    const data = await response.json()
    return data.data
  },
  remove: async (id: string | number): Promise<void> => {
    const response = await apiRequest(`${API_BASE_URL}/rooms/property-images/${id}/`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Failed to delete property image")
    }
  },
}

// Note: Legacy propertyLevelDocsApi was consolidated into documentsApi above.

// Check if user is authenticated (async since it checks Supabase session)
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getSupabaseToken();
  return !!token;
}

