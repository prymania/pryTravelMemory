import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Image as ImageIcon, BookOpen, Calendar, Globe, Plus, X, ChevronRight, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { tripsApi } from '@/services/trips.api'
import { getPaginated } from '@/services/api'
import { PageSpinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import PlaceForm from '@/components/place/PlaceForm'
import MemoryForm from '@/components/memory/MemoryForm'
import MemoryCard from '@/components/memory/MemoryCard'
import TripForm from '@/components/trip/TripForm'
import CoverPhotoModal from '@/components/trip/CoverPhotoModal'
import type { Place, Memory } from '@/types'

const API_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'
const photoUrl = (key?: string | null) => key ? `${API_URL}/uploads/${key}` : null

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X size={18} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function PlaceRow({ place, onAddMemory }: { place: Place; onAddMemory: (p: Place) => void }) {
  return (
    <div className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
      <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
        <MapPin size={16} className="text-primary-600 dark:text-primary-400" />
      </div>
      <Link to={`/places/${place.id}`} className="flex-1 min-w-0 block">
        <p className="font-medium text-gray-900 dark:text-white truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          {place.name}
        </p>
        <p className="text-xs text-gray-400">
          {[place.city, place.country].filter(Boolean).join(', ')}
          {place.visited_at && ` · ${format(new Date(place.visited_at), 'MMM d, yyyy')}`}
        </p>
      </Link>
      <button
        onClick={() => onAddMemory(place)}
        className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline shrink-0"
      >
        <Plus size={12} /> Memory
      </button>
      <span className="text-xs text-gray-400">{place.memory_count}</span>
      <ChevronRight size={14} className="text-gray-300 shrink-0" />
    </div>
  )
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const [placeModal,   setPlaceModal]   = useState(false)
  const [memoryModal,  setMemoryModal]  = useState(false)
  const [memoryPlace,  setMemoryPlace]  = useState<Place | null>(null)
  const [editModal,    setEditModal]    = useState(false)
  const [coverModal,   setCoverModal]   = useState(false)

  const { data: trip, isLoading: loadingTrip } = useQuery({
    queryKey: ['trips', id],
    queryFn: () => tripsApi.get(id!),
    enabled: !!id,
  })

  const { data: places = [], isLoading: loadingPlaces } = useQuery({
    queryKey: ['places', id],
    queryFn: () => tripsApi.getPlaces(id!),
    enabled: !!id,
  })

  const { data: memoriesData } = useQuery({
    queryKey: ['memories', id],
    queryFn: () => getPaginated<Memory>('/memories', { trip_id: id, limit: 50 }),
    enabled: !!id,
  })

  if (loadingTrip) return <PageSpinner />
  if (!trip) return <div className="p-6 text-gray-500">Trip not found</div>

  const cover = photoUrl(trip.cover_photo_key)
  const statusColors: Record<string, 'primary' | 'success' | 'warning'> = {
    planned: 'warning', ongoing: 'primary', completed: 'success',
  }

  const openMemoryFor = (place: Place) => {
    setMemoryPlace(place)
    setMemoryModal(true)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="relative h-64 bg-gradient-to-br from-primary-200 to-indigo-200 dark:from-primary-900 dark:to-indigo-900 overflow-hidden">
        {cover && <img src={cover} alt={trip.title} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center justify-between mb-3">
            <Link to="/trips" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm">
              <ArrowLeft size={14} /> All Trips
            </Link>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCoverModal(true)}
                className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                <ImageIcon size={12} /> Cover
              </button>
              <button
                onClick={() => setEditModal(true)}
                className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                <Edit2 size={12} /> Edit
              </button>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <h1 className="text-3xl font-bold text-white">{trip.title}</h1>
            <Badge variant={statusColors[trip.status] || 'default'}>{trip.status}</Badge>
          </div>
          {(trip.start_date || trip.end_date) && (
            <p className="text-white/70 text-sm mt-1">
              <Calendar size={13} className="inline mr-1" />
              {trip.start_date && format(new Date(trip.start_date), 'MMM d, yyyy')}
              {trip.end_date   && ` → ${format(new Date(trip.end_date), 'MMM d, yyyy')}`}
            </p>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-3"
        >
          {[
            { icon: Globe,     label: 'Countries', value: trip.stats?.country_count ?? '—' },
            { icon: MapPin,    label: 'Places',    value: trip.stats?.place_count   ?? trip.place_count },
            { icon: BookOpen,  label: 'Memories',  value: trip.stats?.memory_count  ?? trip.memory_count },
            { icon: ImageIcon, label: 'Photos',    value: trip.stats?.photo_count   ?? trip.photo_count },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-4 text-center">
              <Icon size={18} className="mx-auto text-primary-500 mb-2" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Description */}
        {trip.description && (
          <div className="card p-5">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{trip.description}</p>
          </div>
        )}

        {/* Places section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin size={16} /> Places ({(places as Place[]).length})
            </h2>
            <button
              onClick={() => setPlaceModal(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <Plus size={14} /> Add Place
            </button>
          </div>

          {loadingPlaces ? (
            <PageSpinner />
          ) : (places as Place[]).length === 0 ? (
            <div className="card p-8 text-center text-gray-400 text-sm">
              No places yet — add your first destination
            </div>
          ) : (
            <div className="space-y-2">
              {(places as Place[]).map(place => (
                <PlaceRow key={place.id} place={place} onAddMemory={openMemoryFor} />
              ))}
            </div>
          )}
        </div>

        {/* Memories section */}
        {memoriesData?.data && memoriesData.data.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <BookOpen size={16} /> Recent Memories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {memoriesData.data.map(m => (
                <MemoryCard key={m.id} memory={m} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {placeModal && (
          <Modal title="Add Place" onClose={() => setPlaceModal(false)}>
            <PlaceForm
              tripId={id!}
              onSuccess={() => {
                setPlaceModal(false)
                qc.invalidateQueries({ queryKey: ['places', id] })
              }}
              onCancel={() => setPlaceModal(false)}
            />
          </Modal>
        )}
        {memoryModal && memoryPlace && (
          <Modal title={`Add Memory · ${memoryPlace.name}`} onClose={() => setMemoryModal(false)}>
            <MemoryForm
              placeId={memoryPlace.id}
              onSuccess={() => {
                setMemoryModal(false)
                qc.invalidateQueries({ queryKey: ['memories', id] })
              }}
              onCancel={() => setMemoryModal(false)}
            />
          </Modal>
        )}
        {editModal && trip && (
          <Modal title="Edit Trip" onClose={() => setEditModal(false)}>
            <TripForm
              trip={trip}
              onSuccess={() => {
                setEditModal(false)
                qc.invalidateQueries({ queryKey: ['trips', id] })
                qc.invalidateQueries({ queryKey: ['trips'] })
              }}
              onCancel={() => setEditModal(false)}
            />
          </Modal>
        )}
        {coverModal && trip && (
          <CoverPhotoModal trip={trip} onClose={() => setCoverModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
