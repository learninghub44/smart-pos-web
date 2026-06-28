'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
    title: 'Fast POS Checkout',
    desc: 'Barcode scanning, quick product search, and M-Pesa payment built in. Serve a customer in under 30 seconds.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    title: 'Inventory Control',
    desc: 'Real-time stock across all branches. Automated low-stock alerts and supplier order management.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    title: 'Sales Analytics',
    desc: 'Daily, weekly, and monthly reports. Identify your best-selling products, peak hours, and margins at a glance.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: 'Multi-Branch',
    desc: 'Manage up to unlimited branches from a single login. Each branch keeps its own staff, stock, and reports.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><line x1="8" y1="2" x2="8" y2="18"/>
        <line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
    ),
    title: 'Works Offline',
    desc: 'Internet down? Keep selling. Sales queue automatically and sync the moment you reconnect.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
    ),
    title: 'Thermal Receipt Printing',
    desc: 'Supports 58mm and 80mm receipt printers out of the box. Customers always leave with a receipt.',
  },
]

const PLANS = [
  {
    id: 'starter', name: 'Starter', monthly: 250,
    accent: '#3b82f6',
    features: ['1 Branch', '3 Staff accounts', '500 Products', 'M-Pesa Payments', 'Basic Reports', '14-day free trial'],
  },
  {
    id: 'business', name: 'Business', monthly: 999,
    accent: '#8b5cf6', popular: true,
    features: ['5 Branches', '15 Staff accounts', '5,000 Products', 'Advanced Analytics', 'Barcode Scanning', 'Priority Support', '14-day free trial'],
  },
  {
    id: 'enterprise', name: 'Enterprise', monthly: 2000,
    accent: '#0ea5e9',
    features: ['Unlimited Branches', 'Unlimited Staff', 'Unlimited Products', 'API Access', 'Custom Reports', 'Dedicated Account Manager', '14-day free trial'],
  },
]

const TESTIMONIALS = [
  { name: 'Faith Otieno', role: 'Owner, Nairobi Supermart', text: 'Switched from a manual till to ZetuPOS in one afternoon. Stock accuracy went from guesswork to exact numbers. My staff love it.' },
  { name: 'David Mwangi', role: 'Manager, Zuri Electronics – 3 branches', text: 'Running three shops used to mean three separate headaches. Now I check all of them from my phone during lunch.' },
  { name: 'Amina Hassan', role: 'Director, Hassan Wholesale, Mombasa', text: 'M-Pesa integration alone saved us 40 minutes a day chasing payments. The offline mode is a lifesaver during network outages.' },
]

