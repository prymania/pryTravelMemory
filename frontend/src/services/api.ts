import axios from 'axios'
import type { ApiResponse, PaginatedResponse } from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let refreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise(resolve =>
          queue.push(token => { original.headers.Authorization = `Bearer ${token}`; resolve(api(original)) })
        )
      }

      original._retry = true
      refreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        const { accessToken } = data.data
        localStorage.setItem('accessToken', accessToken)
        queue.forEach(cb => cb(accessToken))
        queue = []
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  }
)

// Typed helpers
export const get = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<ApiResponse<T>>(url, { params }).then(r => r.data.data)

export const getPaginated = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<PaginatedResponse<T>>(url, { params }).then(r => r.data)

export const post = <T>(url: string, body?: unknown) =>
  api.post<ApiResponse<T>>(url, body).then(r => r.data.data)

export const put = <T>(url: string, body?: unknown) =>
  api.put<ApiResponse<T>>(url, body).then(r => r.data.data)

export const del = (url: string) =>
  api.delete<ApiResponse<null>>(url).then(r => r.data)
