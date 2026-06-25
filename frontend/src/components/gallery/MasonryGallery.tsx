import { useMemo } from 'react'
import type { Photo } from '@/types'
import PhotoCard from './PhotoCard'

interface MasonryGalleryProps {
  photos: Photo[]
  columns?: { sm: number; md: number; lg: number; xl: number }
  onPhotoClick: (index: number) => void
  onFavorite?: (id: string, value: boolean) => void
}

export default function MasonryGallery({
  photos,
  columns = { sm: 2, md: 3, lg: 4, xl: 5 },
  onPhotoClick,
  onFavorite,
}: MasonryGalleryProps) {
  // Split photos into columns for true masonry
  const columnArrays = useMemo(() => {
    const cols = 4 // base, CSS handles responsive
    const arr: number[][] = Array.from({ length: cols }, () => [])
    photos.forEach((_, i) => arr[i % cols].push(i))
    return arr
  }, [photos])

  if (photos.length === 0) return null

  return (
    <div
      className={`grid gap-3`}
      style={{ gridTemplateColumns: `repeat(${columns.lg}, 1fr)` }}
    >
      {/* Responsive via CSS */}
      <style>{`
        @media (max-width: 639px)  { .masonry-wrapper { grid-template-columns: repeat(${columns.sm}, 1fr) !important; } }
        @media (min-width: 640px)  { .masonry-wrapper { grid-template-columns: repeat(${columns.md}, 1fr) !important; } }
        @media (min-width: 1024px) { .masonry-wrapper { grid-template-columns: repeat(${columns.lg}, 1fr) !important; } }
        @media (min-width: 1280px) { .masonry-wrapper { grid-template-columns: repeat(${columns.xl}, 1fr) !important; } }
      `}</style>

      {photos.map((photo, i) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onClick={() => onPhotoClick(i)}
          onFavorite={onFavorite}
        />
      ))}
    </div>
  )
}
