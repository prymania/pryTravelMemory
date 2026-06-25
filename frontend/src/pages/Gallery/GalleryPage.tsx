import { useState, useCallback } from 'react'
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { Images, Heart, Camera } from 'lucide-react'
import { photosApi, photoUrl } from '@/services/photos.api'
import PhotoCard from '@/components/gallery/PhotoCard'
import { Spinner } from '@/components/ui/Spinner'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { Photo } from '@/types'

const LIMIT = 30

export default function GalleryPage() {
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [filterFav, setFilterFav]         = useState(false)
  const qc = useQueryClient()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['gallery', { is_favorite: filterFav }],
    queryFn: ({ pageParam = 1 }) =>
      photosApi.list({ page: pageParam as number, limit: LIMIT, is_favorite: filterFav ? 'true' : undefined }),
    getNextPageParam: (last) =>
      last.pagination.hasNext ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  })

  const photos: Photo[] = data?.pages.flatMap(p => p.data) ?? []
  const slides           = photos.map(p => ({ src: photoUrl(p.medium_key || p.storage_key) }))
  const sentinel         = useInfiniteScroll(fetchNextPage, !!hasNextPage)

  const favMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      photosApi.update(id, { is_favorite: value } as Partial<Photo>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  })

  const handleFavorite = useCallback((id: string, value: boolean) => {
    favMutation.mutate({ id, value })
  }, [favMutation])

  const totalPhotos = data?.pages[0]?.pagination.total ?? 0

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Images size={22} /> Gallery
          </h1>
          {!isLoading && (
            <p className="text-sm text-gray-400 mt-0.5">
              {totalPhotos} photos{filterFav && ' · favorites only'}
            </p>
          )}
        </div>
        <button
          onClick={() => setFilterFav(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterFav
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Heart size={14} className={filterFav ? 'fill-red-500 text-red-500' : ''} />
          Favorites
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : photos.length === 0 ? (
        <div className="text-center py-24">
          <Camera size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No photos yet</p>
          <p className="text-xs text-gray-400 mt-1">Upload photos in a Memory to see them here</p>
        </div>
      ) : (
        <>
          {/* Masonry grid — CSS columns approach */}
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
            {photos.map((photo, i) => (
              <div key={photo.id} className="break-inside-avoid">
                <PhotoCard
                  photo={photo}
                  onClick={() => setLightboxIndex(i)}
                  onFavorite={handleFavorite}
                />
              </div>
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinel} className="flex justify-center py-6">
            {isFetchingNextPage && <Spinner />}
          </div>
        </>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={slides}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
      />
    </div>
  )
}
