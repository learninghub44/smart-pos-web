'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NAV_LINKS = ['Features', 'Pricing', 'Contact']

const FEATURES = [
  {
    num: '01',
    title: 'Works On Any Device',
    desc: 'Phone, tablet, or desktop — your shop runs in a browser. No special hardware needed. Ring up sales from an Android phone behind the counter or a laptop in the back office.',
    img: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b6?w=600&q=85&auto=format&fit=crop',
  },
  {
    num: '02',
    title: 'Multi-Branch Control',
    desc: 'One login. Every branch. See real-time sales, staff activity and stock levels across all your locations from a single dashboard.',
    img: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b6?w=600&q=85&auto=format&fit=crop',
  },
  {
    num: '03',
    title: 'Offline-First',
    desc: 'Power cut. No internet. Your POS keeps running. Every transaction queues locally and syncs the moment you reconnect.',
    img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=85&auto=format&fit=crop',
  },
]

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'KES 250',
    period: '/month',
    desc: 'For single-branch shops just getting started.',
    features: ['1 Branch', '3 Staff accounts', '500 Products', 'Works on phone & desktop', 'Basic Reports', '14-day free trial'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    id: 'business',
    name: 'Business',
    price: 'KES 999',
    period: '/month',
    desc: 'The complete package for growing businesses.',
    features: ['5 Branches', '15 Staff accounts', '5,000 Products', 'Advanced Analytics', 'Barcode Scanning', 'Priority Support', '14-day free trial'],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'KES 2,000',
    period: '/month',
    desc: 'For large operations with no limits.',
    features: ['Unlimited Branches', 'Unlimited Staff', 'Unlimited Products', 'API Access', 'Custom Reports', 'Dedicated Account Manager', '14-day free trial'],
    cta: 'Start free trial',
    highlight: false,
  },
]

const TESTIMONIALS = [
  {
    quote: 'Switched from a manual till to ZetuPOS in one afternoon. My stock accuracy went from guesswork to exact numbers overnight.',
    name: 'Faith Otieno',
    role: 'Owner, Nairobi Supermart',
  },
  {
    quote: 'Running three shops used to mean three separate headaches. Now I check all of them from my phone over lunch.',
    name: 'David Mwangi',
    role: 'Manager, Zuri Electronics – 3 branches',
  },
  {
    quote: 'My cashiers ring up sales on an ordinary Android phone now. No special till hardware, no setup headaches, and it still works when the power goes out.',
    name: 'Amina Hassan',
    role: 'Director, Hassan Wholesale, Mombasa',
  },
]

const BENEFITS = [
  { icon: '⚡', title: 'Fast checkout', desc: 'Built for quick, accurate sales — train new staff in minutes.' },
  { icon: '📱', title: 'Works on phone', desc: 'No tills to buy. Sell from any phone, tablet, or computer you already own.' },
  { icon: '📊', title: 'Live reports', desc: 'Sales, stock, and shift summaries updated the moment they happen.' },
  { icon: '🔒', title: 'Staff permissions', desc: 'Owners, managers and cashiers each see only what they need to.' },
]

