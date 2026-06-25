import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings, Moon, Sun, Monitor, Check, Trash2, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { put, post } from '@/services/api'
import { tagsApi } from '@/services/tags.api'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import type { User as UserType, Tag } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

type Theme = 'light' | 'system' | 'dark'
const THEMES: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: 'light',  icon: Sun,     label: 'Light'  },
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'dark',   icon: Moon,    label: 'Dark'   },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-white text-base">{title}</h2>
      {children}
    </div>
  )
}

function TagManager() {
  const qc = useQueryClient()
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list() })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => tagsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })

  if ((tags as Tag[]).length === 0) {
    return <p className="text-sm text-gray-400">No tags yet. Create tags when adding trips or memories.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(tags as Tag[]).map(tag => (
        <div
          key={tag.id}
          className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium text-white group"
          style={{ background: tag.color }}
        >
          <span>{tag.name}</span>
          <button
            onClick={() => { if (confirm(`Delete tag "${tag.name}"?`)) deleteMutation.mutate(tag.id) }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-black/20 transition-all"
          >
            <Trash2 size={10} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const { theme, setTheme } = useUIStore()
  const qc = useQueryClient()

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [pw, setPw]           = useState({ current: '', new_password: '', confirm: '' })
  const [savedProfile, setSavedProfile] = useState(false)
  const [savedPw, setSavedPw]           = useState(false)
  const [pwError, setPwError]           = useState('')

  const profileMutation = useMutation({
    mutationFn: () => put<UserType>('/auth/profile', { name: profile.name }),
    onSuccess: (data) => {
      setUser(data)
      setSavedProfile(true)
      setTimeout(() => setSavedProfile(false), 2000)
    },
  })

  const pwMutation = useMutation({
    mutationFn: () => post('/auth/change-password', {
      current_password: pw.current,
      new_password: pw.new_password,
    }),
    onSuccess: () => {
      setPw({ current: '', new_password: '', confirm: '' })
      setSavedPw(true)
      setTimeout(() => setSavedPw(false), 2000)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update password'
      setPwError(msg)
    },
  })

  const handlePwSubmit = () => {
    setPwError('')
    if (pw.new_password !== pw.confirm) { setPwError('Passwords do not match'); return }
    if (pw.new_password.length < 8)     { setPwError('Password must be at least 8 characters'); return }
    pwMutation.mutate()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Settings size={22} /> Settings
      </h1>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Section title="Appearance">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
            <div className="flex gap-2">
              {THEMES.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    theme === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-zinc-700 text-gray-500 hover:border-gray-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>
        </Section>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Section title="Profile">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Display Name</label>
            <input
              className="input w-full"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              className="input w-full opacity-60 cursor-not-allowed"
              value={profile.email}
              readOnly
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          {profileMutation.isError && (
            <p className="text-sm text-red-500">
              {(profileMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update'}
            </p>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => profileMutation.mutate()}
              disabled={!profile.name.trim() || profileMutation.isPending}
              className="btn-primary disabled:opacity-50 flex items-center gap-2"
            >
              {savedProfile ? <><Check size={14} /> Saved!</> : profileMutation.isPending ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </Section>
      </motion.div>

      {/* Password */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Section title="Change Password">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
            <input
              type="password"
              className="input w-full"
              value={pw.current}
              onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
            <input
              type="password"
              className="input w-full"
              value={pw.new_password}
              onChange={e => setPw(p => ({ ...p, new_password: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              className="input w-full"
              onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
              value={pw.confirm}
            />
          </div>
          {pwError && <p className="text-sm text-red-500">{pwError}</p>}
          {savedPw && <p className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> Password updated successfully</p>}
          <div className="flex justify-end">
            <button
              onClick={handlePwSubmit}
              disabled={!pw.current || !pw.new_password || pwMutation.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {pwMutation.isPending ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </Section>
      </motion.div>

      {/* Tag Management */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Section title="Tags">
          <TagManager />
        </Section>
      </motion.div>

      {/* Export */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Section title="Backup & Export">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Download all your trips, places, memories, and diary entries as a JSON file.
          </p>
          <a
            href={`${API_URL}/export`}
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Download size={15} /> Download Export (JSON)
          </a>
        </Section>
      </motion.div>

      {/* Danger zone */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="card p-6 border border-red-100 dark:border-red-900/50">
          <h2 className="font-semibold text-red-600 dark:text-red-400 mb-2">Account Info</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Account: <span className="font-medium text-gray-700 dark:text-gray-300">{user?.email}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            This is a single-owner archive. Data is stored locally in your database.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
