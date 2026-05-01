import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Columns returned in list view — excludes payment_screenshot (can be large)
// The full screenshot is loaded only on the individual ticket detail action
const LIST_COLUMNS = [
  'id', 'name', 'phone', 'email', 'status',
  'payment_method', 'total_amount', 'quantity',
  'group_id', 'group_total', 'ticket_index',
  'approved_at', 'scanned_at', 'created_at',
].join(', ')

export async function GET(request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') || 'all'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = 100
  const offset = (page - 1) * limit

  const supabase = createServiceClient()
  let query = supabase
    .from('tickets')
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filter === 'pending')   query = query.eq('status', 'pending')
  if (filter === 'confirmed') query = query.eq('status', 'confirmed')
  if (filter === 'scanned')   query = query.not('scanned_at', 'is', null)
  if (filter === 'rejected')  query = query.eq('status', 'rejected')

  const { data, error } = await query

  if (error) {
    console.error('[admin/tickets]', error.message)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }

  return NextResponse.json({ tickets: data || [] })
}
