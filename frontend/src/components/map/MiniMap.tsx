import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/lib/leaflet-fix'

interface MiniMapProps {
  lat: number
  lng: number
  label?: string
  zoom?: number
  className?: string
}

const pinIcon = L.divIcon({
  className: '',
  iconSize:  [32, 32],
  iconAnchor:[16, 16],
  html: `<div style="
    width:32px;height:32px;border-radius:50%;
    background:#2563eb;border:2.5px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,.3);
    display:flex;align-items:center;justify-content:center;
  ">
    <svg width='14' height='14' viewBox='0 0 24 24' fill='white'>
      <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/>
    </svg>
  </div>`,
})

export default function MiniMap({ lat, lng, zoom = 13, className = 'h-48 w-full rounded-xl overflow-hidden' }: MiniMapProps) {
  // Key forces re-mount when position changes
  const key = useMemo(() => `${lat},${lng}`, [lat, lng])

  return (
    <div className={className}>
      <MapContainer
        key={key}
        center={[lat, lng]}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO'
          maxZoom={19}
        />
        <Marker position={[lat, lng]} icon={pinIcon} />
      </MapContainer>
    </div>
  )
}
