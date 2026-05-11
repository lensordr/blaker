// ─── Client-Side Rate Limiter ─────────────────────────────────────────────────
// Prevents rapid-fire form submissions from the UI.
// This is NOT a replacement for backend rate limiting — it's a UX layer
// that stops casual abuse and provides feedback to users.
//
// Uses localStorage to persist across page refreshes (prevents refresh-spam).

const STORAGE_KEY = 'rutillas_rate_limits'

/**
 * Get rate limit state from localStorage
 */
function getState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Save rate limit state
 */
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

/**
 * Clean up expired entries
 */
function cleanState(state) {
  const now = Date.now()
  const cleaned = {}
  for (const [key, entry] of Object.entries(state)) {
    if (entry.resetAt > now) {
      cleaned[key] = entry
    }
  }
  return cleaned
}

/**
 * Check if an action is rate-limited
 * 
 * @param {string} action - Action identifier (e.g., 'login', 'register', 'create_route')
 * @param {object} options
 * @param {number} options.maxAttempts - Max attempts in the window (default: 5)
 * @param {number} options.windowMs - Time window in ms (default: 60000 = 1 min)
 * @param {number} options.cooldownMs - Cooldown after hitting limit (default: 300000 = 5 min)
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
export function checkRateLimit(action, options = {}) {
  const {
    maxAttempts = 5,
    windowMs = 60000,
    cooldownMs = 300000,
  } = options

  const now = Date.now()
  let state = cleanState(getState())
  let entry = state[action]

  // No previous attempts
  if (!entry) {
    entry = { attempts: 1, firstAttempt: now, resetAt: now + windowMs, lockedUntil: 0 }
    state[action] = entry
    saveState(state)
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 }
  }

  // Currently in cooldown
  if (entry.lockedUntil > now) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.lockedUntil - now }
  }

  // Window expired — reset
  if (entry.resetAt <= now) {
    entry = { attempts: 1, firstAttempt: now, resetAt: now + windowMs, lockedUntil: 0 }
    state[action] = entry
    saveState(state)
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 }
  }

  // Within window — increment
  entry.attempts += 1

  if (entry.attempts > maxAttempts) {
    // Lock out
    entry.lockedUntil = now + cooldownMs
    state[action] = entry
    saveState(state)
    return { allowed: false, remaining: 0, retryAfterMs: cooldownMs }
  }

  state[action] = entry
  saveState(state)
  return { allowed: true, remaining: maxAttempts - entry.attempts, retryAfterMs: 0 }
}

/**
 * Reset rate limit for an action (e.g., after successful login)
 */
export function resetRateLimit(action) {
  const state = getState()
  delete state[action]
  saveState(state)
}

/**
 * Pre-configured rate limits for common actions
 */
export const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 60000, cooldownMs: 300000 },       // 5 per min, 5 min cooldown
  register: { maxAttempts: 3, windowMs: 300000, cooldownMs: 900000 },   // 3 per 5 min, 15 min cooldown
  createRoute: { maxAttempts: 5, windowMs: 300000, cooldownMs: 600000 },// 5 per 5 min, 10 min cooldown
  joinRoute: { maxAttempts: 10, windowMs: 60000, cooldownMs: 120000 },  // 10 per min, 2 min cooldown
  sendMessage: { maxAttempts: 30, windowMs: 60000, cooldownMs: 60000 }, // 30 per min, 1 min cooldown
  forgotPassword: { maxAttempts: 3, windowMs: 300000, cooldownMs: 900000 }, // 3 per 5 min, 15 min cooldown
}

/**
 * Format remaining time for user display
 */
export function formatRetryAfter(ms) {
  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) return `${seconds} segundos`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minuto${minutes > 1 ? 's' : ''}`
}
