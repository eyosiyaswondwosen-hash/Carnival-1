'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { C } from './theme'

export default function AdminDashboard({ username }) {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [notif, setNotif] = useState(null)
  const [receipt, setReceipt] = useState(null) // { name, url, loading }

  async function openReceipt(ticketId, name) {
    setReceipt({ name, url: null, loading: true })
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/screenshot`)
      if (!res.ok) { setReceipt({ name, url: null, loading: false }); return }
      const data = await res.json()
      setReceipt({ name, url: data.screenshot || null, loading: false })
    } catch {
      setReceipt({ name, url: null, loading: false })
    }
  }

  const showNotif = (msg, type = 'success') => {
    setNotif({ msg, type })
    setTimeout(() => setNotif(null), 3500)
  }

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' })
      if (res.status === 401) { router.replace('/admin/login'); return }
      setStats(await res.json())
    } catch {
      // non-fatal — stats are supplementary
    }
  }, [router])

  const fetchTickets = useCallback(async (currentFilter) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets?filter=${currentFilter}`, { cache: 'no-store' })
      if (res.status === 401) { router.replace('/admin/login'); return }
      if (!res.ok) { showNotif('Failed to load tickets', 'error'); return }
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch {
      showNotif('Network error — check your connection', 'error')
    } finally {
      setLoading(false)
    }
  }, [router])

  // On mount: load stats and tickets in parallel
  useEffect(() => {
    fetchStats()
    fetchTickets(filter)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When filter changes: only reload tickets, stats stay
  useEffect(() => {
    fetchTickets(filter)
  }, [filter, fetchTickets])

  // Auto-refresh stats every 30s; tickets only on manual refresh
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  async function handleApprove(ticketId, name, groupTotal) {
    setActionId(ticketId)
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/approve`, { method: 'POST' })
      if (res.status === 401) {
        router.replace('/admin/login')
        return
      }
      const data = await res.json()
      if (!res.ok) {
        showNotif(data.error || 'Approval failed', 'error')
        return
      }
      showNotif(
        `Confirmed: ${name}${groupTotal > 1 ? ` (${groupTotal} tickets)` : ''}`
      )
      fetchStats()
      await fetchTickets(filter)
    } catch {
      showNotif('Network error', 'error')
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(ticketId, name) {
    if (!confirm(`Reject ticket(s) for ${name}?`)) return
    setActionId(ticketId)
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/reject`, { method: 'POST' })
      if (res.status === 401) {
        router.replace('/admin/login')
        return
      }
      if (!res.ok) {
        const data = await res.json()
        showNotif(data.error || 'Rejection failed', 'error')
        return
      }
      showNotif(`Rejected: ${name}`)
      fetchStats()
      await fetchTickets(filter)
    } catch {
      showNotif('Network error', 'error')
    } finally {
      setActionId(null)
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div style={s.page}>
      {/* Receipt modal */}
      {receipt && (
        <div style={s.modalOverlay} onClick={() => setReceipt(null)}>
          <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Receipt — {receipt.name}</span>
              <button style={s.modalClose} onClick={() => setReceipt(null)}>✕</button>
            </div>
            <div style={s.modalBody}>
              {receipt.loading && <div style={s.modalMsg}>Loading receipt...</div>}
              {!receipt.loading && !receipt.url && (
                <div style={s.modalMsg}>No receipt image uploaded for this ticket.</div>
              )}
              {!receipt.loading && receipt.url && (
                <img
                  src={receipt.url}
                  alt={`Payment receipt for ${receipt.name}`}
                  style={s.modalImg}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {notif && (
        <div
          style={{
            ...s.notif,
            background: notif.type === 'error' ? C.redD : C.grnD,
            borderColor: notif.type === 'error' ? C.red : C.grn,
            color: notif.type === 'error' ? C.red : C.grn,
          }}
        >
          {notif.msg}
        </div>
      )}

      <header style={s.header}>
        <div>
          <div style={s.headerEyebrow}>LEBAWI CARNIVAL 2026</div>
          <h1 style={s.headerTitle}>Admin Dashboard</h1>
          <p style={s.headerSub}>Signed in as <strong>{username}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/" style={s.linkBtn}>View Site</a>
          <button onClick={handleLogout} style={s.logoutBtn}>Sign Out</button>
        </div>
      </header>

      <section style={s.statsRow}>
        <Stat label="Total Tickets" value={stats?.totalTickets ?? '—'} />
        <Stat label="Confirmed" value={stats?.confirmed ?? '—'} color={C.grn} />
        <Stat label="Pending" value={stats?.pending ?? '—'} color={C.yel} />
        <Stat label="Scanned" value={stats?.scanned ?? '—'} color={C.gold} />
        <Stat label="Revenue (Birr)" value={stats?.revenue?.toLocaleString() ?? '—'} color={C.gold} />
        <Stat
          label="Capacity Remaining"
          value={stats ? `${stats.remaining} / ${stats.capacity}` : '—'}
        />
      </section>

      <section style={s.filterRow}>
        {[
          ['all', 'All'],
          ['pending', 'Pending'],
          ['confirmed', 'Confirmed'],
          ['scanned', 'Scanned'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              ...s.filterBtn,
              ...(filter === key ? s.filterBtnActive : {}),
            }}
          >
            {label}
          </button>
        ))}
        <button onClick={() => { fetchStats(); fetchTickets(filter) }} style={s.refreshBtn}>
          Refresh
        </button>
      </section>

      <section style={s.list}>
        {loading && <div style={s.empty}>Loading tickets...</div>}
        {!loading && tickets.length === 0 && (
          <div style={s.empty}>No tickets found for this filter.</div>
        )}
        {!loading &&
          tickets.map((t) => (
            <article key={t.id} style={s.ticketCard}>
              <header style={s.ticketHeader}>
                <div>
                  <div style={s.ticketName}>{t.name}</div>
                  <div style={s.ticketSub}>
                    {t.phone}
                    {t.email ? ` · ${t.email}` : ''}
                  </div>
                </div>
                <div
                  style={{
                    ...s.statusPill,
                    background: t.status === 'confirmed' ? C.grnD : C.yelD,
                    color: t.status === 'confirmed' ? C.grn : C.yel,
                    borderColor: t.status === 'confirmed' ? C.grn : C.yel,
                  }}
                >
                  {t.status}
                </div>
              </header>

              <div style={s.metaRow}>
                <span>
                  Ticket #{t.id}
                  {t.group_total > 1 ? ` (${t.ticket_index}/${t.group_total})` : ''}
                </span>
                <span>
                  {t.group_total > 1
                    ? `${t.group_total * t.total_amount} Birr group total`
                    : `${t.total_amount} Birr`}
                </span>
                <span>{t.payment_method === 'cbe' ? 'CBE' : 'Telebirr'}</span>
                {t.scanned_at && (
                  <span style={{ color: C.gold }}>
                    Scanned {new Date(t.scanned_at).toLocaleString()}
                  </span>
                )}
              </div>

              <button
                style={s.receiptBtn}
                onClick={() => openReceipt(t.id, t.name)}
              >
                View Receipt
              </button>

              {t.status === 'pending' && (
                <div style={s.actions}>
                  <button
                    onClick={() => handleApprove(t.id, t.name, t.group_total)}
                    disabled={actionId === t.id}
                    style={s.approveBtn}
                  >
                    {actionId === t.id ? 'Working...' : 'Approve Payment'}
                  </button>
                  <button
                    onClick={() => handleReject(t.id, t.name)}
                    disabled={actionId === t.id}
                    style={s.rejectBtn}
                  >
                    Reject
                  </button>
                </div>
              )}

              <div style={s.created}>
                Submitted {new Date(t.created_at).toLocaleString()}
              </div>
            </article>
          ))}
      </section>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statValue, color: color || C.tx }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: C.bg,
    color: C.tx,
    padding: 32,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: 1200,
    margin: '0 auto',
  },
  notif: {
    position: 'fixed',
    top: 20,
    right: 20,
    padding: '12px 18px',
    borderRadius: 10,
    border: '1px solid',
    fontSize: 14,
    fontWeight: 600,
    zIndex: 100,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  headerEyebrow: {
    fontSize: 11,
    letterSpacing: 3,
    color: C.gold,
    fontWeight: 600,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 30, margin: 0, color: C.tx, fontWeight: 700 },
  headerSub: { color: C.txM, fontSize: 14, margin: '4px 0 0' },
  linkBtn: {
    color: C.tx,
    background: 'transparent',
    border: `1px solid ${C.bd}`,
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  logoutBtn: {
    background: C.redD,
    color: C.red,
    border: `1px solid ${C.red}`,
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    background: C.card,
    border: `1px solid ${C.bd}`,
    borderRadius: 12,
    padding: 18,
  },
  statValue: { fontSize: 26, fontWeight: 700 },
  statLabel: {
    color: C.txM,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  filterBtn: {
    background: C.sf,
    color: C.txM,
    border: `1px solid ${C.bd}`,
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: 13,
    cursor: 'pointer',
  },
  filterBtnActive: {
    background: C.gold,
    color: C.bg,
    borderColor: C.gold,
    fontWeight: 700,
  },
  refreshBtn: {
    marginLeft: 'auto',
    background: 'transparent',
    color: C.tx,
    border: `1px solid ${C.bd}`,
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 14 },
  empty: {
    background: C.card,
    border: `1px dashed ${C.bd}`,
    padding: 48,
    textAlign: 'center',
    color: C.txM,
    borderRadius: 12,
  },
  ticketCard: {
    background: C.card,
    border: `1px solid ${C.bd}`,
    borderRadius: 12,
    padding: 18,
  },
  ticketHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  ticketName: { fontSize: 17, fontWeight: 700, color: C.tx },
  ticketSub: { color: C.txM, fontSize: 13, marginTop: 2 },
  statusPill: {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 14,
    color: C.txM,
    fontSize: 13,
    marginTop: 12,
    paddingTop: 12,
    borderTop: `1px solid ${C.bd}`,
  },

  actions: { display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  approveBtn: {
    background: C.grn,
    color: C.bg,
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    flex: 1,
    minWidth: 140,
  },
  rejectBtn: {
    background: 'transparent',
    color: C.red,
    border: `1px solid ${C.red}`,
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  created: { fontSize: 11, color: C.txD, marginTop: 12, letterSpacing: 0.5 },
  receiptBtn: {
    marginTop: 12,
    background: 'transparent',
    color: C.gold,
    border: `1px solid ${C.gold}`,
    borderRadius: 8,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    background: C.card,
    border: `1px solid ${C.bd}`,
    borderRadius: 14,
    width: '100%',
    maxWidth: 560,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: `1px solid ${C.bd}`,
  },
  modalTitle: { fontWeight: 700, fontSize: 15, color: C.tx },
  modalClose: {
    background: 'transparent',
    border: 'none',
    color: C.txM,
    fontSize: 18,
    cursor: 'pointer',
    lineHeight: 1,
    padding: 4,
  },
  modalBody: {
    padding: 18,
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMsg: { color: C.txM, fontSize: 14, textAlign: 'center', padding: 32 },
  modalImg: {
    width: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: 8,
  },
}
