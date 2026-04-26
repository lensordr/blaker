import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import { IconMapPin, IconClock, IconUsers, IconMoto, IconCalendar } from '../components/Icons'

function StatusBadge({ status }) {
  const labels = { upcoming: 'Próximo', active: 'En curso', ended: 'Finalizado' }
  return <span className={`badge badge-${status}`}>{labels[status]}</span>
}

function EventRow({ event, onClick }) {
  const getEventParticipants = useStore((s) => s.getEventParticipants)
  const approved = getEventParticipants(event.id).filter((p) => p.status === 'approved').length

  return (
    <div className="event-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="event-card-cover-placeholder" style={{ height: 140 }}>
        {event.coverImage
          ? <img src={event.coverImage} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          : (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px 20px',
            }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: 'clamp(24px, 7vw, 34px)',
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
        {event.status === 'active' && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 2,
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.95)', borderRadius: 100, padding: '4px 10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>
            <span className="live-dot" />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#16a34a' }}>LIVE</span>
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <span className={`badge badge-${event.status}`}>
            {event.status === 'active' ? 'En curso' : event.status === 'upcoming' ? 'Próximo' : 'Finalizado'}
          </span>
        </div>
      </div>
      <div className="event-card-body">
        <h3 className="event-card-title" style={{ fontSize: 20 }}>{event.title}</h3>
        <div className="event-card-info">
          <div className="event-card-info-row">
            <IconClock size={13} />
            {format(new Date(event.date), "d MMM yyyy · HH:mm", { locale: es })}
          </div>
          <div className="event-card-info-row">
            <IconMapPin size={13} />
            {event.location}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <div className="event-card-riders">
            <IconUsers size={12} />
            {approved} / {event.maxParticipants} riders
          </div>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            Ver →
          </span>
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const navigate = useNavigate()
  const events = useStore((s) => s.events)
  const syncEventStatuses = useStore((s) => s.syncEventStatuses)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    syncEventStatuses()
  }, [syncEventStatuses])

  const filtered = events.filter((e) => {
    if (filter === 'all') return true
    return e.status === filter
  })

  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'En curso' },
    { key: 'upcoming', label: 'Próximos' },
    { key: 'ended', label: 'Pasados' },
  ]

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 0',
        position: 'sticky',
        top: 0,
        background: 'rgba(245,245,245,0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <IconCalendar size={22} />
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Eventos
          </h1>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: filter === f.key ? 'var(--accent)' : 'var(--border)',
                background: filter === f.key ? 'var(--accent-dim)' : 'transparent',
                color: filter === f.key ? 'var(--accent)' : 'var(--text-2)',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <IconCalendar size={48} />
            <p className="empty-state-title">Sin eventos</p>
          </div>
        ) : (
          <div className="stack">
            {filtered.map((e) => (
              <EventRow key={e.id} event={e} onClick={() => navigate(`/events/${e.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
