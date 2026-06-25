import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, CheckCircle, XCircle, Loader2, Image } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { uploadToStorage } from '@/lib/supabase'
import { photosApi } from '@/services/photos.api'

interface FileItem {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

interface DropzoneUploadProps {
  memoryId?: string
  onUploaded?: () => void
}

async function resizeBlob(file: File, maxW: number, maxH: number, mode: 'cover' | 'inside'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      if (mode === 'cover') {
        const scale = Math.max(maxW / w, maxH / h)
        canvas.width = maxW; canvas.height = maxH
        ctx.drawImage(img, (w - maxW/scale)/2, (h - maxH/scale)/2, maxW/scale, maxH/scale, 0, 0, maxW, maxH)
      } else {
        const scale = Math.min(maxW / w, maxH / h, 1)
        canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('resize failed')), 'image/webp', 0.85)
    }
    img.onerror = reject
    img.src = url
  })
}

function getExt(file: File) {
  const m = file.name.match(/\.[^.]+$/)
  return m ? m[0].toLowerCase() : '.jpg'
}

async function processAndUpload(file: File, memoryId?: string, index = 0) {
  const id = uuidv4()

  let exifData: Record<string, unknown> = {}
  let lat: number | null = null
  let lng: number | null = null
  let takenAt: string | null = null
  try {
    const exifr = (await import('exifr')).default
    exifData = await exifr.parse(file, { gps: true, tiff: true }) ?? {}
    lat     = (exifData.latitude  as number) ?? (exifData.GPSLatitude  as number) ?? null
    lng     = (exifData.longitude as number) ?? (exifData.GPSLongitude as number) ?? null
    takenAt = (exifData.DateTimeOriginal ?? exifData.CreateDate) as string ?? null
  } catch { /* EXIF optional */ }

  const [thumbBlob, medBlob] = await Promise.all([
    resizeBlob(file, 400, 400, 'cover'),
    resizeBlob(file, 1200, 1200, 'inside'),
  ])

  const [storageKey, thumbnailKey, mediumKey] = await Promise.all([
    uploadToStorage(file,      `originals/${id}${getExt(file)}`),
    uploadToStorage(thumbBlob, `thumbs/${id}_thumb.webp`),
    uploadToStorage(medBlob,   `medium/${id}_med.webp`),
  ])

  return photosApi.uploadMeta({
    memory_id:         memoryId ?? null,
    original_filename: file.name,
    storage_key:       storageKey,
    thumbnail_key:     thumbnailKey,
    medium_key:        mediumKey,
    file_size:         file.size,
    mime_type:         file.type,
    width:             0,
    height:            0,
    sort_order:        index,
    latitude:          lat,
    longitude:         lng,
    taken_at:          takenAt,
    exif_data:         exifData,
  })
}

export default function DropzoneUpload({ memoryId, onUploaded }: DropzoneUploadProps) {
  const [items, setItems] = useState<FileItem[]>([])

  const setStatus = (id: string, status: FileItem['status'], error?: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, status, error } : i))

  const onDrop = useCallback(async (accepted: File[]) => {
    const newItems: FileItem[] = accepted.map(file => ({ id: uuidv4(), file, status: 'pending' as const }))
    setItems(prev => [...prev, ...newItems])

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i]
      setStatus(item.id, 'uploading')
      try {
        await processAndUpload(item.file, memoryId, i)
        setStatus(item.id, 'done')
        onUploaded?.()
      } catch (err) {
        setStatus(item.id, 'error', err instanceof Error ? err.message : 'Upload failed')
      }
    }
  }, [memoryId, onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'] },
    multiple: true,
  })

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-zinc-700 hover:border-primary-300 dark:hover:border-primary-700'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={32} className="mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isDragActive ? 'Drop photos here…' : 'Drag & drop photos, or click to select'}
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, HEIC</p>
      </div>

      <AnimatePresence initial={false}>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/60"
          >
            <Image size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{item.file.name}</span>
            {item.status === 'pending'   && <span className="text-xs text-gray-400">Waiting…</span>}
            {item.status === 'uploading' && <Loader2 size={16} className="animate-spin text-primary-500 shrink-0" />}
            {item.status === 'done'      && <CheckCircle size={16} className="text-green-500 shrink-0" />}
            {item.status === 'error'     && <><span className="text-xs text-red-500 truncate max-w-[120px]">{item.error}</span><XCircle size={16} className="text-red-400 shrink-0" /></>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
