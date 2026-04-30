import { cookies } from 'next/headers'
import crypto from 'node:crypto'
import { createServiceClient } from './supabase/server.js'

export const ADMIN_COOKIE_NAME = 'lebawi_admin_session'
// 24-hour hard expiry, no inactivity check (removed to cut DB writes per request)
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex')
}

export async function createAdminSession(adminId, request) {
  const supabase = createServiceClient()
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

  const ipAddress =
    request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
    request?.headers?.get?.('x-real-ip') ||
    null
  const userAgent = request?.headers?.get?.('user-agent') || null

  const { error } = await supabase.from('admin_sessions').insert({
    admin_id: adminId,
    token,
    expires_at: expiresAt,
    ip_address: ipAddress,
    user_agent: userAgent,
  })

  if (error) {
    console.error('[admin-auth] Failed to create session:', error)
    throw new Error('Failed to create session')
  }

  return { token, expiresAt }
}

// Single DB query — no update on every request (removed inactivity touch)
export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (!token) return null

  const supabase = createServiceClient()
  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('id, admin_id, expires_at, admin_users(id, username)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString()) // filter expired in the query
    .maybeSingle()

  if (error || !session) return null

  return {
    sessionId: session.id,
    adminId: session.admin_id,
    username: session.admin_users?.username,
    expiresAt: session.expires_at,
  }
}

export async function destroyAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (!token) return

  const supabase = createServiceClient()
  await supabase.from('admin_sessions').delete().eq('token', token)
  cookieStore.delete(ADMIN_COOKIE_NAME)
}

export async function requireAdmin() {
  const session = await getAdminSession()
  if (!session) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }
  return session
}
