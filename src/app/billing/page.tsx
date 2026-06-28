'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Check, Zap, Star, ArrowLeft, AlertCircle, Clock, TrendingUp, Shield } from 'lucide-react'

const PLANS = [
  { id: 'starter', name: 'Starter', monthly: 250, color: '#3b82f6', features: ['1 Branch', '3 Users', '500 Products', 'Basic Reports'] },
  { id: 'business', name: 'Business', monthly: 999, color: '#8b5cf6', popular: true, features: ['5 Branches', '15 Users', '5,000 Products', 'Advanced Analytics', 'Barcode Scanning'] },
  { id: 'enterprise', name: 'Enterprise', monthly: 2000, color: '#f59e0b', features: ['Unlimited Branches', 'Unlimited Users', 'Unlimited Products', 'API Access', 'White-label'] },
  { id: 'lifetime', name: 'Lifetime', monthly: null, lifetime: 16000, color: '#10b981', features: ['Business features', 'One-time payment', 'Lifetime updates', 'No monthly fees'] },
]

interface TenantInfo {
  plan_id: string
  status: string
  trial_ends_at: string | null
  business_name: string
}

interface SubscriptionInfo {
  current_period_end: string | null
  status: string
}

function BillingPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const isOnboarding = params.get('onboarding') === '1'
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('business')
  const [billing, setBilling] = useState<'monthly' | 'lifetime'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tenant/plan').then(r => {
      if (r.status === 401) { router.push('/login'); return null }
      return r.json()
    }).then(d => {
      if (d?.tenant?.plan_id) {
        setTenant(d.tenant)
        setSubscription(d.subscription || null)
        setSelectedPlan(d.tenant.plan_id)
      }
      setPageLoading(false)
    }).catch(() => setPageLoading(false))
    fetch('/api/billing/invoices').then(r => r.json()).then(d => d.invoices && setInvoices(d.invoices)).catch(() => {})
  }, [])

  const handleSubscribe = async (planId: string, billingType: 'monthly' | 'lifetime') => {
    setLoading(planId)
    try {
      const res = await fetch('/api/billing/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingType }),
      })
      const data = await res.json()
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        alert(data.error || 'Payment initialization failed')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const trialDaysLeft = tenant?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0

  const currentPlan = PLANS.find(p => p.id === tenant?.plan_id)

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', padding: '2rem', overflowY: 'auto' },
    wrap: { maxWidth: 960, margin: '0 auto' },
    back: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0 },
    header: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' },
    headerIcon: { width: 44, height: 44, background: 'rgba(59,130,246,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    h1: { fontSize: '1.5rem', fontWeight: 700, margin: 0 },
    sub: { color: '#64748b', fontSize: '0.85rem', margin: 0 },

    // Status cards row
    statusRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' },
    statCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem' },
    statLabel: { fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '0.4rem' },
    statValue: { fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.2rem' },
    statSub: { fontSize: '0.75rem', color: '#64748b' },

    // Banners
    trialBanner: { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
    activeBanner: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
    expiredBanner: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },

    // Toggle
    toggle: { display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: '1.5rem' },
    sectionTitle: { fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#e2e8f0' },

    // Plans
    plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' },

    // Invoices
    invoiceCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85rem' },
    th: { textAlign: 'left' as const, padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 500 },
    td: { padding: '0.625rem 0.75rem' },
  }

  if (pageLoading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748b' }}>Loading billing info…</div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <button onClick={() => router.push('/dashboard')} style={s.back}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* ── Onboarding welcome banner ── */}
        {isOnboarding && (
          <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: 42, height: 42, background: 'rgba(59,130,246,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={20} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', marginBottom: '0.3rem' }}>
                Welcome! One last step to activate your account 🎉
              </div>
              <div style={{ fontSize: '0.87rem', color: '#94a3b8', lineHeight: 1.55 }}>
                Choose a plan and complete your first payment to unlock your <strong style={{ color: '#f1f5f9' }}>14-day free trial</strong>.
                You won&apos;t be charged again until the trial ends — and you can cancel anytime.
              </div>
            </div>
          </div>
        )}

        <div style={s.header}>
          <div style={s.headerIcon}><CreditCard size={22} color="#3b82f6" /></div>
          <div>
            <h1 style={s.h1}>Billing & Subscription</h1>
            <p style={s.sub}>{tenant?.business_name}</p>
          </div>
        </div>

        {/* Subscription status cards */}
        <div style={s.statusRow}>
          <div style={s.statCard}>
            <div style={s.statLabel}>Current Plan</div>
            <div style={{ ...s.statValue, color: currentPlan?.color || '#f1f5f9' }}>{currentPlan?.name || 'None'}</div>
            <div style={s.statSub}>
              {tenant?.status === 'trial' ? 'Free trial' : tenant?.status === 'active' ? 'Active subscription' : tenant?.status || 'Unknown'}
            </div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>Billing Status</div>
            <div style={{ ...s.statValue, color: tenant?.status === 'active' ? '#10b981' : tenant?.status === 'trial' ? '#3b82f6' : '#ef4444' }}>
              {tenant?.status === 'active' ? '✓ Active' : tenant?.status === 'trial' ? '⏳ Trial' : '✗ Expired'}
            </div>
            <div style={s.statSub}>
              {tenant?.status === 'trial' ? `${trialDaysLeft} days remaining` :
               subscription?.current_period_end ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })}` :
               'Subscribe to continue access'}
            </div>
          </div>
          <div style={s.statCard}>
            <div style={s.statLabel}>Total Payments</div>
            <div style={s.statValue}>KES {invoices.filter(i => i.status === 'paid').reduce((a:number, i:any) => a + Number(i.amount), 0).toLocaleString()}</div>
            <div style={s.statSub}>{invoices.filter(i => i.status === 'paid').length} successful payment{invoices.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Status banner */}
        {tenant?.status === 'trial' && (
          <div style={s.trialBanner}>
            <Zap size={20} color="#3b82f6" />
            <div>
              <div style={{ fontWeight: 600, color: '#93c5fd' }}>Free Trial Active — {trialDaysLeft} days left</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Subscribe below to keep your data when the trial ends. M-Pesa accepted.</div>
            </div>
          </div>
        )}
        {tenant?.status === 'active' && (
          <div style={s.activeBanner}>
            <Check size={20} color="#10b981" />
            <div>
              <div style={{ fontWeight: 600, color: '#6ee7b7' }}>Subscription Active</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>You're on the <strong style={{ color: '#e2e8f0' }}>{currentPlan?.name}</strong> plan. Upgrade anytime below.</div>
            </div>
          </div>
        )}
        {tenant?.status === 'expired' && (
          <div style={s.expiredBanner}>
            <AlertCircle size={20} color="#ef4444" />
            <div>
              <div style={{ fontWeight: 600, color: '#fca5a5' }}>Subscription Expired</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Resubscribe below to restore full access. Your data is safe.</div>
            </div>
          </div>
        )}

        {/* Billing toggle */}
        <p style={s.sectionTitle}>Choose a Plan</p>
        <div style={s.toggle}>
          {(['monthly', 'lifetime'] as const).map(t => (
            <button key={t} onClick={() => setBilling(t)} style={{ padding: '0.45rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: billing === t ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent', color: billing === t ? 'white' : '#94a3b8' }}>
              {t === 'monthly' ? 'Monthly' : 'Lifetime (One-time)'}
            </button>
          ))}
        </div>

        {/* Plans */}
        <div style={s.plansGrid}>
          {PLANS.filter(p => billing === 'lifetime' ? p.id === 'lifetime' : p.id !== 'lifetime').map(plan => {
            const isCurrent = tenant?.plan_id === plan.id
            return (
              <div key={plan.id} style={{ padding: '1.5rem', background: isCurrent ? `${plan.color}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${isCurrent ? plan.color : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, position: 'relative' }}>
                {(plan as any).popular && (
                  <div style={{ position: 'absolute', top: -10, right: 12, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', padding: '0.2rem 0.625rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>
                    <Star size={9} fill="white" style={{ display: 'inline', marginRight: 3 }} />Popular
                  </div>
                )}
                <div style={{ color: plan.color, fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>{plan.name}</div>
                <div style={{ marginBottom: '1rem' }}>
                  {plan.monthly ? (
                    <><span style={{ fontSize: '1.75rem', fontWeight: 800 }}>KES {plan.monthly.toLocaleString()}</span><span style={{ color: '#64748b', fontSize: '0.8rem' }}>/mo</span></>
                  ) : (
                    <><span style={{ fontSize: '1.75rem', fontWeight: 800 }}>KES {(plan as any).lifetime?.toLocaleString()}</span><span style={{ color: '#64748b', fontSize: '0.8rem' }}> once</span></>
                  )}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94a3b8' }}>
                      <Check size={13} color={plan.color} strokeWidth={2.5} />{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div style={{ textAlign: 'center', padding: '0.625rem', background: `${plan.color}20`, borderRadius: 8, color: plan.color, fontSize: '0.8rem', fontWeight: 600 }}>✓ Current Plan</div>
                ) : (
                  <button onClick={() => handleSubscribe(plan.id, billing === 'lifetime' ? 'lifetime' : 'monthly')} disabled={!!loading} style={{ width: '100%', padding: '0.625rem', background: loading === plan.id ? 'rgba(59,130,246,0.3)' : `${plan.color}20`, border: `1px solid ${plan.color}60`, color: plan.color, borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                    {loading === plan.id ? 'Redirecting…' : plan.id === 'lifetime' ? 'Buy Lifetime' : 'Subscribe → Pay with M-Pesa'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Need help banner */}
        <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={18} color="#10b981" />
            <div>
              <div style={{ fontWeight: 600, color: '#6ee7b7', fontSize: '0.9rem' }}>Questions about billing?</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Our support team is ready to help with payments, upgrades, or refunds.</div>
            </div>
          </div>
          <button onClick={() => router.push('/support')} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#10b981', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' as const }}>
            Contact Support →
          </button>
        </div>

        {/* Invoice history */}
        {invoices.length > 0 && (
          <div style={s.invoiceCard}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#3b82f6" /> Payment History
            </h2>
            <table style={s.table}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Date', 'Amount', 'Reference', 'Status'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ ...s.td, color: '#94a3b8' }}>{new Date(inv.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={s.td}>KES {Number(inv.amount).toLocaleString()}</td>
                    <td style={{ ...s.td, color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem' }}>{inv.paystack_ref}</td>
                    <td style={s.td}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, background: inv.status === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: inv.status === 'paid' ? '#10b981' : '#f59e0b' }}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingPageInner />
    </Suspense>
  )
}
