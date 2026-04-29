import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import { api } from '../api'
import {
  IconBack, IconMapPin, IconClock, IconUsers, IconLink,
  IconChat, IconSend, IconImage, IconCamera, IconEdit, IconTrash
} from '../components/Icons'
import { useToast } from '../components/Toast'

const STATUS_LABELS = { upcoming: 'Próximo', active: 'En curso', full: 'Completo', ended: 'Finalizado' }

// ─── Chat Tab ─────────────────────────────────────────────────────────────────
function ChatTab({ route, inGracePeriod, chatDeadline }) {
  const currentUser = useStore((s) => s.currentUser)
  const messages = useStore((s) => s.messages[route.id] || [])
  const fetchMessages = useStore((s) => s.fetchMessages)
  const sendMessage = useStore((s) => s.sendMessage)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const toast = useToast()

  useEffect(() => {
      fetchMessages(route.id)
      const interval = setInterval(() => fetchMessages(route.id), 5000)
      return () => clearInterval(interval)
  }, [route.id, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    const result = await sendMessage(route.id, trimmed)
    setSending(false)
    if (result?.error) toast(result.error, 'error')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const isClosed = !chatDeadline || new Date() > chatDeadline
  const getName = (msg) => {
    const u = msg.user
    if (!u) return '?'
    return u.first_name || u.username || '?'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
      {/* Grace period warning */}
      {inGracePeriod && chatDeadline && (
        <div style={{
          padding: '8px 16px', background: 'var(--yellow-dim)',
          borderBottom: '1px solid rgba(217,119,6,0.2)',
          fontSize: 12, color: 'var(--yellow)', fontWeight: 600, textAlign: 'center',
        }}>
          ⏳ Ruta finalizada — chat disponible hasta {format(chatDeadline, "d MMM · HH:mm", { locale: es })}. Después se eliminará.
        </div>
      )}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <IconChat size={36} />
            <p className="empty-state-title">Sin mensajes aún</p>
            {!isClosed && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Sé el primero en escribir</p>}
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.user?.id === currentUser?.id
          return (
            <div key={msg.id} className={`chat-bubble${isOwn ? ' own' : ''}`}>
              {!isOwn && (
                <div className="avatar avatar-sm">{getName(msg)[0]?.toUpperCase()}</div>
              )}
              <div>
                {!isOwn && <div className="chat-bubble-name">{getName(msg)}</div>}
                <div className="chat-bubble-content">
                  <p className="chat-bubble-text">{msg.text}</p>
                  <p className="chat-bubble-time">
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {isClosed ? (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text-3)', background: 'var(--bg-2)' }}>
          Chat cerrado — la ruta y sus mensajes han sido eliminados
        </div>
      ) : (
        <div className="chat-input-bar">
          <textarea
            className="chat-input"
            placeholder="Escribe un mensaje..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button className="btn btn-primary btn-icon" onClick={handleSend}
            disabled={!text.trim() || sending} aria-label="Enviar">
            <IconSend size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Photos Tab ───────────────────────────────────────────────────────────────
function PhotosTab({ route }) {
  // Photos stored locally per-route (base64) — will migrate to Supabase Storage later
  const [photos, setPhotos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`photos_${route.id}`) || '[]') } catch { return [] }
  })
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)
  const toast = useToast()
  const currentUser = useStore((s) => s.currentUser)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast('Solo imágenes', 'error'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const photo = {
        id: Date.now(),
        url: ev.target.result,
        userName: currentUser?.first_name || currentUser?.username || 'Rider',
        createdAt: new Date().toISOString(),
      }
      const updated = [photo, ...photos]
      setPhotos(updated)
      localStorage.setItem(`photos_${route.id}`, JSON.stringify(updated))
      toast('Foto publicada 📸', 'success')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div style={{ padding: '12px 0' }}>
      {route.status !== 'ended' && (
        <div style={{ padding: '0 16px 12px' }}>
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }} onChange={handleFile} />
          <button className="btn btn-secondary btn-full" onClick={() => fileRef.current?.click()}>
            <IconCamera size={18} /> Subir foto
          </button>
        </div>
      )}
      {photos.length === 0 ? (
        <div className="empty-state">
          <IconImage size={40} />
          <p className="empty-state-title">Sin fotos aún</p>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((p) => (
            <div key={p.id} className="photo-grid-item" onClick={() => setPreview(p)}>
              <img src={p.url} alt="foto" loading="lazy" />
            </div>
          ))}
        </div>
      )}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)} style={{ alignItems: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, width: '100%' }}>
            <img src={preview.url} alt="" style={{ width: '100%', borderRadius: 'var(--radius-lg)', maxHeight: '80dvh', objectFit: 'contain' }} />
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Por <strong>{preview.userName}</strong></span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{format(new Date(preview.createdAt), 'dd MMM · HH:mm', { locale: es })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Edit Route Modal ─────────────────────────────────────────────────────────
function EditRouteModal({ route, onClose, onDelete }) {
  const updateRoute = useStore((s) => s.updateRoute)
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const toLocal = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
  }

  const [form, setForm] = useState({
    title: route.title || '',
    description: route.description || '',
    city: route.city || '',
    location_detail: route.location_detail || '',
    date: toLocal(route.date),
    end_date: toLocal(route.end_date),
    max_participants: route.max_participants || 20,
    route_url: route.route_url || '',
  })

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const data = { ...form, date: new Date(form.date).toISOString(), end_date: new Date(form.end_date).toISOString(), max_participants: Number(form.max_participants) }
    const result = await updateRoute(route.id, data)
    setSaving(false)
    if (result?.error) { toast(result.error, 'error'); return }
    toast('Ruta actualizada ✓', 'success')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">Editar ruta</h2>
        {confirmDel ? (
          <div className="stack">
            <p style={{ fontSize: 15, color: 'var(--text-2)' }}>¿Eliminar <strong>"{route.title}"</strong>? Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={onDelete}><IconTrash size={16} /> Eliminar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="stack">
            <div className="form-group">
              <label className="form-label">Título</label>
              <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Ciudad</label>
                <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Detalle</label>
                <input className="form-input" value={form.location_detail} onChange={e => set('location_detail', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Inicio</label>
                <input className="form-input" type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fin</label>
                <input className="form-input" type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Máx. riders</label>
                <input className="form-input" type="number" min="2" max="200" value={form.max_participants} onChange={e => set('max_participants', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Google Maps</label>
                <input className="form-input" type="url" value={form.route_url} onChange={e => set('route_url', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmDel(true)}>
                <IconTrash size={14} />
              </button>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const routes = useStore((s) => s.routes)
  const fetchRoutes = useStore((s) => s.fetchRoutes)
  const joinRoute = useStore((s) => s.joinRoute)
  const set = useStore.setState
  const [tab, setTab] = useState('info')
  const [joining, setJoining] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const updateRoute = useStore((s) => s.updateRoute)
  const deleteRoute = useStore((s) => s.deleteRoute)
  const toast = useToast()

  useEffect(() => {
    // Always fetch fresh route data when opening detail page
    const loadRoute = async () => {
      try {
        const fresh = await api.getRoute(parseInt(id))
        set((s) => ({
          routes: s.routes.some(r => r.id === fresh.id)
            ? s.routes.map(r => r.id === fresh.id ? fresh : r)
            : [...s.routes, fresh]
        }))
      } catch (e) {}
    }
    loadRoute()
    if (!routes.length) fetchRoutes()
  }, [id])

  const route = routes.find((r) => r.id === parseInt(id) || r.id === id)

  if (!route) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <span className="spinner" style={{ margin: '40px auto', display: 'block' }} />
      </div>
    )
  }

  const userStatus = route.user_status  // from API: null | 'pending' | 'approved' | 'rejected'
  const isAdmin = currentUser?.is_staff
  const isSubscribed = currentUser?.is_subscribed || currentUser?.is_free_user || isAdmin
  const isCreator = route.creator?.id === currentUser?.id
  // Creator is always considered approved for their own route
  const isApproved = userStatus === 'approved' || isAdmin || isCreator

  // Non-subscribers see paywall — EXCEPT creators can always see their own route
  if (!isSubscribed && !isCreator) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(245,245,245,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><IconBack /></button>
          <h1 style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 900, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {route.title}
          </h1>
        </div>
        {/* Paywall */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
            Contenido exclusivo
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 8, lineHeight: 1.6 }}>
            Suscríbete para ver la ubicación, detalles de la ruta, unirte al chat y mucho más.
          </p>
          <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-lg)', padding: '12px 20px', marginBottom: 24 }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: 'var(--accent)' }}>3,99€ <span style={{ fontSize: 16, fontWeight: 600 }}>/mes</span></p>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Acceso completo · Cancela cuando quieras</p>
          </div>
          <a
            href="https://square.link/u/4AiXGpLe"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-lg"
            style={{ textDecoration: 'none', marginBottom: 12, width: '100%', maxWidth: 280 }}
          >
            🏍️ Suscribirse — 3,99€/mes
          </a>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>
      </div>
    )
  }

  // Chat open during event + 24h grace period after end
  const chatDeadline = route.end_date ? new Date(new Date(route.end_date).getTime() + 24 * 60 * 60 * 1000) : null
  const chatOpen = chatDeadline ? new Date() < chatDeadline : true
  const inGracePeriod = route.status === 'ended' && chatOpen

  const canChat = (isApproved || isCreator) && chatOpen
  const canPhotos = isApproved || isCreator

  const handleJoin = async () => {
    setJoining(true)
    const result = await joinRoute(route.id)
    setJoining(false)
    if (result?.error === 'subscription_required') {
      toast('Necesitas suscripción para unirte', 'error')
      setTimeout(() => window.open(result.payment_url, '_blank'), 800)
    } else if (result?.error) {
      toast(result.error, 'error')
    } else {
      toast('Solicitud enviada ✓ El admin la revisará pronto', 'success')
    }
  }

  const tabs = [
    { key: 'info', label: 'Info' },
    ...(canChat ? [{ key: 'chat', label: inGracePeriod ? 'Chat ⏳' : 'Chat' }] : []),
    ...(canPhotos ? [{ key: 'photos', label: 'Fotos' }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderBottom: '1px solid var(--border)', background: 'rgba(245,245,245,0.95)',
        backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)} aria-label="Volver">
          <IconBack />
        </button>
        <h1 style={{
          flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20,
          fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {route.title}
        </h1>
        {(isCreator || isAdmin) && (
          <button className="btn btn-ghost btn-icon" onClick={() => setShowEdit(true)} aria-label="Editar">
            <IconEdit size={18} />
          </button>
        )}
        <span className={`badge badge-${route.status}`}>
          {route.status === 'active' ? <><span className="live-dot" style={{ width: 6, height: 6 }} /> En curso</> : STATUS_LABELS[route.status]}
        </span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)', padding: '0 16px' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '12px 16px', border: 'none', background: 'transparent',
            color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {tab === 'info' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {/* Cover banner */}
            <div className="event-card-cover-placeholder" style={{ borderRadius: 'var(--radius-lg)', marginBottom: 16 }}>
              <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 24px' }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(28px, 8vw, 42px)', textTransform: 'uppercase', color: 'var(--accent)', textAlign: 'center', lineHeight: 1.05, opacity: 0.85 }}>
                  {route.title}
                </span>
              </div>
            </div>

            <div className="stack">
              {/* Details card */}
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div className="stack" style={{ gap: 10 }}>
                  <div className="event-card-info-row" style={{ fontSize: 14 }}>
                    <IconClock size={16} />
                    <span>{format(new Date(route.date), "EEEE d 'de' MMMM yyyy · HH:mm", { locale: es })}</span>
                  </div>
                  <div className="event-card-info-row" style={{ fontSize: 14 }}>
                    <IconMapPin size={16} />
                    <span>{route.city}{route.location_detail ? ` — ${route.location_detail}` : ''}</span>
                  </div>
                  <div className="event-card-info-row" style={{ fontSize: 14 }}>
                    <IconUsers size={16} />
                    <span>{route.approved_count} / {route.max_participants} riders</span>
                  </div>
                  {route.route_url && (
                    <div className="event-card-info-row" style={{ fontSize: 14 }}>
                      <IconLink size={16} />
                      <a href={route.route_url} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                        Ver ruta en Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {route.description && (
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{route.description}</p>
                </div>
              )}

              {/* Join / status */}
              {!isAdmin && (
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                  {!userStatus && route.status !== 'ended' && (
                    <button className="btn btn-primary btn-full btn-lg" onClick={handleJoin} disabled={joining}>
                      {joining ? <span className="spinner" /> : 'Solicitar unirse'}
                    </button>
                  )}
                  {userStatus === 'pending' && (
                    <div style={{ textAlign: 'center' }}>
                      <span className="badge badge-pending" style={{ fontSize: 13, padding: '6px 14px' }}>
                        Solicitud pendiente de aprobación
                      </span>
                    </div>
                  )}
                  {userStatus === 'approved' && (
                    <div style={{ textAlign: 'center' }}>
                      <span className="badge badge-approved" style={{ fontSize: 13, padding: '6px 14px' }}>
                        ✓ Aceptado en la ruta
                      </span>
                    </div>
                  )}
                  {userStatus === 'rejected' && (
                    <div style={{ textAlign: 'center' }}>
                      <span className="badge badge-rejected" style={{ fontSize: 13, padding: '6px 14px' }}>
                        Solicitud rechazada
                      </span>
                    </div>
                  )}
                  {route.status === 'ended' && !userStatus && (
                    <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>Esta ruta ha finalizado</p>
                  )}
                </div>
              )}

              {!isApproved && (
                <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
                  El chat y las fotos están disponibles solo para participantes aprobados
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'chat' && canChat && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <ChatTab route={route} inGracePeriod={inGracePeriod} chatDeadline={chatDeadline} />
          </div>
        )}
        {tab === 'photos' && canPhotos && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <PhotosTab route={route} />
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <EditRouteModal
          route={route}
          onClose={() => setShowEdit(false)}
          onDelete={() => { navigate('/events'); deleteRoute(route.id) }}
        />
      )}
    </div>
  )
}
