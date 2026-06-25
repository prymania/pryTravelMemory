import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Calendar, Edit2, Trash2, Plus, Globe, X } from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { get, del } from '@/services/api'
import { Spinner, PageSpinner } from '@/components/ui/Spinner'
import MiniMap from '@/components/map/MiniMap'
import MemoryCard from '@/components/memory/MemoryCard'
import MemoryForm from '@/components/memory/MemoryForm'
import PlaceForm from '@/components/place/PlaceForm'
import type { Place, Memory } from '@/types'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
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

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editOpen,   setEditOpen]   = useState(false)
  const [memoryOpen, setMemoryOpen] = useState(false)

  const { data: place, isLoading } = useQuery({
    queryKey: ['place', id],
    queryFn: () => get<Place>(`/places/${id}`),
    enabled: !!id,
  })

  const { data: memories = [] } = useQuery({
    queryKey: ['place-memories', id],
    queryFn: () => get<Memory[]>(`/places/${id}/memories`),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => del(`/places/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['places'] })
      navigate(-1)
    },
  })

  if (isLoading) return <PageSpinner />
  if (!place)    return <div className="p-6 text-gray-500">Place not found.</div>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
            <MapPin size={22} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{place.name}</h1>
            {place.name_local && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{place.name_local}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
              {(place.city || place.country) && (
                <span className="flex items-center gap-1.5">
                  <Globe size={13} />
                  {[place.city, place.country].filter(Boolean).join(', ')}
                </span>
              )}
              {place.visited_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {format(new Date(place.visited_at), 'MMMM d, yyyy')}
                </span>
              )}
              {place.address && (
                <span className="text-xs text-gray-400">{place.address}</span>
              )}
            </div>
            {place.latitude != null && place.longitude != null && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                <MapPin size={10} />
                {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setEditOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => { if (confirm('Delete this place and all its memories?')) deleteMutation.mutate() }}
              className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mini-map */}
      {place.latitude != null && place.longitude != null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <MiniMap lat={place.latitude} lng={place.longitude} label={place.name} />
        </motion.div>
      )}

      {/* Memories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Memories <span className="text-gray-400 font-normal">({(memories as Memory[]).length})</span>
          </h2>
          <button
            onClick={() => setMemoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus size={14} /> Add Memory
          </button>
        </div>

        {(memories as Memory[]).length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No memories yet — start recording your experience here
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(memories as Memory[]).map(m => <MemoryCard key={m.id} memory={m} />)}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editOpen && (
          <Modal title="Edit Place" onClose={() => setEditOpen(false)}>
            <PlaceForm
              tripId={place.trip_id}
              place={place}
              onSuccess={() => {
                setEditOpen(false)
                qc.invalidateQueries({ queryKey: ['place', id] })
              }}
              onCancel={() => setEditOpen(false)}
            />
          </Modal>
        )}
        {memoryOpen && (
          <Modal title="Add Memory" onClose={() => setMemoryOpen(false)}>
            <MemoryForm
              placeId={id!}
              onSuccess={() => {
                setMemoryOpen(false)
                qc.invalidateQueries({ queryKey: ['place-memories', id] })
              }}
              onCancel={() => setMemoryOpen(false)}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
