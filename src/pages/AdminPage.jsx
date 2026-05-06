import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX, IconUsers, IconShield, IconCalendar, IconSettings, IconLogout } from '../components/Icons'
import { useToast } from '../components/Toast'
import { api } from '../api'

const toLocal = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// ─── Event Form Modal ─────────────────────────────────────────────────────────
function EventFormModal({ event, onClose }) {
  const createRoute = useStore((s) => s.createRoute)
  const updateRoute = useStore((s) => s.updateRoute)
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: toLocal(event?.date) || '',
    end_date: toLocal(event?.end_date) || '',
    city: event?.city || '',
    location_detail: event?.location_detail || '',
    route_url: event?.route_url || '',
    max_participants: event?.max_participants || 25,
  })
  const [errors, setErrors] = useState({})
  const set = (f, v) => { setForm(p => ({...p, [f]: v})); setErrors(p => ({...p, [f]: ''})) }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Requerido'
    if (!form.date) e.date = 'Requerido'
    if (!form.end_date) e.end_date = 'Requerido'
    if (!form.city.trim()) e.city = 'Requerido'
    if (form.date && form.end_date && new Date(form.end_date) <= new Date(form.date)) e.end_date = 'Debe ser posterior al inicio'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const data = { ...form, date: new Date(form.date).toISOString(), end_date: new Date(form.end_date).toISOString(), max_participants: Number(form.max_participants) }
    const result = event ? await updateRoute(event.id, data) : await createRoute(data)
    setSaving(false)
    if (result?.error) { toast(result.error, 'error'); return }
    toast(event ? 'Ruta actualizada ✓' : 'Ruta creada 🏍️', 'success')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">{event ? 'Editar ruta' : 'Nueva ruta'}</h2>
        <form onSubmit={handleSubmit} className="stack">
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Nombre de la ruta" />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe la ruta..." />
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
          <div className="form-group">
            <label className="form-label">Ciudad *</label>
            <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Barcelona, Madrid..." />
            {errors.city && <span className="form-error">{errors.city}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Detalle ubicación</label>
            <input className="form-input" value={form.location_detail} onChange={e => set('location_detail', e.target.value)} placeholder="Punto de salida..." />
          </div>
          <div className="form-group">
            <label className="form-label">Ruta Google Maps</label>
            <input className="form-input" type="url" value={form.route_url} onChange={e => set('route_url', e.target.value)} placeholder="https://maps.google.com/..." />
          </div>
          <div className="form-group">
            <label className="form-label">Máx. participantes</label>
            <input className="form-input" type="number" min="1" max="500" value={form.max_participants} onChange={e => set('max_participants', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? <span className="spinner" /> : event ? 'Guardar' : 'Crear ruta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Participants Modal ───────────────────────────────────────────────────────
function ParticipantsModal({ route, onClose }) {
  const participants = useStore((s) => s.participants[route.id] || [])
  const fetchParticipants = useStore((s) => s.fetchParticipants)
  const updateParticipant = useStore((s) => s.updateParticipant)
  const toast = useToast()

  useEffect(() => { fetchParticipants(route.id) }, [route.id])

  const EXP = { beginner: 'Principiante', medio: 'Medio', advanced: 'Avanzado' }
  const pending = participants.filter(p => p.status === 'pending')
  const approved = participants.filter(p => p.status === 'approved')
  const rejected = participants.filter(p => p.status === 'rejected')

  const handleAction = async (partId, status) => {
    const result = await updateParticipant(route.id, partId, status)
    if (result?.error) toast(result.error, 'error')
    else toast(status === 'approved' ? 'Aceptado ✓' : 'Rechazado', status === 'approved' ? 'success' : 'error')
  }

  const Card = ({ p, actions }) => (
    <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: actions ? 10 : 0 }}>
        <div className="avatar avatar-sm">{(p.user?.first_name || p.user?.username || '?')[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>{p.user?.first_name} {p.user?.last_name}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.user?.email}</p>
        </div>
        <span className={`badge badge-${p.status}`}>{p.status === 'pending' ? 'Pendiente' : p.status === 'approved' ? 'Aceptado' : 'Rechazado'}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: actions ? 10 : 0 }}>
        {p.user?.moto_model && <span style={{ fontSize: 11, background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--accent)', fontWeight: 700 }}>🏍️ {p.user.moto_model}</span>}
        {p.user?.experience && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>{EXP[p.user.experience]}</span>}
        {p.user?.needs_food && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>🍽️ Comida</span>}
        {p.user?.is_subscribed && <span style={{ fontSize: 11, background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--accent)' }}>⭐ Suscriptor</span>}
        {p.user?.location && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>📍 {p.user.location}</span>}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" style={{ flex: 1, background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.3)' }} onClick={() => handleAction(p.id, 'approved')}>
            <IconCheck size={14} /> Aceptar
          </button>
          <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleAction(p.id, 'rejected')}>
            <IconX size={14} /> Rechazar
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">Riders — {route.title}</h2>
        {pending.length > 0 && <><p className="section-title" style={{ marginBottom: 8 }}>Pendientes ({pending.length})</p>{pending.map(p => <Card key={p.id} p={p} actions />)}</>}
        {approved.length > 0 && <><p className="section-title" style={{ marginBottom: 8, marginTop: 12 }}>Aceptados ({approved.length})</p>{approved.map(p => <Card key={p.id} p={p} actions={false} />)}</>}
        {rejected.length > 0 && <><p className="section-title" style={{ marginBottom: 8, marginTop: 12 }}>Rechazados ({rejected.length})</p>{rejected.map(p => <Card key={p.id} p={p} actions={false} />)}</>}
        {participants.length === 0 && <div className="empty-state" style={{ padding: '24px 0' }}><IconUsers size={36} /><p className="empty-state-title">Sin solicitudes</p></div>}
        <button className="btn btn-ghost btn-full mt-8" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ onClose }) {
  const currentUser = useStore((s) => s.currentUser)
  const updateCurrentUser = useStore((s) => s.updateCurrentUser)
  const logout = useStore((s) => s.logout)
  const navigate = useNavigate()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: currentUser?.first_name || '',
    email: currentUser?.email || '',
    insta_handle: currentUser?.insta_handle || '',
    password: '',
  })
  const set = (f, v) => setForm(p => ({...p, [f]: v}))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const data = { first_name: form.first_name, email: form.email, insta_handle: form.insta_handle }
    if (form.password) data.password = form.password
    const result = await updateCurrentUser(data)
    setSaving(false)
    if (result?.error) { toast(result.error, 'error'); return }
    toast('Guardado ✓', 'success')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className="avatar avatar-lg" style={{ fontSize: 24 }}>{(form.first_name || 'A')[0].toUpperCase()}</div>
          <div>
            <h2 className="modal-title" style={{ marginBottom: 4 }}>Ajustes de cuenta</h2>
            <span className="badge badge-approved"><IconShield size={10} /> Admin</span>
          </div>
        </div>
        <form onSubmit={handleSave} className="stack">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Instagram</label>
            <input className="form-input" value={form.insta_handle} onChange={e => set('insta_handle', e.target.value)} placeholder="@tuusuario" />
          </div>
          <div className="form-group">
            <label className="form-label">Nueva contraseña</label>
            <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Dejar vacío para no cambiar" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? <span className="spinner" /> : 'Guardar cambios'}
          </button>
          <button type="button" className="btn btn-danger btn-full" onClick={() => { logout(); navigate('/auth') }}>
            <IconLogout size={16} /> Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Promo Codes Tab ──────────────────────────────────────────────────────────
function PromoCodesTab() {
  const toast = useToast()
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editCode, setEditCode] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = async () => {
    setLoading(true)
    try { setCodes(await api.getPromoCodes()) } catch (e) { toast('Error al cargar códigos', 'error') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    const result = await api.deletePromoCode(id).then(() => ({ ok: true })).catch((e) => ({ error: e.data?.error || 'Error' }))
    setConfirmDelete(null)
    if (result.error) toast(result.error, 'error')
    else { toast('Código eliminado', 'success'); load() }
  }

  return (
    <div>
      <button className="btn btn-primary btn-full" style={{ marginBottom: 16 }} onClick={() => { setEditCode(null); setShowForm(true) }}>
        <IconPlus size={16} /> Crear código promocional
      </button>

      {loading && <div className="empty-state"><span className="spinner" /></div>}

      {!loading && codes.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-title">Sin códigos</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Crea tu primer código promocional</p>
        </div>
      )}

      <div className="stack">
        {codes.map((code) => (
          <div key={code.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: '0.08em', color: 'var(--accent)' }}>
                  {code.code}
                </span>
                <span className={`badge ${code.is_active ? 'badge-approved' : 'badge-ended'}`}>
                  {code.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {code.days_free} días gratis
                {code.max_uses ? ` · Máx. ${code.max_uses} usos` : ' · Usos ilimitados'}
                {code.uses_count !== undefined ? ` · Usado ${code.uses_count} veces` : ''}
              </p>
              {code.expires_at && (
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  Expira: {format(new Date(code.expires_at), "d MMM yyyy", { locale: es })}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }}
                onClick={() => { setEditCode(code); setShowForm(true) }}>
                <IconEdit size={14} /> Editar
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, color: 'var(--red)' }}
                onClick={() => setConfirmDelete(code)}>
                <IconTrash size={14} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <PromoFormModal
          code={editCode}
          onClose={() => { setShowForm(false); setEditCode(null) }}
          onSaved={() => { setShowForm(false); setEditCode(null); load() }}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title" style={{ fontSize: 20 }}>¿Eliminar código?</h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 24 }}>
              Se eliminará el código <strong>{confirmDelete.code}</strong> permanentemente.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete.id)}>
                <IconTrash size={16} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Promo Form Modal ─────────────────────────────────────────────────────────
function PromoFormModal({ code, onClose, onSaved }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: code?.code || '',
    days_free: code?.days_free || 30,
    max_uses: code?.max_uses || '',
    expires_at: code?.expires_at ? code.expires_at.slice(0, 10) : '',
    is_active: code?.is_active ?? true,
  })
  const [errors, setErrors] = useState({})
  const set = (f, v) => { setForm((p) => ({ ...p, [f]: v })); setErrors((p) => ({ ...p, [f]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.code.trim()) e.code = 'Requerido'
    if (!form.days_free || Number(form.days_free) < 1) e.days_free = 'Mínimo 1 día'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const data = {
      code: form.code.trim().toUpperCase(),
      days_free: Number(form.days_free),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    }
    try {
      if (code) await api.updatePromoCode(code.id, data)
      else await api.createPromoCode(data)
      toast(code ? 'Código actualizado ✓' : 'Código creado ✓', 'success')
      onSaved()
    } catch (err) {
      toast(err.data?.error || 'Error al guardar', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">{code ? 'Editar código' : 'Nuevo código'}</h2>
        <form onSubmit={handleSubmit} className="stack">
          <div className="form-group">
            <label className="form-label">Código *</label>
            <input className="form-input" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="Ej: RUTILLAS30" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }} />
            {errors.code && <span className="form-error">{errors.code}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Días gratis *</label>
              <input className="form-input" type="number" min="1" max="365" value={form.days_free}
                onChange={(e) => set('days_free', e.target.value)} />
              {errors.days_free && <span className="form-error">{errors.days_free}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Máx. usos</label>
              <input className="form-input" type="number" min="1" value={form.max_uses}
                onChange={(e) => set('max_uses', e.target.value)} placeholder="Ilimitado" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de expiración</label>
            <input className="form-input" type="date" value={form.expires_at}
              onChange={(e) => set('expires_at', e.target.value)} />
          </div>
          <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: '4px 14px' }}>
            <div className="toggle-row">
              <span className="toggle-label">Código activo</span>
              <label className="toggle">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? <span className="spinner" /> : code ? 'Guardar' : 'Crear código'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const routes = useStore((s) => s.routes)
  const fetchRoutes = useStore((s) => s.fetchRoutes)
  const deleteRoute = useStore((s) => s.deleteRoute)
  const adminUsers = useStore((s) => s.adminUsers)
  const fetchAdminUsers = useStore((s) => s.fetchAdminUsers)
  const participants = useStore((s) => s.participants)
  const toast = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editRoute, setEditRoute] = useState(null)
  const [showParticipants, setShowParticipants] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [tab, setTab] = useState('routes')

  useEffect(() => {
    fetchRoutes()
    fetchAdminUsers()
  }, [])

  if (!currentUser?.is_staff) {
    return <div style={{ padding: 24, textAlign: 'center' }}><p style={{ color: 'var(--text-3)' }}>Acceso restringido</p></div>
  }

  const totalPending = Object.values(participants).flat().filter(p => p.status === 'pending').length

  const handleDelete = async () => {
    const result = await deleteRoute(confirmDelete.id)
    setConfirmDelete(null)
    if (result?.error) toast(result.error, 'error')
    else toast('Ruta eliminada', 'error')
  }

  const EXP = { beginner: 'Principiante', medio: 'Medio', advanced: 'Avanzado' }
  const MOTO = { naked: 'Naked', sport: 'Sport', adventure: 'Adventure', touring: 'Touring', scrambler: 'Scrambler', custom: 'Custom', enduro: 'Enduro', other: 'Otra' }

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--bg-3) 0%, var(--bg) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconShield size={22} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Admin</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowSettings(true)}><IconSettings size={18} /></button>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditRoute(null); setShowForm(true) }}><IconPlus size={16} /> Nueva ruta</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Rutas', value: routes.length },
            { label: 'Riders', value: adminUsers.length },
            { label: 'Pendientes', value: totalPending, accent: totalPending > 0 },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--bg-3)', border: `1px solid ${s.accent ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: 10, textAlign: 'center' }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, color: s.accent ? 'var(--accent)' : 'var(--text)' }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
        {[{ key: 'routes', label: 'Rutas' }, { key: 'users', label: `Riders (${adminUsers.length})` }, { key: 'promos', label: '🎟️ Promos' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '12px 16px', border: 'none', background: 'transparent', color: tab === t.key ? 'var(--accent)' : 'var(--text-3)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
        {/* Routes tab */}
        {tab === 'routes' && (
          <div className="stack">
            {routes.length === 0 && <div className="empty-state"><IconCalendar size={40} /><p className="empty-state-title">Sin rutas</p></div>}
            {routes.map(route => {
              const routeParts = participants[route.id] || []
              const pending = routeParts.filter(p => p.status === 'pending').length
              const approved = routeParts.filter(p => p.status === 'approved').length
              return (
                <div key={route.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className={`badge badge-${route.status}`}>{route.status === 'active' ? 'En curso' : route.status === 'upcoming' ? 'Próximo' : route.status === 'full' ? 'Completo' : 'Finalizado'}</span>
                      {pending > 0 && <span className="badge badge-pending">{pending} pendientes</span>}
                    </div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>{route.title}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{format(new Date(route.date), "d MMM yyyy · HH:mm", { locale: es })} · {route.city}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{route.approved_count} / {route.max_participants} riders aceptados</p>
                  </div>
                  <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }} onClick={() => setShowParticipants(route)}><IconUsers size={14} /> Riders</button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }} onClick={() => navigate(`/events/${route.id}`)}>Ver</button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, borderRight: '1px solid var(--border)' }} onClick={() => { setEditRoute(route); setShowForm(true) }}><IconEdit size={14} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, borderRadius: 0, color: 'var(--red)' }} onClick={() => setConfirmDelete(route)}><IconTrash size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="stack">
            {adminUsers.length === 0 && <div className="empty-state"><IconUsers size={40} /><p className="empty-state-title">Sin riders</p></div>}
            {adminUsers.map(user => (
              <div key={user.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="avatar">{(user.first_name || user.username || '?')[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{user.first_name} {user.last_name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{user.email}</p>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{user.routes_count} ruta{user.routes_count !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {user.moto_type && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>🏍️ {MOTO[user.moto_type] || user.moto_type}</span>}
                  {user.moto_model && <span style={{ fontSize: 11, background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--accent)', fontWeight: 700 }}>{user.moto_model}</span>}
                  {user.location && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>📍 {user.location}</span>}
                  {user.experience && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>{EXP[user.experience]}</span>}
                  {user.is_subscribed && <span style={{ fontSize: 11, background: 'var(--accent-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--accent)' }}>⭐ Suscriptor</span>}
                  {user.is_free_user && <span style={{ fontSize: 11, background: 'var(--green-dim)', borderRadius: 4, padding: '2px 7px', color: 'var(--green)' }}>🆓 Free</span>}
                  {user.insta_handle && <span style={{ fontSize: 11, background: 'var(--bg-4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text-2)' }}>📸 {user.insta_handle}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Promo codes tab */}
        {tab === 'promos' && (
          <PromoCodesTab />
        )}
      </div>

      {showForm && <EventFormModal event={editRoute} onClose={() => { setShowForm(false); setEditRoute(null) }} />}
      {showParticipants && <ParticipantsModal route={showParticipants} onClose={() => setShowParticipants(null)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title" style={{ fontSize: 20 }}>¿Eliminar ruta?</h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 24 }}>Se eliminará <strong>"{confirmDelete.title}"</strong> permanentemente.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}><IconTrash size={16} /> Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
