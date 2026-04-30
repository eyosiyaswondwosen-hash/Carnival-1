import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { ADMIN_COOKIE_NAME, createAdminSession } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function POST(request) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { username, password } = body

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, username, password_hash')
      .eq('username', username.trim())
      .maybeSingle()

    // Use constant-time comparison to prevent timing attacks
    const dummyHash = '$2a$10$abcdefghijklmnopqrstuvuuuuuuuuuuuuuuuuuuuuuuuuuuuuu'
    const hashToCheck = admin?.password_hash || dummyHash
    const valid = await bcrypt.compare(password, hashToCheck)

    if (error || !admin || !valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const { token, expiresAt } = await createAdminSession(admin.id, request)

    const cookieStore = await cookies()
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(expiresAt),
    })

    return NextResponse.json({ success: true, username: admin.username })
  } catch (err) {
    console.error('[admin/login] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
