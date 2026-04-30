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
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('id, status, total_amount, quantity, scanned_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const all = tickets || []
  const confirmed = all.filter((t) => t.status === 'confirmed')
  const pending = all.filter((t) => t.status === 'pending')
  const scanned = all.filter((t) => t.scanned_at)

  const totalQuantity = all.reduce((sum, t) => sum + (t.quantity || 1), 0)
  const revenue = confirmed.reduce((sum, t) => sum + (t.total_amount || 0), 0)
  const capacity = 1000

  return NextResponse.json({
    totalTickets: totalQuantity,
    confirmed: confirmed.length,
    pending: pending.length,
    scanned: scanned.length,
    revenue,
    capacity,
    remaining: Math.max(0, capacity - confirmed.length),
  })
}
