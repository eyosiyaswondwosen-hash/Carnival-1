import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req, { params }) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('tickets')
    .select('payment_screenshot')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  return NextResponse.json({ screenshot: data.payment_screenshot || null })
}
