// ─── Input Sanitization ───────────────────────────────────────────────────────
// Sanitize user inputs before sending to the API.
// Prevents XSS payloads, SQL injection attempts, and malformed data.
//
// Note: The backend MUST also sanitize — this is defense-in-depth.

/**
 * Strip HTML tags from a string
 */
export function stripHtml(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Escape HTML entities
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return str.replace(/[&<>"']/g, (c) => map[c])
}

/**
 * Sanitize a text input — removes dangerous characters while preserving readability
 */
export function sanitizeText(str, maxLength = 500) {
  if (typeof str !== 'string') return ''
  return stripHtml(str)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, maxLength)
}

/**
 * Sanitize email — strict format validation
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return ''
  const cleaned = email.trim().toLowerCase().slice(0, 254)
  // Basic email regex — backend should do full validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(cleaned) ? cleaned : ''
}

/**
 * Sanitize a URL — only allow http/https
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') return ''
  const trimmed = url.trim()
  try {
    const parsed = new URL(trimmed)
    if (!['http:', 'https:'].includes(parsed.protocol)) return ''
    return parsed.href
  } catch {
    return ''
  }
}

/**
 * Sanitize Instagram handle
 */
export function sanitizeInstagram(handle) {
  if (typeof handle !== 'string') return ''
  // Remove @ prefix, keep only valid IG characters
  return handle
    .trim()
    .replace(/^@/, '')
    .replace(/[^a-zA-Z0-9._]/g, '')
    .slice(0, 30)
}

/**
 * Sanitize a numeric input
 */
export function sanitizeNumber(value, min = 0, max = Infinity) {
  const num = Number(value)
  if (isNaN(num)) return min
  return Math.max(min, Math.min(max, Math.floor(num)))
}

/**
 * Validate password strength
 * Returns { valid: boolean, message: string }
 */
export function validatePassword(password) {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Mínimo 6 caracteres' }
  }
  if (password.length > 128) {
    return { valid: false, message: 'Máximo 128 caracteres' }
  }
  // Check for common weak passwords
  const weak = ['123456', 'password', 'qwerty', '111111', 'abc123', '123123', 'admin1']
  if (weak.includes(password.toLowerCase())) {
    return { valid: false, message: 'Contraseña demasiado común' }
  }
  return { valid: true, message: '' }
}

/**
 * Sanitize all fields in a registration/update payload
 */
export function sanitizeUserPayload(data) {
  const sanitized = {}
  
  if (data.email !== undefined) sanitized.email = sanitizeEmail(data.email)
  if (data.username !== undefined) sanitized.username = sanitizeText(data.username, 50)
  if (data.first_name !== undefined) sanitized.first_name = sanitizeText(data.first_name, 50)
  if (data.last_name !== undefined) sanitized.last_name = sanitizeText(data.last_name, 50)
  if (data.password !== undefined) sanitized.password = data.password // Don't sanitize passwords (may contain special chars)
  if (data.moto_type !== undefined) sanitized.moto_type = sanitizeText(data.moto_type, 30)
  if (data.moto_model !== undefined) sanitized.moto_model = sanitizeText(data.moto_model, 100)
  if (data.experience !== undefined) sanitized.experience = sanitizeText(data.experience, 20)
  if (data.location !== undefined) sanitized.location = sanitizeText(data.location, 100)
  if (data.insta_handle !== undefined) sanitized.insta_handle = sanitizeInstagram(data.insta_handle)
  if (data.heard_from !== undefined) sanitized.heard_from = sanitizeText(data.heard_from, 30)
  if (data.promo_code !== undefined) sanitized.promo_code = sanitizeText(data.promo_code, 30).toUpperCase()
  if (data.latitude !== undefined) sanitized.latitude = data.latitude ? Number(data.latitude) || null : null
  if (data.longitude !== undefined) sanitized.longitude = data.longitude ? Number(data.longitude) || null : null
  if (data.needs_food !== undefined) sanitized.needs_food = Boolean(data.needs_food)

  return sanitized
}

/**
 * Sanitize route creation payload
 */
export function sanitizeRoutePayload(data) {
  return {
    title: sanitizeText(data.title, 200),
    description: sanitizeText(data.description, 2000),
    date: data.date, // ISO string — validated by backend
    end_date: data.end_date,
    city: sanitizeText(data.city, 100),
    location_detail: sanitizeText(data.location_detail, 200),
    route_url: sanitizeUrl(data.route_url),
    max_participants: sanitizeNumber(data.max_participants, 1, 500),
  }
}

/**
 * Sanitize chat message
 */
export function sanitizeMessage(text) {
  return sanitizeText(text, 1000)
}
