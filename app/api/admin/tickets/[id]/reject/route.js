import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(_request, { params }) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()

  const { data: target, error: fetchErr } = await supabase
    .from('tickets')
    .select('id, group_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !target) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  const query = target.group_id
    ? supabase.from('tickets').delete().eq('group_id', target.group_id)
    : supabase.from('tickets').delete().eq('id', id)

  const { error } = await query
  if (error) {
    return NextResponse.json({ error: 'Rejection failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
