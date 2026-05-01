import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const CAPACITY = 1000

  // Fire all DB count queries in parallel — zero row data transferred
  const [totalRes, confirmedRes, pendingRes, scannedRes, revenueRes] = await Promise.all([
    supabase.from('tickets').select('id', { count: 'exact', head: true }),
    supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('tickets').select('id', { count: 'exact', head: true }).not('scanned_at', 'is', null),
    supabase.from('tickets').select('total_amount').eq('status', 'confirmed'),
  ])

  const total = totalRes.count ?? 0
  const confirmed = confirmedRes.count ?? 0
  const pending = pendingRes.count ?? 0
  const scanned = scannedRes.count ?? 0
  const revenue = (revenueRes.data || []).reduce((sum, t) => sum + (t.total_amount || 0), 0)

  return NextResponse.json({
    totalTickets: total,
    confirmed,
    pending,
    scanned,
    revenue,
    capacity: CAPACITY,
    remaining: Math.max(0, CAPACITY - confirmed),
  })
}
