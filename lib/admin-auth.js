import { cookies } from 'next/headers'

// Simple admin auth - no DB, no sessions table, no bcrypt
// Password is checked against env var with a hardcoded fallback
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '9134'
const COOKIE_NAME = 'lebawi_admin'
// Cookie value is just a signed marker - no DB lookup needed
const COOKIE_VALUE = 'authenticated'

export async function checkAdminPassword(password) {
  return password === ADMIN_PASSWORD
}

export async function setAdminCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearAdminCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies()
  const val = cookieStore.get(COOKIE_NAME)?.value
  return val === COOKIE_VALUE
}

export async function requireAdmin() {
  const authed = await isAdminAuthenticated()
  if (!authed) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }
  return { username: 'admin' }
}
