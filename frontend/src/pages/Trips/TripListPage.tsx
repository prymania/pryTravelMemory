import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Plane, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { tripsApi } from '@/services/trips.api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import type { Trip, TripStatus } from '@/types'

const API_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'
const thumbUrl = (key?: string | null) => key ? `${API_URL}/uploads/${key}` : null

const statusOpts: Array<{ label: string; value: TripStatus | '' }> = [
  { label: 'All', value: '' },
  { label: 'Planned', value: 'planned' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
]

function CreateTripModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<TripStatus>('planned')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => tripsApi.create({ title, start_date: startDate || undefined, end_date: endDate || undefined, status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trips'] }); onCreated() },
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="card w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={e => { e.preventDefault(); mutation.mutate() }}
        >
          <Input label="Trip Name *" value={title} onChange={e => setTitle(e.target.value)} placeholder="Japan 2026" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <Input label="End Date"   type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TripStatus)}
              className="input"
            >
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={mutation.isPending} disabled={!title.trim()}>
              Create Trip
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function TripRow({ trip }: { trip: Trip }) {
  const thumb = thumbUrl(trip.cover_thumbnail_key)
  const statusColors: Record<string, 'primary' | 'success' | 'warning'> = {
    planned: 'warning', ongoing: 'primary', completed: 'success',
  }
  return (
    <Link to={`/trips/${trip.id}`}>
      <motion.div
        whileHover={{ x: 2 }}
        className="card p-4 flex gap-4 items-center hover:shadow-card-hover transition-shadow"
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/30 dark:to-indigo-900/30">
          {thumb
            ? <img src={thumb} alt={trip.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Plane size={24} className="text-primary-300 dark:text-primary-700" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">{trip.title}</h3>
            <Badge variant={statusColors[trip.status] || 'default'}>{trip.status}</Badge>
          </div>
          {(trip.start_date || trip.end_date) && (
            <p className="text-xs text-gray-400 mb-1">
              {trip.start_date && format(new Date(trip.start_date), 'MMM d, yyyy')}
              {trip.end_date   && ` → ${format(new Date(trip.end_date), 'MMM d, yyyy')}`}
            </p>
          )}
          <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{trip.place_count} places</span>
            <span>{trip.memory_count} memories</span>
            <span>{trip.photo_count} photos</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function TripListPage() {
  const [search, setSearch]         = useState('')
  const [status, setStatus]         = useState<TripStatus | ''>('')
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['trips', { q: search, status }],
    queryFn: () => tripsApi.list({ q: search || undefined, status: status || undefined }),
  })

  const trips = data?.data || []

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Plane size={22} /> Trips
          </h1>
          <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            New Trip
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search trips..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-zinc-800">
            {statusOpts.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  status === opt.value
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <PageSpinner />
        ) : trips.length === 0 ? (
          <div className="card p-16 text-center">
            <Plane size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No trips found</p>
            <Button onClick={() => setShowCreate(true)} icon={<Plus size={16} />}>
              Create your first trip
            </Button>
          </div>
        ) : (
          <motion.div className="space-y-3">
            {trips.map(trip => <TripRow key={trip.id} trip={trip} />)}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateTripModal
            onClose={() => setShowCreate(false)}
            onCreated={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
