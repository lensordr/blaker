import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useStore from '../store/useStore'
import {
  IconBack, IconMapPin, IconClock, IconUsers, IconLink,
  IconChat, IconCamera, IconSend, IconImage, IconMoto
} from '../components/Icons'
import { useToast } from '../components/Toast'

function StatusBadge({ status }) {
  const labels = { upcoming: 'Próximo', active: 'En curso', ended: 'Finalizado' }
  return <span className={`badge badge-${status}`}>{labels[status]}</span>
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────
function ChatTab({ event }) {
  const currentUser = useStore((s) => s.currentUser)
  const getEventMessages = useStore((s) => s.getEventMessages)
  const sendMessage = useStore((s) => s.sendMessage)
  const messages = getEventMessages(event.id)
  const [text, setText] = useState('')
  const bottomRef = useRef(null)
  const toast = useToast()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const result = sendMessage(event.id, trimmed)
    if (result?.error) {
      toast(result.error, 'error')
    } else {
      setText('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isClosed = event.status === 'ended'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <IconChat size={36} />
            <p className="empty-state-title">Sin mensajes aún</p>
            {!isClosed && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Sé el primero en escribir</p>}
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.userId === currentUser?.id
          return (
            <div key={msg.id} className={`chat-bubble${isOwn ? ' own' : ''}`}>
              {!isOwn && (
                <div className="avatar avatar-sm">
                  {msg.userName?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                {!isOwn && <div className="chat-bubble-name">{msg.userName}</div>}
                <div className="chat-bubble-content">
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="foto" className="chat-bubble-img" />
                  )}
                  {msg.text && <p className="chat-bubble-text">{msg.text}</p>}
                  <p className="chat-bubble-time">
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {isClosed ? (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--text-3)',
          background: 'var(--bg)',
        }}>
          El chat está cerrado — evento finalizado
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
          <button
            className="btn btn-primary btn-icon"
            onClick={handleSend}
            disabled={!text.trim()}
            aria-label="Enviar mensaje"
          >
            <IconSend size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Photos Tab ───────────────────────────────────────────────────────────────
function PhotosTab({ event }) {
  const currentUser = useStore((s) => s.currentUser)
  const getEventPhotos = useStore((s) => s.getEventPhotos)
  const addPhoto = useStore((s) => s.addPhoto)
  const photos = getEventPhotos(event.id)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)
  const toast = useToast()

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Solo se permiten imágenes', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      addPhoto(event.id, ev.target.result, '')
      toast('Foto publicada 📸', 'success')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div style={{ padding: '12px 0' }}>
      {event.status !== 'ended' && (
        <div style={{ padding: '0 16px 12px' }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <button
            className="btn btn-secondary btn-full"
            onClick={() => fileRef.current?.click()}
          >
            <IconCamera size={18} />
            Subir foto
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="empty-state">
          <IconImage size={40} />
          <p className="empty-state-title">Sin fotos aún</p>
          {event.status !== 'ended' && (
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Sé el primero en compartir</p>
          )}
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((p) => (
            <div key={p.id} className="photo-grid-item" onClick={() => setPreview(p)}>
              <img src={p.url} alt={p.caption || 'Foto del evento'} loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {/* Photo preview modal */}
      {preview && (
        <div
          className="modal-overlay"
          onClick={() => setPreview(null)}
          style={{ alignItems: 'center', padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, width: '100%' }}>
            <img
              src={preview.url}
              alt={preview.caption}
              style={{ width: '100%', borderRadius: 'var(--radius-lg)', maxHeight: '80dvh', objectFit: 'contain' }}
            />
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                Por <strong>{preview.userName}</strong>
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {format(new Date(preview.createdAt), 'dd MMM · HH:mm', { locale: es })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const events = useStore((s) => s.events)
  const getParticipantStatus = useStore((s) => s.getParticipantStatus)
  const requestJoin = useStore((s) => s.requestJoin)
  const syncEventStatuses = useStore((s) => s.syncEventStatuses)
  const [tab, setTab] = useState('info')
  const toast = useToast()

  useEffect(() => { syncEventStatuses() }, [syncEventStatuses])

  const event = events.find((e) => e.id === id)
  if (!event) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-3)' }}>Evento no encontrado</p>
        <button className="btn btn-ghost mt-16" onClick={() => navigate(-1)}>Volver</button>
      </div>
    )
  }

  const participation = getParticipantStatus(event.id, currentUser?.id)
  const isApproved = participation?.status === 'approved' || currentUser?.role === 'admin'
  const canAccessChat = isApproved && event.status !== 'ended'
  const canAccessPhotos = isApproved

  const handleJoin = () => {
    const result = requestJoin(event.id)
    if (result?.error) {
      toast(result.error, 'error')
    } else {
      toast('Solicitud enviada. El admin la revisará pronto.', 'success')
    }
  }

  const tabs = [
    { key: 'info', label: 'Info' },
    ...(canAccessChat ? [{ key: 'chat', label: 'Chat' }] : []),
    ...(canAccessPhotos ? [{ key: 'photos', label: 'Fotos' }] : []),
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(245,245,245,0.95)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)} aria-label="Volver">
          <IconBack />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 20,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {event.title}
          </h1>
        </div>
        <span className={`badge badge-${event.status}`}>
          {event.status === 'active' ? (
            <><span className="live-dot" style={{ width: 6, height: 6 }} /> En curso</>
          ) : event.status === 'upcoming' ? 'Próximo' : 'Finalizado'}
        </span>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        padding: '0 16px',
      }}>
        {tabs.map((t) => (
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
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'info' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {/* Cover */}
            <div className="event-card-cover-placeholder" style={{ borderRadius: 'var(--radius-lg)', marginBottom: 16 }}>
              {event.coverImage ? (
                <img src={event.coverImage} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
              ) : (
                <IconMoto size={56} style={{ opacity: 0.12 }} />
              )}
            </div>

            {/* Details */}
            <div className="stack">
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div className="stack" style={{ gap: 10 }}>
                  <div className="event-card-info-row" style={{ fontSize: 14 }}>
                    <IconClock size={16} />
                    <span>{format(new Date(event.date), "EEEE d 'de' MMMM yyyy · HH:mm", { locale: es })}</span>
                  </div>
                  <div className="event-card-info-row" style={{ fontSize: 14 }}>
                    <IconMapPin size={16} />
                    <span>{event.location}</span>
                  </div>
                  {event.routeUrl && (
                    <div className="event-card-info-row" style={{ fontSize: 14 }}>
                      <IconLink size={16} />
                      <a
                        href={event.routeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent)', textDecoration: 'none' }}
                      >
                        Ver ruta en Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {event.description && (
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{event.description}</p>
                </div>
              )}

              {/* Join / status */}
              {currentUser?.role !== 'admin' && (
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                  {!participation && event.status !== 'ended' && (
                    <button className="btn btn-primary btn-full btn-lg" onClick={handleJoin}>
                      Solicitar unirse
                    </button>
                  )}
                  {participation?.status === 'pending' && (
                    <div style={{ textAlign: 'center' }}>
                      <span className="badge badge-pending" style={{ fontSize: 13, padding: '6px 14px' }}>
                        Solicitud pendiente de aprobación
                      </span>
                    </div>
                  )}
                  {participation?.status === 'approved' && (
                    <div style={{ textAlign: 'center' }}>
                      <span className="badge badge-approved" style={{ fontSize: 13, padding: '6px 14px' }}>
                        ✓ Aceptado en el evento
                      </span>
                    </div>
                  )}
                  {participation?.status === 'rejected' && (
                    <div style={{ textAlign: 'center' }}>
                      <span className="badge badge-rejected" style={{ fontSize: 13, padding: '6px 14px' }}>
                        Solicitud rechazada
                      </span>
                    </div>
                  )}
                  {event.status === 'ended' && !participation && (
                    <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                      Este evento ha finalizado
                    </p>
                  )}
                </div>
              )}

              {/* Access hint */}
              {!isApproved && participation?.status !== 'approved' && (
                <div style={{
                  background: 'var(--bg-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '12px 14px',
                  fontSize: 13,
                  color: 'var(--text-3)',
                  textAlign: 'center',
                }}>
                  El chat y las fotos están disponibles solo para participantes aprobados
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'chat' && canAccessChat && (
          <ChatTab event={event} />
        )}

        {tab === 'photos' && canAccessPhotos && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <PhotosTab event={event} />
          </div>
        )}
      </div>
    </div>
  )
}
