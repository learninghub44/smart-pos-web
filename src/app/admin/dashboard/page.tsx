'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield, Users, TrendingUp, AlertCircle, Clock,
  CheckCircle, XCircle, LogOut, Building2, CreditCard,
  BarChart3, ArrowUpRight, RefreshCw
} from 'lucide-react'

interface Stats {
  overview: {
    total_tenants: number
    active_tenants: number
    trial_tenants: number
    suspended_tenants: number
    cancelled_tenants: number
  }
  mrr: number
  planBreakdown: { plan_id: string; name: string; count: number }[]
  recentTenants: any[]
  revenueByMonth: { month: string; revenue: number; payments: number }[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.status === 401) { router.push('/admin'); return }
      const data = await res.json()
      setStats(data)
    } catch {
      setError('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  const badge = (color: string): React.CSSProperties => ({ padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, background: `${color}20`, color })

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#0a0f1e', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' },
    topbar: { background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 10 },
    topLeft: { display: 'flex', alignItems: 'center', gap: '0.625rem' },
    brand: { fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9' },
    brandSub: { fontSize: '0.72rem', color: '#64748b', marginLeft: 4 },
    navLinks: { display: 'flex', gap: '0.25rem' },
    navBtn: { padding: '0.4rem 0.875rem', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 },
    logoutBtn: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 },
    body: { padding: '2rem 1.5rem', maxWidth: 1200, margin: '0 auto' },
    pageTitle: { fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem' },
    pageSub: { color: '#64748b', fontSize: '0.85rem', marginBottom: '2rem' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
    kpiCard: { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem' },
    kpiLabel: { fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '0.5rem' },
    kpiValue: { fontSize: '2rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.25rem' },
    kpiSub: { fontSize: '0.75rem', color: '#64748b' },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' },
    card: { background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.25rem' },
    cardTitle: { fontSize: '0.88rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 7, color: '#e2e8f0' },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  }

  const statusColor: Record<string, string> = {
    active: '#10b981', trial: '#3b82f6', suspended: '#ef4444', cancelled: '#64748b'
  }

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
        <div>Loading dashboard…</div>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.topLeft}>
          <Shield size={18} color="#8b5cf6" />
          <span style={s.brand}>Super Admin</span>
          <span style={s.brandSub}>Zetu Business Solutions</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            style={{ ...s.navBtn, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={() => router.push('/admin/tenants')}
          >
            <Building2 size={13} style={{ display: 'inline', marginRight: 5 }} />Tenants
          </button>
          <button style={s.logoutBtn} onClick={handleLogout}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.pageTitle}>Dashboard</div>
        <div style={s.pageSub}>Platform overview · {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.875rem 1rem', marginBottom: '1.5rem', color: '#fca5a5', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* KPI row */}
        <div style={s.kpiGrid}>
          {[
            { label: 'Total Tenants', value: stats?.overview.total_tenants ?? '—', icon: Building2, color: '#8b5cf6', sub: 'All registered businesses' },
            { label: 'Active', value: stats?.overview.active_tenants ?? '—', icon: CheckCircle, color: '#10b981', sub: 'Paying subscribers' },
            { label: 'On Trial', value: stats?.overview.trial_tenants ?? '—', icon: Clock, color: '#3b82f6', sub: 'Free trial users' },
            { label: 'Suspended', value: stats?.overview.suspended_tenants ?? '—', icon: XCircle, color: '#ef4444', sub: 'Access restricted' },
            { label: 'MRR', value: `KES ${(stats?.mrr || 0).toLocaleString()}`, icon: TrendingUp, color: '#f59e0b', sub: 'Monthly recurring revenue' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} style={s.kpiCard}>
              <div style={{ ...s.kpiLabel, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon size={12} color={color} /> {label}
              </div>
              <div style={{ ...s.kpiValue, color }}>{value}</div>
              <div style={s.kpiSub}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={s.grid2}>
          {/* Plan breakdown */}
          <div style={s.card}>
            <div style={s.cardTitle}><BarChart3 size={15} color="#8b5cf6" /> Tenants by Plan</div>
            {stats?.planBreakdown.length === 0 && <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No data yet</div>}
            {stats?.planBreakdown.map(p => (
              <div key={p.plan_id} style={s.row}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: Math.min(p.count * 12, 80), height: 6, background: '#8b5cf620', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: '#8b5cf6', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8b5cf6', minWidth: 20 }}>{p.count}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue by month */}
          <div style={s.card}>
            <div style={s.cardTitle}><TrendingUp size={15} color="#10b981" /> Revenue (Last 6 Months)</div>
            {stats?.revenueByMonth.slice(0, 6).map(m => (
              <div key={m.month} style={s.row}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  {new Date(m.month).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.payments} payments</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>KES {Number(m.revenue).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {(!stats?.revenueByMonth || stats.revenueByMonth.length === 0) && (
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No payments recorded yet</div>
            )}
          </div>
        </div>

        {/* Recent tenants */}
        <div style={s.card}>
          <div style={{ ...s.cardTitle, justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Users size={15} color="#3b82f6" /> Recent Tenants</span>
            <button onClick={() => router.push('/admin/tenants')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowUpRight size={12} />
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Business', 'Email', 'Plan', 'Status', 'Joined'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats?.recentTenants.slice(0, 10).map((t: any) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }} onClick={() => router.push('/admin/tenants')}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{t.business_name}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#64748b' }}>{t.email}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{t.plan_name}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={badge(statusColor[t.status] || '#64748b')}>{t.status}</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#64748b' }}>
                      {new Date(t.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
