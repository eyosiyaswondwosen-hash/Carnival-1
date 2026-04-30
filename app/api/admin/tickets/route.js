import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    await requireAdmin()
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') || 'all'

  const supabase = createServiceClient()
  let query = supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter === 'pending') query = query.eq('status', 'pending')
  if (filter === 'confirmed') query = query.eq('status', 'confirmed')
  if (filter === 'rejected') query = query.eq('status', 'rejected')
  if (filter === 'scanned') query = query.not('scanned_at', 'is', null)

  const { data, error } = await query
  if (error) {
    console.error('[v0] Fetch tickets error:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }

  return NextResponse.json({ tickets: data || [] })
}
