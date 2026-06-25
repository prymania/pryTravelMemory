import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, X, Trash2, Edit2, Heart, Calendar, MapPin, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { getPaginated, post, put, del } from '@/services/api'
import { Spinner } from '@/components/ui/Spinner'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { MoodType, WeatherType } from '@/types'

const MOOD_EMOJI: Record<string, string> = {
  amazing: '🤩', happy: '😊', peaceful: '😌', neutral: '😐',
  tired: '😴', nostalgic: '🥲', sad: '😢', excited: '🎉', romantic: '💕',
}
const MOODS: { value: MoodType; emoji: string }[] = [
  { value: 'amazing', emoji: '🤩' }, { value: 'happy', emoji: '😊' },
  { value: 'excited', emoji: '🎉' }, { value: 'peaceful', emoji: '😌' },
  { value: 'romantic', emoji: '💕' }, { value: 'nostalgic', emoji: '🥲' },
  { value: 'neutral', emoji: '😐' }, { value: 'tired', emoji: '😴' },
  { value: 'sad', emoji: '😢' },
]

interface DiaryEntry {
  id: string
  title: string
  content_markdown?: string | null
  mood?: MoodType | null
  weather?: WeatherType | null
  entry_date?: string | null
  entry_time?: string | null
  location_text?: string | null
  is_favorite: boolean
  photo_count: number
  created_at: string
}

const BLANK = {
  title: '', content_markdown: '', mood: '' as MoodType | '',
  weather: '' as WeatherType | '', entry_date: '', entry_time: '',
  location_text: '', is_favorite: false,
}

function EntryForm({
  initial = BLANK,
  onSave,
  onCancel,
  saving,
}: {
  initial?: typeof BLANK
  onSave: (data: typeof BLANK) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <input
        className="input w-full text-lg font-medium"
        placeholder="Title"
        value={form.title}
        onChange={e => set('title', e.target.value)}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <input type="date" className="input w-full" value={form.entry_date} onChange={e => set('entry_date', e.target.value)} />
        <input type="time" className="input w-full" value={form.entry_time} onChange={e => set('entry_time', e.target.value)} />
      </div>
      <input
        className="input w-full"
        placeholder="Location (optional)"
        value={form.location_text}
        onChange={e => set('location_text', e.target.value)}
      />
      <textarea
        className="input w-full resize-none font-mono text-sm"
        rows={8}
        placeholder="Write your thoughts… (Markdown supported)"
        value={form.content_markdown}
        onChange={e => set('content_markdown', e.target.value)}
      />
      {/* Mood */}
      <div className="flex flex-wrap gap-2">
        {MOODS.map(m => (
          <button
            key={m.value}
            type="button"
            onClick={() => set('mood', form.mood === m.value ? '' : m.value)}
            className={`px-2.5 py-1.5 rounded-full text-lg transition-all ${
              form.mood === m.value ? 'ring-2 ring-primary-400 scale-110' : 'opacity-60 hover:opacity-100'
            }`}
          >{m.emoji}</button>
        ))}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="rounded border-gray-300 text-primary-600"
          checked={form.is_favorite}
          onChange={e => set('is_favorite', e.target.checked)}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Favorite ❤️</span>
      </label>
      <div className="flex gap-3 justify-end pt-1">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.title.trim() || saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
      </div>
    </div>
  )
}

