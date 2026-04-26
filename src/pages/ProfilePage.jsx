import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { IconLogout, IconShield, IconMapPin, IconCalendar, IconSettings, IconEdit } from '../components/Icons'
import { useToast } from '../components/Toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const EXPERIENCE_LABELS = { beginner: 'Principiante', medio: 'Medio', advanced: 'Avanzado' }
const EXPERIENCE_COLORS = { beginner: 'var(--green)', medio: 'var(--yellow)', advanced: 'var(--accent)' }
const MOTO_TYPE_LABELS = {
  naked: 'Naked', sport: 'Sport / Supersport', adventure: 'Adventure / Trail',
  touring: 'Touring', scrambler: 'Scrambler / Café Racer', custom: 'Custom / Cruiser',
  enduro: 'Enduro / Off-road', other: 'Otra',
}
const MOTO_TYPE_OPTIONS = [
  { value: 'naked', label: 'Naked' }, { value: 'sport', label: 'Sport / Supersport' },
  { value: 'adventure', label: 'Adventure / Trail' }, { value: 'touring', label: 'Touring' },
  { value: 'scrambler', label: 'Scrambler / Café Racer' }, { value: 'custom', label: 'Custom / Cruiser' },
  { value: 'enduro', label: 'Enduro / Off-road' }, { value: 'other', label: 'Otra' },
]
const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: '🟢 Principiante — menos de 2 años' },
  { value: 'medio', label: '🟡 Medio — 2 a 5 años' },
  { value: 'advanced', label: '🔴 Avanzado — más de 5 años' },
]
const HEARD_FROM_LABELS = { instagram: 'Instagram', tiktok: 'TikTok', friends: 'Amigos', other: 'Otro' }

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ onClose }) {
  const currentUser = useStore((s) => s.currentUser)
  const updateUser = useStore((s) => s.updateUser)
  const toast = useToast()

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    location: currentUser?.location || '',
    motoType: currentUser?.motoType || '',
    motoModel: currentUser?.motoModel || '',
    experience: currentUser?.experience || '',
    instaHandle: currentUser?.instaHandle || '',
    needsFood: currentUser?.needsFood ?? false,
    isSubscriber: currentUser?.isSubscriber ?? false,
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
      location: form.location.trim(),
      motoType: form.motoType,
      motoModel: form.motoModel.trim(),
      experience: form.experience,
      instaHandle: form.instaHandle.trim(),
      needsFood: form.needsFood,
      isSubscriber: form.isSubscriber,
    }
    if (form.newPassword) updates.password = form.newPassword

    updateUser(currentUser.id, updates)
    setSaving(false)
    toast('Perfil actualizado ✓', 'success')
    onClose()
  }

  const isAdmin = currentUser?.role === 'admin'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className="avatar avatar-lg" style={{ fontSize: 24 }}>
            {form.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="modal-title" style={{ marginBottom: 2 }}>Editar perfil</h2>
            {isAdmin && <span className="badge badge-approved"><IconShield size={10} /> Admin</span>}
          </div>
        </div>

        <form onSubmit={handleSave} className="stack">

          {/* ── Personal info ── */}
          <p className="section-title" style={{ marginBottom: 4 }}>Información personal</p>

          <div className="form-group">
            <label className="form-label">Nombre completo</label>
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

          {!isAdmin && (
            <div className="form-group">
              <label className="form-label">Ciudad / Ubicación</label>
              <input className="form-input" type="text" value={form.location}
                onChange={(e) => set('location', e.target.value)} placeholder="Madrid, Barcelona..." />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Instagram (opcional)</label>
            <input className="form-input" type="text" value={form.instaHandle}
              onChange={(e) => set('instaHandle', e.target.value)} placeholder="@tuusuario" />
          </div>

          {/* ── Moto info (non-admin only) ── */}
          {!isAdmin && (
            <>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <p className="section-title" style={{ marginBottom: 4 }}>Tu moto</p>

              <div className="form-group">
                <label className="form-label">Tipo de moto</label>
                <select className="form-select" value={form.motoType}
                  onChange={(e) => set('motoType', e.target.value)}>
                  <option value="">Selecciona el tipo...</option>
                  {MOTO_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Marca y modelo</label>
                <input className="form-input" type="text" value={form.motoModel}
                  onChange={(e) => set('motoModel', e.target.value)} placeholder="Yamaha MT-07..." />
              </div>

              <div className="form-group">
                <label className="form-label">Nivel de experiencia</label>
                <select className="form-select" value={form.experience}
                  onChange={(e) => set('experience', e.target.value)}>
                  <option value="">Selecciona tu nivel...</option>
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: '4px 14px' }}>
                <div className="toggle-row">
                  <span className="toggle-label">¿Necesitas comida en el evento?</span>
                  <label className="toggle">
                    <input type="checkbox" checked={form.needsFood} onChange={(e) => set('needsFood', e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <div className="toggle-row">
                  <span className="toggle-label">¿Eres suscriptor de Blaker?</span>
                  <label className="toggle">
                    <input type="checkbox" checked={form.isSubscriber} onChange={(e) => set('isSubscriber', e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ── Password ── */}
          <div style={{ height: 1, background: 'var(--border)' }} />
          <p className="section-title" style={{ marginBottom: 4 }}>Cambiar contraseña</p>

          <div className="form-group">
            <label className="form-label">Nueva contraseña</label>
            <input className="form-input" type="password" value={form.newPassword}
              onChange={(e) => set('newPassword', e.target.value)} placeholder="Dejar vacío para no cambiar" />
            {errors.newPassword && <span className="form-error">{errors.newPassword}</span>}
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
              {saving ? <span className="spinner" /> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, accent }) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--bg-2)',
      border: `1px solid ${accent ? 'rgba(232,50,10,0.2)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '16px 12px',
      textAlign: 'center',
      boxShadow: accent ? '0 4px 16px rgba(232,50,10,0.08)' : 'var(--shadow-sm)',
    }}>
      <p style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900, fontSize: 36, lineHeight: 1,
        color: accent ? 'var(--accent)' : 'var(--text)', marginBottom: 4,
      }}>
        {value}
      </p>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {label}
      </p>
    </div>
  )
}

function InfoRow({ label, value, highlight }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: highlight ? 'var(--accent)' : 'var(--text)', fontWeight: highlight ? 700 : 500, textAlign: 'right', maxWidth: '60%' }}>
        {value}
      </span>
    </div>
  )
}

// ─── Instagram pill ───────────────────────────────────────────────────────────
function InstagramPill({ handle }) {
  if (!handle) return null
  const clean = handle.startsWith('@') ? handle : `@${handle}`
  const url = `https://instagram.com/${handle.replace('@', '')}`
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      textDecoration: 'none',
      background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
      borderRadius: 100, padding: '5px 12px',
      boxShadow: '0 2px 12px rgba(220,39,67,0.3)',
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '0.02em' }}>{clean}</span>
    </a>
  )
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const logout = useStore((s) => s.logout)
  const participants = useStore((s) => s.participants)
  const events = useStore((s) => s.events)
  const toast = useToast()
  const [showEdit, setShowEdit] = useState(false)

  const myParticipations = participants.filter((p) => p.userId === currentUser?.id)
  const approvedEvents = myParticipations.filter((p) => p.status === 'approved')
  const pendingEvents = myParticipations.filter((p) => p.status === 'pending')

  const myApprovedEvents = approvedEvents
    .map((p) => events.find((e) => e.id === p.eventId))
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const completedRoutes = myApprovedEvents.filter((e) => e.status === 'ended').length
  const upcomingRoutes = myApprovedEvents.filter((e) => e.status === 'upcoming' || e.status === 'active').length

  const handleLogout = () => {
    logout()
    toast('Hasta pronto 👋', 'success')
    navigate('/auth')
  }

  const initials = currentUser?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>

      {/* ── Hero header ── */}
      <div style={{
        padding: '28px 20px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, rgba(232,50,10,0.04) 0%, transparent 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, maxWidth: 480, margin: '0 auto' }}>
          {/* Avatar */}
          <div className="avatar avatar-lg" style={{ fontSize: 26, flexShrink: 0 }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 26, fontWeight: 900, fontStyle: 'italic',
                textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1,
              }}>
                {currentUser?.name}
              </h2>
              {currentUser?.role === 'admin' && (
                <span className="badge badge-approved"><IconShield size={10} /> Admin</span>
              )}
              {currentUser?.experience && currentUser.role !== 'admin' && (
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: EXPERIENCE_COLORS[currentUser.experience],
                  background: `${EXPERIENCE_COLORS[currentUser.experience]}18`,
                  border: `1px solid ${EXPERIENCE_COLORS[currentUser.experience]}30`,
                  borderRadius: 100, padding: '3px 9px',
                }}>
                  {EXPERIENCE_LABELS[currentUser.experience]}
                </span>
              )}
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{currentUser?.email}</p>

            {currentUser?.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                <IconMapPin size={12} style={{ color: 'var(--text-3)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{currentUser.location}</span>
              </div>
            )}

            {/* Instagram pill */}
            {currentUser?.instaHandle && (
              <div style={{ marginTop: 8 }}>
                <InstagramPill handle={currentUser.instaHandle} />
              </div>
            )}
          </div>

          {/* Edit button */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowEdit(true)}
            aria-label="Editar perfil"
            style={{ flexShrink: 0 }}
          >
            <IconEdit size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>

        {/* ── Stats (non-admin) ── */}
        {currentUser?.role !== 'admin' && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-title">Mis rutas</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <StatCard value={approvedEvents.length} label="Rutas totales" accent />
              <StatCard value={completedRoutes} label="Completadas" />
              <StatCard value={upcomingRoutes} label="Próximas" />
            </div>
          </div>
        )}

        {/* ── Rider info (non-admin) ── */}
        {currentUser?.role !== 'admin' && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-title">Mi perfil rider</p>
            <div style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '4px 16px', boxShadow: 'var(--shadow-sm)',
            }}>
              <InfoRow label="Tipo de moto" value={MOTO_TYPE_LABELS[currentUser?.motoType]} />
              <InfoRow label="Moto" value={currentUser?.motoModel} highlight />
              <InfoRow label="Ubicación" value={currentUser?.location} />
              <InfoRow label="Nivel" value={EXPERIENCE_LABELS[currentUser?.experience]} />
              <InfoRow label="Comida" value={currentUser?.needsFood ? 'Sí necesita' : 'No necesita'} />
              <InfoRow label="Suscriptor" value={currentUser?.isSubscriber ? '⭐ Sí' : 'No'} />
              {/* Instagram row */}
              {currentUser?.instaHandle && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Instagram
                  </span>
                  <InstagramPill handle={currentUser.instaHandle} />
                </div>
              )}
              <InfoRow label="Nos conoció por" value={HEARD_FROM_LABELS[currentUser?.heardFrom]} />
            </div>
          </div>
        )}

        {/* ── Admin quick info ── */}
        {currentUser?.role === 'admin' && currentUser?.instaHandle && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-title">Redes sociales</p>
            <div style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: 'var(--shadow-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Instagram</span>
              <InstagramPill handle={currentUser.instaHandle} />
            </div>
          </div>
        )}

        {/* ── Route history (non-admin) ── */}
        {myApprovedEvents.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-title">Historial de rutas</p>
            <div className="stack">
              {myApprovedEvents.map((e) => (
                <div key={e.id} onClick={() => navigate(`/events/${e.id}`)} style={{
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    background: e.status === 'ended' ? 'var(--bg-3)' : 'var(--accent-dim)',
                    border: `1px solid ${e.status === 'ended' ? 'var(--border)' : 'var(--accent-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconCalendar size={18} style={{ color: e.status === 'ended' ? 'var(--text-3)' : 'var(--accent)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 900,
                      textTransform: 'uppercase', letterSpacing: '0.02em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {e.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <IconMapPin size={11} style={{ color: 'var(--text-3)' }} />
                      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{e.location}</p>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                      {format(new Date(e.date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <span className={`badge badge-${e.status}`}>
                    {e.status === 'active' ? 'En curso' : e.status === 'upcoming' ? 'Próximo' : 'Finalizado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending */}
        {pendingEvents.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              background: 'var(--yellow-dim)', border: '1px solid rgba(217,119,6,0.2)',
              borderRadius: 'var(--radius)', padding: '12px 16px',
              fontSize: 13, color: 'var(--yellow)', fontWeight: 600,
            }}>
              {pendingEvents.length} solicitud{pendingEvents.length > 1 ? 'es' : ''} esperando aprobación
            </div>
          </div>
        )}

        {/* Logout */}
        <button className="btn btn-danger btn-full" onClick={handleLogout}>
          <IconLogout size={18} /> Cerrar sesión
        </button>
      </div>

      {/* Edit modal */}
      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </div>
  )
}
