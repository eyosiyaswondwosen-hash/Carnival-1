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
  const [search, setSearch] = useState('')
  const [notif, setNotif] = useState(null)

  const showNotif = (msg, type = 'success') => {
    setNotif({ msg, type })
    setTimeout(() => setNotif(null), 3500)
  }

  const fetchAll = useCallback(async (currentFilter) => {
    setLoading(true)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      const [sRes, tRes] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store', signal: controller.signal }),
        fetch(`/api/admin/tickets?filter=${currentFilter}`, { cache: 'no-store', signal: controller.signal }),
      ])
      if (sRes.status === 401 || tRes.status === 401) {
        router.replace('/admin/login')
        return
      }
      const sData = await sRes.json()
      const tData = await tRes.json()
      setStats(sData)
      setTickets(tData.tickets || [])
    } catch (err) {
      if (err.name !== 'AbortError') showNotif('Failed to load data', 'error')
    } finally {
      clearTimeout(timer)
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchAll(filter) }, [filter, fetchAll])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  const filtered = tickets.filter(t => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      t.name?.toLowerCase().includes(q) ||
      t.phone?.toLowerCase().includes(q) ||
      String(t.id).includes(q)
    )
  })

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
          <div style={{ fontSize: 20, fontWeight: 700, color: C.tx, marginTop: 2 }}>Admin Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => fetchAll(filter)} style={pill(C.bd, C.txM)}>Refresh</button>
          <button onClick={handleLogout} style={pill(C.redD, C.red)}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: stats?.totalTickets ?? '—' },
            { label: 'Confirmed', value: stats?.confirmed ?? '—', color: C.grn },
            { label: 'Pending', value: stats?.pending ?? '—', color: C.yel },
            { label: 'Revenue', value: stats ? `${(stats.revenue || 0).toLocaleString()} Birr` : '—', color: C.gold },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.bd}`, borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color || C.tx }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.txD, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', 'pending', 'confirmed', 'rejected', 'scanned'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${filter === f ? C.gold : C.bd}`,
              background: filter === f ? C.goldD : 'transparent',
              color: filter === f ? C.gold : C.txM, fontWeight: 600, fontSize: 13,
            }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, ID..."
            style={{
              marginLeft: 'auto', background: C.card, border: `1px solid ${C.bd}`,
              borderRadius: 8, padding: '7px 14px', color: C.tx, fontSize: 13,
              outline: 'none', minWidth: 220,
            }}
          />
        </div>

        {/* Table */}
        <div style={{ background: C.card, border: `1px solid ${C.bd}`, borderRadius: 12, overflow: 'hidden' }}>
          {/* Head */}
          <div style={row}>
            {['ID', 'Name', 'Phone', 'Group', 'Amount', 'Payment', 'Status', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, color: C.txD, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={empty}>Loading tickets...</div>
          ) : filtered.length === 0 ? (
            <div style={empty}>No tickets found</div>
          ) : filtered.map((t, i) => (
            <div key={t.id} style={{
              ...row,
              borderTop: `1px solid ${C.bd}`,
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
            }}>
              <div style={{ fontSize: 12, color: C.txD, fontFamily: 'monospace' }}>{t.id}</div>
              <div style={{ fontWeight: 600, color: C.tx, fontSize: 14 }}>{t.name}</div>
              <div style={{ fontSize: 13, color: C.txM }}>{t.phone}</div>
              <div style={{ fontSize: 13, color: C.txM }}>
                {t.group_total > 1 ? `${t.ticket_index}/${t.group_total}` : 'Solo'}
              </div>
              <div style={{ fontSize: 13, color: C.gold }}>{(t.total_amount || 0).toLocaleString()} Birr</div>
              <div style={{ fontSize: 12, color: C.txM, textTransform: 'capitalize' }}>{t.payment_method}</div>
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                  padding: '3px 10px', borderRadius: 20,
                  background: statusBg(t.status), color: statusColor(t.status),
                }}>{t.status}</span>
              </div>
              <button
                onClick={() => router.push(`/admin/tickets/${t.id}`)}
                style={{
                  padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${C.bd}`, background: 'transparent',
                  color: C.tx, fontSize: 12, fontWeight: 600,
                }}
              >View</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: C.txD, textAlign: 'right' }}>
          {filtered.length} of {tickets.length} tickets
        </div>
      </div>
    </div>
  )
}

function pill(bg, color) {
  return { padding: '7px 14px', borderRadius: 8, border: `1px solid ${color}`, background: bg, color, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
}

const row = {
  display: 'grid',
  gridTemplateColumns: '50px 1fr 130px 70px 120px 90px 100px 70px',
  padding: '12px 16px',
  alignItems: 'center',
  gap: 8,
}

const empty = {
  padding: 60, textAlign: 'center', color: C.txD, fontSize: 14,
}
