import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import BlakerLogo from '../components/BlakerLogo'
import { IconMapPin, IconClock, IconUsers, IconMoto, IconPlus } from '../components/Icons'
function StatusBadge({ status }) {
  const labels = { upcoming: 'Próximo', active: 'En curso', ended: 'Finalizado' }
  return <span className={`badge badge-${status}`}>{labels[status]}</span>
}

function EventCard({ event, onClick }) {
  const approved = event.approved_count || 0

  return (
    <div className="event-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>

      {/* Cover — title banner instead of moto icon */}
      <div className="event-card-cover-placeholder">
        {event.coverImage
          ? <img src={event.coverImage} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          : (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '20px 24px',
            }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: 'clamp(28px, 8vw, 40px)',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                color: 'var(--accent)',
                textAlign: 'center',
                lineHeight: 1.05,
                opacity: 0.85,
              }}>
                {event.title}
              </span>
            </div>
          )
        }
        {/* LIVE badge */}
        {event.status === 'active' && (
          <div style={{
            position: 'absolute', top: 14, right: 14, zIndex: 2,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 100, padding: '5px 12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}>
            <span className="live-dot" />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: '#16a34a' }}>LIVE</span>
          </div>
        )}
        {/* Status badge top-left */}
        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
          <StatusBadge status={event.status} />
        </div>
      </div>

      {/* Body */}
      <div className="event-card-body">
        <h3 className="event-card-title">{event.title}</h3>

        <div className="event-card-info">
          <div className="event-card-info-row">
            <IconClock size={14} />
            {format(new Date(event.date), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
          </div>
          <div className="event-card-info-row">
            <IconMapPin size={14} />
            {event.location}
          </div>
        </div>

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <div className="event-card-riders">
            <IconUsers size={12} />
            {approved} / {event.maxParticipants} riders
          </div>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}>
            Ver evento →
          </span>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const routes = useStore((s) => s.routes)
  const fetchRoutes = useStore((s) => s.fetchRoutes)
  const routesLoading = useStore((s) => s.routesLoading)

  useEffect(() => {
    fetchRoutes()
    const interval = setInterval(fetchRoutes, 60_000)
    return () => clearInterval(interval)
  }, [fetchRoutes])

  const activeEvents = routes.filter((e) => e.status === 'active')
  const upcomingEvents = routes.filter((e) => e.status === 'upcoming' || e.status === 'full')
  const endedEvents = routes.filter((e) => e.status === 'ended')

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>

      {/* ── Hero Header ── */}
      <div style={{
        padding: '36px 20px 28px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(232,50,10,0.04) 0%, transparent 100%)',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
        }} />

        <BlakerLogo size={42} showTagline center />

        <p style={{ marginTop: 16, fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>
          Bienvenido, <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{currentUser?.first_name || currentUser?.username}</strong> 👋
        </p>
        <button
          className="btn btn-primary btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => navigate('/events')}
        >
          <IconPlus size={15} /> Crear ruta
        </button>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>

        {/* Active events */}
        {activeEvents.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="live-dot" />
              <p className="section-title" style={{ margin: 0 }}>En curso ahora</p>
            </div>
            <div className="stack">
              {activeEvents.map((e) => (
                <EventCard key={e.id} event={e} onClick={() => navigate(`/events/${e.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p className="section-title">Próximos eventos</p>
            <div className="stack">
              {upcomingEvents.map((e) => (
                <EventCard key={e.id} event={e} onClick={() => navigate(`/events/${e.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Ended events */}
        {endedEvents.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p className="section-title">Eventos pasados</p>
            <div className="stack">
              {endedEvents.map((e) => (
                <EventCard key={e.id} event={e} onClick={() => navigate(`/events/${e.id}`)} />
              ))}
            </div>
          </div>
        )}

        {routes.length === 0 && !routesLoading && (
          <div className="empty-state">
            <IconMoto size={56} />
            <p className="empty-state-title">Sin rutas aún</p>
          </div>
        )}
        {routesLoading && routes.length === 0 && (
          <div className="empty-state">
            <span className="spinner" />
          </div>
        )}
      </div>
    </div>
  )
}
