import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
  if (currentUser.role !== 'admin') return <Navigate to="/" replace />
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

export default function App() {
  const currentUser = useStore((s) => s.currentUser)

  return (
    <BrowserRouter basename="/blaker">
      <ToastProvider />
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
