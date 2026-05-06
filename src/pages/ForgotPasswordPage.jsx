import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BlakerLogo from '../components/BlakerLogo'
import { api } from '../api'

// ─── Forgot Password ─────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Email requerido'); return }
    setLoading(true)
    try {
      await api.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError('Error al enviar. Inténtalo de nuevo.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'var(--bg)' }}>
      <div style={{ marginBottom: 32 }}>
        <BlakerLogo size={40} showTagline center />
      </div>

      <div style={{ width: '100%', maxWidth: 400, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Email enviado</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 24 }}>
              Si el email existe, recibirás un enlace para restablecer tu contraseña en unos minutos.
            </p>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/auth')}>
              Volver al inicio
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, textTransform: 'uppercase', marginBottom: 6 }}>
              Olvidé mi contraseña
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>
              Introduce tu email y te enviaremos un enlace para restablecerla.
            </p>
            <form onSubmit={handleSubmit} className="stack">
              {error && (
                <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Enviar enlace'}
              </button>
              <button type="button" className="btn btn-ghost btn-full" onClick={() => navigate('/auth')}>
                Volver
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    try {
      await api.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err.data?.error || 'Enlace inválido o expirado')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'var(--bg)' }}>
      <div style={{ marginBottom: 32 }}>
        <BlakerLogo size={40} showTagline center />
      </div>

      <div style={{ width: '100%', maxWidth: 400, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Contraseña actualizada</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/auth')}>
              Iniciar sesión
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, textTransform: 'uppercase', marginBottom: 6 }}>
              Nueva contraseña
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>Elige una contraseña segura.</p>
            <form onSubmit={handleSubmit} className="stack">
              {error && (
                <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Nueva contraseña</label>
                <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar contraseña</label>
                <input className="form-input" type="password" placeholder="Repite la contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Guardar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Confirm Email ────────────────────────────────────────────────────────────
export function ConfirmEmailPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | ok | error

  useEffect(() => {
    api.confirmEmail(token)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: 'var(--bg)', textAlign: 'center' }}>
      <div style={{ marginBottom: 32 }}>
        <BlakerLogo size={40} showTagline center />
      </div>
      {status === 'loading' && <span className="spinner" style={{ margin: '0 auto' }} />}
      {status === 'ok' && (
        <div>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Cuenta confirmada</h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>Tu cuenta está activa. Ya puedes iniciar sesión.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth')}>Iniciar sesión</button>
        </div>
      )}
      {status === 'error' && (
        <div>
          <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Enlace inválido</h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>El enlace ha expirado o ya fue usado.</p>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/auth')}>Volver</button>
        </div>
      )}
    </div>
  )
}
