'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, UtensilsCrossed, Wine, Store,
  Phone, Mail, MessageCircle, ArrowRight,
  Wifi, WifiOff, CreditCard, Printer,
  BarChart2, Users, Globe, Headphones,
  CheckCircle, Star, ChevronRight, Zap, Shield, Layers
} from 'lucide-react'

const FEATURES = [
  {
    Icon: ShoppingCart,
    title: 'Supermarket & Minimart',
    desc: 'Fast checkout with barcode scanning, M-Pesa, cash, and credit card. Full stock control across multiple stores with automatic reconciliation.',
    color: '#1a3a6b',
  },
  {
    Icon: UtensilsCrossed,
    title: 'Restaurant & Bar',
    desc: 'Kitchen order tokens, waiter ordering, table management. Orders print automatically at kitchen and counter. Handles modifiers and accompaniments.',
    color: '#e8891a',
  },
  {
    Icon: Wine,
    title: 'Wines & Spirits',
    desc: 'Built for retail and wholesale liquor outlets. Multiple payment options, stock valuation, supplier accounts, and comprehensive reporting.',
    color: '#1a3a6b',
  },
  {
    Icon: Store,
    title: 'General Retail',
    desc: 'Ideal for hardware, groceries, cosmetics, bookshops and agrovets. Accurate sales records, stock monitoring, and expenses management.',
    color: '#e8891a',
  },
]

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'KES 250',
    period: '/month',
    desc: 'For single-branch shops getting started.',
    features: ['1 Branch', '3 Staff Accounts', '500 Products', 'Works on Phone & Desktop', 'Basic Reports', '14-day Free Trial'],
    highlight: false,
  },
  {
    id: 'business',
    name: 'Business',
    price: 'KES 999',
    period: '/month',
    desc: 'The complete package for growing businesses.',
    features: ['5 Branches', '15 Staff Accounts', '5,000 Products', 'Advanced Analytics', 'Barcode Scanning', 'Priority Support', '14-day Free Trial'],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'KES 2,000',
    period: '/month',
    desc: 'For large operations with no limits.',
    features: ['Unlimited Branches', 'Unlimited Staff', 'Unlimited Products', 'API Access', 'Custom Reports', 'Dedicated Account Manager', '14-day Free Trial'],
    highlight: false,
  },
]

const TESTIMONIALS = [
  {
    quote: 'We have used Smart POS in our restaurant and bar for over one year. The software is very stable and reliable. I highly recommend it to all restaurants.',
    name: 'Michael S.',
    role: 'Director, Royal Palace Restaurant and Pub',
  },
  {
    quote: 'The guys at Zetu Business Solutions provide great software and on top of that awesome support. Whenever we have any challenges, they respond very quickly.',
    name: 'Nancy K.',
    role: 'Owner, Friends Restaurant – Nairobi',
  },
  {
    quote: 'We had been using other software which frustrated us. We are very happy with Smart POS now. It\'s easy to use and very reliable. Highly recommend.',
    name: 'James M.',
    role: 'Assistant Manager, Kuzima Comrades Sports Bar',
  },
]

const STATS = [
  { val: '500+', label: 'Kenyan Businesses', Icon: Store },
  { val: '99.9%', label: 'Uptime Guaranteed', Icon: Zap },
  { val: 'M-Pesa', label: 'Payments Supported', Icon: CreditCard },
  { val: '24/7', label: 'Customer Support', Icon: Headphones },
]

