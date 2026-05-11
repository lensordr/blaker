// ─── Cloudflare Turnstile CAPTCHA Integration ─────────────────────────────────
// Turnstile is free, privacy-friendly, and invisible to most users.
// Site key is public (safe to expose). Secret key stays on backend only.
//
// To set up:
// 1. Go to https://dash.cloudflare.com → Turnstile → Add site
// 2. Add your domain (rutillas.app or localhost for dev)
// 3. Copy the Site Key below
// 4. On backend: verify token at https://challenges.cloudflare.com/turnstile/v0/siteverify

import { useEffect, useRef, useState, useCallback } from 'react'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAADNIScUfnlFUhi0W'

// Track if script is loaded globally
let scriptLoaded = false
let scriptLoading = false
const loadCallbacks = []

function loadTurnstileScript() {
  if (scriptLoaded) return Promise.resolve()
  if (scriptLoading) {
    return new Promise((resolve) => loadCallbacks.push(resolve))
  }

  scriptLoading = true
  return new Promise((resolve, reject) => {
    loadCallbacks.push(resolve)
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => {
      scriptLoaded = true
      scriptLoading = false
      loadCallbacks.forEach((cb) => cb())
      loadCallbacks.length = 0
    }
    script.onerror = () => {
      scriptLoading = false
      reject(new Error('Failed to load Turnstile script'))
    }
    document.head.appendChild(script)
  })
}

/**
 * Turnstile CAPTCHA component
 * 
 * @param {Object} props
 * @param {function} props.onVerify - Called with token when user passes challenge
 * @param {function} props.onError - Called when verification fails
 * @param {function} props.onExpire - Called when token expires
 * @param {'auto'|'light'|'dark'} props.theme - Widget theme
 * @param {'normal'|'compact'|'invisible'} props.size - Widget size
 */
export function Turnstile({ onVerify, onError, onExpire, theme = 'dark', size = 'normal' }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  useEffect(() => {
    let mounted = true

    loadTurnstileScript().then(() => {
      if (!mounted || !containerRef.current) return
      if (!window.turnstile) return

      // Clean up previous widget if exists
      if (widgetIdRef.current !== null) {
        try { window.turnstile.remove(widgetIdRef.current) } catch (e) {}
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme,
        size,
        callback: (token) => onVerify?.(token),
        'error-callback': () => onError?.(),
        'expired-callback': () => onExpire?.(),
      })
    }).catch((err) => {
      console.warn('Turnstile load failed:', err)
      // If CAPTCHA fails to load, allow form submission (graceful degradation)
      onVerify?.('CAPTCHA_UNAVAILABLE')
    })

    return () => {
      mounted = false
      if (widgetIdRef.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current) } catch (e) {}
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }} />
}

/**
 * Hook for invisible Turnstile (no visible widget)
 * Returns [getToken, isReady] — call getToken() before form submission
 */
export function useTurnstile() {
  const [token, setToken] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const widgetIdRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    // Create hidden container
    const container = document.createElement('div')
    container.style.display = 'none'
    document.body.appendChild(container)
    containerRef.current = container

    loadTurnstileScript().then(() => {
      if (!window.turnstile) return

      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        size: 'invisible',
        callback: (t) => { setToken(t); setIsReady(true) },
        'error-callback': () => { setToken('CAPTCHA_UNAVAILABLE'); setIsReady(true) },
        'expired-callback': () => { setToken(null); setIsReady(false) },
      })
    }).catch(() => {
      // Graceful degradation
      setToken('CAPTCHA_UNAVAILABLE')
      setIsReady(true)
    })

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current) } catch (e) {}
      }
      container.remove()
    }
  }, [])

  const reset = useCallback(() => {
    setToken(null)
    setIsReady(false)
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [])

  return { token, isReady, reset }
}

export { TURNSTILE_SITE_KEY }
