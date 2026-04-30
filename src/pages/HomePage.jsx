import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import BlakerLogo from '../components/BlakerLogo'

export default function HomePage() {
  const currentUser = useStore((s) => s.currentUser)
  const navigate = useNavigate()

  return (
    <div style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))' }}>

      {/* Header */}
      <div style={{
        padding: '36px 20px 28px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(232,50,10,0.04) 0%, transparent 100%)',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)' }} />
        <BlakerLogo size={42} showTagline center />
        <p style={{ marginTop: 14, fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>
          Hola, <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{currentUser?.first_name || currentUser?.username}</strong> 👋
        </p>
      </div>

      {/* Contact content */}
      <div style={{ padding: '24px 20px', maxWidth: 480, margin: '0 auto' }}>

        {/* Main contact card */}
        <div style={{
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)', marginBottom: 16,
        }}>
          {/* Red top bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
          <div style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                ✉️
              </div>
              <div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Contacto
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Estamos aquí para ayudarte</p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 20 }}>
              ¿Tienes dudas sobre una ruta, problemas con tu cuenta o quieres organizar algo especial? Escríbenos.
            </p>

            <a
              href="mailto:rutillasmoto@outlook.com"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'var(--accent)', color: '#fff',
                borderRadius: 100, padding: '14px 24px',
                textDecoration: 'none',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                boxShadow: '0 4px 20px rgba(232,50,10,0.3)',
              }}
            >
              ✉️ rutillasmoto@outlook.com
            </a>
          </div>
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            { icon: '🏍️', title: 'Rutas', desc: 'Organiza y únete a rutas en moto por España' },
            { icon: '💬', title: 'Chat', desc: 'Habla con otros riders durante la ruta' },
            { icon: '📍', title: 'Ubicación', desc: 'Encuentra rutas cerca de ti' },
            { icon: '📸', title: 'Fotos', desc: 'Comparte momentos de la ruta' },
          ].map((item) => (
            <div key={item.title} style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '16px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>
                {item.title}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA to routes */}
        <button
          className="btn btn-secondary btn-full"
          onClick={() => navigate('/events')}
          style={{ marginTop: 4 }}
        >
          🏍️ Ver todas las rutas
        </button>

      </div>
    </div>
  )
}
