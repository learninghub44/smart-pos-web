'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FEATURES = [
  {
    icon: '🛒',
    title: 'Supermarket & Minimart',
    desc: 'Fast checkout with barcode scanning, M-Pesa, cash, credit card support. Full stock control across multiple stores with automatic reconciliation.',
  },
  {
    icon: '🍽️',
    title: 'Restaurant & Bar',
    desc: 'Kitchen order tokens, waiter ordering, table management. Orders print automatically at kitchen/counter. Handles Cold/Warm modifiers and accompaniments.',
  },
  {
    icon: '🍷',
    title: 'Wines & Spirits',
    desc: 'Built for retail and wholesale liquor outlets. Multiple payment options, stock valuation, supplier accounts, and comprehensive reporting.',
  },
  {
    icon: '🏪',
    title: 'General Retail',
    desc: 'Ideal for hardware, groceries, cosmetics, bookshops, agrovets and all retail types. Accurate sales records, stock monitoring, expenses management.',
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
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #fff; color: #1a1a2e; font-family: 'Open Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; color: inherit; }
        img { display: block; }
        h1, h2, h3, h4 { font-family: 'Montserrat', sans-serif; }

        .nav-top { background: #1a3a6b; padding: 8px 0; }
        .nav-main { background: #fff; border-bottom: 2px solid #e8f0fb; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 12px rgba(26,58,107,0.07); }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; background: #e8891a; color: #fff;
          font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 700;
          border: none; border-radius: 4px; cursor: pointer;
          transition: background 0.18s, transform 0.15s;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .btn-primary:hover { background: #c97615; transform: translateY(-1px); }

        .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; background: #1a3a6b; color: #fff;
          font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 700;
          border: none; border-radius: 4px; cursor: pointer;
          transition: background 0.18s, transform 0.15s;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .btn-secondary:hover { background: #122d55; transform: translateY(-1px); }

        .btn-outline-white {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; background: transparent; color: #fff;
          font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 700;
          border: 2px solid rgba(255,255,255,0.6); border-radius: 4px; cursor: pointer;
          transition: all 0.18s; text-transform: uppercase; letter-spacing: 0.04em;
        }
        .btn-outline-white:hover { background: rgba(255,255,255,0.12); border-color: #fff; }

        .section-label {
          display: inline-block;
          background: #e8891a; color: #fff;
          font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 800;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 6px 16px; border-radius: 2px; margin-bottom: 20px;
        }

        .feature-card { transition: transform 0.2s, box-shadow 0.2s; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(26,58,107,0.12); }

        .plan-card { transition: transform 0.2s, box-shadow 0.2s; }
        .plan-card:hover { transform: translateY(-4px); }

        .nav-link {
          background: none; border: none; color: #1a3a6b;
          font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; padding: 8px 4px; text-transform: uppercase; letter-spacing: 0.06em;
          transition: color 0.15s; border-bottom: 2px solid transparent;
        }
        .nav-link:hover { color: #e8891a; border-bottom-color: #e8891a; }

        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .nav-desktop { display: none !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="nav-top">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <a href="tel:+254701059192" style={{ color: '#fff', fontSize: 12, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" fill="#e8891a" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 019.19 18.8 19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              +254 701 059 192
            </a>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: "'Open Sans', sans-serif" }}>Mon–Sat 8AM–6PM</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="https://wa.me/254701059192" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: "'Open Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ── MAIN NAV ── */}
      <nav className="nav-main">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{ width: 42, height: 42, background: '#1a3a6b', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e8891a" strokeWidth="2.2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 20, color: '#1a3a6b', lineHeight: 1.1 }}>Smart POS</div>
              <div style={{ fontFamily: "'Open Sans', sans-serif", fontSize: 10, color: '#e8891a', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>by Zetu Business Solutions</div>
            </div>
          </div>

          {/* Nav links */}
          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[['Home', ''], ['Features', 'features'], ['Pricing', 'pricing'], ['Contact', 'contact']].map(([label, id]) => (
              <button key={label} className="nav-link" onClick={() => id ? scrollTo(id) : window.scrollTo({ top: 0, behavior: 'smooth' })}>{label}</button>
            ))}
          </div>

          {/* Auth CTA */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => router.push('/login')}
              style={{ background: 'none', border: '1px solid #1a3a6b', color: '#1a3a6b', fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Sign In
            </button>
            <button className="btn-primary" onClick={() => router.push('/register')} style={{ padding: '9px 18px', fontSize: 12 }}>
              Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #0f2347 60%, #1a3a6b 100%)', position: 'relative', overflow: 'hidden' }}>
        {/* Background pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle at 20px 20px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,137,26,0.2), transparent 65%)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', position: 'relative' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(232,137,26,0.15)', border: '1px solid rgba(232,137,26,0.4)', borderRadius: 3, padding: '6px 14px', marginBottom: 28 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
                <span style={{ color: '#e8891a', fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Kenya's Leading POS System
                </span>
              </div>

              <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(36px, 5vw, 60px)', color: '#fff', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.01em' }}>
                The #1 POS System<br />
                <span style={{ color: '#e8891a' }}>for Kenyan Business</span>
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.78)', lineHeight: 1.75, marginBottom: 36, maxWidth: 460 }}>
                Affordable, reliable and easy to use. Works for Retail, Restaurants, Hotels and Bars. Runs on your phone, tablet or desktop — even offline.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
                <button className="btn-primary" onClick={() => router.push('/register')}>
                  Start Free Trial
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
                <button className="btn-outline-white" onClick={() => scrollTo('pricing')}>
                  View Pricing
                </button>
              </div>

              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {['14-day free trial', 'No credit card needed', 'Setup in minutes'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" fill="none" stroke="#4ade80" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero image panel */}
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '3px solid rgba(232,137,26,0.4)', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=90&auto=format&fit=crop"
                  alt="Smart POS in use"
                  style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                />
              </div>
              {/* Live badge */}
              <div style={{ position: 'absolute', top: -16, right: -16, background: '#e8891a', borderRadius: 6, padding: '12px 18px', boxShadow: '0 8px 24px rgba(232,137,26,0.4)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Today's Sales</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', fontFamily: "'Montserrat', sans-serif" }}>KES 84,500</div>
              </div>
              {/* Offline badge */}
              <div style={{ position: 'absolute', bottom: -16, left: -16, background: '#fff', borderRadius: 6, padding: '10px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
                <span style={{ fontSize: 12, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1a3a6b' }}>Offline-Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 1440 60" fill="#fff" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
            <path d="M0,32 C360,64 1080,0 1440,32 L1440,60 L0,60 Z"/>
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8f0fb' }}>
        <div className="stats-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { val: '500+', label: 'Kenyan Businesses', icon: '🏪' },
            { val: '99.9%', label: 'Uptime Guaranteed', icon: '⚡' },
            { val: 'M-Pesa', label: 'Payments Supported', icon: '💳' },
            { val: '24/7', label: 'Customer Support', icon: '📞' },
          ].map(({ val, label, icon }, i) => (
            <div key={label} style={{ padding: '36px 24px', textAlign: 'center', borderRight: i < 3 ? '1px solid #e8f0fb' : 'none' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#1a3a6b', fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.02em' }}>{val}</div>
              <div style={{ fontSize: 12, color: '#6b7a99', marginTop: 4, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INTRO ── */}
      <section style={{ background: '#f4f8ff', borderBottom: '1px solid #e8f0fb', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <span className="section-label">About Smart POS</span>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#1a3a6b', marginBottom: 20 }}>
            Looking for a Retail, Restaurant or Hotel POS System in Kenya?
          </h2>
          <p style={{ maxWidth: 720, margin: '0 auto 40px', fontSize: 16, color: '#4a5568', lineHeight: 1.75 }}>
            Smart POS is an affordable, reliable and easy to use point of sale system designed for Kenyan businesses. Whether you run a supermarket, restaurant, bar, wines & spirits outlet or any retail shop — we have a solution built for you.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => scrollTo('features')}>Our POS Solutions</button>
            <button className="btn-primary" onClick={() => scrollTo('pricing')}>Check Price</button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="section-label">Our POS Software Solutions</span>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 3vw, 36px)', color: '#1a3a6b' }}>
              A System Built for Every Kenyan Business
            </h2>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="feature-card" style={{ background: '#fff', border: '1px solid #e8f0fb', borderTop: '3px solid #1a3a6b', borderRadius: 6, padding: '32px 24px' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#1a3a6b', marginBottom: 12, lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: '#6b7a99', lineHeight: 1.65 }}>{desc}</p>
                <button onClick={() => router.push('/register')} style={{ marginTop: 20, background: 'none', border: 'none', color: '#e8891a', fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Learn More →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL BLEED BANNER ── */}
      <div style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1601598851547-4302969d0614?w=1600&q=85&auto=format&fit=crop"
          alt="Kenyan shop"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15,35,71,0.92) 45%, rgba(15,35,71,0.4))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ maxWidth: 560 }}>
            <span className="section-label" style={{ background: '#e8891a' }}>Designed for Kenya</span>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 4vw, 48px)', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
              Beautiful. Easy to Use.<br />Reliable.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.78)', lineHeight: 1.75, marginBottom: 32, maxWidth: 460 }}>
              Our interface is designed so that new staff can be trained in minutes. Supports M-Pesa, cash, credit card and credit payments. Works even when internet or power goes out.
            </p>
            <button className="btn-primary" onClick={() => router.push('/register')}>
              Start Free Trial
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: '#f4f8ff', padding: '80px 24px', borderTop: '1px solid #e8f0fb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="section-label">Client Testimonials</span>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 3vw, 36px)', color: '#1a3a6b' }}>
              What Our Clients Say
            </h2>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <div key={name} style={{ background: '#fff', border: '1px solid #e8f0fb', borderRadius: 6, padding: '36px 32px', boxShadow: '0 4px 20px rgba(26,58,107,0.06)' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
                  {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#e8891a', fontSize: 16 }}>★</span>)}
                </div>
                <p style={{ fontSize: 14.5, color: '#4a5568', lineHeight: 1.8, marginBottom: 28, fontStyle: 'italic' }}>"{quote}"</p>
                <div style={{ borderTop: '1px solid #e8f0fb', paddingTop: 20 }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: '#1a3a6b' }}>{name}</div>
                  <div style={{ fontSize: 12, color: '#6b7a99', marginTop: 3 }}>{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: '#fff', padding: '80px 24px', borderTop: '1px solid #e8f0fb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="section-label">Pricing in Kenya Shillings</span>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 3vw, 36px)', color: '#1a3a6b', marginBottom: 12 }}>
              Affordable Plans for Every Business
            </h2>
            <p style={{ fontSize: 15, color: '#6b7a99' }}>Start with a 14-day free trial. No credit card required.</p>
          </div>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 960, margin: '0 auto' }}>
            {PLANS.map(plan => (
              <div key={plan.id} className="plan-card" style={{
                padding: '40px 32px',
                background: plan.highlight ? '#1a3a6b' : '#fff',
                border: plan.highlight ? '2px solid #1a3a6b' : '1px solid #e8f0fb',
                borderRadius: 6, position: 'relative',
                boxShadow: plan.highlight ? '0 20px 48px rgba(26,58,107,0.25)' : '0 4px 20px rgba(26,58,107,0.05)',
              }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#e8891a', color: '#fff', padding: '5px 18px', borderRadius: 3, fontSize: 10, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    Most Popular
                  </div>
                )}
                <div style={{ fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: plan.highlight ? '#8ca5cc' : '#6b7a99', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>{plan.name}</div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: plan.highlight ? '#fff' : '#1a3a6b', fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.02em' }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: plan.highlight ? '#8ca5cc' : '#6b7a99', marginLeft: 4 }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 13, color: plan.highlight ? '#a8c0e0' : '#6b7a99', marginBottom: 28, lineHeight: 1.6 }}>{plan.desc}</p>
                <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: plan.highlight ? '#d0e0f5' : '#4a5568' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: plan.highlight ? 'rgba(232,137,26,0.2)' : 'rgba(26,58,107,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="10" height="10" fill="none" stroke={plan.highlight ? '#e8891a' : '#1a3a6b'} strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => router.push(`/register?plan=${plan.id}`)} style={{
                  width: '100%', padding: '13px', border: 'none', borderRadius: 4,
                  cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 800,
                  background: plan.highlight ? '#e8891a' : '#1a3a6b',
                  color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'opacity 0.15s',
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
      <div style={{ background: 'linear-gradient(135deg, #e8891a, #c97615)', padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(26px, 4vw, 44px)', color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>
            Ready to Modernise Your Business?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 36, lineHeight: 1.7 }}>
            Join hundreds of Kenyan businesses already using Smart POS. 14 days free, no card needed.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/register')} style={{ padding: '14px 32px', background: '#fff', color: '#e8891a', border: 'none', borderRadius: 4, fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Start Free Trial
            </button>
            <a href="tel:+254701059192" style={{ padding: '14px 32px', background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.7)', borderRadius: 4, fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              📞 Call Us Now
            </a>
          </div>
        </div>
      </div>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ background: '#f4f8ff', padding: '80px 24px', borderTop: '1px solid #e8f0fb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="section-label">Get In Touch</span>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 3vw, 36px)', color: '#1a3a6b' }}>
              Contact Us Today
            </h2>
          </div>
          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }}>
            {[
              { icon: '📞', label: 'Phone', value: '+254 701 059 192', sub: 'Mon – Sat, 8AM – 6PM', href: 'tel:+254701059192' },
              { icon: '✉️', label: 'Email', value: 'support@zetupos.co.ke', sub: 'Reply within a few hours', href: 'mailto:support@zetupos.co.ke' },
              { icon: '💬', label: 'WhatsApp', value: '+254 701 059 192', sub: 'Quick chat responses', href: 'https://wa.me/254701059192' },
            ].map(({ icon, label, value, sub, href }) => (
              <a key={label} href={href} target={label === 'WhatsApp' ? '_blank' : undefined} rel="noopener noreferrer"
                style={{ display: 'block', background: '#fff', border: '1px solid #e8f0fb', borderRadius: 6, padding: '36px 28px', textAlign: 'center', transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s', color: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8891a'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,58,107,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8f0fb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
                <div style={{ fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#e8891a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Montserrat', sans-serif", color: '#1a3a6b', marginBottom: 6 }}>{value}</div>
                <div style={{ fontSize: 12, color: '#6b7a99' }}>{sub}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0f2347', borderTop: '3px solid #e8891a' }}>
        <div className="footer-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, background: '#e8891a', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff' }}>Smart POS</div>
                <div style={{ fontSize: 10, color: '#e8891a', fontFamily: "'Open Sans', sans-serif", fontWeight: 600 }}>by Zetu Business Solutions</div>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: '#8ca5cc', lineHeight: 1.75, maxWidth: 300 }}>
              Affordable, reliable and easy to use POS system built for Kenyan businesses. Works on any device, even offline.
            </p>
            <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#e8891a', fontSize: 13 }}>★</span>)}
              <span style={{ fontSize: 12, color: '#6b7a99', marginLeft: 6 }}>Reliable · Affordable · Easy to Use</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#4a6a99', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Product</div>
            {['Features', 'Pricing', 'Sign In', 'Register'].map(l => (
              <div key={l} style={{ marginBottom: 12 }}>
                <button onClick={() => { if (l === 'Sign In') router.push('/login'); else if (l === 'Register') router.push('/register'); else scrollTo(l.toLowerCase()); }}
                  style={{ background: 'none', border: 'none', color: '#8ca5cc', fontSize: 13.5, fontFamily: "'Open Sans', sans-serif", cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e8891a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#8ca5cc')}>{l}</button>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#4a6a99', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Contact</div>
            {[
              { label: '+254 701 059 192', href: 'tel:+254701059192' },
              { label: 'support@zetupos.co.ke', href: 'mailto:support@zetupos.co.ke' },
              { label: 'WhatsApp Us', href: 'https://wa.me/254701059192' },
            ].map(({ label, href }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <a href={href} style={{ color: '#8ca5cc', fontSize: 13.5, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e8891a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#8ca5cc')}>{label}</a>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', maxWidth: 1200, margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#4a6a99' }}>© 2025 Zetu Business Solutions Ltd · Nairobi, Kenya</span>
          <span style={{ fontSize: 12, color: '#4a6a99' }}>Built for Kenyan Businesses</span>
        </div>
      </footer>
    </>
  )
}
