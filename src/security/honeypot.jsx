// ─── Honeypot Anti-Bot Fields ─────────────────────────────────────────────────
// Invisible fields that bots auto-fill but humans never see.
// If any honeypot field has a value on submission → it's a bot.
//
// We use multiple techniques:
// 1. Hidden input with attractive name (e.g., "website", "phone2")
// 2. CSS-hidden field (display:none, position:absolute off-screen)
// 3. Timing check — bots fill forms in < 2 seconds

import { useState, useRef, useCallback } from 'react'

/**
 * Honeypot hook — returns fields to render and a validation function
 * 
 * Usage:
 *   const { HoneypotFields, validateHoneypot } = useHoneypot()
 *   // In form: <HoneypotFields />
 *   // On submit: if (!validateHoneypot()) return // it's a bot
 */
export function useHoneypot() {
  const [honeypotValues, setHoneypotValues] = useState({
    website: '',
    phone_number: '',
    address2: '',
  })
  const formLoadTime = useRef(Date.now())

  const handleChange = (field) => (e) => {
    setHoneypotValues((prev) => ({ ...prev, [field]: e.target.value }))
  }

  /**
   * Returns true if the form submission looks human.
   * Returns false if bot behavior is detected.
   */
  const validateHoneypot = useCallback(() => {
    // Check 1: Any honeypot field filled → bot
    const anyFilled = Object.values(honeypotValues).some((v) => v.trim() !== '')
    if (anyFilled) {
      console.warn('[Security] Honeypot triggered — bot detected')
      return false
    }

    // Check 2: Form filled too fast (< 3 seconds) → likely bot
    const elapsed = Date.now() - formLoadTime.current
    if (elapsed < 3000) {
      console.warn('[Security] Form submitted too fast — bot detected')
      return false
    }

    return true
  }, [honeypotValues])

  /**
   * Reset the honeypot timer (call when switching form modes)
   */
  const resetTimer = useCallback(() => {
    formLoadTime.current = Date.now()
    setHoneypotValues({ website: '', phone_number: '', address2: '' })
  }, [])

  /**
   * Invisible honeypot fields component
   * Uses multiple hiding techniques to fool different bot types
   */
  const HoneypotFields = () => (
    <>
      {/* Technique 1: aria-hidden + tabIndex -1 + absolute positioning off-screen */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: 0,
          height: 0,
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <label htmlFor="hp_website">Website</label>
        <input
          type="text"
          id="hp_website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypotValues.website}
          onChange={handleChange('website')}
        />
        <label htmlFor="hp_phone">Phone</label>
        <input
          type="tel"
          id="hp_phone"
          name="phone_number"
          tabIndex={-1}
          autoComplete="off"
          value={honeypotValues.phone_number}
          onChange={handleChange('phone_number')}
        />
        <label htmlFor="hp_address">Address</label>
        <input
          type="text"
          id="hp_address"
          name="address2"
          tabIndex={-1}
          autoComplete="off"
          value={honeypotValues.address2}
          onChange={handleChange('address2')}
        />
      </div>
    </>
  )

  return { HoneypotFields, validateHoneypot, resetTimer }
}
