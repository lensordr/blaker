import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import BlakerLogo from '../components/BlakerLogo'
import { IconMapPin, IconClock, IconUsers, IconMoto } from '../components/Icons'

function StatusBadge({ status }) {
  const labels = { upcoming: 'Próximo', active: 'En curso', ended: 'Finalizado' }
  return <span className={`badge badge-${status}`}>{labels[status]}</span>
}

function EventCard({ event, onClick }) {
  const getEventParticipants = useStore((s) => s.getEventParticipants)
  const approved = getEventParticipants(event.id).filter((p) => p.status === 'approved').length

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
  const events = useStore((s) => s.events)
  const syncEventStatuses = useStore((s) => s.syncEventStatuses)

  useEffect(() => {
    syncEventStatuses()
    const interval = setInterval(syncEventStatuses, 60_000)
    return () => clearInterval(interval)
  }, [syncEventStatuses])

  const activeEvents = events.filter((e) => e.status === 'active')
  const upcomingEvents = events.filter((e) => e.status === 'upcoming')
  const endedEvents = events.filter((e) => e.status === 'ended')

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
          Bienvenido, <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{currentUser?.name?.split(' ')[0]}</strong> 👋
        </p>
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

        {events.length === 0 && (
          <div className="empty-state">
            <IconMoto size={56} />
            <p className="empty-state-title">Sin eventos aún</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>El admin publicará los próximos eventos aquí</p>
          </div>
        )}
      </div>
    </div>
  )
}
