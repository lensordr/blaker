import { useNavigate } from 'react-router-dom'
import BlakerLogo from '../components/BlakerLogo'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>

      {/* Background glow */}
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '140%', height: '60%', background: 'radial-gradient(ellipse, rgba(232,50,10,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', position: 'relative', zIndex: 2 }}>
        <BlakerLogo size={28} />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/auth')}
        >
          Entrar
        </button>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        <BlakerLogo size={52} showTagline center />

        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(32px, 8vw, 56px)',
          fontWeight: 900,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          lineHeight: 1.05,
          marginTop: 32,
          maxWidth: 500,
        }}>
          Rutas en moto<br />
          <span style={{ color: 'var(--accent)' }}>por toda España</span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 16, maxWidth: 400 }}>
          Únete a la comunidad de riders. Organiza rutas, conoce gente y comparte la pasión por las dos ruedas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32, width: '100%', maxWidth: 320 }}>
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={() => navigate('/auth')}
          >
            🏍️ Únete gratis
          </button>
          <button
            className="btn btn-ghost btn-full"
            onClick={() => navigate('/auth')}
          >
            Ya tengo cuenta — Entrar
          </button>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 48, width: '100%', maxWidth: 400 }}>
          {[
            { icon: '🏍️', title: 'Rutas grupales', desc: 'Organiza y únete a rutas con otros riders' },
            { icon: '💬', title: 'Chat en vivo', desc: 'Coordina con tu grupo durante la ruta' },
            { icon: '📍', title: 'Por ubicación', desc: 'Encuentra rutas cerca de ti en toda España' },
            { icon: '📸', title: 'Comparte fotos', desc: 'Guarda los mejores momentos de cada ruta' },
          ].map((f) => (
            <div key={f.title} style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 16px',
              textAlign: 'left',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>
                {f.title}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 48, padding: '24px 20px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ height: 4, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: 2, marginBottom: 16 }} />
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
            La comunidad crece
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Riders de Barcelona, Madrid, Valencia, Sevilla y más ciudades ya organizan sus rutas con RUTILLAS.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
            {[
              { value: '🏍️', label: 'Rutas cada semana' },
              { value: '📍', label: '+10 ciudades' },
              { value: '👥', label: 'Comunidad activa' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 24 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing teaser */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>Acceso completo desde</p>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: 'var(--accent)' }}>
            3,99€<span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)' }}>/mes</span>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Cancela cuando quieras · Acceso gratuito en zona Barcelona</p>
        </div>

        {/* Final CTA */}
        <div style={{ marginTop: 40, width: '100%', maxWidth: 320 }}>
          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={() => navigate('/auth')}
          >
            Empezar ahora
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '24px 20px', textAlign: 'center', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          © 2025 RUTILLAS · Comunidad de riders en moto por España
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
          <a href="mailto:rutillasmoto@outlook.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>rutillasmoto@outlook.com</a>
        </p>
      </footer>
    </div>
  )
}
