import { api, get, getPaginated, put, del } from './api'
import type { Photo } from '@/types'

const BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'

export function photoUrl(key?: string | null): string {
  if (!key) return ''
  if (key.startsWith('http://') || key.startsWith('https://')) return key
  return `${BASE}/uploads/${key}`
}

export const photosApi = {
  list: (params?: Record<string, unknown>) =>
    getPaginated<Photo>('/photos', params),

  get: (id: string) =>
    get<Photo>(`/photos/${id}`),

  uploadMeta: (meta: Record<string, unknown>) =>
    api.post('/photos/upload', meta).then(r => r.data.data as Photo),

  update: (id: string, data: Partial<Photo>) =>
    put<Photo>(`/photos/${id}`, data),

  delete: (id: string) =>
    del(`/photos/${id}`),

  setCover: (photoId: string, memoryId: string) =>
    api.post(`/photos/${photoId}/set-cover`, { memory_id: memoryId }).then(r => r.data.data as Photo),

  mapMarkers: (bbox?: string) =>
    get<Array<{ id: string; thumbnail_key: string; lat: number; lng: number; memory_title?: string; place_name?: string; taken_at?: string }>>(
      '/photos/map-markers',
      bbox ? { bbox } : undefined
    ),
}
