import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
  applyTheme: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarCollapsed: false,
      mobileSidebarOpen: false,

      setTheme: (theme) => {
        set({ theme })
        get().applyTheme()
      },

      toggleSidebar: () =>
        set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      toggleMobileSidebar: () =>
        set(s => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

      closeMobileSidebar: () =>
        set({ mobileSidebarOpen: false }),

      applyTheme: () => {
        const { theme } = get()
        const isDark =
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
      },
    }),
    { name: 'ui', partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }) }
  )
)
