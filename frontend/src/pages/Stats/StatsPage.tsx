import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart2, Globe, Camera, MapPin, Image, Plane, BookOpen, HardDrive } from 'lucide-react'
import { statsApi } from '@/services/stats.api'
import { Spinner } from '@/components/ui/Spinner'

function StatBlock({ icon: Icon, label, value, sub, color = 'text-primary-500' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const gb = bytes / 1024 / 1024 / 1024
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  const mb = bytes / 1024 / 1024
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

export default function StatsPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['stats-overview'],
    queryFn: () => statsApi.overview(),
  })

  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: ['stats-countries'],
    queryFn: () => statsApi.countries(),
  })

  const { data: cameras = [], isLoading: loadingCameras } = useQuery({
    queryKey: ['stats-cameras'],
    queryFn: () => statsApi.cameras(),
  })

  const isLoading = loadingOverview || loadingCountries || loadingCameras

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <BarChart2 size={22} /> Statistics
      </h1>

      {/* Overview grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <StatBlock icon={Plane}    label="Trips"     value={overview?.trip_count    ?? 0} color="text-blue-500" />
        <StatBlock icon={MapPin}   label="Places"    value={overview?.place_count   ?? 0} color="text-green-500" />
        <StatBlock icon={BookOpen} label="Memories"  value={overview?.memory_count  ?? 0} color="text-purple-500" />
        <StatBlock icon={Image}    label="Photos"    value={overview?.photo_count   ?? 0} color="text-pink-500" />
        <StatBlock icon={Globe}    label="Countries" value={overview?.country_count ?? 0} color="text-orange-500" />
        <StatBlock
          icon={HardDrive}
          label="Storage used"
          value={formatBytes(overview?.total_bytes ?? 0)}
          color="text-gray-500"
        />
      </motion.div>

      {/* Countries visited */}
      {countries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Globe size={16} /> Countries Visited ({countries.length})
          </h2>
          <div className="card divide-y divide-gray-50 dark:divide-zinc-800">
            {countries.map((c, i) => (
              <div key={c.country_code || i} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl" title={c.country}>
                    {c.country_code
                      ? String.fromCodePoint(...[...c.country_code.toUpperCase()].map(ch => 0x1F1E0 - 65 + ch.charCodeAt(0)))
                      : '🌍'}
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{c.country}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 rounded-full bg-primary-200 dark:bg-primary-900/40 overflow-hidden" style={{ width: 80 }}>
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(c.visit_count / (countries[0]?.visit_count || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-8 text-right">{c.visit_count}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cameras */}
      {cameras.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Camera size={16} /> Cameras Used
          </h2>
          <div className="card divide-y divide-gray-50 dark:divide-zinc-800">
            {cameras.map((cam, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                    {[cam.camera_make, cam.camera_model].filter(Boolean).join(' ')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 rounded-full bg-purple-100 dark:bg-purple-900/40 overflow-hidden" style={{ width: 80 }}>
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${(cam.photo_count / (cameras[0]?.photo_count || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-16 text-right">{cam.photo_count} photos</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No data state */}
      {!overview?.trip_count && !isLoading && (
        <div className="text-center py-20 text-gray-400">
          <BarChart2 size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
          <p>Start adding trips and photos to see your statistics</p>
        </div>
      )}
    </div>
  )
}
