import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { post, put } from '@/services/api'
import TagPicker from '@/components/tags/TagPicker'
import type { Trip, TripStatus } from '@/types'

const STATUSES: TripStatus[] = ['planned', 'ongoing', 'completed']

interface TripFormProps {
  trip?: Trip
  onSuccess?: (trip: Trip) => void
  onCancel?: () => void
}

export default function TripForm({ trip, onSuccess, onCancel }: TripFormProps) {
  const isEdit = !!trip
  const qc = useQueryClient()

  const [form, setForm] = useState({
    title:       trip?.title       ?? '',
    description: trip?.description ?? '',
    start_date:  trip?.start_date  ?? '',
    end_date:    trip?.end_date    ?? '',
    status:      trip?.status      ?? ('planned' as TripStatus),
    visibility:  trip?.visibility  ?? 'private',
  })
  const [selectedTags, setSelectedTags] = useState<string[]>(
    trip?.tags?.map(t => t.id) ?? []
  )

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        start_date:  form.start_date  || null,
        end_date:    form.end_date    || null,
        description: form.description || null,
        tags: selectedTags,
      }
      return isEdit
        ? put<Trip>(`/trips/${trip!.id}`, body)
        : post<Trip>('/trips', body)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['trips'] })
      onSuccess?.(data)
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
        <input
          className="input w-full"
          placeholder="Where did you go?"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
        <textarea
          className="input w-full resize-none"
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Start date</label>
          <input type="date" className="input w-full" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">End date</label>
          <input type="date" className="input w-full" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
        <TagPicker selectedIds={selectedTags} onChange={setSelectedTags} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
        <div className="flex gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => set('status', s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                form.status === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-500">
          {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save'}
        </p>
      )}

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && <button onClick={onCancel} className="btn-secondary">Cancel</button>}
        <button
          onClick={() => mutation.mutate()}
          disabled={!form.title.trim() || mutation.isPending}
          className="btn-primary disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : isEdit ? 'Update Trip' : 'Create Trip'}
        </button>
      </div>
    </div>
  )
}
