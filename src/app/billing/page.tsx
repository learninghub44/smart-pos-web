'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Check, Star, AlertCircle, TrendingUp, Shield, ChevronRight, Zap } from 'lucide-react'

const PLANS = [
  { id: 'starter',    name: 'Starter',    monthly: 250,   color: 'var(--blue)',     colorLt: 'var(--blue-lt)',   features: ['1 Branch', '3 Users', '500 Products', 'Basic Reports'] },
  { id: 'business',   name: 'Business',   monthly: 999,   color: 'var(--purple)',   colorLt: 'var(--purple-lt)', popular: true, features: ['5 Branches', '15 Users', '5,000 Products', 'Advanced Analytics', 'Barcode Scanning'] },
  { id: 'enterprise', name: 'Enterprise', monthly: 2000,  color: 'var(--xl-green)', colorLt: 'var(--xl-green-lt)', features: ['Unlimited Branches', 'Unlimited Users', 'Unlimited Products', 'API Access', 'White-label'] },
  { id: 'lifetime',   name: 'Lifetime',   monthly: null, lifetime: 16000, color: 'var(--orange)', colorLt: 'var(--orange-lt)', features: ['Business features', 'One-time payment', 'Lifetime updates', 'No monthly fees'] },
]

interface TenantInfo {
  plan_id: string
  status: string
  business_name: string
}

interface SubscriptionInfo {
  current_period_end: string | null
  status: string
}

