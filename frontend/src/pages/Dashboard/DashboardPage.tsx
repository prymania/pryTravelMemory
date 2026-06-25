import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plane, MapPin, BookOpen, Image, Clock, Globe, TrendingUp, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { tripsApi, memoriesApi } from '@/services/trips.api'
import { statsApi } from '@/services/stats.api'
import { photoUrl } from '@/services/photos.api'
import { useAuthStore } from '@/stores/auth.store'
import { PageSpinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import MemoryCard from '@/components/memory/MemoryCard'
import type { Trip, Memory } from '@/types'

function TripCard({ trip }: { trip: Trip }) {
  const thumb = trip.cover_thumbnail_key ? photoUrl(trip.cover_thumbnail_key) : null
  const statusColors: Record<string, 'primary' | 'success' | 'warning'> = {
    planned: 'warning', ongoing: 'primary', completed: 'success',
  }
  return (
    <Link to={`/trips/${trip.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="card overflow-hidden hover:shadow-card-hover transition-shadow duration-200"
      >
        <div className="h-36 bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/30 dark:to-indigo-900/30 overflow-hidden">
          {thumb ? (
            <img src={thumb} alt={trip.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Plane size={36} className="text-primary-300 dark:text-primary-700" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{trip.title}</h3>
            <Badge variant={statusColors[trip.status] || 'default'}>{trip.status}</Badge>
          </div>
          {(trip.start_date || trip.end_date) && (
            <p className="text-xs text-gray-400 mb-2">
              {trip.start_date && format(new Date(trip.start_date), 'MMM d, yyyy')}
              {trip.end_date && ` → ${format(new Date(trip.end_date), 'MMM d, yyyy')}`}
            </p>
          )}
          <div className="flex gap-3 text-xs text-gray-400">
            <span>{trip.place_count} places</span>
            <span>{trip.memory_count} memories</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

function OnThisDay({ memories }: { memories: Memory[] }) {
  if (!memories.length) return null
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
      <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
        <Calendar size={16} className="text-amber-500" />
        On This Day
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {memories.map(m => (
          <Link key={m.id} to={`/memories/${m.id}`} className="shrink-0 w-56">
            <div className="card hover:shadow-card-hover transition-shadow overflow-hidden">
              {m.cover_photo_key && (
                <div className="h-28 overflow-hidden -mx-4 -mt-4 mb-3">
                  <img src={photoUrl(m.cover_photo_key)} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">{m.title}</p>
              {m.memory_date && (
                <p className="text-xs text-amber-500 mt-0.5">
                  {format(new Date(m.memory_date), 'yyyy')} · {m.place_name || m.city}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const { data: stats } = useQuery({
    queryKey: ['stats-overview'],
    queryFn: () => statsApi.overview(),
  })

  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['trips', { limit: 6 }],
    queryFn: () => tripsApi.list({ limit: 6 }),
  })

  const { data: onThisDayMemories = [] } = useQuery({
    queryKey: ['on-this-day'],
    queryFn: () => memoriesApi.onThisDay(),
  })

  const trips = tripsData?.data || []

  const statCards = [
    { icon: Plane,    label: 'Trips',     value: stats?.trip_count,    to: '/trips',    color: 'text-blue-500'   },
    { icon: MapPin,   label: 'Places',    value: stats?.place_count,   to: '/map',      color: 'text-green-500'  },
    { icon: BookOpen, label: 'Memories',  value: stats?.memory_count,  to: '/timeline', color: 'text-purple-500' },
    { icon: Image,    label: 'Photos',    value: stats?.photo_count,   to: '/gallery',  color: 'text-pink-500'   },
    { icon: Globe,    label: 'Countries', value: stats?.country_count, to: '/stats',    color: 'text-orange-500' },
    { icon: TrendingUp, label: 'Cities',  value: stats?.city_count,    to: '/stats',    color: 'text-cyan-500'   },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {user?.name} ✈️
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {format(now, 'EEEE, MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {statCards.map(({ icon: Icon, label, value, to, color }) => (
          <Link key={label} to={to}>
            <div className="card p-4 text-center hover:shadow-card-hover transition-shadow cursor-pointer group">
              <Icon size={20} className={`mx-auto mb-2 ${color} group-hover:scale-110 transition-transform`} />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </Link>
        ))}
      </motion.div>

      {/* On This Day */}
      <OnThisDay memories={onThisDayMemories as Memory[]} />

      {/* Recent Trips */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={16} /> Recent Trips
          </h2>
          <Link to="/trips" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View all →
          </Link>
        </div>
        {isLoading ? (
          <PageSpinner />
        ) : trips.length === 0 ? (
          <div className="card p-12 text-center">
            <Plane size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No trips yet</p>
            <Link to="/trips" className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
              Create your first trip →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
          </div>
        )}
      </motion.div>
    </div>
  )
}
