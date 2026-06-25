import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Image, Clock, Plane,
  BookOpen, BarChart2, Settings, LogOut, ChevronLeft,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/map',       icon: Map,             label: 'Map View' },
  { to: '/gallery',   icon: Image,           label: 'Gallery' },
  { to: '/timeline',  icon: Clock,           label: 'Timeline' },
  { to: '/trips',     icon: Plane,           label: 'Trips' },
  { to: '/diary',     icon: BookOpen,        label: 'Diary' },
  { to: '/stats',     icon: BarChart2,       label: 'Statistics' },
]

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const width = sidebarCollapsed ? 72 : 240

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">TM</span>
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="font-semibold text-gray-900 dark:text-white whitespace-nowrap"
            >
              Travel Memory
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 group',
              isActive
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <Icon size={18} className="shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-gray-100 dark:border-zinc-800 space-y-0.5">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Settings size={18} className="shrink-0" />
          {!sidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>

        {/* User chip */}
        {!sidebarCollapsed && user && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800">
            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        )}
      </div>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex absolute top-16 -right-3 z-10 w-6 h-6 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronLeft size={12} className="text-gray-500" />
        </motion.div>
      </button>
    </motion.aside>
  )
}
