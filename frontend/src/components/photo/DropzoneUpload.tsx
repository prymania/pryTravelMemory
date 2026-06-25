import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, CheckCircle, AlertCircle, ImagePlus } from 'lucide-react'
import { photosApi } from '@/services/photos.api'

interface FileItem {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
  photoId?: string
}

interface DropzoneUploadProps {
  memoryId?: string
  onUploaded?: (photoId: string) => void
  onAllDone?: () => void
  maxFiles?: number
}

function uid() {
  return Math.random().toString(36).slice(2)
}

export default function DropzoneUpload({
  memoryId,
  onUploaded,
  onAllDone,
  maxFiles = 20,
}: DropzoneUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems]       = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const addFiles = useCallback((files: File[]) => {
    const allowed = files.filter(f => f.type.startsWith('image/'))
    const newItems: FileItem[] = allowed.slice(0, maxFiles - items.length).map(f => ({
      id: uid(), file: f,
      preview: URL.createObjectURL(f),
      status: 'pending', progress: 0,
    }))
    setItems(prev => [...prev, ...newItems])
  }, [items.length, maxFiles])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }, [addFiles])

  const remove = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter(i => i.id !== id)
    })
  }

  const uploadAll = async () => {
    const pending = items.filter(i => i.status === 'pending')
    if (!pending.length) return
    setIsUploading(true)

    for (const item of pending) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 30 } : i))
      try {
        const photo = await photosApi.upload(item.file, memoryId)
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done', progress: 100, photoId: photo.id } : i))
        onUploaded?.(photo.id)
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Upload failed'
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', progress: 0, error: msg } : i))
      }
    }

    setIsUploading(false)
    const allDone = items.every(i => i.status === 'done' || i.status === 'error')
    if (allDone) onAllDone?.()
  }

  const pendingCount  = items.filter(i => i.status === 'pending').length
  const doneCount     = items.filter(i => i.status === 'done').length
  const errorCount    = items.filter(i => i.status === 'error').length

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-zinc-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*"
          onChange={e => addFiles(Array.from(e.target.files || []))}
        />
        <ImagePlus size={32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600 dark:text-gray-300 font-medium">Drop photos here or click to browse</p>
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, HEIC, WebP up to 50 MB · max {maxFiles} files</p>
      </div>

      {/* File list */}
      <AnimatePresence initial={false}>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700"
          >
            <img src={item.preview} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{item.file.name}</p>
              <p className="text-xs text-gray-400">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
              {item.status === 'uploading' && (
                <div className="mt-1.5 h-1 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full animate-pulse w-3/4" />
                </div>
              )}
              {item.error && <p className="text-xs text-red-500 mt-0.5">{item.error}</p>}
            </div>
            {item.status === 'done'  && <CheckCircle size={18} className="text-green-500 flex-shrink-0" />}
            {item.status === 'error' && <AlertCircle size={18} className="text-red-500 flex-shrink-0" />}
            {item.status === 'pending' && (
              <button onClick={() => remove(item.id)} className="p-1 text-gray-400 hover:text-red-500">
                <X size={16} />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Upload button */}
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {doneCount > 0 && <span className="text-green-600">{doneCount} uploaded</span>}
            {errorCount > 0 && <span className="text-red-500 ml-2">{errorCount} failed</span>}
            {pendingCount > 0 && <span className="ml-2">{pendingCount} pending</span>}
          </p>
          <button
            onClick={uploadAll}
            disabled={isUploading || pendingCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload size={14} />
            {isUploading ? 'Uploading…' : `Upload ${pendingCount} photo${pendingCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
