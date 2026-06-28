'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FEATURES = [
  { emoji: '🛒', title: 'Fast POS Checkout', desc: 'Barcode scanning, quick search, and M-Pesa payment — serve customers in under 30 seconds.' },
  { emoji: '📦', title: 'Inventory Control', desc: 'Real-time stock levels, low-stock alerts, and supplier management across all branches.' },
  { emoji: '📊', title: 'Sales Analytics', desc: 'Daily, weekly, and monthly reports. Know your best sellers, peak hours, and margins.' },
  { emoji: '🏪', title: 'Multi-Branch', desc: 'Run 5 branches from one login. Each branch has its own staff, stock, and reports.' },
  { emoji: '📶', title: 'Works Offline', desc: 'Keep selling during internet outages. Sales queue up and sync automatically when back online.' },
  { emoji: '🖨️', title: 'Thermal Printing', desc: '58mm and 80mm receipt printing built in. Customers get a receipt every time.' },
]

const PLANS = [
  {
    id: 'starter', name: 'Starter', monthly: 250, color: '#3b82f6',
    features: ['1 Branch', '3 Users', '500 Products', 'M-Pesa Payments', 'Basic Reports', '14-day free trial'],
  },
  {
    id: 'business', name: 'Business', monthly: 999, color: '#8b5cf6', popular: true,
    features: ['5 Branches', '15 Users', '5,000 Products', 'Advanced Analytics', 'Barcode Scanning', 'Priority Support', '14-day free trial'],
  },
  {
    id: 'enterprise', name: 'Enterprise', monthly: 2000, color: '#f59e0b',
    features: ['Unlimited Branches', 'Unlimited Users', 'Unlimited Products', 'API Access', 'Custom Reports', 'Dedicated Support', '14-day free trial'],
  },
]

export default function LandingPage() {
  const [billing, setBilling] = useState<'monthly' | 'lifetime'>('monthly')
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#080f1a', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', height: 60, borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: 'rgba(8,15,26,0.92)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛒</div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>Smart<span style={{ color: '#3b82f6' }}>POS</span></span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => router.push('/login')} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            Sign in
          </button>
          <button onClick={() => router.push('/register')} style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            Free trial →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 2rem 60px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 999, fontSize: 13, color: '#93c5fd', marginBottom: 28, fontWeight: 500 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
          Built for Kenyan shops · M-Pesa integrated
        </div>

        <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 22 }}>
          The POS system your shop{' '}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              actually needs
            </span>
          </span>
        </h1>

        <p style={{ fontSize: 18, color: '#64748b', lineHeight: 1.75, maxWidth: 600, margin: '0 auto 36px' }}>
          Sell faster, track everything, and run multiple branches from one place. Works offline. Prints receipts. Accepts M-Pesa.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/register')} style={{ padding: '14px 28px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 700, boxShadow: '0 0 40px rgba(37,99,235,0.3)' }}>
            Start 14-day free trial
          </button>
          <button onClick={() => router.push('/login')} style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, cursor: 'pointer', fontSize: 16 }}>
            Sign in to your account
          </button>
        </div>
        <p style={{ marginTop: 14, color: '#334155', fontSize: 13 }}>No credit card required · Cancel anytime</p>
      </section>

      {/* Stats bar */}
      <div style={{ maxWidth: 800, margin: '0 auto 60px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[['500+', 'Shops using SmartPOS'], ['99.9%', 'Uptime guarantee'], ['< 1s', 'Sync on reconnect'], ['24/7', 'Support team']].map(([val, label]) => (
          <div key={label} style={{ padding: '20px 16px', textAlign: 'center', background: 'rgba(8,15,26,0.8)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>{val}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section style={{ padding: '0 2rem 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>Everything in one tab</h2>
          <p style={{ color: '#64748b', fontSize: 16 }}>No juggling between apps. POS, inventory, reports — all right here.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ emoji, title, desc }) => (
            <div key={title} style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{emoji}</div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#f1f5f9' }}>{title}</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '60px 2rem 80px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>Pricing in Kenya Shillings</h2>
          <p style={{ color: '#64748b', fontSize: 16 }}>Start free. Pay only when you're ready.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, gap: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['monthly', 'lifetime'] as const).map(t => (
              <button key={t} onClick={() => setBilling(t)} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s', background: billing === t ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : 'transparent', color: billing === t ? 'white' : '#64748b' }}>
                {t === 'monthly' ? 'Monthly' : '🔥 Lifetime Deal'}
              </button>
            ))}
          </div>
        </div>

        {billing === 'monthly' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {PLANS.map(plan => (
              <div key={plan.id} style={{ padding: '28px 24px', background: (plan as any).popular ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${(plan as any).popular ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, position: 'relative' }}>
                {(plan as any).popular && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: 'white', padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Most Popular
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{plan.name}</div>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.03em' }}>KES {plan.monthly.toLocaleString()}</span>
                  <span style={{ color: '#475569', fontSize: 14 }}>/month</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#94a3b8' }}>
                      <span style={{ color: plan.color, fontSize: 16 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push(`/register?plan=${plan.id}&billing=monthly`)}
                  style={{ width: '100%', padding: '11px', background: (plan as any).popular ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'transparent', border: `1px solid ${plan.color}50`, color: (plan as any).popular ? 'white' : plan.color, borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                  Start free trial
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: 420, margin: '0 auto', padding: '36px 32px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Lifetime Access</div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.03em' }}>KES 16,000</span>
            </div>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>Pay once, use forever. All Business plan features included. No monthly fees, ever.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              {['Everything in Business plan', 'Lifetime software updates', 'No recurring charges', 'Priority support forever'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#94a3b8' }}>
                  <span style={{ color: '#10b981' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => router.push('/register?plan=lifetime&billing=lifetime')}
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#059669,#10b981)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: 15 }}>
              Buy Lifetime Access →
            </button>
          </div>
        )}
      </section>

      {/* CTA */}
      <section style={{ margin: '0 2rem 80px', maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ padding: '48px 40px', background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.15))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 20, textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>Ready to upgrade your shop?</h2>
          <p style={{ color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>Join 500+ Kenyan businesses already running on SmartPOS. 14 days free, no card needed.</p>
          <button onClick={() => router.push('/register')} style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 700, boxShadow: '0 0 40px rgba(37,99,235,0.25)' }}>
            Get started free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ color: '#334155', fontSize: 13 }}>© 2025 SmartPOS · Zetu Business Solutions, Kenya</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13 }}>Sign in</button>
          <button onClick={() => router.push('/register')} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13 }}>Register</button>
        </div>
      </footer>
    </div>
  )
}
