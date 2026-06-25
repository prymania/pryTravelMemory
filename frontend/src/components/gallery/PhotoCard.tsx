import { useState } from 'react'
import { Heart, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { photoUrl } from '@/services/photos.api'
import type { Photo } from '@/types'

interface PhotoCardProps {
  photo: Photo
  onClick: () => void
  onFavorite?: (id: string, value: boolean) => void
}

export default function PhotoCard({ photo, onClick, onFavorite }: PhotoCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)

  const thumb = photoUrl(photo.thumbnail_key)
  const aspect = photo.width && photo.height
    ? photo.height / photo.width
    : 1

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl cursor-pointer bg-gray-100 dark:bg-zinc-800 group"
      style={{ paddingBottom: `${Math.min(Math.max(aspect * 100, 60), 160)}%` }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
    >
      {/* Placeholder shimmer */}
      {!imgLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-100 dark:from-zinc-700 dark:to-zinc-800" />
      )}

      {/* Photo */}
      <img
        src={thumb}
        alt={photo.caption || ''}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* Caption */}
      {photo.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <p className="text-white text-xs font-medium line-clamp-2">{photo.caption}</p>
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {photo.is_favorite && <Star size={14} className="text-amber-400 fill-amber-400" />}
      </div>

      {/* Favorite button */}
      {onFavorite && (
        <button
          className="absolute top-2 left-2 p-1.5 rounded-full bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
          onClick={e => { e.stopPropagation(); onFavorite(photo.id, !photo.is_favorite) }}
        >
          <Heart
            size={12}
            className={photo.is_favorite ? 'text-red-400 fill-red-400' : 'text-white'}
          />
        </button>
      )}
    </motion.div>
  )
}
