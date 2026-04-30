import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useStore from './store/useStore'
import BottomNav from './components/BottomNav'
import { ToastProvider } from './components/Toast'

import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({ children }) {
  const currentUser = useStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/auth" replace />
  return children
}

function AdminRoute({ children }) {
  const currentUser = useStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/auth" replace />
  if (!currentUser.is_staff) return <Navigate to="/" replace />
  return children
}

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {children}
      <BottomNav />
    </div>
  )
}

// Global notification poller — runs as long as user is logged in
function NotificationPoller() {
  const currentUser = useStore((s) => s.currentUser)
  const fetchNotifications = useStore((s) => s.fetchNotifications)
  const refreshUser = useStore((s) => s.refreshUser)

  useEffect(() => {
    if (!currentUser) return
    // Fetch immediately on mount/login
    fetchNotifications()
    refreshUser()
    // Poll every 8 seconds
    const interval = setInterval(() => {
      fetchNotifications()
    }, 8000)
    return () => clearInterval(interval)
  }, [currentUser?.id, fetchNotifications, refreshUser])

  return null
}

export default function App() {
  const currentUser = useStore((s) => s.currentUser)

  return (
    <BrowserRouter basename="/blaker">
      <ToastProvider />
      <NotificationPoller />
      <Routes>
        {/* Auth */}
        <Route
          path="/auth"
          element={currentUser ? <Navigate to="/" replace /> : <AuthPage />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HomePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EventsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EventDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NotificationsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AppLayout>
                <AdminPage />
              </AppLayout>
            </AdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={currentUser ? '/' : '/auth'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