export default function LandingPage() {
  const [billing, setBilling] = useState<'monthly' | 'lifetime'>('monthly')
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090b',
      color: '#e4e4e7',
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      overflowX: 'hidden',
    }}>
      {/* DM Sans font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(1.25rem, 5vw, 3rem)', height: 64,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(9,9,11,0.88)', backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', color: '#fafafa' }}>
            Zetu<span style={{ color: '#6366f1' }}>POS</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => router.push('/login')}
            style={{ padding: '8px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#a1a1aa', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, fontFamily: 'inherit' }}>
            Sign in
          </button>
          <button onClick={() => router.push('/register')}
            style={{ padding: '8px 18px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>
            Start free trial
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: 'clamp(60px, 10vw, 120px) clamp(1.25rem, 5vw, 3rem) 0', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>

          {/* Left */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 12px', borderRadius: 6,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              fontSize: 12, fontWeight: 600, color: '#818cf8', letterSpacing: '0.04em',
              textTransform: 'uppercase', marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
              Built for Kenya · M-Pesa Integrated
            </div>

            <h1 style={{
              fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)', fontWeight: 900,
              lineHeight: 1.08, letterSpacing: '-0.04em', color: '#fafafa',
              marginBottom: 24,
            }}>
              The POS that keeps your shop running,{' '}
              <span style={{ color: '#6366f1' }}>even offline.</span>
            </h1>

            <p style={{ fontSize: 18, color: '#71717a', lineHeight: 1.75, marginBottom: 36, maxWidth: 480 }}>
              Sell faster, track every item, accept M-Pesa, and manage multiple branches from a single dashboard. No hardware lock-in.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
              <button onClick={() => router.push('/register')}
                style={{
                  padding: '13px 26px', background: '#6366f1', color: 'white', border: 'none',
                  borderRadius: 9, cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                  boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 8px 32px rgba(99,102,241,0.3)',
                }}>
                Start 14-day free trial
              </button>
              <button onClick={() => { const el = document.getElementById('pricing'); el?.scrollIntoView({ behavior: 'smooth' }) }}
                style={{
                  padding: '13px 26px', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa',
                  borderRadius: 9, cursor: 'pointer', fontSize: 15, fontFamily: 'inherit',
                }}>
                View pricing
              </button>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {['No credit card needed', 'Cancel anytime', 'Setup in 5 minutes'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#52525b' }}>
                  <svg width="14" height="14" fill="none" stroke="#6366f1" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right – hero image */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            }}>
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80&auto=format&fit=crop"
                alt="POS system in use at a retail counter"
                style={{ width: '100%', height: 400, objectFit: 'cover', display: 'block' }}
              />
            </div>
            {/* Floating badge */}
            <div style={{
              position: 'absolute', bottom: -16, left: -20,
              background: '#18181b', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '14px 18px', boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            }}>
              <div style={{ fontSize: 12, color: '#71717a', fontWeight: 600, marginBottom: 4 }}>Today's sales</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.02em' }}>KES 47,230</div>
              <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginTop: 2 }}>+18% vs yesterday</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(1.25rem, 5vw, 3rem)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14,
          overflow: 'hidden',
        }}>
          {[
            { val: '500+', label: 'Kenyan shops' },
            { val: '99.9%', label: 'Uptime guaranteed' },
            { val: '< 1s', label: 'Offline sync speed' },
            { val: '24/7', label: 'Support response' },
          ].map(({ val, label }, i) => (
            <div key={label} style={{
              padding: '28px 20px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : undefined,
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fafafa', letterSpacing: '-0.03em' }}>{val}</div>
              <div style={{ fontSize: 13, color: '#52525b', marginTop: 5 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '0 clamp(1.25rem, 5vw, 3rem) clamp(60px, 8vw, 100px)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 12 }}>
            Everything your shop needs
          </h2>
          <p style={{ color: '#52525b', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            One tool replaces your till, your spreadsheet, and your stock book. All of it.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {FEATURES.map(({ icon, title, desc }, i) => (
            <div key={title} style={{
              padding: '32px 28px',
              background: i === 1 || i === 4 ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = i === 1 || i === 4 ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ color: '#6366f1', marginBottom: 18 }}>{icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#fafafa', marginBottom: 10 }}>{title}</h3>
              <p style={{ color: '#52525b', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VISUAL SPLIT – SHOP IMAGE ── */}
      <section style={{
        margin: '0 clamp(1.25rem, 5vw, 3rem) clamp(60px, 8vw, 100px)',
        maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center',
      }}>
        <img
          src="https://images.unsplash.com/photo-1601598851547-4302969d0614?w=700&q=80&auto=format&fit=crop"
          alt="Retail shop owner at counter"
          style={{ width: '100%', height: 420, objectFit: 'cover', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' }}
        />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            Designed for real shops
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 20, lineHeight: 1.2 }}>
            Built around how Kenyan businesses actually operate
          </h2>
          <p style={{ color: '#52525b', lineHeight: 1.75, marginBottom: 28 }}>
            From dukas in Kisii to wholesale shops in Mombasa, ZetuPOS fits the way your team works. Handle M-Pesa, cash, and credit customers side by side without switching systems.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'M-Pesa STK push directly from the POS screen',
              'Supports Swahili product names and local units',
              'WhatsApp receipt delivery for customers',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="10" height="10" fill="none" stroke="#6366f1" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '0 clamp(1.25rem, 5vw, 3rem) clamp(60px, 8vw, 100px)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 10 }}>
            Shops that made the switch
          </h2>
          <p style={{ color: '#52525b', fontSize: 15 }}>Real results from real Kenyan business owners.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {TESTIMONIALS.map(({ name, role, text }) => (
            <div key={name} style={{ padding: '28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p style={{ color: '#71717a', fontSize: 14, lineHeight: 1.75, marginBottom: 20 }}>{text}</p>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fafafa' }}>{name}</div>
                <div style={{ fontSize: 12, color: '#52525b', marginTop: 3 }}>{role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '0 clamp(1.25rem, 5vw, 3rem) clamp(60px, 8vw, 100px)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 10 }}>
            Pricing in Kenya Shillings
          </h2>
          <p style={{ color: '#52525b', fontSize: 15 }}>Start free. Pay only when you're ready. No hidden fees.</p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 4, gap: 4 }}>
            {(['monthly', 'lifetime'] as const).map(t => (
              <button key={t} onClick={() => setBilling(t)}
                style={{
                  padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.2s',
                  background: billing === t ? '#6366f1' : 'transparent',
                  color: billing === t ? 'white' : '#71717a',
                }}>
                {t === 'monthly' ? 'Monthly' : 'Lifetime deal'}
              </button>
            ))}
          </div>
        </div>

        {billing === 'monthly' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {PLANS.map(plan => (
              <div key={plan.id} style={{
                padding: '32px 26px', borderRadius: 14, position: 'relative',
                background: plan.popular ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.02)',
                border: plan.popular ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: '#6366f1', color: 'white', padding: '4px 14px',
                    borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.04em',
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, color: plan.accent, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{plan.name}</div>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 38, fontWeight: 900, color: '#fafafa', letterSpacing: '-0.04em' }}>
                    KES {plan.monthly.toLocaleString()}
                  </span>
                  <span style={{ color: '#52525b', fontSize: 14 }}>/mo</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#71717a' }}>
                      <svg width="14" height="14" fill="none" stroke={plan.accent} strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push(`/register?plan=${plan.id}`)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 9, cursor: 'pointer',
                    fontWeight: 700, fontSize: 14, fontFamily: 'inherit', transition: 'opacity 0.2s',
                    background: plan.popular ? '#6366f1' : 'transparent',
                    border: plan.popular ? 'none' : `1px solid ${plan.accent}50`,
                    color: plan.popular ? 'white' : plan.accent,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Start free trial
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 36px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Lifetime Access</div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 46, fontWeight: 900, color: '#fafafa', letterSpacing: '-0.04em' }}>KES 16,000</span>
            </div>
            <p style={{ color: '#52525b', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
              Pay once and own it forever. All Business plan features, all future updates, and priority support — with no monthly fee ever again.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
              {['Everything in Business plan', 'All future software updates', 'No recurring charges', 'Priority support, always'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#71717a' }}>
                  <svg width="14" height="14" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => router.push('/register?plan=lifetime')}
              style={{ width: '100%', padding: '14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: 15, fontFamily: 'inherit' }}>
              Get lifetime access
            </button>
          </div>
        )}
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '0 clamp(1.25rem, 5vw, 3rem) clamp(60px, 8vw, 100px)', maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          position: 'relative', overflow: 'hidden',
          padding: 'clamp(40px, 6vw, 64px) clamp(28px, 5vw, 56px)',
          borderRadius: 20, textAlign: 'center',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.2), transparent 70%)' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 14, lineHeight: 1.2 }}>
              Ready to modernise your shop?
            </h2>
            <p style={{ color: '#71717a', marginBottom: 32, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 32px' }}>
              Join hundreds of Kenyan shops already running on ZetuPOS. 14 days free — no credit card required.
            </p>
            <button onClick={() => router.push('/register')}
              style={{
                padding: '14px 32px', background: '#6366f1', color: 'white', border: 'none',
                borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 8px 32px rgba(99,102,241,0.3)',
              }}>
              Get started — it's free
            </button>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding: '0 clamp(1.25rem, 5vw, 3rem) clamp(60px, 8vw, 100px)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 10 }}>
            Get in touch
          </h2>
          <p style={{ color: '#52525b', fontSize: 15 }}>Have questions? Our team is ready to help you get set up.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {/* Phone */}
          <div style={{ padding: '32px 28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Phone</div>
              <a href="tel:+254701059192" style={{ fontSize: 18, fontWeight: 700, color: '#fafafa', textDecoration: 'none', display: 'block', marginBottom: 4 }}>
                +254 701 059 192
              </a>
              <div style={{ fontSize: 13, color: '#52525b' }}>Mon – Sat, 8AM – 6PM</div>
            </div>
          </div>

          {/* Email */}
          <div style={{ padding: '32px 28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" fill="none" stroke="#6366f1" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Email</div>
              <a href="mailto:support@zetupos.co.ke" style={{ fontSize: 16, fontWeight: 700, color: '#fafafa', textDecoration: 'none', display: 'block', marginBottom: 4 }}>
                support@zetupos.co.ke
              </a>
              <div style={{ fontSize: 13, color: '#52525b' }}>We reply within a few hours</div>
            </div>
          </div>

          {/* WhatsApp */}
          <div style={{ padding: '32px 28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#22c55e">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>WhatsApp</div>
              <a href="https://wa.me/254701059192" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 18, fontWeight: 700, color: '#fafafa', textDecoration: 'none', display: 'block', marginBottom: 4 }}>
                +254 701 059 192
              </a>
              <div style={{ fontSize: 13, color: '#52525b' }}>Quick responses on WhatsApp</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '36px clamp(1.25rem, 5vw, 3rem)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em', color: '#fafafa' }}>
                Zetu<span style={{ color: '#6366f1' }}>POS</span>
              </span>
            </div>
            <p style={{ color: '#3f3f46', fontSize: 13, lineHeight: 1.7 }}>
              The POS system built for Kenyan shops. M-Pesa integrated, works offline, runs multiple branches.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Product</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Features', 'Pricing', 'Sign in', 'Register'].map(label => (
                  <button key={label}
                    onClick={() => {
                      if (label === 'Pricing') { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) }
                      else if (label === 'Sign in') router.push('/login')
                      else if (label === 'Register') router.push('/register')
                    }}
                    style={{ background: 'none', border: 'none', color: '#3f3f46', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textAlign: 'left', padding: 0 }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Contact</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="tel:+254701059192" style={{ color: '#3f3f46', fontSize: 13, textDecoration: 'none' }}>+254 701 059 192</a>
                <a href="mailto:support@zetupos.co.ke" style={{ color: '#3f3f46', fontSize: 13, textDecoration: 'none' }}>support@zetupos.co.ke</a>
                <a href="https://wa.me/254701059192" target="_blank" rel="noopener noreferrer" style={{ color: '#3f3f46', fontSize: 13, textDecoration: 'none' }}>WhatsApp us</a>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '28px auto 0', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: '#27272a', fontSize: 12 }}>© 2025 Zetu Business Solutions Ltd · Nairobi, Kenya</span>
          <span style={{ color: '#27272a', fontSize: 12 }}>Built for Kenyan shops</span>
        </div>
      </footer>
    </div>
  )
}
