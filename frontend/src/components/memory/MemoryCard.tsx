import { Link } from 'react-router-dom'
import { Heart, Star, MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { photoUrl } from '@/services/photos.api'
import type { Memory } from '@/types'

const MOOD_EMOJI: Record<string, string> = {
  amazing: '🤩', happy: '😊', peaceful: '😌', neutral: '😐',
  tired: '😴', nostalgic: '🥲', sad: '😢', excited: '🎉', romantic: '💕',
}

interface MemoryCardProps {
  memory: Memory
  className?: string
}

export default function MemoryCard({ memory, className = '' }: MemoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card group relative overflow-hidden hover:shadow-card-hover transition-shadow duration-200 ${className}`}
    >
      <Link to={`/memories/${memory.id}`} className="block">
        {/* Cover photo */}
        {memory.cover_photo_key ? (
          <div className="h-44 overflow-hidden rounded-t-xl -mx-4 -mt-4 mb-4">
            <img
              src={photoUrl(memory.cover_photo_key)}
              alt={memory.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="h-24 rounded-xl mb-4 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-zinc-800 flex items-center justify-center">
            {memory.mood
              ? <span className="text-4xl">{MOOD_EMOJI[memory.mood]}</span>
              : <Star size={24} className="text-primary-400" />
            }
          </div>
        )}

        {/* Content */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mb-1.5 line-clamp-2">
          {memory.title}
        </h3>

        {memory.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {memory.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            {(memory.place_name || memory.city) && (
              <span className="flex items-center gap-1">
                <MapPin size={10} />
                {memory.place_name || memory.city}
              </span>
            )}
          </div>
          {memory.memory_date && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {format(new Date(memory.memory_date), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </Link>

      {/* Badges */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        {memory.mood && memory.cover_photo_key && (
          <span className="text-sm">{MOOD_EMOJI[memory.mood]}</span>
        )}
        {memory.is_favorite && <Heart size={14} className="text-red-400 fill-red-400" />}
        {memory.rating && memory.rating >= 4 && <Star size={14} className="text-amber-400 fill-amber-400" />}
      </div>
    </motion.div>
  )
}
