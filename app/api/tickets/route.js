import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 15

const TICKET_PRICE = 600
const TICKET_CAP = 1000

export async function POST(request) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const {
      name,
      phone,
      email,
      quantity = 1,
      paymentMethod,
      paymentScreenshot,
      screenshotName,
    } = body

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      )
    }
    if (!paymentScreenshot) {
      return NextResponse.json(
        { error: 'Payment screenshot is required' },
        { status: 400 }
      )
    }

    const qty = Math.max(1, Math.min(10, Number(quantity) || 1))
    const supabase = createServiceClient()

    // Use DB count — fast, no row fetch
    const { count: confirmedCount, error: countErr } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')

    if (countErr) {
      console.error('[tickets] Count error:', countErr)
      return NextResponse.json({ error: 'Failed to check capacity' }, { status: 500 })
    }

    const remaining = TICKET_CAP - (confirmedCount || 0)
    if (qty > remaining) {
      return NextResponse.json(
        {
          error:
            remaining <= 0
              ? 'Sorry, tickets are sold out!'
              : `Only ${remaining} tickets remaining`,
        },
        { status: 409 }
      )
    }

    const groupId = `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const rows = Array.from({ length: qty }, (_, i) => ({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      payment_method: paymentMethod,
      payment_screenshot: paymentScreenshot,
      screenshot_name: screenshotName || null,
      status: 'pending',
      total_amount: TICKET_PRICE,
      quantity: 1,
      group_id: groupId,
      group_total: qty,
      ticket_index: i + 1,
    }))

    const { data, error } = await supabase.from('tickets').insert(rows).select()
    if (error) {
      console.error('[tickets] Insert error:', error)
      return NextResponse.json({ error: 'Failed to save tickets' }, { status: 500 })
    }

    return NextResponse.json({ success: true, tickets: data, groupId })
  } catch (err) {
    console.error('[tickets] Purchase error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
