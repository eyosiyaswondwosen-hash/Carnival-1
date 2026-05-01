import { NextResponse } from 'next/server'
import { checkPassword, setAdminCookie } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const body = await request.json()
    const password = (body.password || '').trim()

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (!checkPassword(password)) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    await setAdminCookie()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/login]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
