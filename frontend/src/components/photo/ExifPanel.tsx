import { useEffect, useState } from 'react'
import { Camera, MapPin, Calendar, Aperture } from 'lucide-react'

interface ExifData {
  Make?: string
  Model?: string
  DateTimeOriginal?: Date | string
  ExposureTime?: number
  FNumber?: number
  ISO?: number
  FocalLength?: number
  latitude?: number
  longitude?: number
}

interface ExifPanelProps {
  file: File | null
}

export default function ExifPanel({ file }: ExifPanelProps) {
  const [exif, setExif] = useState<ExifData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!file) { setExif(null); return }
    let cancelled = false
    setLoading(true)
    import('exifr').then(async mod => {
      try {
        const exifrModule = mod.default || mod
        const data = await exifrModule.parse(file, {
          tiff: true, gps: true, exif: true,
          pick: ['Make','Model','DateTimeOriginal','ExposureTime','FNumber','ISO','FocalLength','latitude','longitude'],
        })
        if (!cancelled) setExif(data || null)
      } catch { if (!cancelled) setExif(null) }
      finally   { if (!cancelled) setLoading(false) }
    })
    return () => { cancelled = true }
  }, [file])

  if (!file) return null
  if (loading) return <div className="text-xs text-gray-400 animate-pulse">Reading EXIF data…</div>
  if (!exif)   return null

  const camera = [exif.Make, exif.Model].filter(Boolean).join(' ')
  const date   = exif.DateTimeOriginal
    ? new Date(exif.DateTimeOriginal).toLocaleString()
    : null
  const gps    = exif.latitude != null && exif.longitude != null
    ? `${exif.latitude.toFixed(5)}, ${exif.longitude.toFixed(5)}`
    : null
  const shutter = exif.ExposureTime
    ? exif.ExposureTime < 1 ? `1/${Math.round(1 / exif.ExposureTime)}s` : `${exif.ExposureTime}s`
    : null

  return (
    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
      {camera && (
        <div className="flex items-center gap-1.5">
          <Camera size={12} className="text-gray-400" />
          <span>{camera}</span>
        </div>
      )}
      {date && (
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-gray-400" />
          <span>{date}</span>
        </div>
      )}
      {gps && (
        <div className="flex items-center gap-1.5 col-span-2 text-green-600 dark:text-green-400">
          <MapPin size={12} />
          <span>{gps}</span>
        </div>
      )}
      {(shutter || exif.FNumber || exif.ISO) && (
        <div className="flex items-center gap-2 col-span-2">
          <Aperture size={12} className="text-gray-400" />
          {shutter && <span>{shutter}</span>}
          {exif.FNumber && <span>f/{exif.FNumber}</span>}
          {exif.ISO && <span>ISO {exif.ISO}</span>}
          {exif.FocalLength && <span>{exif.FocalLength}mm</span>}
        </div>
      )}
    </div>
  )
}
