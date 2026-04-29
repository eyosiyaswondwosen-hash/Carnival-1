import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { ADMIN_COOKIE_NAME, createAdminSession } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, username, password_hash')
      .eq('username', username)
      .maybeSingle()

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const { token, expiresAt } = await createAdminSession(admin.id, request)

    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id)

    const cookieStore = await cookies()
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(expiresAt),
    })

    return NextResponse.json({
      success: true,
      username: admin.username,
    })
  } catch (err) {
    console.error('[v0] Login error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
