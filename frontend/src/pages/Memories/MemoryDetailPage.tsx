import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { ArrowLeft, MapPin, Calendar, Heart, Star, Edit2, Trash2, Plus, ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { get, del } from '@/services/api'
import { photosApi, photoUrl } from '@/services/photos.api'
import MemoryForm from '@/components/memory/MemoryForm'
import DropzoneUpload from '@/components/photo/DropzoneUpload'
import MiniMap from '@/components/map/MiniMap'
import { Spinner } from '@/components/ui/Spinner'
import type { Memory, Photo } from '@/types'

const MOOD_EMOJI: Record<string, string> = {
  amazing: '🤩', happy: '😊', peaceful: '😌', neutral: '😐',
  tired: '😴', nostalgic: '🥲', sad: '😢', excited: '🎉', romantic: '💕',
}
const WEATHER_EMOJI: Record<string, string> = {
  sunny: '☀️', partly_cloudy: '⛅', cloudy: '☁️', rainy: '🌧️',
  stormy: '⛈️', snowy: '❄️', foggy: '🌫️', windy: '💨', hot: '🔥', cold: '🧊',
}

export default function MemoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [editOpen,    setEditOpen]    = useState(false)
  const [uploadOpen,  setUploadOpen]  = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(-1)

  const { data: memory, isLoading } = useQuery({
    queryKey: ['memory', id],
    queryFn: () => get<Memory>(`/memories/${id}`),
    enabled: !!id,
  })

  const { data: photosData } = useQuery({
    queryKey: ['memory-photos', id],
    queryFn: () => photosApi.list({ memory_id: id, limit: 100 }),
    enabled: !!id,
  })

  const photos: Photo[] = photosData?.data ?? []
  const slides = photos.map(p => ({ src: photoUrl(p.medium_key || p.storage_key) }))

  const deleteMutation = useMutation({
    mutationFn: () => del(`/memories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memories'] })
      navigate(-1)
    },
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  )
  if (!memory) return (
    <div className="p-6 text-center text-gray-500">Memory not found.</div>
  )

  const cover = memory.cover_photo_key ? photoUrl(memory.cover_photo_key) : null

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Back */}
      <div className="px-6 pt-6 pb-4">
        <Link
          to={-1 as unknown as string}
          onClick={e => { e.preventDefault(); navigate(-1) }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* Hero */}
      {cover ? (
        <div className="mx-6 rounded-2xl overflow-hidden h-64 shadow-lg">
          <img src={cover} alt={memory.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="mx-6 h-32 rounded-2xl bg-gradient-to-br from-primary-100 to-blue-50 dark:from-primary-900/40 dark:to-zinc-800 flex items-center justify-center">
          {memory.mood && <span className="text-6xl">{MOOD_EMOJI[memory.mood]}</span>}
        </div>
      )}

      {/* Content */}
      <div className="px-6 mt-6 space-y-6">
        {/* Title + actions */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{memory.title}</h1>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setEditOpen(v => !v)}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => { if (confirm('Delete this memory?')) deleteMutation.mutate() }}
              className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Meta bar */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
          {memory.memory_date && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {format(new Date(memory.memory_date), 'EEEE, MMMM d, yyyy')}
              {memory.memory_time && ` · ${memory.memory_time.slice(0, 5)}`}
            </span>
          )}
          {(memory.place_name || memory.city) && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {[memory.place_name, memory.city, memory.country].filter(Boolean).join(', ')}
            </span>
          )}
          {memory.mood && (
            <span className="flex items-center gap-1">{MOOD_EMOJI[memory.mood]} {memory.mood}</span>
          )}
          {memory.weather && (
            <span className="flex items-center gap-1">{WEATHER_EMOJI[memory.weather]} {memory.weather.replace('_', ' ')}</span>
          )}
          {memory.rating != null && memory.rating > 0 && (
            <span className="flex items-center gap-1">
              {'★'.repeat(memory.rating)}{'☆'.repeat(5 - memory.rating)}
            </span>
          )}
          {memory.is_favorite && <span className="text-red-500">❤️ Favorite</span>}
        </div>

        {/* Description */}
        {memory.description && (
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{memory.description}</p>
        )}

        {/* Journal / markdown */}
        {memory.content_markdown && (
          <div className="prose prose-sm dark:prose-invert max-w-none border-t border-gray-100 dark:border-zinc-800 pt-5">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
              {memory.content_markdown}
            </pre>
          </div>
        )}

        {/* Place mini-map */}
        {(memory as Memory & { latitude?: number; longitude?: number }).latitude != null && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Location</p>
            <MiniMap
              lat={(memory as Memory & { latitude?: number }).latitude!}
              lng={(memory as Memory & { longitude?: number }).longitude!}
              label={memory.place_name}
            />
          </div>
        )}

        {/* Edit form inline */}
        {editOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-primary-200 dark:border-primary-900"
          >
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Edit Memory</h2>
            <MemoryForm
              placeId={memory.place_id}
              memory={memory}
              onSuccess={() => {
                setEditOpen(false)
                qc.invalidateQueries({ queryKey: ['memory', id] })
              }}
              onCancel={() => setEditOpen(false)}
            />
          </motion.div>
        )}

        {/* Photos section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Photos {photos.length > 0 && <span className="text-gray-400 font-normal">({photos.length})</span>}
            </h2>
            <button
              onClick={() => setUploadOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <Plus size={14} /> Add Photos
            </button>
          </div>

          {uploadOpen && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-5 card border border-dashed border-primary-300 dark:border-primary-800">
              <DropzoneUpload
                memoryId={id}
                onUploaded={() => {
                  qc.invalidateQueries({ queryKey: ['memory-photos', id] })
                  qc.invalidateQueries({ queryKey: ['memory', id] })
                }}
              />
            </motion.div>
          )}

          {photos.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No photos yet — add some above</div>
          ) : (
            <div className="columns-2 sm:columns-3 gap-3 space-y-3">
              {photos.map((photo, i) => (
                <div key={photo.id} className="break-inside-avoid">
                  <div
                    className="relative rounded-xl overflow-hidden cursor-pointer group"
                  >
                    <img
                      src={photoUrl(photo.thumbnail_key)}
                      alt={photo.caption || ''}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onClick={() => setLightboxIdx(i)}
                    />
                    {/* Photo action overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        title="Set as cover"
                        onClick={() => {
                          if (id) photosApi.setCover(photo.id, id).then(() => {
                            qc.invalidateQueries({ queryKey: ['memory', id] })
                          })
                        }}
                        className={`p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-colors ${photo.is_cover ? 'text-amber-400' : 'text-white'}`}
                      >
                        <ImageIcon size={14} />
                      </button>
                      <button
                        title="Delete photo"
                        onClick={() => {
                          if (!confirm('Delete this photo?')) return
                          photosApi.delete(photo.id).then(() => {
                            qc.invalidateQueries({ queryKey: ['memory-photos', id] })
                            qc.invalidateQueries({ queryKey: ['memory', id] })
                          })
                        }}
                        className="p-2 rounded-full bg-white/20 hover:bg-red-500/80 text-white backdrop-blur-sm transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {/* Cover badge */}
                    {photo.is_cover && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-500 text-white text-xs font-medium">
                        Cover
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Lightbox
        open={lightboxIdx >= 0}
        close={() => setLightboxIdx(-1)}
        index={lightboxIdx}
        slides={slides}
        on={{ view: ({ index }) => setLightboxIdx(index) }}
      />
    </div>
  )
}
