import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/Auth/LoginPage'
import DashboardPage from '@/pages/Dashboard/DashboardPage'
import TripListPage from '@/pages/Trips/TripListPage'
import TripDetailPage from '@/pages/Trips/TripDetailPage'
import MapViewPage from '@/pages/MapView/MapViewPage'
import GalleryPage from '@/pages/Gallery/GalleryPage'
import TimelinePage from '@/pages/Timeline/TimelinePage'
import MemoryDetailPage from '@/pages/Memories/MemoryDetailPage'
import StatsPage from '@/pages/Stats/StatsPage'
import SettingsPage from '@/pages/Settings/SettingsPage'
import DiaryPage from '@/pages/Diary/DiaryPage'
import PlaceDetailPage from '@/pages/Places/PlaceDetailPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"          element={<DashboardPage />} />
          <Route path="trips"              element={<TripListPage />} />
          <Route path="trips/:id"          element={<TripDetailPage />} />
          <Route path="map"                element={<MapViewPage />} />
          <Route path="gallery"            element={<GalleryPage />} />
          <Route path="timeline"           element={<TimelinePage />} />
          <Route path="memories/:id"       element={<MemoryDetailPage />} />
          <Route path="stats"              element={<StatsPage />} />
          <Route path="settings"           element={<SettingsPage />} />
          <Route path="diary"              element={<DiaryPage />} />
          <Route path="places/:id"         element={<PlaceDetailPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