function EntryCard({ entry, onEdit, onDelete }: { entry: DiaryEntry; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card group"
    >
      <div className="flex items-start gap-3">
        {/* Date column */}
        <div className="shrink-0 w-12 text-center">
          {entry.entry_date ? (
            <>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400 leading-none">
                {format(parseISO(entry.entry_date), 'd')}
              </p>
              <p className="text-xs text-gray-400">{format(parseISO(entry.entry_date), 'MMM')}</p>
              <p className="text-xs text-gray-300 dark:text-zinc-600">{format(parseISO(entry.entry_date), 'yyyy')}</p>
            </>
          ) : (
            <Calendar size={20} className="mx-auto text-gray-300 dark:text-zinc-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {entry.mood && <span className="text-lg">{MOOD_EMOJI[entry.mood]}</span>}
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{entry.title}</h3>
            {entry.is_favorite && <Heart size={12} className="text-red-400 fill-red-400" />}
          </div>
          {entry.location_text && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
              <MapPin size={10} />{entry.location_text}
            </p>
          )}
          {entry.content_markdown && (
            <div
              className={`text-sm text-gray-600 dark:text-gray-300 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {entry.content_markdown}
            </div>
          )}
          {entry.content_markdown && entry.content_markdown.length > 200 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs text-primary-600 dark:text-primary-400 mt-1 hover:underline"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-zinc-800">
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 dark:hover:bg-zinc-800">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function DiaryPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editEntry,  setEditEntry]  = useState<DiaryEntry | null>(null)
  const qc = useQueryClient()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['diary'],
    queryFn: ({ pageParam = 1 }) =>
      getPaginated<DiaryEntry>('/diary', { page: pageParam as number, limit: 20 }),
    getNextPageParam: last => last.pagination.hasNext ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  })

  const entries: DiaryEntry[] = data?.pages.flatMap(p => p.data) ?? []
  const sentinel = useInfiniteScroll(fetchNextPage, !!hasNextPage)

  const createMutation = useMutation({
    mutationFn: (form: typeof BLANK) => post<DiaryEntry>('/diary', {
      ...form, mood: form.mood || null, weather: form.weather || null,
      entry_date: form.entry_date || null, entry_time: form.entry_time || null,
      location_text: form.location_text || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diary'] }); setCreateOpen(false) },
  })

  const editMutation = useMutation({
    mutationFn: (form: typeof BLANK) => put<DiaryEntry>(`/diary/${editEntry!.id}`, {
      ...form, mood: form.mood || null, entry_date: form.entry_date || null,
      entry_time: form.entry_time || null, location_text: form.location_text || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diary'] }); setEditEntry(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/diary/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diary'] }),
  })

  const total = data?.pages[0]?.pagination.total ?? 0

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={22} /> Diary
          </h1>
          {!isLoading && <p className="text-sm text-gray-400 mt-0.5">{total} entries</p>}
        </div>
        <button
          onClick={() => setCreateOpen(v => !v)}
          className="flex items-center gap-2 btn-primary"
        >
          <Plus size={16} /> New Entry
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card border border-primary-200 dark:border-primary-900"
          >
            <EntryForm
              onSave={form => createMutation.mutate(form)}
              onCancel={() => setCreateOpen(false)}
              saving={createMutation.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit form */}
      <AnimatePresence>
        {editEntry && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card border border-amber-200 dark:border-amber-900"
          >
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Edit Entry</h2>
            <EntryForm
              initial={{
                title: editEntry.title,
                content_markdown: editEntry.content_markdown ?? '',
                mood: editEntry.mood ?? '',
                weather: editEntry.weather ?? '',
                entry_date: editEntry.entry_date ?? '',
                entry_time: editEntry.entry_time ?? '',
                location_text: editEntry.location_text ?? '',
                is_favorite: editEntry.is_favorite,
              }}
              onSave={form => editMutation.mutate(form)}
              onCancel={() => setEditEntry(null)}
              saving={editMutation.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries list */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : entries.length === 0 && !createOpen ? (
        <div className="text-center py-20">
          <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Your diary is empty</p>
          <p className="text-xs text-gray-400 mt-1">Start writing your first entry</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => setEditEntry(entry)}
              onDelete={() => { if (confirm('Delete this entry?')) deleteMutation.mutate(entry.id) }}
            />
          ))}
          <div ref={sentinel} className="flex justify-center py-4">
            {isFetchingNextPage && <Spinner />}
          </div>
        </div>
      )}
    </div>
  )
}
