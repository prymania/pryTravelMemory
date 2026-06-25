import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, X, Plane, MapPin, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPaginated } from '@/services/api'
import { useDebounce } from '@/hooks/useDebounce'
import type { Trip, Memory, Place } from '@/types'

interface SearchResults {
  trips: Trip[]
  memories: Memory[]
  places: Place[]
}

export default function GlobalSearch() {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const dq = useDebounce(query, 300)

  const { data: trips    = [] } = useQuery({
    queryKey: ['search-trips', dq],
    queryFn: () => getPaginated<Trip>('/trips', { q: dq, limit: 5 }).then(r => r.data),
    enabled: dq.length >= 2,
  })
  const { data: memories = [] } = useQuery({
    queryKey: ['search-memories', dq],
    queryFn: () => getPaginated<Memory>('/memories', { q: dq, limit: 5 }).then(r => r.data),
    enabled: dq.length >= 2,
  })

  const hasResults = trips.length > 0 || memories.length > 0

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  // Keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const go = (to: string) => {
    navigate(to)
    close()
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors w-52"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="text-xs bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded px-1">⌘K</kbd>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-start justify-center pt-[10vh] px-4 bg-black/50 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                <Search size={18} className="text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search trips, memories, places…"
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
                <kbd
                  onClick={close}
                  className="text-xs bg-gray-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 cursor-pointer text-gray-400"
                >Esc</kbd>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {dq.length < 2 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    Type at least 2 characters to search
                  </div>
                ) : !hasResults ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    No results for "{dq}"
                  </div>
                ) : (
                  <div className="py-2">
                    {trips.length > 0 && (
                      <div className="mb-1">
                        <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Trips</p>
                        {trips.map(t => (
                          <button
                            key={t.id}
                            onClick={() => go(`/trips/${t.id}`)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left transition-colors"
                          >
                            <Plane size={15} className="text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.title}</p>
                              {t.start_date && <p className="text-xs text-gray-400">{t.start_date.slice(0, 10)}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {memories.length > 0 && (
                      <div>
                        <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Memories</p>
                        {memories.map(m => (
                          <button
                            key={m.id}
                            onClick={() => go(`/memories/${m.id}`)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left transition-colors"
                          >
                            <BookOpen size={15} className="text-purple-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.title}</p>
                              <p className="text-xs text-gray-400">
                                {[m.place_name, m.city].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
