import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Check, ImageOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPaginated, put } from '@/services/api'
import { photoUrl } from '@/services/photos.api'
import { Spinner } from '@/components/ui/Spinner'
import type { Photo, Trip } from '@/types'

interface CoverPhotoModalProps {
  trip: Trip
  onClose: () => void
}

export default function CoverPhotoModal({ trip, onClose }: CoverPhotoModalProps) {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<string | null>(trip.cover_photo_id ?? null)

  const { data, isLoading } = useQuery({
    queryKey: ['trip-photos', trip.id],
    queryFn: () => getPaginated<Photo>('/photos', { trip_id: trip.id, limit: 100 }),
  })

  const saveMutation = useMutation({
    mutationFn: () => put<Trip>(`/trips/${trip.id}`, { cover_photo_id: selected }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips', trip.id] })
      qc.invalidateQueries({ queryKey: ['trips'] })
      onClose()
    },
  })

  const photos = data?.data ?? []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        className="card w-full max-w-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">Set Trip Cover Photo</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X size={18} />
          </button>
        </div>

        {/* Photo grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ImageOff size={40} className="mb-3" />
              <p className="text-sm">No photos in this trip yet</p>
              <p className="text-xs mt-1">Upload photos to memories first</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {/* "No cover" option */}
              <button
                onClick={() => setSelected(null)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all flex items-center justify-center bg-gray-100 dark:bg-zinc-800 ${
                  selected === null
                    ? 'border-primary-500 ring-2 ring-primary-300 dark:ring-primary-700'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-zinc-600'
                }`}
              >
                <ImageOff size={24} className="text-gray-400" />
                {selected === null && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
                <span className="absolute bottom-0 left-0 right-0 text-center text-xs py-1 bg-black/40 text-white">None</span>
              </button>

              {photos.map(photo => {
                const isSelected = selected === photo.id
                return (
                  <button
                    key={photo.id}
                    onClick={() => setSelected(photo.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-primary-500 ring-2 ring-primary-300 dark:ring-primary-700'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <img
                      src={photoUrl(photo.thumbnail_key) ?? ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      alt=""
                    />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800 shrink-0">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Set Cover'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
