import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import BlakerLogo from '../components/BlakerLogo'
import { useToast } from '../components/Toast'
import { api } from '../api'

const MOTO_TYPE_OPTIONS = [
  { value: 'naked', label: 'Naked' },
  { value: 'sport', label: 'Sport / Supersport' },
  { value: 'adventure', label: 'Adventure / Trail' },
  { value: 'touring', label: 'Touring' },
  { value: 'scrambler', label: 'Scrambler / Café Racer' },
  { value: 'custom', label: 'Custom / Cruiser' },
  { value: 'enduro', label: 'Enduro / Off-road' },
  { value: 'other', label: 'Otra' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: '🟢 Principiante — menos de 2 años' },
  { value: 'medio', label: '🟡 Medio — 2 a 5 años' },
  { value: 'advanced', label: '🔴 Avanzado — más de 5 años' },
]

const HEARD_FROM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'friends', label: 'Amigos' },
  { value: 'other', label: 'Otro' },
]

// Step indicator
function StepDots({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current - 1 ? 20 : 6,
          height: 6,
          borderRadius: 3,
          background: i === current - 1 ? 'var(--accent)' : 'var(--border-2)',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const navigate = useNavigate()
  const login = useStore((s) => s.login)
  const register = useStore((s) => s.register)
  const toast = useToast()

  useEffect(() => {
    // Capture PWA install prompt
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    // Step 2 — moto
    motoType: '',
    motoModel: '',
    location: '',
    experience: '',
    // Step 3 — preferences
    instaHandle: '',
    heardFrom: '',
    promoCode: '',
    latitude: null,
    longitude: null,
  })

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateStep1 = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nombre requerido'
    if (!form.email.trim()) e.email = 'Email requerido'
    if (!form.password || form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e = {}
    if (!form.motoType) e.motoType = 'Selecciona el tipo de moto'
    if (!form.motoModel.trim()) e.motoModel = 'Indica tu moto'
    if (!form.location.trim()) e.location = 'Indica tu ciudad'
    if (!form.experience) e.experience = 'Selecciona tu nivel'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep3 = () => {
    const e = {}
    if (!form.heardFrom) e.heardFrom = 'Selecciona una opción'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.email.trim()) errs.email = 'Email requerido'
    if (!form.password) errs.password = 'Contraseña requerida'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    const result = await login(form.email, form.password)
    setLoading(false)
    if (result.error) {
      setErrors({ general: result.error })
    } else {
      toast('¡Bienvenido de vuelta!', 'success')
      navigate('/')
    }
  }

  const handleNext = (e) => {
    e.preventDefault()
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!validateStep3()) return
    setLoading(true)

    const result = await register({ ...form })
    setLoading(false)
    if (result.error) {
      setErrors({ general: result.error })
      setStep(1)
    } else {
      toast('¡Cuenta creada! Bienvenido a RUTILLAS 🏍️', 'success')
      // Show PWA install prompt if available
      if (deferredPrompt) {
        setShowInstall(true)
      } else {
        navigate('/')
      }
    }
  }

  const stepTitles = ['Tu cuenta', 'Tu moto', 'Preferencias']

  // PWA install screen shown after registration
  if (showInstall) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: 'var(--bg)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📲</div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
          Añade RUTILLAS a tu pantalla
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.6, maxWidth: 320 }}>
          Instala la app en tu móvil para acceder rápido a tus rutas, chat y notificaciones.
        </p>
        <button
          className="btn btn-primary btn-lg btn-full"
          style={{ maxWidth: 320, marginBottom: 12 }}
          onClick={async () => {
            if (deferredPrompt) {
              deferredPrompt.prompt()
              await deferredPrompt.userChoice
              setDeferredPrompt(null)
            }
            navigate('/')
          }}
        >
          📲 Añadir a pantalla de inicio
        </button>
        <button className="btn btn-ghost btn-full" style={{ maxWidth: 320 }} onClick={() => navigate('/')}>
          Ahora no
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 20 }}>
          En iPhone: Safari → Compartir → Añadir a pantalla de inicio
        </p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%',
        transform: 'translateX(-50%)', width: '120%', height: '50%',
        background: 'radial-gradient(ellipse, rgba(232,50,10,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo — centered */}
      <div style={{ marginBottom: 24, position: 'relative', zIndex: 1 }}>
        <BlakerLogo size={44} showTagline center />
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 24px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Mode tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-3)',
          borderRadius: 100,
          padding: 3,
          marginBottom: 24,
        }}>
          {[['login', 'Entrar'], ['register', 'Registrarse']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setStep(1); setErrors({}) }}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: 100,
                border: 'none',
                background: mode === m ? 'var(--bg-2)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--text-3)',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="stack">
            {errors.general && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>
                {errors.general}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="tu@email.com"
                value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" placeholder="••••••"
                value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="current-password" />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Entrar'}
            </button>
            <button type="button" className="btn btn-ghost btn-full btn-sm" onClick={() => navigate('/auth/forgot')} style={{ marginTop: -4 }}>
              ¿Olvidaste tu contraseña?
            </button>

          </form>
        )}

        {/* ── REGISTER ── */}
        {mode === 'register' && (
          <>
            {/* Step header */}
            <div style={{ marginBottom: 20 }}>
              <StepDots current={step} total={3} />
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 18,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text)',
                textAlign: 'center',
              }}>
                {stepTitles[step - 1]}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 2 }}>
                Paso {step} de 3
              </p>
            </div>

            {errors.general && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
                {errors.general}
              </div>
            )}

            {/* Step 1 — Account */}
            {step === 1 && (
              <form onSubmit={handleNext} className="stack">
                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
                  <input className="form-input" type="text" placeholder="Tu nombre"
                    value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="tu@email.com"
                    value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input className="form-input" type="password" placeholder="Mínimo 6 caracteres"
                    value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg">
                  Siguiente →
                </button>
              </form>
            )}

            {/* Step 2 — Moto */}
            {step === 2 && (
              <form onSubmit={handleNext} className="stack">
                <div className="form-group">
                  <label className="form-label">Tipo de moto</label>
                  <select className="form-select" value={form.motoType} onChange={(e) => set('motoType', e.target.value)}>
                    <option value="">Selecciona el tipo...</option>
                    {MOTO_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {errors.motoType && <span className="form-error">{errors.motoType}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Marca y modelo</label>
                  <input className="form-input" type="text" placeholder="Ej: Yamaha MT-07, Honda CB500F..."
                    value={form.motoModel} onChange={(e) => set('motoModel', e.target.value)} />
                  {errors.motoModel && <span className="form-error">{errors.motoModel}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Tu ciudad / ubicación</label>
                  <input className="form-input" type="text" placeholder="Ej: Madrid, Barcelona..."
                    value={form.location} onChange={(e) => set('location', e.target.value)} />
                  {errors.location && <span className="form-error">{errors.location}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Nivel de experiencia</label>
                  <select className="form-select" value={form.experience} onChange={(e) => set('experience', e.target.value)}>
                    <option value="">Selecciona tu nivel...</option>
                    {EXPERIENCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {errors.experience && <span className="form-error">{errors.experience}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Atrás</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Siguiente →</button>
                </div>
              </form>
            )}

            {/* Step 3 — Preferences */}
            {step === 3 && (
              <form onSubmit={handleRegister} className="stack">
                {/* Location permission request */}
                <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📍</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Permitir ubicación</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Para recibir alertas de rutas cerca de ti</p>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm ${form.latitude ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={async () => {
                      try {
                        const pos = await new Promise((res, rej) =>
                          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, enableHighAccuracy: true })
                        )
                        set('latitude', pos.coords.latitude)
                        set('longitude', pos.coords.longitude)
                        toast('Ubicación guardada ✓', 'success')
                      } catch (err) {
                        if (err.code === 1) {
                          toast('Permiso denegado. Actívalo en ajustes del navegador.', 'error')
                        } else {
                          toast('No se pudo obtener la ubicación', 'error')
                        }
                      }
                    }}
                  >
                    {form.latitude ? '✓ Guardada' : 'Permitir'}
                  </button>
                </div>

                {/* Instagram */}
                <div className="form-group">
                  <label className="form-label">Instagram <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(opcional)</span></label>
                  <input className="form-input" type="text" placeholder="@tuusuario"
                    value={form.instaHandle} onChange={(e) => set('instaHandle', e.target.value)} />
                </div>

                {/* Promo code */}
                <div className="form-group">
                  <label className="form-label">Código promocional <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(opcional)</span></label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ej: RUTILLAS30"
                    value={form.promoCode || ''}
                    onChange={(e) => set('promoCode', e.target.value.toUpperCase())}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
                  />
                  <span className="form-hint">30 días gratis con código válido</span>
                </div>

                <div className="form-group">
                  <label className="form-label">¿Cómo nos conociste?</label>
                  <select className="form-select" value={form.heardFrom} onChange={(e) => set('heardFrom', e.target.value)}>
                    <option value="">Selecciona...</option>
                    {HEARD_FROM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {errors.heardFrom && <span className="form-error">{errors.heardFrom}</span>}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>← Atrás</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Crear cuenta 🏍️'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
