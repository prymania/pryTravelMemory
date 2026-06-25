import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Loader2 } from 'lucide-react'
import { post, put } from '@/services/api'
import type { Place } from '@/types'

interface PlaceFormProps {
  tripId: string
  place?: Place
  onSuccess?: (place: Place) => void
  onCancel?: () => void
}

export default function PlaceForm({ tripId, place, onSuccess, onCancel }: PlaceFormProps) {
  const isEdit = !!place
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name:        place?.name        ?? '',
    name_local:  place?.name_local  ?? '',
    city:        place?.city        ?? '',
    country:     place?.country     ?? '',
    country_code:place?.country_code?? '',
    address:     place?.address     ?? '',
    latitude:    place?.latitude != null  ? String(place.latitude)  : '',
    longitude:   place?.longitude != null ? String(place.longitude) : '',
    visited_at:  place?.visited_at  ?? '',
  })
  const [geoLoading, setGeoLoading] = useState(false)

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const autoGeocode = async () => {
    if (!form.name && !form.city) return
    const q = [form.name, form.city, form.country].filter(Boolean).join(', ')
    setGeoLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
      )
      const data = await res.json()
      if (data[0]) {
        setForm(prev => ({
          ...prev,
          latitude:  String(data[0].lat),
          longitude: String(data[0].lon),
        }))
      }
    } catch {}
    setGeoLoading(false)
  }

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        trip_id:   tripId,
        latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        visited_at: form.visited_at || null,
        name_local:   form.name_local   || null,
        city:         form.city         || null,
        country:      form.country      || null,
        country_code: form.country_code || null,
        address:      form.address      || null,
      }
      return isEdit
        ? put<Place>(`/places/${place!.id}`, body)
        : post<Place>('/places', body)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['places', tripId] })
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      onSuccess?.(data)
    },
  })

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Place Name *</label>
        <input
          className="input w-full"
          placeholder="e.g. Kyoto, Fushimi Inari, Grand Palace…"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Local name</label>
          <input className="input w-full" placeholder="ชื่อภาษาท้องถิ่น" value={form.name_local} onChange={e => set('name_local', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Visit date</label>
          <input type="date" className="input w-full" value={form.visited_at} onChange={e => set('visited_at', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">City</label>
          <input className="input w-full" value={form.city} onChange={e => set('city', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Country</label>
          <input className="input w-full" value={form.country} onChange={e => set('country', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Address</label>
        <input className="input w-full" value={form.address} onChange={e => set('address', e.target.value)} />
      </div>

      {/* GPS */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GPS Coordinates</label>
          <button
            type="button"
            onClick={autoGeocode}
            disabled={geoLoading}
            className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
          >
            {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
            Auto-detect
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="input w-full" placeholder="Latitude" value={form.latitude}  onChange={e => set('latitude',  e.target.value)} />
          <input className="input w-full" placeholder="Longitude" value={form.longitude} onChange={e => set('longitude', e.target.value)} />
        </div>
        <p className="text-xs text-gray-400 mt-1">Used to show this place on the map</p>
      </div>

      {/* Error */}
      {mutation.isError && (
        <p className="text-sm text-red-500">
          {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Something went wrong'}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        {onCancel && <button onClick={onCancel} className="btn-secondary">Cancel</button>}
        <button
          onClick={() => mutation.mutate()}
          disabled={!form.name.trim() || mutation.isPending}
          className="btn-primary disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : isEdit ? 'Update Place' : 'Add Place'}
        </button>
      </div>
    </div>
  )
}
