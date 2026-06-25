import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Clock, MapPin, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { format, getYear, getMonth, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { getPaginated } from '@/services/api'
import { photoUrl } from '@/services/photos.api'
import { Spinner } from '@/components/ui/Spinner'
import type { Memory } from '@/types'

const MOOD_EMOJI: Record<string, string> = {
  amazing: '🤩', happy: '😊', peaceful: '😌', neutral: '😐',
  tired: '😴', nostalgic: '🥲', sad: '😢', excited: '🎉', romantic: '💕',
}

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

type ByYear  = Map<number, Map<number, Memory[]>>

function groupByDate(memories: Memory[]): ByYear {
  const map: ByYear = new Map()
  const sorted = [...memories].sort((a, b) => {
    const da = a.memory_date || a.created_at
    const db = b.memory_date || b.created_at
    return new Date(db).getTime() - new Date(da).getTime()
  })
  for (const m of sorted) {
    const d = m.memory_date ? parseISO(m.memory_date) : new Date(m.created_at)
    const y = getYear(d)
    const mo = getMonth(d)
    if (!map.has(y)) map.set(y, new Map())
    const months = map.get(y)!
    if (!months.has(mo)) months.set(mo, [])
    months.get(mo)!.push(m)
  }
  return map
}

function MemoryItem({ memory }: { memory: Memory }) {
  return (
    <Link to={`/memories/${memory.id}`} className="block group">
      <div className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors">
        {/* Thumbnail or mood */}
        <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800">
          {memory.cover_photo_key ? (
            <img
              src={photoUrl(memory.cover_photo_key)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
              alt=""
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {memory.mood ? MOOD_EMOJI[memory.mood] : '📷'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
            {memory.title}
          </h3>
          {memory.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{memory.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            {memory.memory_date && (
              <span>{format(parseISO(memory.memory_date), 'MMM d')}</span>
            )}
            {memory.place_name && (
              <span className="flex items-center gap-0.5"><MapPin size={10} />{memory.place_name}</span>
            )}
            {memory.trip_title && (
              <span className="text-gray-300 dark:text-zinc-600">· {memory.trip_title}</span>
            )}
          </div>
        </div>

        <ChevronRight size={16} className="text-gray-300 dark:text-zinc-700 flex-shrink-0 self-center group-hover:text-primary-500 transition-colors" />
      </div>
    </Link>
  )
}

function MonthSection({ year, month, memories }: { year: number; month: number; memories: Memory[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 w-full text-left"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {MONTH_NAMES[month]}
        <span className="ml-1 text-xs font-normal text-gray-400">({memories.length})</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-l-2 border-gray-100 dark:border-zinc-800 ml-2 pl-4 space-y-0.5">
              {memories.map(m => <MemoryItem key={m.id} memory={m} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TimelinePage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['timeline-memories', page],
    queryFn: () => getPaginated<Memory>('/memories', { page, limit: 200, sort: 'memory_date', order: 'desc' }),
  })

  const memories = data?.data ?? []
  const grouped  = groupByDate(memories)
  const years    = Array.from(grouped.keys()).sort((a, b) => b - a)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock size={22} /> Timeline
        </h1>
        {data && (
          <p className="text-sm text-gray-400">{data.pagination.total} memories</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : memories.length === 0 ? (
        <div className="text-center py-24">
          <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No memories yet</p>
          <p className="text-xs text-gray-400 mt-1">Create your first trip and add memories to it</p>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map(year => (
            <div key={year}>
              {/* Year header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800" />
                <span className="text-2xl font-bold text-gray-200 dark:text-zinc-700">{year}</span>
                <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800" />
              </div>

              {/* Months */}
              {Array.from(grouped.get(year)!.entries())
                .sort(([a], [b]) => b - a)
                .map(([month, mems]) => (
                  <MonthSection key={month} year={year} month={month} memories={mems} />
                ))
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
