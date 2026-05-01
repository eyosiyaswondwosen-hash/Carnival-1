import { cookies } from 'next/headers'
import crypto from 'node:crypto'

// ---------------------------------------------------------------------------
// Stateless cookie-based admin auth — zero DB calls on every request.
// The cookie value is: base64(payload) + "." + HMAC-SHA256(base64(payload))
// The ADMIN_PASSWORD env var is the only secret. No admin_sessions table needed.
// ---------------------------------------------------------------------------

const COOKIE_NAME = 'lebawi_admin'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours in seconds
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Lebawi@2026!'
const HMAC_SECRET = process.env.ADMIN_HMAC_SECRET || 'lebawi-carnival-2026-secret'

function sign(payload) {
  return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex')
}

function makeCookieValue() {
  const payload = Buffer.from(JSON.stringify({ ts: Date.now() })).toString('base64')
  return `${payload}.${sign(payload)}`
}

function verifyCookieValue(value) {
  if (!value) return false
  const dotIndex = value.indexOf('.')
  if (dotIndex === -1) return false
  const payload = value.slice(0, dotIndex)
  const sig = value.slice(dotIndex + 1)
  if (!payload || !sig) return false
  const expected = sign(payload)
  // Both must be exactly 64 hex chars (SHA-256) for timingSafeEqual
  if (sig.length !== 64 || expected.length !== 64) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

// Called by login route — sets the signed cookie
export async function setAdminCookie(response) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, makeCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

// Called by logout route — clears the cookie
export async function clearAdminCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Used by server components (admin page.jsx) — no DB call
export async function isAdminAuthenticated() {
  const cookieStore = await cookies()
  const value = cookieStore.get(COOKIE_NAME)?.value
  return verifyCookieValue(value)
}

// Used by API route handlers — throws if not authenticated, no DB call
export async function requireAdmin() {
  const authed = await isAdminAuthenticated()
  if (!authed) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }
  return true
}

// Exported for the login route to validate the password
export function checkPassword(input) {
  // Constant-time compare
  try {
    return crypto.timingSafeEqual(
      Buffer.from(input.padEnd(32)),
      Buffer.from(ADMIN_PASSWORD.padEnd(32))
    )
  } catch {
    return false
  }
}