function BillingPageInner() {
  const router       = useRouter()
  const params       = useSearchParams()
  const isOnboarding = params.get('onboarding') === '1'
  const [tenant, setTenant]             = useState<TenantInfo | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [billing, setBilling]           = useState<'monthly' | 'lifetime'>('monthly')
  const [loading, setLoading]           = useState<string | null>(null)
  const [invoices, setInvoices]         = useState<any[]>([])
  const [pageLoading, setPageLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/tenant/plan').then(r => {
      if (r.status === 401) { router.push('/login'); return null }
      return r.json()
    }).then(d => {
      if (d?.tenant) {
        setTenant(d.tenant)
        setSubscription(d.subscription || null)
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

  const currentPlan = PLANS.find(p => p.id === tenant?.plan_id)

  const statusLabel = () => {
    if (!tenant) return ''
    if (tenant.status === 'pending_payment') return 'Payment Required'
    if (tenant.status === 'active') return 'Active'
    if (tenant.status === 'suspended') return 'Suspended'
    if (tenant.status === 'cancelled') return 'Cancelled'
    return tenant.status
  }

  const statusColor = () => {
    if (!tenant) return 'var(--txt-3)'
    if (tenant.status === 'active') return 'var(--green)'
    return 'var(--red)'
  }

  if (pageLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <span style={{ color: 'var(--txt-3)', fontSize: 13 }}>Loading billing info…</span>
    </div>
  )

  return (
    <div style={{ padding: '20px 24px', maxWidth: 960, margin: '0 auto' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <CreditCard size={18} color="var(--xl-green)" />
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Billing &amp; Subscription</h1>
          {tenant?.business_name && <p style={{ fontSize: 11, color: 'var(--txt-3)', margin: 0 }}>{tenant.business_name}</p>}
        </div>
      </div>

      {/* ── Onboarding banner ── */}
      {isOnboarding && (
        <div style={{ background: 'var(--xl-green-lt)', border: '1px solid var(--xl-green)', borderRadius: 2, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Zap size={16} color="var(--xl-green)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--xl-green)', marginBottom: 2 }}>
              Welcome! Complete payment to activate your account
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.5 }}>
              Choose a plan below and pay via M-Pesa or card. Your account unlocks immediately after payment.
            </div>
          </div>
        </div>
      )}

      {/* ── Status cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Current Plan</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt-1)', marginBottom: 2 }}>{currentPlan?.name || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>
            {currentPlan?.monthly ? `KES ${currentPlan.monthly.toLocaleString()}/mo` : 'Lifetime'}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Status</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: statusColor(), marginBottom: 2 }}>{statusLabel()}</div>
          <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>
            {tenant?.status === 'pending_payment' ? 'Pay below to activate' :
             subscription?.current_period_end ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}` :
             'Subscribe to continue'}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total Paid</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt-1)', marginBottom: 2 }}>
            KES {invoices.filter(i => i.status === 'paid').reduce((a: number, i: any) => a + Number(i.amount), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{invoices.filter(i => i.status === 'paid').length} payment{invoices.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* ── Alert banners ── */}
      {tenant?.status === 'pending_payment' && (
        <div style={{ background: 'var(--yellow-lt)', border: '1px solid var(--yellow)', borderRadius: 2, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={15} color="var(--yellow)" />
          <div>
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--yellow)' }}>Payment required — </span>
            <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>Your account is not yet active. Choose a plan and complete payment below to get started.</span>
          </div>
        </div>
      )}
      {(tenant?.status === 'suspended' || tenant?.status === 'cancelled') && (
        <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red)', borderRadius: 2, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={15} color="var(--red)" />
          <div>
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--red)' }}>Subscription expired — </span>
            <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>Resubscribe below to restore full access. Your data is safe.</span>
          </div>
        </div>
      )}

      {/* ── Plan selector ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 20 }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Choose a Plan</span>
          <div style={{ display: 'flex', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {(['monthly', 'lifetime'] as const).map(t => (
              <button key={t} onClick={() => setBilling(t)} style={{
                padding: '4px 12px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: billing === t ? 'var(--xl-green)' : 'var(--surface)',
                color: billing === t ? 'white' : 'var(--txt-2)',
                borderRight: t === 'monthly' ? '1px solid var(--border)' : 'none',
              }}>
                {t === 'monthly' ? 'Monthly' : 'Lifetime'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: 14 }}>
          {PLANS.filter(p => billing === 'lifetime' ? p.id === 'lifetime' : p.id !== 'lifetime').map(plan => {
            const isCurrent = tenant?.plan_id === plan.id && tenant?.status === 'active'
            return (
              <div key={plan.id} style={{
                border: `2px solid ${isCurrent ? plan.color : 'var(--border)'}`,
                padding: 16, position: 'relative',
                background: isCurrent ? plan.colorLt : 'var(--surface)',
              }}>
                {(plan as any).popular && (
                  <div style={{ position: 'absolute', top: -1, right: 10, background: 'var(--purple)', color: 'white', padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
                    POPULAR
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{plan.name}</div>
                <div style={{ marginBottom: 12 }}>
                  {plan.monthly ? (
                    <><span style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt-1)' }}>KES {plan.monthly.toLocaleString()}</span><span style={{ fontSize: 11, color: 'var(--txt-3)' }}>/mo</span></>
                  ) : (
                    <><span style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt-1)' }}>KES {(plan as any).lifetime?.toLocaleString()}</span><span style={{ fontSize: 11, color: 'var(--txt-3)' }}> once</span></>
                  )}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--txt-2)' }}>
                      <Check size={11} color={plan.color} strokeWidth={3} />{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div style={{ textAlign: 'center', padding: '5px', background: plan.colorLt, border: `1px solid ${plan.color}`, fontSize: 11, fontWeight: 700, color: plan.color }}>
                    ✓ Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id, billing === 'lifetime' ? 'lifetime' : 'monthly')}
                    disabled={!!loading}
                    style={{
                      width: '100%', padding: '6px 0', border: `1px solid ${plan.color}`,
                      background: loading === plan.id ? 'var(--surface-2)' : plan.colorLt,
                      color: plan.color, cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}
                  >
                    {loading === plan.id ? 'Redirecting…' : (
                      <>{plan.id === 'lifetime' ? 'Buy Lifetime' : 'Pay with M-Pesa'} <ChevronRight size={12} /></>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Payment history ── */}
      {invoices.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={13} color="var(--txt-2)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Payment History</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Amount', 'Reference', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 14px', fontWeight: 600, color: 'var(--txt-2)', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '7px 14px', color: 'var(--txt-2)' }}>{new Date(inv.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={{ padding: '7px 14px', fontWeight: 600 }}>KES {Number(inv.amount).toLocaleString()}</td>
                  <td style={{ padding: '7px 14px', color: 'var(--txt-3)', fontFamily: 'monospace', fontSize: 11 }}>{inv.paystack_ref}</td>
                  <td style={{ padding: '7px 14px' }}>
                    <span style={{ padding: '2px 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: inv.status === 'paid' ? 'var(--green-lt)' : 'var(--yellow-lt)', color: inv.status === 'paid' ? 'var(--green)' : 'var(--yellow)' }}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={13} color="var(--txt-3)" />
          <span style={{ fontSize: 11, color: 'var(--txt-2)' }}>Secured by Paystack · M-Pesa accepted · Cancel anytime</span>
        </div>
        <button onClick={() => router.push('/support')} style={{ background: 'none', border: '1px solid var(--border)', padding: '4px 12px', fontSize: 11, fontWeight: 600, color: 'var(--txt-2)', cursor: 'pointer' }}>
          Contact Support
        </button>
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
