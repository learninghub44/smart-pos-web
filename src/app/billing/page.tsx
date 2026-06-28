'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Check, Zap, Star, ArrowLeft } from 'lucide-react'

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

export default function BillingPage() {
  const router = useRouter()
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('business')
  const [billing, setBilling] = useState<'monthly' | 'lifetime'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/tenant/plan').then(r => r.json()).then(d => {
      if (d.plan_id) { setTenant(d); setSelectedPlan(d.plan_id) }
      else router.push('/login')
    })
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

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(59,130,246,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={20} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Billing & Subscription</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{tenant?.business_name}</p>
          </div>
        </div>

        {/* Trial banner */}
        {tenant?.status === 'trial' && (
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={20} color="#3b82f6" />
            <div>
              <div style={{ fontWeight: 600, color: '#93c5fd' }}>Free Trial Active</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{trialDaysLeft} days remaining. Subscribe to keep your data and access.</div>
            </div>
          </div>
        )}

        {tenant?.status === 'active' && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Check size={20} color="#10b981" />
            <div>
              <div style={{ fontWeight: 600, color: '#6ee7b7' }}>Active Subscription</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Plan: {PLANS.find(p => p.id === tenant.plan_id)?.name} · You can upgrade anytime below.</div>
            </div>
          </div>
        )}

        {/* Billing toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: '1.5rem' }}>
          {(['monthly', 'lifetime'] as const).map(t => (
            <button key={t} onClick={() => setBilling(t)} style={{ padding: '0.45rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: billing === t ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent', color: billing === t ? 'white' : '#94a3b8' }}>
              {t === 'monthly' ? 'Monthly' : 'Lifetime (One-time)'}
            </button>
          ))}
        </div>

        {/* Plans grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {PLANS.filter(p => billing === 'lifetime' ? p.id === 'lifetime' : p.id !== 'lifetime').map(plan => {
            const isCurrent = tenant?.plan_id === plan.id
            return (
              <div key={plan.id} style={{ padding: '1.5rem', background: isCurrent ? `${plan.color}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${isCurrent ? plan.color : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, position: 'relative' }}>
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
                  <div style={{ textAlign: 'center', padding: '0.625rem', background: `${plan.color}20`, borderRadius: 8, color: plan.color, fontSize: '0.8rem', fontWeight: 600 }}>Current Plan</div>
                ) : (
                  <button onClick={() => handleSubscribe(plan.id, billing === 'lifetime' ? 'lifetime' : 'monthly')} disabled={!!loading} style={{ width: '100%', padding: '0.625rem', background: loading === plan.id ? 'rgba(59,130,246,0.3)' : `${plan.color}20`, border: `1px solid ${plan.color}60`, color: plan.color, borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                    {loading === plan.id ? 'Redirecting…' : plan.id === 'lifetime' ? 'Buy Lifetime' : 'Subscribe → Pay with M-Pesa'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Invoice history */}
        {invoices.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Payment History</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Date', 'Amount', 'Reference', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#64748b', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#94a3b8' }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>KES {Number(inv.amount).toLocaleString()}</td>
                    <td style={{ padding: '0.625rem 0.75rem', color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem' }}>{inv.paystack_ref}</td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
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
