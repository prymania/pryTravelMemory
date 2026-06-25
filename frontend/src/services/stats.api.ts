import { get } from './api'

export interface GlobalStats {
  trip_count: number
  place_count: number
  memory_count: number
  photo_count: number
  country_count: number
  city_count: number
  total_bytes: number
}

export const statsApi = {
  overview: () => get<GlobalStats>('/stats/overview'),
  countries: () => get<Array<{ country: string; country_code: string; visit_count: number }>>('/stats/countries'),
  cameras:   () => get<Array<{ camera_make: string; camera_model: string; photo_count: number }>>('/stats/cameras'),
}
