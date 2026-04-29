import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Mirror of genCode used in the UI
function decodeTicketId(code) {
  if (/^\d+$/.test(code)) return Number(code)
  // pattern LBW-{id}-{checksum}
  const match = code.match(/^LBW-(\d+)-/)
  if (match) return Number(match[1])
  return null
}

export async function POST(request) {
  try {
    const { code } = await request.json()
    if (!code) {
      return NextResponse.json({ ok: false, msg: 'Missing code' }, { status: 400 })
    }

    const ticketId = decodeTicketId(code)
    if (!ticketId) {
      return NextResponse.json({ ok: false, msg: 'Ticket not found' })
    }

    const supabase = createServiceClient()
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .maybeSingle()

    if (error || !ticket) {
      return NextResponse.json({ ok: false, msg: 'Ticket not found' })
    }
    if (ticket.status === 'pending') {
      return NextResponse.json({
        ok: false,
        msg: 'Payment not confirmed yet',
        ticket,
      })
    }
    if (ticket.scanned_at) {
      return NextResponse.json({
        ok: false,
        msg: `Already scanned at ${new Date(ticket.scanned_at).toLocaleTimeString()}`,
        ticket,
      })
    }

    const { data: updated, error: updateErr } = await supabase
      .from('tickets')
      .update({ scanned_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select()
      .maybeSingle()

    if (updateErr) {
      return NextResponse.json({ ok: false, msg: 'Failed to mark scanned' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, msg: 'Entry approved!', ticket: updated })
  } catch (err) {
    console.error('[v0] Scan error:', err)
    return NextResponse.json({ ok: false, msg: 'Server error' }, { status: 500 })
  }
}
