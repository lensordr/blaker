import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import { IconBell, IconCheck } from '../components/Icons'

function NotifIcon({ type }) {
  const icons = { join_request: '🏍️', approved: '✅', rejected: '❌', new_message: '💬' }
  return <span style={{ fontSize: 20 }}>{icons[type] || '🔔'}</span>
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const notifications = useStore((s) => s.notifications)
  const fetchNotifications = useStore((s) => s.fetchNotifications)
  const markNotificationRead = useStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead)

  const hasUnread = notifications.some((n) => !n.read)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    const t = setTimeout(() => markAllNotificationsRead(), 1500)
    return () => clearTimeout(t)
  }, [markAllNotificationsRead])

  const handleClick = (notif) => {
    markNotificationRead(notif.id)
    if (notif.route_id) navigate(`/events/${notif.route_id}`)
  }

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconBell size={22} />
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Notificaciones
          </h1>
        </div>
        {hasUnread && (
          <button className="btn btn-ghost btn-sm" onClick={markAllNotificationsRead}>
            <IconCheck size={14} /> Leer todo
          </button>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {notifications.length === 0 ? (
          <div className="empty-state">
            <IconBell size={48} />
            <p className="empty-state-title">Sin notificaciones</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Aquí aparecerán tus avisos</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} onClick={() => handleClick(notif)} style={{
              display: 'flex', gap: 12, padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              cursor: notif.route_id ? 'pointer' : 'default',
              background: notif.read ? 'transparent' : 'rgba(232,50,10,0.04)',
              transition: 'background 0.15s',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <NotifIcon type={notif.type} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, lineHeight: 1.4, color: notif.read ? 'var(--text-2)' : 'var(--text)' }}>
                  {notif.message}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                </p>
              </div>
              {!notif.read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
