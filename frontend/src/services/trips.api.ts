import { get, getPaginated, post, put, del } from './api'
import type { Trip, Place, Memory } from '@/types'

export const tripsApi = {
  list: (params?: Record<string, unknown>) =>
    getPaginated<Trip>('/trips', params),

  get: (id: string) =>
    get<Trip>(`/trips/${id}`),

  create: (data: Partial<Trip>) =>
    post<Trip>('/trips', data),

  update: (id: string, data: Partial<Trip>) =>
    put<Trip>(`/trips/${id}`, data),

  delete: (id: string) =>
    del(`/trips/${id}`),

  getPlaces: (tripId: string) =>
    get<Place[]>(`/trips/${tripId}/places`),
}

export const placesApi = {
  get: (id: string) =>
    get<Place>(`/places/${id}`),

  create: (data: Partial<Place>) =>
    post<Place>('/places', data),

  update: (id: string, data: Partial<Place>) =>
    put<Place>(`/places/${id}`, data),

  delete: (id: string) =>
    del(`/places/${id}`),

  getMemories: (placeId: string) =>
    get<Memory[]>(`/places/${placeId}/memories`),
}

export const memoriesApi = {
  list: (params?: Record<string, unknown>) =>
    getPaginated<Memory>('/memories', params),

  get: (id: string) =>
    get<Memory>(`/memories/${id}`),

  create: (data: Partial<Memory>) =>
    post<Memory>('/memories', data),

  update: (id: string, data: Partial<Memory>) =>
    put<Memory>(`/memories/${id}`, data),

  delete: (id: string) =>
    del(`/memories/${id}`),

  onThisDay: () =>
    get<Memory[]>('/memories/on-this-day'),
}
