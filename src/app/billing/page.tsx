'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Check, AlertCircle, TrendingUp, Shield, ChevronRight, Zap } from 'lucide-react'

const PLANS = [
  { id: 'starter',    name: 'Starter',    monthly: 250,  color: 'var(--blue)',     colorLt: 'var(--blue-lt)',    features: ['1 Branch', '3 Users', '500 Products', 'Basic Reports'] },
  { id: 'business',   name: 'Business',   monthly: 999,  color: 'var(--purple)',   colorLt: 'var(--purple-lt)',  popular: true, features: ['5 Branches', '15 Users', '5,000 Products', 'Advanced Analytics', 'Barcode Scanning'] },
  { id: 'enterprise', name: 'Enterprise', monthly: 2000, color: 'var(--xl-green)', colorLt: 'var(--xl-green-lt)', features: ['Unlimited Branches', 'Unlimited Users', 'Unlimited Products', 'API Access', 'White-label'] },
  { id: 'lifetime',   name: 'Lifetime',   monthly: null, lifetime: 16000, color: 'var(--orange)', colorLt: 'var(--orange-lt)', features: ['Business features', 'One-time payment', 'Lifetime updates', 'No monthly fees'] },
]

interface TenantInfo { plan_id: string; status: string; business_name: string }
interface SubscriptionInfo { current_period_end: string | null; status: string }

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
      if (d?.tenant) { setTenant(d.tenant); setSubscription(d.subscription || null) }
      setPageLoading(false)
    }).catch(() => setPageLoading(false))
    fetch('/api/billing/invoices').then(r => r.json()).then(d => d.invoices && setInvoices(d.invoices)).catch(() => {})
  }, [])

  const handleSubscribe = async (planId: string, billingType: 'monthly' | 'lifetime') => {
    setLoading(planId)
    try {
      const res  = await fetch('/api/billing/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId, billingType }) })
      const data = await res.json()
      if (data.authorizationUrl) window.location.href = data.authorizationUrl
      else alert(data.error || 'Payment initialization failed')
    } catch { alert('Network error. Please try again.') }
    finally { setLoading(null) }
  }

  const currentPlan  = PLANS.find(p => p.id === tenant?.plan_id)
  const statusLabel  = () => {
    if (!tenant) return ''
    if (tenant.status === 'pending_payment') return 'Payment Required'
    if (tenant.status === 'active') return 'Active'
    if (tenant.status === 'suspended') return 'Suspended'
    if (tenant.status === 'cancelled') return 'Cancelled'
    return tenant.status
  }
  const statusColor  = () => tenant?.status === 'active' ? 'var(--green)' : 'var(--red)'
  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((a: number, i: any) => a + Number(i.amount), 0)

  if (pageLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <span style={{ color: 'var(--txt-3)', fontSize: 13 }}>Loading billing info…</span>
    </div>
  )

  return (
    <div style={{ padding: '16px 20px' }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <CreditCard size={15} color="var(--xl-green)" />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt-1)' }}>Billing &amp; Subscription</span>
        {tenant?.business_name && <span style={{ fontSize: 13, color: 'var(--txt-3)', marginLeft: 4 }}>— {tenant.business_name}</span>}
      </div>

      {/* ── Onboarding banner ── */}
      {isOnboarding && (
        <div style={{ background: 'var(--xl-green-lt)', border: '1px solid var(--xl-green)', padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={15} color="var(--xl-green)" style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--xl-green)' }}>Welcome! </span>
            <span style={{ fontSize: 13, color: 'var(--txt-2)' }}>Choose a plan and complete payment to activate your account. Access is granted immediately after payment.</span>
          </div>
        </div>
      )}

      {/* ── Status banners ── */}
      {tenant?.status === 'pending_payment' && (
        <div style={{ background: 'var(--yellow-lt)', border: '1px solid var(--yellow)', padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={15} color="var(--yellow)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--txt-2)' }}><strong style={{ color: 'var(--yellow)' }}>Payment required —</strong> Your account is not yet active. Choose a plan below to get started.</span>
        </div>
      )}
      {(tenant?.status === 'suspended' || tenant?.status === 'cancelled') && (
        <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red)', padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={15} color="var(--red)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--txt-2)' }}><strong style={{ color: 'var(--red)' }}>Subscription expired —</strong> Resubscribe below to restore access. Your data is safe.</span>
        </div>
      )}

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12, alignItems: 'start' }}>

        {/* ══ LEFT: status summary ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Account status card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '6px 12px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Account Status</span>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Current Plan', value: currentPlan?.name || '—', sub: currentPlan?.monthly ? `KES ${currentPlan.monthly.toLocaleString()}/mo` : currentPlan?.id === 'lifetime' ? 'Lifetime' : '—', valueColor: 'var(--txt-1)' },
                { label: 'Status', value: statusLabel(), sub: tenant?.status === 'pending_payment' ? 'Pay below to activate' : subscription?.current_period_end ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Subscribe to continue', valueColor: statusColor() },
                { label: 'Total Paid', value: `KES ${totalPaid.toLocaleString()}`, sub: `${invoices.filter(i => i.status === 'paid').length} payment(s)`, valueColor: 'var(--txt-1)' },
              ].map(({ label, value, sub, valueColor }, i, arr) => (
                <div key={label} style={{ padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: valueColor, marginBottom: 2 }}>{value}</div>
                  <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Security footer */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Shield size={13} color="var(--txt-3)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: 'var(--txt-3)', lineHeight: 1.5 }}>
                Secured by Paystack · M-Pesa accepted · Cancel anytime
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT: plans + history ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Plan selector */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Choose a Plan</span>
              <div style={{ display: 'flex', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {(['monthly', 'lifetime'] as const).map(t => (
                  <button key={t} onClick={() => setBilling(t)} style={{ padding: '4px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: billing === t ? 'var(--xl-green)' : 'var(--surface)', color: billing === t ? 'white' : 'var(--txt-2)', borderRight: t === 'monthly' ? '1px solid var(--border)' : 'none', fontFamily: 'inherit' }}>
                    {t === 'monthly' ? 'Monthly' : 'Lifetime'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: 14 }}>
              {PLANS.filter(p => billing === 'lifetime' ? p.id === 'lifetime' : p.id !== 'lifetime').map(plan => {
                const isCurrent = tenant?.plan_id === plan.id && tenant?.status === 'active'
                return (
                  <div key={plan.id} style={{ border: `2px solid ${isCurrent ? plan.color : 'var(--border)'}`, padding: '14px 14px 12px', position: 'relative', background: isCurrent ? plan.colorLt : 'var(--surface)' }}>
                    {(plan as any).popular && (
                      <div style={{ position: 'absolute', top: -1, right: 8, background: 'var(--purple)', color: 'white', padding: '1px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>POPULAR</div>
                    )}
                    <div style={{ fontSize: 11, fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{plan.name}</div>
                    <div style={{ marginBottom: 10 }}>
                      {plan.monthly
                        ? <><span style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt-1)' }}>KES {plan.monthly.toLocaleString()}</span><span style={{ fontSize: 12, color: 'var(--txt-3)' }}>/mo</span></>
                        : <><span style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt-1)' }}>KES {(plan as any).lifetime?.toLocaleString()}</span><span style={{ fontSize: 12, color: 'var(--txt-3)' }}> once</span></>
                      }
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {plan.features.map(f => (
                        <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--txt-2)' }}>
                          <Check size={11} color={plan.color} strokeWidth={3} />{f}
                        </li>
                      ))}
                    </ul>
                    {isCurrent
                      ? <div style={{ textAlign: 'center', padding: '5px', background: plan.colorLt, border: `1px solid ${plan.color}`, fontSize: 12, fontWeight: 700, color: plan.color }}>✓ Current Plan</div>
                      : <button onClick={() => handleSubscribe(plan.id, billing === 'lifetime' ? 'lifetime' : 'monthly')} disabled={!!loading} style={{ width: '100%', padding: '7px 0', border: `1px solid ${plan.color}`, background: loading === plan.id ? 'var(--surface-2)' : plan.colorLt, color: plan.color, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'inherit' }}>
                          {loading === plan.id ? 'Redirecting…' : <>{plan.id === 'lifetime' ? 'Buy Lifetime' : 'Pay with M-Pesa'} <ChevronRight size={12} /></>}
                        </button>
                    }
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment history */}
          {invoices.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={13} color="var(--txt-2)" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-1)' }}>Payment History</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                    {['Date', 'Amount', 'Reference', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 14px', fontWeight: 600, color: 'var(--txt-2)', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 14px', fontSize: 13, color: 'var(--txt-2)' }}>{new Date(inv.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: 'var(--txt-1)' }}>KES {Number(inv.amount).toLocaleString()}</td>
                      <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--txt-3)', fontFamily: 'monospace' }}>{inv.paystack_ref}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{ padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: inv.status === 'paid' ? 'var(--green-lt)' : 'var(--yellow-lt)', color: inv.status === 'paid' ? 'var(--green)' : 'var(--yellow)' }}>
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
    </div>
  )
}

export default function BillingPage() {
  return <Suspense><BillingPageInner /></Suspense>
}
