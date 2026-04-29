import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import { IconMapPin, IconClock, IconUsers, IconCalendar, IconPlus, IconBack } from '../components/Icons'

// ─── Create Route Modal ───────────────────────────────────────────────────────
function CreateRouteModal({ onClose }) {
  const createRoute = useStore((s) => s.createRoute)
  const fetchRoutes = useStore((s) => s.fetchRoutes)
  const toast = useToast ? null : null
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    title: '', description: '', city: '', location_detail: '',
    date: '', end_date: '', max_participants: 20, route_url: '',
  })

  const set = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Requerido'
    if (!form.city.trim()) e.city = 'Requerido'
    if (!form.date) e.date = 'Requerido'
    if (!form.end_date) e.end_date = 'Requerido'
    if (form.date && form.end_date && new Date(form.end_date) <= new Date(form.date)) e.end_date = 'Debe ser posterior al inicio'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const data = {
      ...form,
      date: new Date(form.date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      max_participants: Number(form.max_participants),
    }
    const result = await createRoute(data)
    setSaving(false)
    if (result?.error) { setErrors({ general: result.error }); return }
    await fetchRoutes()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">Nueva ruta 🏍️</h2>
        <form onSubmit={handleSubmit} className="stack">
          {errors.general && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>
              {errors.general}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Ruta por Montserrat" />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe la ruta..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Ciudad *</label>
              <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Barcelona" />
              {errors.city && <span className="form-error">{errors.city}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Detalle ubicación</label>
              <input className="form-input" value={form.location_detail} onChange={e => set('location_detail', e.target.value)} placeholder="Punto de salida" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Inicio *</label>
              <input className="form-input" type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Fin *</label>
              <input className="form-input" type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
              {errors.end_date && <span className="form-error">{errors.end_date}</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Máx. riders</label>
              <input className="form-input" type="number" min="2" max="200" value={form.max_participants} onChange={e => set('max_participants', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Link Google Maps</label>
              <input className="form-input" type="url" value={form.route_url} onChange={e => set('route_url', e.target.value)} placeholder="https://maps.google.com/..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? <span className="spinner" /> : 'Crear ruta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// need toast import
import { useToast } from '../components/Toast'

function EventRow({ event, onClick }) {
  const currentUser = useStore((s) => s.currentUser)
  const isSubscribed = currentUser?.is_subscribed || currentUser?.is_free_user || currentUser?.is_staff

  return (
    <div className="event-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="event-card-cover-placeholder" style={{ height: 140 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px' }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontStyle: 'italic',
            fontSize: 'clamp(22px, 6vw, 32px)', textTransform: 'uppercase', letterSpacing: '0.02em',
            color: 'var(--accent)', textAlign: 'center', lineHeight: 1.05, opacity: 0.85,
          }}>
            {event.title}
          </span>
        </div>
        {event.status === 'active' && (
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.95)', borderRadius: 100, padding: '4px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            <span className="live-dot" />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#16a34a' }}>LIVE</span>
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <span className={`badge badge-${event.status}`}>
            {event.status === 'active' ? 'En curso' : event.status === 'upcoming' ? 'Próximo' : event.status === 'full' ? 'Completo' : 'Finalizado'}
          </span>
        </div>
        {/* Lock for non-subscribers */}
        {!isSubscribed && (
          <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 2, background: 'rgba(0,0,0,0.6)', borderRadius: 100, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12 }}>🔒</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>SUSCRIPCIÓN</span>
          </div>
        )}
      </div>
      <div className="event-card-body">
        <h3 className="event-card-title" style={{ fontSize: 20 }}>{event.title}</h3>
        {isSubscribed ? (
          <div className="event-card-info">
            <div className="event-card-info-row">
              <IconClock size={13} />
              {format(new Date(event.date), "d MMM yyyy · HH:mm", { locale: es })}
            </div>
            <div className="event-card-info-row">
              <IconMapPin size={13} />
              {event.city}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
            Suscríbete para ver los detalles
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          {isSubscribed ? (
            <div className="event-card-riders">
              <IconUsers size={12} />
              {event.approved_count} / {event.max_participants} riders
            </div>
          ) : (
            <div className="event-card-riders">
              <IconUsers size={12} />
              {event.max_participants} riders max
            </div>
          )}
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isSubscribed ? 'var(--accent)' : 'var(--text-3)' }}>
            {isSubscribed ? 'Ver →' : '🔒 Ver'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const navigate = useNavigate()
  const routes = useStore((s) => s.routes)
  const fetchRoutes = useStore((s) => s.fetchRoutes)
  const routesLoading = useStore((s) => s.routesLoading)
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [citySearch, setCitySearch] = useState('')

  useEffect(() => {
    fetchRoutes(citySearch || null)
  }, [fetchRoutes, citySearch])

  const filtered = routes.filter((e) => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return e.status === 'upcoming' || e.status === 'full'
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
      <div style={{ padding: '16px 16px 0', position: 'sticky', top: 0, background: 'rgba(245,245,245,0.95)', backdropFilter: 'blur(20px)', zIndex: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconCalendar size={22} />
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Rutas
            </h1>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <IconPlus size={16} /> Nueva ruta
          </button>
        </div>

        {/* City search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input
            className="form-input"
            type="text"
            placeholder="🔍  Buscar por ciudad..."
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            style={{ paddingLeft: 14, borderRadius: 100 }}
          />
          {citySearch && (
            <button
              onClick={() => setCitySearch('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Popular cities */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', marginBottom: 8 }}>
          {['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Málaga', 'Bilbao', 'Zaragoza', 'Girona'].map((city) => (
            <button
              key={city}
              onClick={() => setCitySearch(citySearch === city ? '' : city)}
              style={{
                padding: '5px 12px', borderRadius: 100, border: '1px solid',
                borderColor: citySearch === city ? 'var(--accent)' : 'var(--border)',
                background: citySearch === city ? 'var(--accent-dim)' : 'transparent',
                color: citySearch === city ? 'var(--accent)' : 'var(--text-2)',
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {city}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid',
              borderColor: filter === f.key ? 'var(--accent)' : 'var(--border)',
              background: filter === f.key ? 'var(--accent-dim)' : 'transparent',
              color: filter === f.key ? 'var(--accent)' : 'var(--text-2)',
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
        {routesLoading && filtered.length === 0 && (
          <div className="empty-state"><span className="spinner" /></div>
        )}
        {!routesLoading && filtered.length === 0 && (
          <div className="empty-state">
            <IconCalendar size={48} />
            <p className="empty-state-title">Sin rutas</p>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="stack">
            {filtered.map((e) => (
              <EventRow key={e.id} event={e} onClick={() => navigate(`/events/${e.id}`)} />
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateRouteModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
