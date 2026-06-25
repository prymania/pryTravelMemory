import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Map, Image, MapPin, Layers } from 'lucide-react'
import { photosApi } from '@/services/photos.api'
import { mapApi } from '@/services/map.api'
import TravelMap from '@/components/map/TravelMap'
import { Spinner } from '@/components/ui/Spinner'

export default function MapViewPage() {
  const [showPhotos, setShowPhotos] = useState(true)
  const [showPlaces, setShowPlaces] = useState(true)

  const { data: photoMarkers = [], isLoading: loadingPhotos } = useQuery({
    queryKey: ['map-markers'],
    queryFn: () => photosApi.mapMarkers(),
  })

  const { data: placeMarkers = [], isLoading: loadingPlaces } = useQuery({
    queryKey: ['places-all'],
    queryFn: () => mapApi.places(),
  })

  const isLoading = loadingPhotos || loadingPlaces

  return (
    <div className="relative h-full flex flex-col">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-800 px-3 py-2">
          <Layers size={14} className="text-gray-400 mr-1" />
          <button
            onClick={() => setShowPhotos(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showPhotos
                ? 'bg-primary-600 text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Image size={12} /> Photos ({photoMarkers.length})
          </button>
          <button
            onClick={() => setShowPlaces(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showPlaces
                ? 'bg-primary-600 text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <MapPin size={12} /> Places ({placeMarkers.length})
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/60 dark:bg-black/40 backdrop-blur-sm">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && photoMarkers.length === 0 && placeMarkers.length === 0 && (
        <div className="absolute inset-0 z-[999] flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 text-center max-w-xs">
            <Map size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No locations yet</p>
            <p className="text-xs text-gray-400 mt-1">Upload photos with GPS or add places with coordinates to see them on the map.</p>
          </div>
        </div>
      )}

      {/* Map */}
      <TravelMap
        photoMarkers={showPhotos ? photoMarkers : []}
        placeMarkers={showPlaces ? placeMarkers : []}
        className="flex-1 w-full"
      />
    </div>
  )
}
