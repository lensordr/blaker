import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import {
  IconPlus, IconEdit, IconTrash, IconCheck, IconX,
  IconUsers, IconShield, IconCalendar, IconMoto, IconSettings, IconLogout
} from '../components/Icons'
import { useToast } from '../components/Toast'

// ─── Event Form Modal ─────────────────────────────────────────────────────────
function EventFormModal({ event, onClose }) {
  const createEvent = useStore((s) => s.createEvent)
  const updateEvent = useStore((s) => s.updateEvent)
  const toast = useToast()

  const toLocalDatetime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: toLocalDatetime(event?.date) || '',
    endDate: toLocalDatetime(event?.endDate) || '',
    location: event?.location || '',
    routeUrl: event?.routeUrl || '',
    maxParticipants: event?.maxParticipants || 30,
  })
  const [errors, setErrors] = useState({})

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Título requerido'
    if (!form.date) e.date = 'Fecha de inicio requerida'
    if (!form.endDate) e.endDate = 'Fecha de fin requerida'
    if (!form.location.trim()) e.location = 'Ubicación requerida'
    if (form.date && form.endDate && new Date(form.endDate) <= new Date(form.date)) {
      e.endDate = 'La fecha de fin debe ser posterior al inicio'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const data = {
      ...form,
      date: new Date(form.date).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      maxParticipants: Number(form.maxParticipants),
    }
    if (event) {
      updateEvent(event.id, data)
      toast('Evento actualizado', 'success')
    } else {
      createEvent(data)
      toast('Evento creado 🏍️', 'success')
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">{event ? 'Editar evento' : 'Nuevo evento'}</h2>
        <form onSubmit={handleSubmit} className="stack">
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input className="form-input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Nombre del evento" />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe el evento..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Inicio *</label>
              <input className="form-input" type="datetime-local" value={form.date} onChange={(e) => set('date', e.target.value)} />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Fin *</label>
              <input className="form-input" type="datetime-local" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
              {errors.endDate && <span className="form-error">{errors.endDate}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ubicación *</label>
            <input className="form-input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Ciudad, País" />
            {errors.location && <span className="form-error">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Ruta Google Maps</label>
            <input className="form-input" type="url" value={form.routeUrl} onChange={(e) => set('routeUrl', e.target.value)} placeholder="https://maps.google.com/..." />
          </div>

          <div className="form-group">
            <label className="form-label">Máx. participantes</label>
            <input className="form-input" type="number" min="1" max="500" value={form.maxParticipants} onChange={(e) => set('maxParticipants', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              {event ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Participants Modal ───────────────────────────────────────────────────────
function ParticipantsModal({ event, onClose }) {
  const getEventParticipants = useStore((s) => s.getEventParticipants)
  const updateParticipant = useStore((s) => s.updateParticipant)
  const toast = useToast()
  const participants = getEventParticipants(event.id)

  const EXPERIENCE_LABELS = { beginner: 'Principiante', medio: 'Medio', advanced: 'Avanzado' }
  const HEARD_FROM_LABELS = { instagram: 'Instagram', tiktok: 'TikTok', friends: 'Amigos', other: 'Otro' }

  const pending = participants.filter((p) => p.status === 'pending')
  const approved = participants.filter((p) => p.status === 'approved')
  const rejected = participants.filter((p) => p.status === 'rejected')

  const handleAction = (partId, status) => {
    updateParticipant(partId, status)
    toast(status === 'approved' ? 'Participante aceptado ✓' : 'Participante rechazado', status === 'approved' ? 'success' : 'error')
  }

  const ParticipantCard = ({ p, showActions }) => (
    <div style={{
      background: 'var(--bg-3)',
      borderRadius: 'var(--radius)',
      padding: '12px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: showActions ? 10 : 0 }}>
        <div className="avatar avatar-sm">
          {p.user?.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>{p.user?.name}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.user?.email}</p>
        </div>
        <span className={`badge badge-${p.status}`}>{p.status === 'pending' ? 'Pendiente' : p.status === 'approved' ? 'Aceptado' : 'Rechazado'}</span>
      </div>

      {p.user && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: showActions ? 10 : 0 }}>
          {p.user.motoType && (
            <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>
              🏍️ {p.user.motoType}
            </span>
          )}
          {p.user.experience && (
            <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>
              {EXPERIENCE_LABELS[p.user.experience]}
            </span>
          )}
          {p.user.needsFood && (
            <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>
              🍽️ Comida
            </span>
          )}
          {p.user.isSubscriber && (
            <span style={{ fontSize: 11, background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--accent)' }}>
              ⭐ Suscriptor
            </span>
          )}
          {p.user.heardFrom && (
            <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>
              📣 {HEARD_FROM_LABELS[p.user.heardFrom]}
            </span>
          )}
        </div>
      )}

      {showActions && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-sm"
            style={{ flex: 1, background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.3)' }}
            onClick={() => handleAction(p.id, 'approved')}
          >
            <IconCheck size={14} /> Aceptar
          </button>
          <button
            className="btn btn-danger btn-sm"
            style={{ flex: 1 }}
            onClick={() => handleAction(p.id, 'rejected')}
          >
            <IconX size={14} /> Rechazar
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">Participantes — {event.title}</h2>

        {pending.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p className="section-title" style={{ marginBottom: 8 }}>
              Pendientes ({pending.length})
            </p>
            {pending.map((p) => <ParticipantCard key={p.id} p={p} showActions />)}
          </div>
        )}

        {approved.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p className="section-title" style={{ marginBottom: 8 }}>
              Aceptados ({approved.length})
            </p>
            {approved.map((p) => <ParticipantCard key={p.id} p={p} showActions={false} />)}
          </div>
        )}

        {rejected.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p className="section-title" style={{ marginBottom: 8 }}>
              Rechazados ({rejected.length})
            </p>
            {rejected.map((p) => <ParticipantCard key={p.id} p={p} showActions={false} />)}
          </div>
        )}

        {participants.length === 0 && (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <IconUsers size={36} />
            <p className="empty-state-title">Sin solicitudes aún</p>
          </div>
        )}

        <button className="btn btn-ghost btn-full mt-8" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}

// ─── Admin Settings Modal ─────────────────────────────────────────────────────
function AdminSettingsModal({ onClose }) {
  const currentUser = useStore((s) => s.currentUser)
  const updateUser = useStore((s) => s.updateUser)
  const logout = useStore((s) => s.logout)
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    instaHandle: currentUser?.instaHandle || '',
    currentPassword: '',
    newPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nombre requerido'
    if (!form.email.trim()) errs.email = 'Email requerido'
    if (form.newPassword && form.newPassword.length < 6) errs.newPassword = 'Mínimo 6 caracteres'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))

    const updates = {
      name: form.name.trim(),
      email: form.email.trim(),
      instaHandle: form.instaHandle.trim(),
    }
    if (form.newPassword) updates.password = form.newPassword

    updateUser(currentUser.id, updates)
    setSaving(false)
    toast('Ajustes guardados ✓', 'success')
    onClose()
  }

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">Ajustes de cuenta</h2>

        <form onSubmit={handleSave} className="stack">
          {/* Avatar preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0 8px' }}>
            <div className="avatar avatar-lg" style={{ fontSize: 26 }}>
              {form.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>
                {form.name || 'Admin'}
              </p>
              <span className="badge badge-approved" style={{ marginTop: 4 }}>
                <IconShield size={10} /> Admin
              </span>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

          <p className="section-title" style={{ marginBottom: 0 }}>Información personal</p>

          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" type="text" value={form.name}
              onChange={(e) => set('name', e.target.value)} placeholder="Tu nombre" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email}
              onChange={(e) => set('email', e.target.value)} placeholder="tu@email.com" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Instagram (opcional)</label>
            <input className="form-input" type="text" value={form.instaHandle}
              onChange={(e) => set('instaHandle', e.target.value)} placeholder="@tuusuario" />
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

          <p className="section-title" style={{ marginBottom: 0 }}>Cambiar contraseña</p>

          <div className="form-group">
            <label className="form-label">Nueva contraseña</label>
            <input className="form-input" type="password" value={form.newPassword}
              onChange={(e) => set('newPassword', e.target.value)} placeholder="Dejar vacío para no cambiar" />
            {errors.newPassword && <span className="form-error">{errors.newPassword}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? <span className="spinner" /> : 'Guardar cambios'}
          </button>

          <button type="button" className="btn btn-danger btn-full" onClick={handleLogout}>
            <IconLogout size={16} /> Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const events = useStore((s) => s.events)
  const deleteEvent = useStore((s) => s.deleteEvent)
  const updateEvent = useStore((s) => s.updateEvent)
  const participants = useStore((s) => s.participants)
  const users = useStore((s) => s.users)
  const syncEventStatuses = useStore((s) => s.syncEventStatuses)
  const toast = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [showParticipants, setShowParticipants] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [tab, setTab] = useState('events')

  if (currentUser?.role !== 'admin') {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-3)' }}>Acceso restringido</p>
      </div>
    )
  }

  const pendingCount = participants.filter((p) => p.status === 'pending').length
  const totalUsers = users.filter((u) => u.role !== 'admin').length

  const handleDelete = (event) => {
    if (!window.confirm(`¿Eliminar "${event.title}"?`)) return
    deleteEvent(event.id)
    toast('Evento eliminado', 'error')
  }

  const handleForceStatus = (event, status) => {
    updateEvent(event.id, { status })
    syncEventStatuses()
    toast(`Estado cambiado a: ${status}`, 'success')
  }

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--bg-3) 0%, var(--bg) 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconShield size={22} style={{ color: 'var(--accent)' }} />
            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 26,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Admin
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowSettings(true)} aria-label="Ajustes">
              <IconSettings size={18} />
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditEvent(null); setShowForm(true) }}>
              <IconPlus size={16} />
              Nuevo evento
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Eventos', value: events.length },
            { label: 'Riders', value: totalUsers },
            { label: 'Pendientes', value: pendingCount, accent: pendingCount > 0 },
          ].map((s) => (
            <div key={s.label} style={{
              flex: 1,
              background: 'var(--bg-3)',
              border: `1px solid ${s.accent ? 'var(--accent-border)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '10px',
              textAlign: 'center',
            }}>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 24,
                fontWeight: 900,
                color: s.accent ? 'var(--accent)' : 'var(--text)',
              }}>
                {s.value}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
        {[
          { key: 'events', label: 'Eventos' },
          { key: 'users', label: `Riders (${totalUsers})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
        {/* Events tab */}
        {tab === 'events' && (
          <div className="stack">
            {events.length === 0 && (
              <div className="empty-state">
                <IconCalendar size={40} />
                <p className="empty-state-title">Sin eventos</p>
              </div>
            )}
            {events.map((event) => {
              const eventPending = participants.filter(
                (p) => p.eventId === event.id && p.status === 'pending'
              ).length
              const eventApproved = participants.filter(
                (p) => p.eventId === event.id && p.status === 'approved'
              ).length

              return (
                <div key={event.id} style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span className={`badge badge-${event.status}`}>
                            {event.status === 'active' ? 'En curso' : event.status === 'upcoming' ? 'Próximo' : 'Finalizado'}
                          </span>
                          {eventPending > 0 && (
                            <span className="badge badge-pending">{eventPending} pendientes</span>
                          )}
                        </div>
                        <h3 style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: 18,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}>
                          {event.title}
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                          {format(new Date(event.date), "d MMM yyyy · HH:mm", { locale: es })} · {event.location}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                          {eventApproved} / {event.maxParticipants} riders aceptados
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: 0,
                    borderTop: '1px solid var(--border)',
                  }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }}
                      onClick={() => setShowParticipants(event)}
                    >
                      <IconUsers size={14} />
                      Riders
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }}
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      Ver
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }}
                      onClick={() => { setEditEvent(event); setShowForm(true) }}
                    >
                      <IconEdit size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, borderRadius: 0, color: 'var(--red)' }}
                      onClick={() => handleDelete(event)}
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="stack">
            {users.filter((u) => u.role !== 'admin').length === 0 && (
              <div className="empty-state">
                <IconUsers size={40} />
                <p className="empty-state-title">Sin riders registrados</p>
              </div>
            )}
            {users
              .filter((u) => u.role !== 'admin')
              .map((user) => {
                const EXPERIENCE_LABELS = { beginner: 'Principiante', medio: 'Medio', advanced: 'Avanzado' }
                const HEARD_FROM_LABELS = { instagram: 'Instagram', tiktok: 'TikTok', friends: 'Amigos', other: 'Otro' }
                const MOTO_TYPE_LABELS = { naked: 'Naked', sport: 'Sport', adventure: 'Adventure', touring: 'Touring', scrambler: 'Scrambler', custom: 'Custom', enduro: 'Enduro', other: 'Otra' }
                const userEvents = participants.filter((p) => p.userId === user.id && p.status === 'approved').length

                return (
                  <div key={user.id} style={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div className="avatar">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 15 }}>{user.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{user.email}</p>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {userEvents} evento{userEvents !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {user.motoType && (
                        <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>
                          🏍️ {MOTO_TYPE_LABELS[user.motoType] || user.motoType}
                        </span>
                      )}
                      {user.motoModel && (
                        <span style={{ fontSize: 11, background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--accent)', fontWeight: 700 }}>
                          {user.motoModel}
                        </span>
                      )}
                      {user.location && (
                        <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>
                          📍 {user.location}
                        </span>
                      )}
                      {user.experience && (
                        <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>
                          {EXPERIENCE_LABELS[user.experience]}
                        </span>
                      )}
                      {user.needsFood && (
                        <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>
                          🍽️ Comida
                        </span>
                      )}
                      {user.isSubscriber && (
                        <span style={{ fontSize: 11, background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--accent)' }}>
                          ⭐ Suscriptor
                        </span>
                      )}
                      {user.heardFrom && (
                        <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>
                          📣 {HEARD_FROM_LABELS[user.heardFrom]}
                        </span>
                      )}
                      {user.instaHandle && (
                        <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>
                          📸 {user.instaHandle}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <EventFormModal
          event={editEvent}
          onClose={() => { setShowForm(false); setEditEvent(null) }}
        />
      )}
      {showParticipants && (
        <ParticipantsModal
          event={showParticipants}
          onClose={() => setShowParticipants(null)}
        />
      )}
      {showSettings && (
        <AdminSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
