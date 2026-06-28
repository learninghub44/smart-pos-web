'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Enter email and password'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/admin/dashboard')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '1rem' },
    card: { background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 400 },
    iconWrap: { width: 52, height: 52, background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' },
    h1: { fontSize: '1.4rem', fontWeight: 800, textAlign: 'center' as const, color: '#f1f5f9', marginBottom: '0.35rem' },
    sub: { fontSize: '0.82rem', color: '#64748b', textAlign: 'center' as const, marginBottom: '2rem' },
    label: { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem', letterSpacing: '0.04em', textTransform: 'uppercase' as const },
    input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.7rem 0.875rem', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const },
    pwWrap: { position: 'relative' as const },
    eyeBtn: { position: 'absolute' as const, right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0 },
    error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.6rem 0.875rem', fontSize: '0.82rem', color: '#fca5a5', marginBottom: '1rem' },
    btn: { width: '100%', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: 10, padding: '0.8rem', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '0.25rem' },
    badge: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '1.5rem', fontSize: '0.75rem', color: '#475569' },
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.iconWrap}>
          <Shield size={26} color="#8b5cf6" />
        </div>
        <h1 style={s.h1}>Super Admin</h1>
        <p style={s.sub}>Zetu Business Solutions · Internal Portal</p>

        {error && <div style={s.error}>{error}</div>}

        <div style={{ marginBottom: '1rem' }}>
          <label style={s.label}>Email</label>
          <input
            style={s.input}
            type="email"
            placeholder="admin@zetupos.co.ke"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={s.label}>Password</label>
          <div style={s.pwWrap}>
            <input
              style={{ ...s.input, paddingRight: '2.5rem' }}
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button style={s.eyeBtn} onClick={() => setShowPw(p => !p)} type="button">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button style={s.btn} onClick={handleLogin} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={16} />}
          {loading ? 'Signing in…' : 'Sign in to Admin Panel'}
        </button>

        <div style={s.badge}>
          <Shield size={11} />
          Restricted access · Zetu internal only
        </div>
      </div>
    </div>
  )
}