export default function Landing() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #fff; color: #1a1a2e; font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; color: inherit; }
        h1, h2, h3, h4, h5 { font-family: 'Plus Jakarta Sans', sans-serif; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; background: #e8891a; color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700;
          border: none; border-radius: 6px; cursor: pointer;
          transition: all 0.18s; letter-spacing: -0.01em;
        }
        .btn-primary:hover { background: #c97615; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(232,137,26,0.35); }

        .btn-navy {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; background: #1a3a6b; color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700;
          border: none; border-radius: 6px; cursor: pointer;
          transition: all 0.18s; letter-spacing: -0.01em;
        }
        .btn-navy:hover { background: #122d55; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(26,58,107,0.3); }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; background: transparent; color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700;
          border: 1.5px solid rgba(255,255,255,0.45); border-radius: 6px; cursor: pointer;
          transition: all 0.18s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.8); }

        .section-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(232,137,26,0.1); border: 1px solid rgba(232,137,26,0.3);
          color: #c97615; font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; padding: 5px 12px; border-radius: 20px; margin-bottom: 18px;
        }

        .feature-card { transition: all 0.22s; }
        .feature-card:hover { transform: translateY(-5px); box-shadow: 0 20px 48px rgba(26,58,107,0.12); }

        .plan-card { transition: all 0.22s; }
        .plan-card:hover { transform: translateY(-4px); }

        .nav-link {
          background: none; border: none; color: #374151;
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; font-weight: 600;
          cursor: pointer; padding: 6px 4px; letter-spacing: -0.01em;
          transition: color 0.15s; position: relative;
        }
        .nav-link::after {
          content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px;
          background: #e8891a; transform: scaleX(0); transition: transform 0.18s; border-radius: 2px;
        }
        .nav-link:hover { color: #e8891a; }
        .nav-link:hover::after { transform: scaleX(1); }

        .contact-card { transition: all 0.2s; }
        .contact-card:hover { transform: translateY(-3px); border-color: #e8891a !important; box-shadow: 0 12px 32px rgba(26,58,107,0.1); }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-img { display: none !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .nav-links { display: none !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .cta-flex { flex-direction: column !important; }
        }
        @media (max-width: 560px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-badges { flex-direction: column !important; }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ background: '#0f2347', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '9px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href="tel:+254701059192" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}>
              <Phone size={11} color="#e8891a" />
              +254 701 059 192
            </a>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Mon–Sat 8AM–6PM EAT</span>
          </div>
          <a href="https://wa.me/254701059192" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.15s' }}>
            <MessageCircle size={11} />
            WhatsApp Us
          </a>
        </div>
      </div>

      {/* ── MAIN NAV ── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #f0f4fd', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 20px rgba(26,58,107,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo-zetu-icon.png" alt="POS Zetu" style={{ height: 36, width: 'auto' }} />
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#1a3a6b', lineHeight: 1.1, letterSpacing: '-0.02em' }}>POS ZETU</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9.5, color: '#1d6fe0', fontWeight: 600, letterSpacing: '0.05em' }}>poszetupos.co.ke</div>
            </div>
          </div>

          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[['Home', ''], ['Features', 'features'], ['Pricing', 'pricing'], ['Contact', 'contact']].map(([label, id]) => (
              <button key={label} className="nav-link" onClick={() => id ? scrollTo(id) : window.scrollTo({ top: 0, behavior: 'smooth' })}>{label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => router.push('/login')}
              style={{ background: 'none', border: '1.5px solid #e2e8f0', color: '#374151', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '-0.01em' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a3a6b'; e.currentTarget.style.color = '#1a3a6b' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151' }}>
              Sign In
            </button>
            <button className="btn-primary" onClick={() => router.push('/register')} style={{ padding: '9px 18px', fontSize: 13 }}>
              Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(150deg, #0f2347 0%, #1a3a6b 50%, #122d55 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div style={{ position: 'absolute', top: -140, right: -100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,137,26,0.18), transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,82,152,0.4), transparent 65%)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px 0', position: 'relative' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 28 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                <span style={{ color: '#4ade80', fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  Kenya's #1 POS System
                </span>
              </div>

              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 'clamp(38px, 5vw, 62px)', color: '#fff', lineHeight: 1.06, marginBottom: 22, letterSpacing: '-0.025em' }}>
                The POS Built<br />
                <span style={{ color: '#e8891a' }}>for Kenya</span>
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, marginBottom: 36, maxWidth: 470 }}>
                Affordable, reliable, and easy to use. For retail, restaurants, hotels, and bars. Runs on any phone, tablet, or desktop — even without internet.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
                <button className="btn-primary" onClick={() => router.push('/register')}>
                  Start Free Trial
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
                <button className="btn-ghost" onClick={() => scrollTo('pricing')}>
                  View Pricing
                </button>
              </div>

              <div className="hero-badges" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[
                  { icon: CheckCircle, label: 'Pay and start instantly' },
                  { icon: Shield, label: 'No card needed' },
                  { icon: Zap, label: 'Setup in minutes' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={14} color="#4ade80" strokeWidth={2.5} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-img" style={{ position: 'relative', paddingBottom: 32 }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(232,137,26,0.35)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=90&auto=format&fit=crop"
                  alt="Smart POS in use"
                  style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ position: 'absolute', top: -18, right: -18, background: 'linear-gradient(135deg, #e8891a, #c97615)', borderRadius: 10, padding: '14px 20px', boxShadow: '0 12px 32px rgba(232,137,26,0.45)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Today's Sales</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>KES 84,500</div>
              </div>
              <div style={{ position: 'absolute', bottom: 10, left: -18, background: '#fff', borderRadius: 8, padding: '10px 16px', boxShadow: '0 8px 28px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <WifiOff size={14} color="#4ade80" strokeWidth={2.5} />
                <span style={{ fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#1a3a6b' }}>Works Offline</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ lineHeight: 0, marginTop: 48 }}>
          <svg viewBox="0 0 1440 64" fill="#fff" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
            <path d="M0,40 C360,68 1080,8 1440,40 L1440,64 L0,64 Z"/>
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f4fd' }}>
        <div className="stats-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {STATS.map(({ val, label, Icon }, i) => (
            <div key={label} style={{ padding: '36px 24px', textAlign: 'center', borderRight: i < 3 ? '1px solid #f0f4fd' : 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #f0f4fd, #e8eef8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Icon size={20} color="#1a3a6b" strokeWidth={2} />
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#1a3a6b', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.025em' }}>{val}</div>
              <div style={{ fontSize: 12, color: '#6b7a99', marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INTRO SECTION ── */}
      <section style={{ background: '#f8faff', padding: '80px 24px', borderBottom: '1px solid #f0f4fd' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }} className="hero-grid">
          <div>
            <div className="section-tag">
              <Layers size={10} />
              About Smart POS
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1a3a6b', marginBottom: 18, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              The POS System<br />Built for Kenyan Business
            </h2>
            <p style={{ fontSize: 15.5, color: '#4a5568', lineHeight: 1.8, marginBottom: 24 }}>
              Smart POS is an affordable, reliable, and easy-to-use point of sale system designed for Kenyan businesses. Whether you run a supermarket, restaurant, bar, wines and spirits outlet, or any retail shop — we have a solution built for you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {['Works on phones, tablets and desktops', 'Full M-Pesa and cash payment integration', 'Runs even when internet or power goes out'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={16} color="#e8891a" strokeWidth={2.5} />
                  <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-navy" onClick={() => scrollTo('features')}>Our Solutions</button>
              <button className="btn-primary" onClick={() => scrollTo('pricing')}>See Pricing</button>
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%)', borderRadius: 16, padding: '40px 36px', color: '#fff' }}>
            <div style={{ fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#e8891a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Why businesses choose us</div>
            {[
              { Icon: CreditCard, title: 'M-Pesa Integrated', desc: 'Accept Lipa na M-Pesa, cash, Visa and credit with one system.' },
              { Icon: WifiOff, title: 'Offline Mode', desc: 'Keep selling even when the internet or power goes out.' },
              { Icon: Printer, title: 'Thermal Receipt Printing', desc: 'Auto-print receipts and kitchen tickets with any printer.' },
              { Icon: BarChart2, title: 'Real-time Reports', desc: 'Live sales data, stock alerts, and branch-by-branch analytics.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(232,137,26,0.15)', border: '1px solid rgba(232,137,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color="#e8891a" strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '88px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-tag">
              <Globe size={10} />
              Our POS Solutions
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1a3a6b', letterSpacing: '-0.02em' }}>
              A System for Every Business Type
            </h2>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {FEATURES.map(({ Icon, title, desc, color }) => (
              <div key={title} className="feature-card" style={{ background: '#fff', border: '1px solid #f0f4fd', borderTop: `3px solid ${color}`, borderRadius: 10, padding: '32px 24px', boxShadow: '0 2px 12px rgba(26,58,107,0.04)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: color === '#e8891a' ? 'rgba(232,137,26,0.1)' : 'rgba(26,58,107,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={22} color={color} strokeWidth={1.8} />
                </div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#1a3a6b', marginBottom: 12, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: '#6b7a99', lineHeight: 1.7 }}>{desc}</p>
                <button onClick={() => router.push('/register')} style={{ marginTop: 20, background: 'none', border: 'none', color: '#e8891a', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, transition: 'gap 0.15s' }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.gap = '8px' }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.gap = '4px' }}>
                  Learn More <ChevronRight size={13} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL BLEED BANNER ── */}
      <div style={{ position: 'relative', height: 440, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1601598851547-4302969d0614?w=1600&q=85&auto=format&fit=crop"
          alt="Kenyan shop"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,27,60,0.95) 40%, rgba(10,27,60,0.5))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%' }}>
            <div style={{ maxWidth: 580 }}>
              <div className="section-tag" style={{ background: 'rgba(232,137,26,0.15)', border: '1px solid rgba(232,137,26,0.4)', color: '#e8891a' }}>
                <Shield size={10} />
                Designed for Kenya
              </div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 'clamp(30px, 4.5vw, 50px)', color: '#fff', lineHeight: 1.08, marginBottom: 20, letterSpacing: '-0.025em' }}>
                Beautiful, Easy<br />and Reliable.
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 36, maxWidth: 460 }}>
                Our interface is designed so new staff can be trained in minutes. Supports M-Pesa, cash, credit card, and credit payments. Works even when internet or power goes out.
              </p>
              <button className="btn-primary" onClick={() => router.push('/register')}>
                Start Free Trial
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: '#f8faff', padding: '88px 24px', borderTop: '1px solid #f0f4fd' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-tag">
              <Star size={10} />
              Client Testimonials
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1a3a6b', letterSpacing: '-0.02em' }}>
              What Our Clients Say
            </h2>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <div key={name} style={{ background: '#fff', border: '1px solid #f0f4fd', borderRadius: 10, padding: '36px 32px', boxShadow: '0 4px 20px rgba(26,58,107,0.05)' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={15} color="#e8891a" fill="#e8891a" />)}
                </div>
                <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.8, marginBottom: 28, fontStyle: 'italic' }}>"{quote}"</p>
                <div style={{ borderTop: '1px solid #f0f4fd', paddingTop: 20 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#1a3a6b' }}>{name}</div>
                  <div style={{ fontSize: 12.5, color: '#6b7a99', marginTop: 3 }}>{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: '#fff', padding: '88px 24px', borderTop: '1px solid #f0f4fd' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-tag">
              <CreditCard size={10} />
              Pricing in Kenya Shillings
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1a3a6b', marginBottom: 12, letterSpacing: '-0.02em' }}>
              Affordable Plans for Every Business
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a99', maxWidth: 400, margin: '0 auto' }}>Affordable monthly plans. M-Pesa accepted.</p>
          </div>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 980, margin: '0 auto' }}>
            {PLANS.map(plan => (
              <div key={plan.id} className="plan-card" style={{
                padding: '40px 32px',
                background: plan.highlight ? 'linear-gradient(150deg, #1a3a6b, #0f2347)' : '#fff',
                border: plan.highlight ? '2px solid #1a3a6b' : '1.5px solid #f0f4fd',
                borderRadius: 12, position: 'relative',
                boxShadow: plan.highlight ? '0 24px 60px rgba(26,58,107,0.28)' : '0 4px 20px rgba(26,58,107,0.05)',
              }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #e8891a, #c97615)', color: '#fff', padding: '5px 20px', borderRadius: 20, fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(232,137,26,0.35)' }}>
                    Most Popular
                  </div>
                )}
                <div style={{ fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: plan.highlight ? '#8ca5cc' : '#6b7a99', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>{plan.name}</div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: plan.highlight ? '#fff' : '#1a3a6b', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.03em' }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: plan.highlight ? '#8ca5cc' : '#6b7a99', marginLeft: 4 }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 13, color: plan.highlight ? '#a8c0e0' : '#6b7a99', marginBottom: 28, lineHeight: 1.6 }}>{plan.desc}</p>
                <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: plan.highlight ? '#d0e0f5' : '#374151' }}>
                      <CheckCircle size={15} color={plan.highlight ? '#e8891a' : '#1a3a6b'} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push(`/register?plan=${plan.id}`)} style={{
                  width: '100%', padding: '13px', border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13.5, fontWeight: 800,
                  background: plan.highlight ? '#e8891a' : '#1a3a6b',
                  color: '#fff', letterSpacing: '-0.01em', transition: 'opacity 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <div style={{ background: 'linear-gradient(135deg, #e8891a 0%, #c97615 100%)', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 4vw, 46px)', color: '#fff', marginBottom: 16, lineHeight: 1.08, letterSpacing: '-0.025em' }}>
            Ready to Modernise<br />Your Business?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 40, lineHeight: 1.7 }}>
            Join 500+ Kenyan businesses already using Smart POS. Pay and get started today.
          </p>
          <div className="cta-flex" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/register')} style={{ padding: '15px 34px', background: '#fff', color: '#e8891a', border: 'none', borderRadius: 6, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 800, cursor: 'pointer', letterSpacing: '-0.01em', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
              Start Free Trial
            </button>
            <a href="tel:+254701059192" style={{ padding: '15px 34px', background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.6)', borderRadius: 6, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Phone size={15} strokeWidth={2.5} />
              Call Us Now
            </a>
          </div>
        </div>
      </div>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ background: '#f8faff', padding: '88px 24px', borderTop: '1px solid #f0f4fd' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-tag">
              <Headphones size={10} />
              Get In Touch
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1a3a6b', letterSpacing: '-0.02em' }}>
              Contact Us Today
            </h2>
          </div>
          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 860, margin: '0 auto' }}>
            {[
              { Icon: Phone, label: 'Phone', value: '+254 701 059 192', sub: 'Mon–Sat, 8AM–6PM EAT', href: 'tel:+254701059192' },
              { Icon: Mail, label: 'Email', value: 'support@zetupos.co.ke', sub: 'Reply within a few hours', href: 'mailto:support@zetupos.co.ke' },
              { Icon: MessageCircle, label: 'WhatsApp', value: '+254 701 059 192', sub: 'Quick chat responses', href: 'https://wa.me/254701059192' },
            ].map(({ Icon, label, value, sub, href }) => (
              <a key={label} href={href} target={label === 'WhatsApp' ? '_blank' : undefined} rel="noopener noreferrer"
                className="contact-card"
                style={{ display: 'block', background: '#fff', border: '1.5px solid #f0f4fd', borderRadius: 10, padding: '36px 28px', textAlign: 'center', color: 'inherit' }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg, #f0f4fd, #e4ecf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Icon size={22} color="#1a3a6b" strokeWidth={1.8} />
                </div>
                <div style={{ fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#e8891a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1a3a6b', marginBottom: 5 }}>{value}</div>
                <div style={{ fontSize: 12, color: '#6b7a99' }}>{sub}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a1b3c', borderTop: '3px solid #e8891a' }}>
        <div className="footer-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 40px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ background: '#fff', borderRadius: 7, padding: 6, display: 'inline-flex', alignItems: 'center' }}>
                <img src="/logo-zetu-icon.png" alt="POS Zetu" style={{ height: 30, width: 'auto' }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.01em' }}>POS ZETU</div>
                <div style={{ fontSize: 9.5, color: '#4d9fff', fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: '0.05em' }}>poszetupos.co.ke</div>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: '#6b8ab0', lineHeight: 1.75, maxWidth: 280 }}>
              Affordable, reliable and easy to use POS system built for Kenyan businesses. Works on any device, even offline.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#3a5a8a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Product</div>
            {['Features', 'Pricing', 'Sign In', 'Register'].map(l => (
              <div key={l} style={{ marginBottom: 12 }}>
                <button onClick={() => { if (l === 'Sign In') router.push('/login'); else if (l === 'Register') router.push('/register'); else scrollTo(l.toLowerCase()); }}
                  style={{ background: 'none', border: 'none', color: '#6b8ab0', fontSize: 13.5, fontFamily: "'Inter', sans-serif", cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e8891a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b8ab0')}>{l}</button>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#3a5a8a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Contact</div>
            {[
              { label: '+254 701 059 192', href: 'tel:+254701059192' },
              { label: 'support@zetupos.co.ke', href: 'mailto:support@zetupos.co.ke' },
              { label: 'WhatsApp Us', href: 'https://wa.me/254701059192' },
            ].map(({ label, href }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <a href={href} style={{ color: '#6b8ab0', fontSize: 13.5, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e8891a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b8ab0')}>{label}</a>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', maxWidth: 1200, margin: '0 auto', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#3a5a8a' }}>© 2025 Zetu Business Solutions Ltd · Nairobi, Kenya</span>
          <span style={{ fontSize: 12, color: '#3a5a8a' }}>Built for Kenyan Businesses</span>
        </div>
      </footer>
    </>
  )
}
