import { cookies } from 'next/headers'
import crypto from 'node:crypto'
import { createServiceClient } from './supabase/server.js'

export const ADMIN_COOKIE_NAME = 'lebawi_admin_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8 // 8 hours
const INACTIVITY_TIMEOUT_MS = 1000 * 60 * 30 // 30 minutes

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
    console.error('[v0] Failed to create admin session:', error)
    throw new Error('Failed to create session')
  }

  return { token, expiresAt }
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (!token) return null

  const supabase = createServiceClient()
  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('id, admin_id, token, expires_at, last_activity_at, admin_users(id, username)')
    .eq('token', token)
    .maybeSingle()

  if (error || !session) return null

  const now = Date.now()
  const expiresAt = new Date(session.expires_at).getTime()
  const lastActivity = new Date(session.last_activity_at).getTime()

  // Hard expiration
  if (now > expiresAt) {
    await supabase.from('admin_sessions').delete().eq('id', session.id)
    return null
  }

  // Inactivity timeout
  if (now - lastActivity > INACTIVITY_TIMEOUT_MS) {
    await supabase.from('admin_sessions').delete().eq('id', session.id)
    return null
  }

  // Touch last activity (best-effort)
  await supabase
    .from('admin_sessions')
    .update({ last_activity_at: new Date(now).toISOString() })
    .eq('id', session.id)

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
