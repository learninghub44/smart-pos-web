'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield, Search, Building2, Users, GitBranch,
  LogOut, ChevronLeft, RefreshCw, X, Check,
  AlertTriangle, CheckCircle, XCircle, Clock, ArrowLeft
} from 'lucide-react'

const PLANS = [
  { id: 'starter', name: 'Starter' },
  { id: 'business', name: 'Business' },
  { id: 'enterprise', name: 'Enterprise' },
]

const STATUS_OPTIONS = ['', 'active', 'trial', 'suspended', 'cancelled']

const statusColor: Record<string, string> = {
  active: '#10b981', trial: '#3b82f6', suspended: '#ef4444', cancelled: '#64748b'
}
const statusIcon: Record<string, any> = {
  active: CheckCircle, trial: Clock, suspended: XCircle, cancelled: XCircle
}

interface Tenant {
  id: string
  business_name: string
  email: string
  plan_id: string
  plan_name: string
  status: string
  trial_ends_at: string | null
  created_at: string
  user_count: number
  branch_count: number
}

export default function AdminTenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Tenant | null>(null)
  const [saving, setSaving] = useState(false)
  const [editPlan, setEditPlan] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/tenants?${params}`)
      if (res.status === 401) { router.push('/admin'); return }
      const data = await res.json()
      setTenants(data.tenants || [])
    } catch {
      setTenants([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [load])

  const openTenant = (t: Tenant) => {
    setSelected(t)
    setEditPlan(t.plan_id)
    setEditStatus(t.status)
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: selected.id, status: editStatus, planId: editPlan }),
      })
      if (res.ok) {
        showToast('Tenant updated successfully')
        setSelected(null)
        load()
      } else {
        showToast('Update failed. Try again.')
      }
    } catch {
      showToast('Network error.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  const badge = (color: string): React.CSSProperties => ({ padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, background: `${color}20`, color, display: 'inline-flex', alignItems: 'center', gap: 4 })

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#0a0f1e', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' },
    topbar: { background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 10 },
    brand: { fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9' },
    brandSub: { fontSize: '0.72rem', color: '#64748b', marginLeft: 4 },
    body: { padding: '2rem 1.5rem', maxWidth: 1200, margin: '0 auto' },
    pageTitle: { fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem' },
    pageSub: { color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' },
    toolbar: { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' as const, alignItems: 'center' },
    searchWrap: { position: 'relative' as const, flex: 1, minWidth: 200, maxWidth: 340 },
    searchInput: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.55rem 0.875rem 0.55rem 2.25rem', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' as const },
    searchIcon: { position: 'absolute' as const, left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' },
    select: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.55rem 0.875rem', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.83rem' },
    th: { textAlign: 'left' as const, padding: '0.625rem 0.875rem', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0f172a' },
    td: { padding: '0.7rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.04)' },
    logoutBtn: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 8, padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 },
    // Modal
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
    modal: { background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 480 },
    modalTitle: { fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem' },
    modalSub: { fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' },
    modalLabel: { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase' as const },
    modalSelect: { width: '100%', background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.6rem 0.75rem', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' as const },
    saveBtn: { flex: 1, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: 9, padding: '0.7rem', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
    cancelBtn: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '0.7rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' },
    // Toast
    toast: { position: 'fixed' as const, bottom: '1.5rem', right: '1.5rem', background: '#1e293b', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10, padding: '0.75rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, color: '#6ee7b7', zIndex: 100, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  }

  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div style={s.toast}>
          <Check size={15} /> {toast}
        </div>
      )}

      {/* Topbar */}
      <div style={s.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Shield size={18} color="#8b5cf6" />
          <span style={s.brand}>Super Admin</span>
          <span style={s.brandSub}>Zetu Business Solutions</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={() => router.push('/admin/dashboard')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={14} /> Dashboard
          </button>
          <button style={s.logoutBtn} onClick={handleLogout}><LogOut size={13} /> Sign out</button>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.pageTitle}>Tenant Management</div>
        <div style={s.pageSub}>{tenants.length} tenant{tenants.length !== 1 ? 's' : ''} found</div>

        {/* Toolbar */}
        <div style={s.toolbar}>
          <div style={s.searchWrap}>
            <Search size={14} style={s.searchIcon} />
            <input
              style={s.searchInput}
              placeholder="Search business name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select style={s.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button onClick={load} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.55rem 0.875rem', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Table */}
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
              <div>Loading tenants…</div>
            </div>
          ) : tenants.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Building2 size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
              <div>No tenants found</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Business', 'Email', 'Plan', 'Status', 'Users', 'Branches', 'Joined', 'Action'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => {
                    const StatusIcon = statusIcon[t.status] || Clock
                    return (
                      <tr key={t.id} style={{ cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ ...s.td, fontWeight: 700 }}>{t.business_name}</td>
                        <td style={{ ...s.td, color: '#64748b', fontSize: '0.8rem' }}>{t.email}</td>
                        <td style={s.td}>{t.plan_name}</td>
                        <td style={s.td}>
                          <span style={badge(statusColor[t.status] || '#64748b')}>
                            <StatusIcon size={10} />
                            {t.status}
                          </span>
                        </td>
                        <td style={{ ...s.td, color: '#94a3b8' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} />{t.user_count}</span>
                        </td>
                        <td style={{ ...s.td, color: '#94a3b8' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><GitBranch size={12} />{t.branch_count}</span>
                        </td>
                        <td style={{ ...s.td, color: '#64748b', fontSize: '0.8rem' }}>
                          {new Date(t.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={s.td}>
                          <button
                            onClick={() => openTenant(t)}
                            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', borderRadius: 6, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Manage modal */}
      {selected && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={s.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={s.modalTitle}>{selected.business_name}</div>
                <div style={s.modalSub}>{selected.email} · ID: {selected.id.slice(0, 8)}…</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Current info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Users', value: selected.user_count, icon: Users },
                { label: 'Branches', value: selected.branch_count, icon: GitBranch },
                { label: 'Joined', value: new Date(selected.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }), icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                  <Icon size={14} color="#64748b" style={{ marginBottom: 4 }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Edit status */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={s.modalLabel}>Account Status</label>
              <select style={s.modalSelect} value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {['active', 'trial', 'suspended', 'cancelled'].map(st => (
                  <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Edit plan */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={s.modalLabel}>Plan</label>
              <select style={s.modalSelect} value={editPlan} onChange={e => setEditPlan(e.target.value)}>
                {PLANS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Suspend warning */}
            {editStatus === 'suspended' && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.625rem 0.875rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#fca5a5', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                Suspending will block this tenant's access immediately. They will see a suspended notice on login.
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={s.cancelBtn} onClick={() => setSelected(null)}>Cancel</button>
              <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
