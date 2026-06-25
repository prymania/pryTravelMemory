import { get } from './api'

export interface PlaceMarker {
  id: string
  trip_id: string
  name: string
  city?: string
  country?: string
  visited_at?: string
  latitude: number
  longitude: number
  memory_count: number
  trip_title: string
}

export const mapApi = {
  places: () => get<PlaceMarker[]>('/places'),
}
