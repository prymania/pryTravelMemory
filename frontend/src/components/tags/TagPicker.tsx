import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Tag as TagIcon } from 'lucide-react'
import { tagsApi } from '@/services/tags.api'
import type { Tag } from '@/types'

const PRESET_COLORS = [
  '#6B7280','#EF4444','#F59E0B','#10B981','#3B82F6',
  '#8B5CF6','#EC4899','#14B8A6','#F97316','#84CC16',
]

interface TagPickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export default function TagPicker({ selectedIds, onChange }: TagPickerProps) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3B82F6')
  const [creating, setCreating] = useState(false)
  const qc = useQueryClient()

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: () => tagsApi.create({ name: newName.trim(), color: newColor }),
    onSuccess: (tag) => {
      qc.invalidateQueries({ queryKey: ['tags'] })
      onChange([...selectedIds, tag.id])
      setNewName('')
      setCreating(false)
    },
  })

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id]
    )
  }

  return (
    <div className="space-y-2">
      {/* Tag chips */}
      <div className="flex flex-wrap gap-1.5">
        {(tags as Tag[]).map(tag => {
          const active = selectedIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                active
                  ? 'text-white border-transparent'
                  : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
              }`}
              style={active ? { background: tag.color, borderColor: tag.color } : {}}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/60' : ''}`}
                style={!active ? { background: tag.color } : {}}
              />
              {tag.name}
              {active && <X size={10} className="ml-0.5" />}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setCreating(v => !v)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-dashed border-gray-300 dark:border-zinc-600 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
        >
          <Plus size={10} /> New tag
        </button>
      </div>

      {/* Create new tag form */}
      {creating && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
          <input
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
            placeholder="Tag name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) createMutation.mutate() }}
            autoFocus
          />
          {/* Color swatches */}
          <div className="flex gap-1">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`w-4 h-4 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-gray-50 dark:ring-offset-zinc-800' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <button
            onClick={() => { if (newName.trim()) createMutation.mutate() }}
            disabled={!newName.trim() || createMutation.isPending}
            className="px-2.5 py-1 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
          <button onClick={() => setCreating(false)} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
