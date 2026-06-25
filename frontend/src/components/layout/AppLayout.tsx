import { Outlet, useLocation } from 'react-router-dom'
import { Sun, Moon, Monitor, Menu } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import GlobalSearch from '@/components/search/GlobalSearch'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useUIStore } from '@/stores/ui.store'
import { useEffect } from 'react'

// Route → page title map
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/trips':     'Trips',
  '/map':       'Map View',
  '/gallery':   'Gallery',
  '/timeline':  'Timeline',
  '/diary':     'Diary',
  '/stats':     'Statistics',
  '/settings':  'Settings',
}

function usePageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const base = 'Travel Memory'
    const segment = Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k))
    document.title = segment ? `${PAGE_TITLES[segment]} — ${base}` : base
  }, [pathname])
}

export default function AppLayout() {
  const { theme, setTheme, mobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar } = useUIStore()
  usePageTitle()

  const themes: Array<{ key: 'light' | 'dark' | 'system'; icon: React.ReactNode }> = [
    { key: 'light',  icon: <Sun size={14} /> },
    { key: 'system', icon: <Monitor size={14} /> },
    { key: 'dark',   icon: <Moon size={14} /> },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={closeMobileSidebar}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64"
            >
              <Sidebar onNavigate={closeMobileSidebar} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Global search */}
          <div className="flex-1">
            <GlobalSearch />
          </div>

          {/* Theme switcher */}
          <div className="flex items-center gap-0.5 p-1 rounded-lg bg-gray-100 dark:bg-zinc-800 shrink-0">
            {themes.map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === key
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
