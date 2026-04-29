'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { C } from '../theme'

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: C.bg }} />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }
      router.replace(redirect)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.badge}>LEBAWI INTERNATIONAL ACADEMY</div>
        <h1 style={s.title}>Admin Access</h1>
        <p style={s.subtitle}>Sign in to manage carnival ticket approvals</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>
            <span style={s.labelText}>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              style={s.input}
              required
            />
          </label>

          <label style={s.label}>
            <span style={s.labelText}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={s.input}
              required
            />
          </label>

          {error && <div style={s.error}>{error}</div>}

          <button type="submit" disabled={loading} style={s.button}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <a href="/" style={s.backLink}>
          &larr; Back to homepage
        </a>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: `radial-gradient(ellipse at top, ${C.purD}, ${C.bg} 60%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    background: C.card,
    border: `1px solid ${C.bd}`,
    borderRadius: 16,
    padding: 36,
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
  },
  badge: {
    fontSize: 10,
    letterSpacing: 3,
    color: C.gold,
    fontWeight: 600,
    marginBottom: 18,
    textAlign: 'center',
  },
  title: {
    color: C.tx,
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: C.txM,
    fontSize: 14,
    margin: 0,
    marginBottom: 28,
    textAlign: 'center',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'flex', flexDirection: 'column', gap: 6 },
  labelText: {
    color: C.txM,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  input: {
    background: C.sf,
    border: `1px solid ${C.bd}`,
    borderRadius: 8,
    padding: '12px 14px',
    color: C.tx,
    fontSize: 15,
    outline: 'none',
  },
  error: {
    background: C.redD,
    border: `1px solid ${C.red}`,
    color: C.red,
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
  },
  button: {
    background: C.gold,
    color: C.bg,
    border: 'none',
    borderRadius: 8,
    padding: '14px 18px',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginTop: 8,
  },
  backLink: {
    display: 'block',
    marginTop: 22,
    textAlign: 'center',
    color: C.txM,
    fontSize: 13,
    textDecoration: 'none',
  },
}
