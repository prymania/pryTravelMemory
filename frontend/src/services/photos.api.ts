import { api, get, getPaginated, put, del } from './api'
import type { Photo } from '@/types'

const BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'

export function photoUrl(key?: string | null): string {
  if (!key) return ''
  return `${BASE}/uploads/${key}`
}

export const photosApi = {
  list: (params?: Record<string, unknown>) =>
    getPaginated<Photo>('/photos', params),

  get: (id: string) =>
    get<Photo>(`/photos/${id}`),

  upload: async (file: File, memoryId?: string, sortOrder?: number) => {
    const fd = new FormData()
    fd.append('photo', file)
    if (memoryId)   fd.append('memory_id',   memoryId)
    if (sortOrder != null) fd.append('sort_order', String(sortOrder))
    const { data } = await api.post('/photos/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data as Photo & { exif_summary?: { has_gps: boolean; camera: string | null; taken_at: string | null } }
  },

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
