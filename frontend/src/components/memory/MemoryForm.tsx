import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { post, put } from '@/services/api'
import TagPicker from '@/components/tags/TagPicker'
import type { Memory, MoodType, WeatherType } from '@/types'

const MOODS: { value: MoodType; emoji: string; label: string }[] = [
  { value: 'amazing',   emoji: '🤩', label: 'Amazing'   },
  { value: 'happy',     emoji: '😊', label: 'Happy'     },
  { value: 'excited',   emoji: '🎉', label: 'Excited'   },
  { value: 'peaceful',  emoji: '😌', label: 'Peaceful'  },
  { value: 'romantic',  emoji: '💕', label: 'Romantic'  },
  { value: 'nostalgic', emoji: '🥲', label: 'Nostalgic' },
  { value: 'neutral',   emoji: '😐', label: 'Neutral'   },
  { value: 'tired',     emoji: '😴', label: 'Tired'     },
  { value: 'sad',       emoji: '😢', label: 'Sad'       },
]

const WEATHERS: { value: WeatherType; emoji: string; label: string }[] = [
  { value: 'sunny',        emoji: '☀️', label: 'Sunny'    },
  { value: 'partly_cloudy',emoji: '⛅', label: 'Partly cloudy' },
  { value: 'cloudy',       emoji: '☁️', label: 'Cloudy'   },
  { value: 'rainy',        emoji: '🌧️', label: 'Rainy'    },
  { value: 'stormy',       emoji: '⛈️', label: 'Stormy'   },
  { value: 'snowy',        emoji: '❄️', label: 'Snowy'    },
  { value: 'hot',          emoji: '🔥', label: 'Hot'      },
  { value: 'cold',         emoji: '🧊', label: 'Cold'     },
]

interface MemoryFormProps {
  placeId: string
  memory?: Memory
  onSuccess?: (memory: Memory) => void
  onCancel?: () => void
}

export default function MemoryForm({ placeId, memory, onSuccess, onCancel }: MemoryFormProps) {
  const isEdit = !!memory
  const qc = useQueryClient()

  const [form, setForm] = useState({
    title:            memory?.title          ?? '',
    description:      memory?.description   ?? '',
    content_markdown: memory?.content_markdown ?? '',
    mood:             memory?.mood           ?? ('' as MoodType | ''),
    weather:          memory?.weather        ?? ('' as WeatherType | ''),
    rating:           memory?.rating         ?? (0 as number),
    memory_date:      memory?.memory_date    ?? '',
    memory_time:      memory?.memory_time    ?? '',
    is_favorite:      memory?.is_favorite    ?? false,
  })
  const [selectedTags, setSelectedTags] = useState<string[]>(
    (memory as Memory & { tags?: Array<{ id: string }> })?.tags?.map(t => t.id) ?? []
  )

  const set = (key: string, val: unknown) => setForm(prev => ({ ...prev, [key]: val }))

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        place_id: placeId,
        mood:    form.mood    || null,
        weather: form.weather || null,
        rating:  form.rating  || null,
        memory_date: form.memory_date || null,
        memory_time: form.memory_time || null,
        tags: selectedTags,
      }
      return isEdit
        ? put<Memory>(`/memories/${memory!.id}`, body)
        : post<Memory>('/memories', body)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['memories'] })
      qc.invalidateQueries({ queryKey: ['place'] })
      onSuccess?.(data)
    },
  })

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
        <input
          className="input w-full"
          placeholder="What happened here?"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          autoFocus
        />
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
          <input type="date" className="input w-full" value={form.memory_date} onChange={e => set('memory_date', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Time</label>
          <input type="time" className="input w-full" value={form.memory_time} onChange={e => set('memory_time', e.target.value)} />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
        <textarea
          className="input w-full resize-none"
          rows={3}
          placeholder="A short description…"
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      {/* Notes / journal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Journal</label>
        <textarea
          className="input w-full resize-none font-mono text-sm"
          rows={5}
          placeholder="Write your story… (Markdown supported)"
          value={form.content_markdown}
          onChange={e => set('content_markdown', e.target.value)}
        />
      </div>

      {/* Mood */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mood</label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => set('mood', form.mood === m.value ? '' : m.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                form.mood === m.value
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-1 ring-primary-400'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weather */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weather</label>
        <div className="flex flex-wrap gap-2">
          {WEATHERS.map(w => (
            <button
              key={w.value}
              type="button"
              onClick={() => set('weather', form.weather === w.value ? '' : w.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                form.weather === w.value
                  ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 ring-1 ring-sky-400'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {w.emoji} {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => set('rating', form.rating === n ? 0 : n)}
              className={`text-2xl transition-transform hover:scale-110 ${n <= (form.rating || 0) ? 'text-amber-400' : 'text-gray-300 dark:text-zinc-600'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
        <TagPicker selectedIds={selectedTags} onChange={setSelectedTags} />
      </div>

      {/* Favorite */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          checked={form.is_favorite}
          onChange={e => set('is_favorite', e.target.checked)}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Mark as favorite ❤️</span>
      </label>

      {/* Error */}
      {mutation.isError && (
        <p className="text-sm text-red-500">
          {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Something went wrong'}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
        )}
        <button
          onClick={() => mutation.mutate()}
          disabled={!form.title.trim() || mutation.isPending}
          className="btn-primary disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : isEdit ? 'Update Memory' : 'Create Memory'}
        </button>
      </div>
    </div>
  )
}
