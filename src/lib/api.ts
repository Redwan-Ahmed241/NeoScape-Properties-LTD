// Vite environment variable typing for TypeScript
/// <reference types="vite/client" />

import { supabase } from "../services/supabaseClient";

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
}

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

    const response = await fetch(`${API_BASE_URL}/rooms/?${params}`)
    if (!response.ok) {
      throw new Error("Failed to fetch rooms")
    }
    return response.json()
  },

  // Get single room by ID
  getRoom: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}/`)
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
      method: "PUT",
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

// Booking API functions
export const bookingsApi = {
  // Create new booking (requires authentication)
  createBooking: async (bookingData: {
    roomId: string
    checkIn: string
    checkOut: string
    guests: number
    guestInfo: {
      name: string
      email: string
      phone: string
    }
  }) => {
    const response = await apiRequest(`${API_BASE_URL}/bookings/`, {
      method: "POST",
      body: JSON.stringify(bookingData),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to create booking")
    }
    return response.json()
  },

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

  // Get user booking history
  getUserBookings: async (): Promise<any> => {
    const response = await apiRequest(`${API_BASE_URL}/bookings/user-bookings/`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to fetch user bookings")
    }
    return response.json()
  },
}

// ─── Legacy auth functions (kept for backward compat, now delegate to Supabase) ──

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

// User Profile API functions - Updated to use JWT
export const userProfileApi = {
  // Get user profile by username
  getUserProfile: async (username: string): Promise<any> => {
    const response = await apiRequest(`${API_BASE_URL}/auth/user-info/${username}/`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to fetch user profile")
    }
    return response.json()
  },

  // Get current user profile
  getCurrentUserProfile: async (): Promise<any> => {
    const user = await getCurrentUser()
    if (!user) throw new Error("No user logged in")

    return userProfileApi.getUserProfile(user.username)
  },

  // Update user profile
  updateUserProfile: async (profileData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile_no?: string;
    profile_image?: string;
    bio?: string;
  }): Promise<any> => {
    const response = await apiRequest(`${API_BASE_URL}/auth/profile/`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to update user profile")
    }
    return response.json()
  },

  // Change password
  changePassword: async (passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<any> => {
    const response = await apiRequest(`${API_BASE_URL}/auth/change-password/`, {
      method: "POST",
      body: JSON.stringify(passwordData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to change password")
    }
    return response.json()
  },

  // Upload profile image
  uploadProfileImage: async (imageFile: File): Promise<any> => {
    const formData = new FormData()
    formData.append("profile_image", imageFile)

    const response = await apiRequest(`${API_BASE_URL}/auth/upload-profile-image/`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to upload profile image")
    }
    return response.json()
  },
}

// Backward compatibility
export async function getUserProfile(username: string): Promise<any> {
  return userProfileApi.getUserProfile(username)
}

// Upload API functions
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

// Check if user is authenticated (async since it checks Supabase session)
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getSupabaseToken();
  return !!token;
}

// Get current user from Supabase session
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email,
    username: meta.username ?? user.email?.split("@")[0] ?? "",
    phone: meta.phone ?? user.phone,
    role: meta.role ?? "customer",
  };
}
