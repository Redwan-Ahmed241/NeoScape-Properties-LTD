export interface Room {
  id: number | string
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
  max_guests?: number // alias for backward compat with mock data
  bedrooms: number
  bathrooms: number
  size: number
  available: boolean
  presenceStatus?: "occupied" | "vacant"
  createdAt?: string
  updatedAt?: string
}

export interface SearchFilters {
  location: string
  checkIn: string
  checkOut: string
  guests: number
  priceRange: [number, number]
  minPrice: number
  maxPrice: number
  roomType: string
  amenities: string[]
}

export interface BookingData {
  roomId: string
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: number
  guestInfo: {
    name: string
    email: string
    phone: string
  }
}

export interface PartialBookingData {
  roomId?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  totalPrice?: number
  guestInfo?: {
    name?: string
    email?: string
    phone?: string
  }
}

export interface Booking {
  id: string
  roomId: string
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: number
  status: "pending" | "confirmed" | "cancelled" | "completed"
  guestInfo: {
    name: string
    email: string
    phone: string
  }
  createdAt: string
  updatedAt: string
  room?: Room
}

export interface AdminStats {
  totalRooms: number
  totalBookings: number
  totalRevenue: number
  occupancyRate: number
}

export interface ApiError {
  message: string
  status: number
}
