// =====================
// Core Types
// =====================

export type MoodType = 'amazing' | 'happy' | 'peaceful' | 'neutral' | 'tired' | 'nostalgic' | 'sad' | 'excited' | 'romantic'
export type WeatherType = 'sunny' | 'cloudy' | 'partly_cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy' | 'windy' | 'hot' | 'cold'
export type VisibilityType = 'private' | 'public' | 'shared_link' | 'password_protected'
export type TripStatus = 'planned' | 'ongoing' | 'completed'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string | null
  preferences?: Record<string, unknown>
  created_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  icon?: string | null
  usage_count: number
}

export interface Trip {
  id: string
  user_id: string
  title: string
  description?: string | null
  content_markdown?: string | null
  start_date?: string | null
  end_date?: string | null
  cover_photo_id?: string | null
  cover_photo_key?: string | null
  cover_thumbnail_key?: string | null
  status: TripStatus
  visibility: VisibilityType
  share_token?: string
  place_count: number
  memory_count: number
  photo_count: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  tags?: Tag[]
  stats?: TripStats
}

export interface TripStats {
  place_count: string
  memory_count: string
  photo_count: string
  country_count: string
  city_count: string
}

export interface Place {
  id: string
  trip_id: string
  user_id: string
  name: string
  name_local?: string | null
  country?: string | null
  country_code?: string | null
  province?: string | null
  city?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  altitude?: number | null
  google_map_url?: string | null
  google_place_id?: string | null
  visited_at?: string | null
  visited_time?: string | null
  sort_order: number
  memory_count: number
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface Memory {
  id: string
  place_id: string
  user_id: string
  title: string
  description?: string | null
  note?: string | null
  content_markdown?: string | null
  mood?: MoodType | null
  weather?: WeatherType | null
  rating?: number | null
  is_favorite: boolean
  visibility: VisibilityType
  memory_date?: string | null
  memory_time?: string | null
  version: number
  photo_count?: string | number
  cover_photo_key?: string | null
  place_name?: string
  city?: string
  country?: string
  trip_title?: string
  trip_id?: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  memory_id?: string | null
  user_id: string
  filename: string
  original_filename?: string | null
  storage_key: string
  thumbnail_key?: string | null
  medium_key?: string | null
  file_size?: number | null
  mime_type?: string | null
  width?: number | null
  height?: number | null
  caption?: string | null
  description?: string | null
  is_highlight: boolean
  is_favorite: boolean
  is_cover: boolean
  sort_order: number
  latitude?: number | null
  longitude?: number | null
  taken_at?: string | null
  exif_data?: Record<string, unknown>
  camera_make?: string | null
  camera_model?: string | null
  lens_model?: string | null
  focal_length?: number | null
  aperture?: number | null
  iso?: number | null
  shutter_speed?: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

// =====================
// API Response
// =====================

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// =====================
// Auth
// =====================

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}
