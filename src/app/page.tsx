'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, BarChart2, Users, Package, Zap, Shield, Globe, Check, Star } from 'lucide-react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 250,
    lifetime: null,
    color: '#3b82f6',
    popular: false,
    features: ['1 Branch', 'Up to 3 Users', '500 Products', 'Basic Reports', 'M-Pesa Payments', '14-day Trial'],
  },
  {
    id: 'business',
    name: 'Business',
    monthly: 999,
    lifetime: null,
    color: '#8b5cf6',
    popular: true,
    features: ['5 Branches', 'Up to 15 Users', '5,000 Products', 'Advanced Analytics', 'Barcode Scanning', 'Multi-currency', 'Priority Support', '14-day Trial'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: 2000,
    lifetime: null,
    color: '#f59e0b',
    popular: false,
    features: ['Unlimited Branches', 'Unlimited Users', 'Unlimited Products', 'Custom Reports', 'API Access', 'White-label Option', 'Dedicated Support', '14-day Trial'],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    monthly: null,
    lifetime: 16000,
    color: '#10b981',
    popular: false,
    features: ['Business plan features', 'One-time payment', 'Lifetime updates', 'No monthly fees', 'Priority Support'],
  },
]

const FEATURES = [
  { icon: ShoppingCart, title: 'Smart POS', desc: 'Fast checkout with barcode scanning and M-Pesa integration' },
  { icon: Package, title: 'Inventory Control', desc: 'Real-time stock tracking across all your branches' },
  { icon: BarChart2, title: 'Sales Analytics', desc: 'Detailed reports to grow your business intelligently' },
  { icon: Users, title: 'Multi-User', desc: 'Role-based access for owners, admins and cashiers' },
  { icon: Globe, title: 'Multi-Branch', desc: 'Manage all your shop locations from one dashboard' },
  { icon: Shield, title: 'Offline-Ready', desc: 'Keep selling even without internet, auto-syncs when back online' },
]

export default function LandingPage() {
  const [billing, setBilling] = useState<'monthly' | 'lifetime'>('monthly')
  const router = useRouter()

  const handleGetStarted = (planId: string, type: 'monthly' | 'lifetime') => {
    router.push(`/register?plan=${planId}&billing=${type}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingCart size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Smart<span style={{ color: '#3b82f6' }}>POS</span></span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => router.push('/login')} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#f1f5f9', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
            Sign In
          </button>
          <button onClick={() => router.push('/register')} style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '5rem 2rem 4rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '0.375rem 1rem', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 999, fontSize: '0.8rem', color: '#93c5fd', marginBottom: '1.5rem' }}>
          <Zap size={12} style={{ display: 'inline', marginRight: 4 }} />
          Built for Kenyan Businesses · M-Pesa Ready
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem' }}>
          The POS System That<br />
          <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Grows With You
          </span>
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 600, margin: '0 auto 2.5rem' }}>
          Manage sales, inventory, and multiple branches from one powerful dashboard. Offline-ready with M-Pesa integration and real-time analytics.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/register')} style={{ padding: '0.875rem 2rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>
            Start 14-Day Free Trial
          </button>
          <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '0.875rem 2rem', background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, cursor: 'pointer', fontSize: '1rem' }}>
            View Pricing
          </button>
        </div>
        <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.8rem' }}>No credit card required · Cancel anytime</p>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Everything you need to run your shop</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '3rem' }}>From a single kiosk to a multi-branch chain</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
              <div style={{ width: 44, height: 44, background: 'rgba(59,130,246,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Icon size={22} color="#3b82f6" />
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '4rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Simple, transparent pricing</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '2rem' }}>All prices in Kenya Shillings (KES)</p>

        {/* Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 4, display: 'flex', gap: 4 }}>
            {(['monthly', 'lifetime'] as const).map(t => (
              <button key={t} onClick={() => setBilling(t)} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', background: billing === t ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent', color: billing === t ? 'white' : '#94a3b8' }}>
                {t === 'monthly' ? 'Monthly' : 'Lifetime Deal'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {PLANS.filter(p => billing === 'lifetime' ? p.id === 'lifetime' || p.id === 'starter' : p.id !== 'lifetime').map(plan => (
            <div key={plan.id} style={{ padding: '1.75rem', background: plan.popular ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${plan.popular ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, position: 'relative' }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', padding: '0.25rem 0.875rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <Star size={11} fill="white" /> Most Popular
                </div>
              )}
              <div style={{ color: plan.color, fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plan.name}</div>
              <div style={{ marginBottom: '1.25rem' }}>
                {billing === 'monthly' && plan.monthly ? (
                  <>
                    <span style={{ fontSize: '2.25rem', fontWeight: 800 }}>KES {plan.monthly.toLocaleString()}</span>
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}>/mo</span>
                  </>
                ) : plan.lifetime ? (
                  <>
                    <span style={{ fontSize: '2.25rem', fontWeight: 800 }}>KES {plan.lifetime.toLocaleString()}</span>
                    <span style={{ color: '#64748b', fontSize: '0.875rem' }}> once</span>
                  </>
                ) : (
                  <span style={{ fontSize: '1.25rem', color: '#64748b' }}>See monthly plans</span>
                )}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
                    <Check size={15} color={plan.color} strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              {(plan.monthly || plan.lifetime) && (
                <button
                  onClick={() => handleGetStarted(plan.id, billing === 'lifetime' && plan.lifetime ? 'lifetime' : 'monthly')}
                  style={{ width: '100%', padding: '0.75rem', background: plan.popular ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : `rgba(${plan.id === 'lifetime' ? '16,185,129' : plan.id === 'enterprise' ? '245,158,11' : '59,130,246'},0.15)`, border: `1px solid ${plan.color}40`, color: plan.popular ? 'white' : plan.color, borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                  {plan.id === 'lifetime' ? 'Buy Lifetime Access' : 'Start Free Trial'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section style={{ textAlign: 'center', padding: '3rem 2rem 5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Trusted by shop owners across Kenya</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {[['99.9%', 'Uptime'], ['< 1s', 'Sync Speed'], ['500+', 'Businesses'], ['24/7', 'Support']].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ color: '#475569', fontSize: '0.8rem' }}>© 2025 SmartPOS · Kadem Business Solutions, Kenya</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.8rem' }}>Sign In</button>
          <button onClick={() => router.push('/register')} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.8rem' }}>Register</button>
        </div>
      </footer>
    </div>
  )
}
