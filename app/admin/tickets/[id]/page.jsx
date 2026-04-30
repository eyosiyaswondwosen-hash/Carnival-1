'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { C } from '../../theme'

export default function TicketDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [notif, setNotif] = useState(null)

  const showNotif = (msg, type = 'success') => {
    setNotif({ msg, type })
    setTimeout(() => setNotif(null), 3000)
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/tickets/${id}`, { cache: 'no-store' })
        if (res.status === 401) { router.replace('/admin/login'); return }
        if (!res.ok) { showNotif('Ticket not found', 'error'); setLoading(false); return }
        const data = await res.json()
        setTicket(data.ticket)
      } catch {
        showNotif('Failed to load ticket', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  async function handleApprove() {
    if (!confirm(`Confirm payment for ${ticket.name}?`)) return
    setActing(true)
    try {
      const res = await fetch(`/api/admin/tickets/${id}/approve`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { showNotif(data.error || 'Approval failed', 'error'); return }
      showNotif(`Confirmed ${data.updated} ticket(s) for ${ticket.name}`)
      setTicket(t => ({ ...t, status: 'confirmed' }))
    } catch {
      showNotif('Network error', 'error')
    } finally {
      setActing(false)
    }
  }

  async function handleReject() {
    if (!confirm(`Reject ticket for ${ticket.name}? This will mark it as rejected.`)) return
    setActing(true)
    try {
      const res = await fetch(`/api/admin/tickets/${id}/reject`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { showNotif(data.error || 'Rejection failed', 'error'); return }
      showNotif(`Rejected ticket for ${ticket.name}`)
      setTicket(t => ({ ...t, status: 'rejected' }))
    } catch {
      showNotif('Network error', 'error')
    } finally {
      setActing(false)
    }
  }

  const statusColor = (s) => s === 'confirmed' ? C.grn : s === 'rejected' ? C.red : C.yel
  const statusBg = (s) => s === 'confirmed' ? C.grnD : s === 'rejected' ? C.redD : C.yelD

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.tx, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {notif && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10,
          background: notif.type === 'error' ? C.redD : C.grnD,
          border: `1px solid ${notif.type === 'error' ? C.red : C.grn}`,
          color: notif.type === 'error' ? C.red : C.grn,
          fontWeight: 600, fontSize: 14,
        }}>{notif.msg}</div>
      )}

      {/* Header */}
      <div style={{ background: C.sf, borderBottom: `1px solid ${C.bd}`, padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: C.gold, letterSpacing: 2, fontWeight: 600, textTransform: 'uppercase' }}>Lebawi International Academy</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.tx, marginTop: 2 }}>Ticket Detail</div>
        </div>
        <button
          onClick={() => router.push('/admin')}
          style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.bd}`, background: 'transparent', color: C.tx, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          &larr; Back to Dashboard
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: '32px auto', padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: C.txD, padding: 60 }}>Loading...</div>
        ) : !ticket ? (
          <div style={{ textAlign: 'center', color: C.red, padding: 60 }}>Ticket not found.</div>
        ) : (
          <>
            {/* Status Banner */}
            <div style={{
              background: statusBg(ticket.status), border: `1px solid ${statusColor(ticket.status)}`,
              borderRadius: 10, padding: '12px 20px', marginBottom: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: statusColor(ticket.status), textTransform: 'uppercase', letterSpacing: 1 }}>
                {ticket.status}
              </span>
              <span style={{ fontSize: 12, color: C.txM }}>Ticket #{ticket.id}</span>
            </div>

            {/* Main Info Card */}
            <div style={{ background: C.card, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.bd}`, background: C.sf }}>
                <div style={{ fontSize: 11, color: C.txD, textTransform: 'uppercase', letterSpacing: 1 }}>Registrant</div>
              </div>
              {[
                ['Full Name', ticket.name],
                ['Phone', ticket.phone],
                ['Email', ticket.email || '—'],
                ['Payment Method', ticket.payment_method?.toUpperCase() || '—'],
                ['Amount', `${(ticket.total_amount || 0).toLocaleString()} Birr`],
                ['Group Size', ticket.group_total > 1 ? `${ticket.group_total} tickets (this is #${ticket.ticket_index})` : 'Solo (1 ticket)'],
                ['Submitted', new Date(ticket.created_at).toLocaleString()],
                ticket.approved_at && ['Approved At', new Date(ticket.approved_at).toLocaleString()],
                ticket.scanned_at && ['Scanned At', new Date(ticket.scanned_at).toLocaleString()],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', padding: '13px 20px', borderBottom: `1px solid ${C.bd}`, gap: 16 }}>
                  <div style={{ width: 140, fontSize: 13, color: C.txD, flexShrink: 0 }}>{label}</div>
                  <div style={{ fontSize: 13, color: C.tx, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Payment Screenshot */}
            {ticket.payment_screenshot && (
              <div style={{ background: C.card, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.bd}`, background: C.sf }}>
                  <div style={{ fontSize: 11, color: C.txD, textTransform: 'uppercase', letterSpacing: 1 }}>Payment Proof</div>
                </div>
                <div style={{ padding: 16 }}>
                  <img
                    src={ticket.payment_screenshot}
                    alt="Payment proof"
                    style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8 }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            {ticket.status === 'pending' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  onClick={handleApprove}
                  disabled={acting}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 10, border: 'none',
                    background: acting ? C.grnD : C.grn,
                    color: acting ? C.grn : C.bg,
                    fontSize: 15, fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {acting ? 'Working...' : `Confirm Payment${ticket.group_total > 1 ? ` (${ticket.group_total} tickets)` : ''}`}
                </button>
                <button
                  onClick={handleReject}
                  disabled={acting}
                  style={{
                    padding: '14px 24px', borderRadius: 10,
                    border: `1px solid ${C.red}`, background: 'transparent',
                    color: C.red, fontSize: 15, fontWeight: 700,
                    cursor: acting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Reject
                </button>
              </div>
            )}

            {ticket.status === 'confirmed' && (
              <div style={{ background: C.grnD, border: `1px solid ${C.grn}`, borderRadius: 10, padding: '14px 20px', textAlign: 'center', color: C.grn, fontWeight: 600 }}>
                Payment confirmed. Ticket is valid.
              </div>
            )}

            {ticket.status === 'rejected' && (
              <div style={{ background: C.redD, border: `1px solid ${C.red}`, borderRadius: 10, padding: '14px 20px', textAlign: 'center', color: C.red, fontWeight: 600 }}>
                This ticket has been rejected.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
