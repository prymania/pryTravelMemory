import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/lib/leaflet-fix'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import type { PlaceMarker } from '@/services/map.api'
import { photoUrl } from '@/services/photos.api'

// ─── Icon factories ───────────────────────────────────────────────────────────

function photoMarkerIcon(thumbKey?: string | null) {
  if (!thumbKey) return placeIcon()
  const url = photoUrl(thumbKey)
  return L.divIcon({
    className: '',
    iconSize:   [44, 44],
    iconAnchor: [22, 22],
    html: `<div style="
      width:44px;height:44px;border-radius:50%;overflow:hidden;
      border:2.5px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.35);
      background:url('${url}') center/cover #e5e7eb;
    "></div>`,
  })
}

function placeIcon() {
  return L.divIcon({
    className: '',
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:#2563eb;border:2.5px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <svg width='16' height='16' viewBox='0 0 24 24' fill='white'>
        <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/>
      </svg>
    </div>`,
  })
}

// ─── Photo marker type ────────────────────────────────────────────────────────
interface PhotoMarker {
  id: string
  thumbnail_key?: string | null
  lat: number
  lng: number
  memory_title?: string
  place_name?: string
  taken_at?: string
}

// ─── Fit bounds helper ────────────────────────────────────────────────────────
function FitBounds({ markers }: { markers: Array<{ lat: number; lng: number }> }) {
  const map = useMap()
  useMemo(() => {
    if (!markers.length) return
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers.length])
  return null
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface TravelMapProps {
  photoMarkers?: PhotoMarker[]
  placeMarkers?: PlaceMarker[]
  className?: string
  defaultCenter?: [number, number]
  defaultZoom?: number
  showFitBounds?: boolean
}

export default function TravelMap({
  photoMarkers = [],
  placeMarkers = [],
  className = 'h-full w-full',
  defaultCenter = [15, 100],
  defaultZoom = 5,
  showFitBounds = true,
}: TravelMapProps) {
  const allMarkers = useMemo(() => [
    ...photoMarkers.map(m => ({ lat: m.lat, lng: m.lng })),
    ...placeMarkers.map(m => ({ lat: m.latitude, lng: m.longitude })),
  ], [photoMarkers, placeMarkers])

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className={className}
      style={{ zIndex: 0 }}
    >
      {/* Tile layer — Carto Voyager (free, beautiful) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      {/* Fit bounds on first load */}
      {showFitBounds && allMarkers.length > 0 && <FitBounds markers={allMarkers} />}

      {/* Photo markers (clustered) */}
      {photoMarkers.length > 0 && (
        <MarkerClusterGroup chunkedLoading maxClusterRadius={60}>
          {photoMarkers.map(m => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={photoMarkerIcon(m.thumbnail_key)}>
              <Popup minWidth={200}>
                <div className="text-sm p-1">
                  {m.thumbnail_key && (
                    <img
                      src={photoUrl(m.thumbnail_key)}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                      loading="lazy"
                    />
                  )}
                  {m.place_name  && <p className="font-semibold text-gray-800">{m.place_name}</p>}
                  {m.memory_title && <p className="text-gray-500 text-xs">{m.memory_title}</p>}
                  {m.taken_at    && <p className="text-gray-400 text-xs mt-1">{format(new Date(m.taken_at), 'MMM d, yyyy')}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      )}

      {/* Place markers */}
      {placeMarkers.map(p => (
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={placeIcon()}>
          <Popup minWidth={180}>
            <div className="text-sm p-1">
              <p className="font-semibold text-gray-800">{p.name}</p>
              {(p.city || p.country) && (
                <p className="text-gray-500 text-xs">{[p.city, p.country].filter(Boolean).join(', ')}</p>
              )}
              <p className="text-gray-400 text-xs">{p.trip_title}</p>
              {p.visited_at && (
                <p className="text-gray-400 text-xs">{format(new Date(p.visited_at), 'MMM d, yyyy')}</p>
              )}
              {p.memory_count > 0 && (
                <Link
                  to={`/trips/${p.trip_id}`}
                  className="text-xs text-blue-600 hover:underline mt-1 block"
                >
                  {p.memory_count} memories →
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
