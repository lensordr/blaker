import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Component } from 'react'
import useStore from './store/useStore'
import BottomNav from './components/BottomNav'
import { ToastProvider } from './components/Toast'

import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import EventsPage from './pages/EventsPage'
import EventDetailPage, { ChatPage } from './pages/EventDetailPage'
import { ForgotPasswordPage, ResetPasswordPage, ConfirmEmailPage } from './pages/ForgotPasswordPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'

// Error boundary to catch React crashes
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e.message } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#e8320a', marginBottom: 12 }}>Error</h2>
          <p style={{ color: '#555', fontSize: 14 }}>{this.state.error}</p>
          <button onClick={() => { localStorage.clear(); window.location.reload() }}
            style={{ marginTop: 20, padding: '10px 20px', background: '#e8320a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Limpiar caché y recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function ProtectedRoute({ children }) {
  const currentUser = useStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/auth" replace />
  return children
}

function AdminRoute({ children }) {
  const currentUser = useStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/auth" replace />
  if (!currentUser.is_staff) return <Navigate to="/events" replace />
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
    <ErrorBoundary>
    <BrowserRouter basename="/" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider />
      <NotificationPoller />
      <Routes>
        {/* Auth */}
        <Route path="/auth" element={currentUser ? <Navigate to="/events" replace /> : <AuthPage />} />
        <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset/:token" element={<ResetPasswordPage />} />
        <Route path="/auth/confirm/:token" element={<ConfirmEmailPage />} />

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
          path="/events/:id/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
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
        <Route path="*" element={<Navigate to={currentUser ? '/events' : '/auth'} replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