export default function Landing() {
  const router = useRouter()
  const [billing, setBilling] = useState<'monthly' | 'lifetime'>('monthly')
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,900&family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #FBF7EF; color: #1B2A41; font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; }
        img { display: block; }
        h1, h2 { font-family: 'Fraunces', serif; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; background: #E8A23D; color: #16243F;
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
          border: none; border-radius: 6px; cursor: pointer; transition: background 0.15s, transform 0.15s;
          letter-spacing: -0.01em;
        }
        .btn-primary:hover { background: #D9922E; transform: translateY(-1px); }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; background: transparent; color: #16243F;
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
          border: 1px solid #D9CCAE; border-radius: 6px; cursor: pointer; transition: border-color 0.15s, transform 0.15s;
          letter-spacing: -0.01em;
        }
        .btn-outline:hover { border-color: #C97F1E; transform: translateY(-1px); }
        .plan-card { transition: transform 0.2s; }
        .plan-card:hover { transform: translateY(-4px); }
        .feature-img { transition: transform 0.4s ease; }
        .feature-row:hover .feature-img { transform: scale(1.03); }
        .benefit-card { transition: transform 0.2s, box-shadow 0.2s; }
        .benefit-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(27,42,65,0.08); }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .feature-row { grid-template-columns: 1fr !important; }
          .feature-row-reverse { direction: ltr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .benefits-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .nav-links { display: none !important; }
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid #E4DCC8',
        background: 'rgba(251,247,239,0.92)', backdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{ width: 36, height: 36, background: '#16243F', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A23D" strokeWidth="2.2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: '#16243F' }}>ZetuPOS</span>
          </div>

          {/* Nav links */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            {NAV_LINKS.map(link => (
              <button key={link} onClick={() => scrollTo(link.toLowerCase())}
                style={{ background: 'none', border: 'none', color: '#7A7164', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', transition: 'color 0.15s', letterSpacing: '-0.01em' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#16243F')}
                onMouseLeave={e => (e.currentTarget.style.color = '#7A7164')}
              >{link}</button>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => router.push('/login')}
              style={{ background: 'none', border: 'none', color: '#7A7164', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', padding: '8px 16px' }}>
              Sign in
            </button>
            <button className="btn-primary" onClick={() => router.push('/register')}
              style={{ padding: '10px 20px', fontSize: 14 }}>
              Free trial
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 32px 80px' }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2F8F5B' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7A7164', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Built for Kenya · Works on any device
          </span>
        </div>

        {/* Headline */}
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(44px, 5.5vw, 72px)', fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.01em', color: '#16243F', marginBottom: 32 }}>
              The POS your shop has been waiting for.
            </h1>
            <p style={{ fontSize: 18, fontWeight: 400, color: '#5B5346', lineHeight: 1.75, marginBottom: 40, maxWidth: 440 }}>
              Sell faster. Track everything. Run multiple branches from one screen. Works on your phone, tablet or computer — even when the internet goes down.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
              <button className="btn-primary" onClick={() => router.push('/register')}>
                Start 14-day free trial
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className="btn-outline" onClick={() => scrollTo('pricing')}>
                View pricing
              </button>
            </div>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {['No credit card needed', 'Cancel anytime', 'Setup in 5 min'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" fill="none" stroke="#2F8F5B" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: 13, color: '#7A7164', fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image */}
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3', border: '1px solid #E4DCC8' }}>
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=90&auto=format&fit=crop"
                alt="Retail POS system in use"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {/* Floating stat */}
            <div style={{
              position: 'absolute', bottom: -20, left: -24,
              background: '#16243F', border: '1px solid #16243F',
              borderRadius: 10, padding: '16px 20px',
              boxShadow: '0 20px 60px rgba(27,42,65,0.25)',
            }}>
              <div style={{ fontSize: 11, color: '#8C97AD', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Today&apos;s revenue</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FBF7EF', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>KES 84,500</div>
              <div style={{ fontSize: 12, color: '#E8A23D', fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                +24% vs yesterday
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <div style={{ borderTop: '1px solid #E4DCC8', borderBottom: '1px solid #E4DCC8' }}>
        <div className="stats-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { val: '500+', label: 'Kenyan shops' },
            { val: '99.9%', label: 'Uptime SLA' },
            { val: '< 1s', label: 'Offline sync' },
            { val: '24/7', label: 'Support' },
          ].map(({ val, label }, i) => (
            <div key={label} style={{
              padding: '40px 32px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid #E4DCC8' : 'none',
            }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#16243F', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>{val}</div>
              <div style={{ fontSize: 13, color: '#7A7164', marginTop: 8, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── POS BENEFITS ─── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 56 }}>
          <div style={{ height: 1, background: '#E4DCC8', flex: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#7A7164', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>POS benefits</span>
          <div style={{ height: 1, background: '#E4DCC8', flex: 1 }} />
        </div>
        <div className="benefits-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {BENEFITS.map(({ icon, title, desc }) => (
            <div key={title} className="benefit-card" style={{ background: '#fff', border: '1px solid #E4DCC8', borderRadius: 10, padding: '28px 24px' }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#16243F', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13.5, color: '#7A7164', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 32px' }}>
        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 80 }}>
          <div style={{ height: 1, background: '#E4DCC8', flex: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#7A7164', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>What makes it different</span>
          <div style={{ height: 1, background: '#E4DCC8', flex: 1 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FEATURES.map(({ num, title, desc, img }, i) => (
            <div key={num} className={`feature-row ${i % 2 !== 0 ? 'feature-row-reverse' : ''}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6rem',
                alignItems: 'center',
                direction: i % 2 !== 0 ? 'rtl' : 'ltr',
                padding: '64px 0',
                borderBottom: i < FEATURES.length - 1 ? '1px solid #E4DCC8' : 'none',
              }}>
              {/* Image */}
              <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '16/10', direction: 'ltr', border: '1px solid #E4DCC8' }}>
                <img className="feature-img" src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Text */}
              <div style={{ direction: 'ltr' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#C97F1E', letterSpacing: '0.06em', marginBottom: 20 }}>{num}</div>
                <h2 style={{ fontSize: 'clamp(30px, 3.6vw, 46px)', fontWeight: 600, color: '#16243F', letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: 24 }}>{title}</h2>
                <p style={{ fontSize: 17, color: '#5B5346', lineHeight: 1.8, maxWidth: 420 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FULL BLEED IMAGE ─── */}
      <div style={{ position: 'relative', height: 480, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1601598851547-4302969d0614?w=1600&q=85&auto=format&fit=crop"
          alt="Kenyan shop owner"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(22,36,63,0.88) 40%, rgba(22,36,63,0.25))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E8A23D', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
              Designed for real Kenyan shops
            </div>
            <h2 style={{ fontSize: 'clamp(30px, 3.8vw, 50px)', fontWeight: 600, color: '#FBF7EF', letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: 24 }}>
              From Kisii to Mombasa, your shop runs better.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(251,247,239,0.75)', lineHeight: 1.75 }}>
              Works on the phone already behind your counter, supports Swahili product names, and sends receipts straight to WhatsApp. ZetuPOS fits the way Kenyan businesses actually work.
            </p>
          </div>
        </div>
      </div>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 80 }}>
          <div style={{ height: 1, background: '#E4DCC8', flex: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#7A7164', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>What shop owners say</span>
          <div style={{ height: 1, background: '#E4DCC8', flex: 1 }} />
        </div>

        <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {TESTIMONIALS.map(({ quote, name, role }) => (
            <div key={name} style={{ padding: '48px 36px', borderRight: '1px solid #E4DCC8', background: '#fff', border: '1px solid #E4DCC8', borderRadius: 4 }}>
              <div style={{ fontSize: 48, color: '#E4DCC8', fontWeight: 900, lineHeight: 1, marginBottom: 24, fontFamily: "'Fraunces', serif" }}>&ldquo;</div>
              <p style={{ fontSize: 16, color: '#5B5346', lineHeight: 1.8, marginBottom: 36, fontStyle: 'italic' }}>{quote}</p>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#16243F' }}>{name}</div>
                <div style={{ fontSize: 13, color: '#A89B82', marginTop: 4 }}>{role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ borderTop: '1px solid #E4DCC8', padding: '120px 0', background: '#F3EEE2' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 80 }}>
            <div style={{ height: 1, background: '#E4DCC8', flex: 1 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#7A7164', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Pricing in Kenya Shillings</span>
            <div style={{ height: 1, background: '#E4DCC8', flex: 1 }} />
          </div>

          {/* Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', background: '#fff', border: '1px solid #E4DCC8', borderRadius: 8, padding: 4 }}>
              {(['monthly', 'lifetime'] as const).map(t => (
                <button key={t} onClick={() => setBilling(t)}
                  style={{
                    padding: '9px 22px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                    background: billing === t ? '#16243F' : 'transparent',
                    color: billing === t ? '#FBF7EF' : '#7A7164',
                  }}>
                  {t === 'monthly' ? 'Monthly' : 'Lifetime deal'}
                </button>
              ))}
            </div>
          </div>

          {billing === 'monthly' ? (
            <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {PLANS.map(plan => (
                <div key={plan.id} className="plan-card" style={{
                  padding: '48px 36px',
                  background: plan.highlight ? '#16243F' : '#fff',
                  border: plan.highlight ? '1px solid #16243F' : '1px solid #E4DCC8',
                  borderRadius: 10,
                  position: 'relative',
                }}>
                  {plan.highlight && (
                    <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#E8A23D', border: 'none', color: '#16243F', padding: '4px 16px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      Most popular
                    </div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 700, color: plan.highlight ? '#8C97AD' : '#7A7164', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>{plan.name}</div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: plan.highlight ? '#FBF7EF' : '#16243F', letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: plan.highlight ? '#8C97AD' : '#A89B82', marginLeft: 4 }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize: 14, color: plan.highlight ? '#AEB9CC' : '#7A7164', marginBottom: 32, lineHeight: 1.6 }}>{plan.desc}</p>
                  <ul style={{ listStyle: 'none', marginBottom: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: plan.highlight ? '#D8DEE9' : '#5B5346' }}>
                        <svg width="14" height="14" fill="none" stroke={plan.highlight ? '#E8A23D' : '#2F8F5B'} strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => router.push(`/register?plan=${plan.id}`)}
                    style={{
                      width: '100%', padding: '14px', border: 'none', borderRadius: 6,
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
                      background: plan.highlight ? '#E8A23D' : 'transparent',
                      color: plan.highlight ? '#16243F' : '#16243F',
                      outline: plan.highlight ? 'none' : '1px solid #D9CCAE',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >{plan.cta}</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ maxWidth: 460, margin: '0 auto', padding: '56px 48px', border: '1px solid #E4DCC8', borderRadius: 10, background: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2F8F5B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Lifetime access</div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: '#16243F', letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" }}>KES 16,000</span>
              </div>
              <p style={{ fontSize: 14, color: '#7A7164', marginBottom: 36, lineHeight: 1.7 }}>Pay once. Use forever. Every Business plan feature, every future update — no monthly fee ever again.</p>
              <ul style={{ listStyle: 'none', marginBottom: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {['All Business plan features', 'Lifetime software updates', 'No recurring fees', 'Priority support forever'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#5B5346' }}>
                    <svg width="14" height="14" fill="none" stroke="#2F8F5B" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push('/register?plan=lifetime')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Get lifetime access
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1600&q=85&auto=format&fit=crop"
          alt="Business team"
          style={{ width: '100%', height: 420, objectFit: 'cover', objectPosition: 'center 60%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,36,63,0.85)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 32px' }}>
          <h2 style={{ fontSize: 'clamp(34px, 4.6vw, 58px)', fontWeight: 600, color: '#FBF7EF', letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: 20 }}>
            Ready to modernise your shop?
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(251,247,239,0.7)', marginBottom: 40, maxWidth: 480 }}>
            Join hundreds of Kenyan businesses on ZetuPOS. 14 days free, no card needed.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => router.push('/register')}>
              Start free trial
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <a href="tel:+254701059192" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'transparent', color: '#FBF7EF', fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, border: '1px solid rgba(251,247,239,0.3)', borderRadius: 6, letterSpacing: '-0.01em' }}>
              Call us: +254 701 059 192
            </a>
          </div>
        </div>
      </div>

      {/* ─── CONTACT ─── */}
      <section id="contact" style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 80 }}>
          <div style={{ height: 1, background: '#E4DCC8', flex: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#7A7164', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Get in touch</span>
          <div style={{ height: 1, background: '#E4DCC8', flex: 1 }} />
        </div>

        <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            {
              label: 'Phone',
              value: '+254 701 059 192',
              sub: 'Mon – Sat, 8AM – 6PM',
              href: 'tel:+254701059192',
              icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
            },
            {
              label: 'Email',
              value: 'support@zetupos.co.ke',
              sub: 'Reply within a few hours',
              href: 'mailto:support@zetupos.co.ke',
              icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
            },
            {
              label: 'WhatsApp',
              value: '+254 701 059 192',
              sub: 'Quick responses on chat',
              href: 'https://wa.me/254701059192',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
            },
          ].map(({ label, value, sub, href, icon }) => (
            <a key={label} href={href} target={label === 'WhatsApp' ? '_blank' : undefined} rel="noopener noreferrer"
              style={{
                display: 'block', padding: '48px 36px',
                border: '1px solid #E4DCC8', borderRadius: 10, color: 'inherit', background: '#fff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C97F1E'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(27,42,65,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4DCC8'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ color: '#C97F1E', marginBottom: 24 }}>{icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#A89B82', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#16243F', letterSpacing: '-0.01em', marginBottom: 8 }}>{value}</div>
              <div style={{ fontSize: 13, color: '#A89B82' }}>{sub}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid #E4DCC8', background: '#16243F' }}>
        <div className="footer-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 32px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '4rem' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: '#E8A23D', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16243F" strokeWidth="2.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              </div>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', color: '#FBF7EF' }}>ZetuPOS</span>
            </div>
            <p style={{ fontSize: 14, color: '#8C97AD', lineHeight: 1.7, maxWidth: 280 }}>
              The POS system built for Kenya. Works on any phone or computer, offline-first, multi-branch ready.
            </p>
          </div>
          {/* Product */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5B677F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>Product</div>
            {['Features', 'Pricing', 'Sign in', 'Register'].map(l => (
              <div key={l} style={{ marginBottom: 14 }}>
                <button onClick={() => {
                  if (l === 'Sign in') router.push('/login')
                  else if (l === 'Register') router.push('/register')
                  else scrollTo(l.toLowerCase())
                }} style={{ background: 'none', border: 'none', color: '#8C97AD', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FBF7EF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#8C97AD')}>{l}</button>
              </div>
            ))}
          </div>
          {/* Contact */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5B677F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>Contact</div>
            {[
              { label: '+254 701 059 192', href: 'tel:+254701059192' },
              { label: 'support@zetupos.co.ke', href: 'mailto:support@zetupos.co.ke' },
              { label: 'WhatsApp us', href: 'https://wa.me/254701059192' },
            ].map(({ label, href }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <a href={href} style={{ color: '#8C97AD', fontSize: 14, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FBF7EF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#8C97AD')}>{label}</a>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(251,247,239,0.08)', maxWidth: 1200, margin: '0 auto', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#5B677F' }}>© 2025 Zetu Business Solutions Ltd · Nairobi, Kenya</span>
          <span style={{ fontSize: 12, color: '#5B677F' }}>Built for Kenyan shops</span>
        </div>
      </footer>
    </>
  )
}
