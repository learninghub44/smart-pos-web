'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    if (result.success) router.push('/dashboard')
    else {
      if ((result as any).code === 'SUBSCRIPTION_EXPIRED') router.push('/billing')
      else setError(result.error || 'Invalid email or password')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Open Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        input { font-family: 'Open Sans', sans-serif; }
        .inp {
          width: 100%; padding: 13px 16px;
          background: #f4f8ff; border: 1px solid #d0dff5;
          border-radius: 4px; color: #1a3a6b;
          font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .inp:focus { border-color: #1a3a6b; box-shadow: 0 0 0 3px rgba(26,58,107,0.1); }
        .inp::placeholder { color: #a0aec0; }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={{ width: '48%', background: 'linear-gradient(160deg, #1a3a6b 0%, #0f2347 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 56px', position: 'relative', overflow: 'hidden' }}
        className="hidden lg:flex">
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -120, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,137,26,0.2), transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,137,26,0.1), transparent 65%)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 46, height: 46, background: '#e8891a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(232,137,26,0.4)' }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }} stroke="#fff" strokeWidth="2.2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', lineHeight: 1.1 }}>Smart POS</div>
            <div style={{ fontSize: 10, color: '#e8891a', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>by Zetu Business Solutions</div>
          </div>
        </div>

        {/* Main copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', background: 'rgba(232,137,26,0.2)', border: '1px solid rgba(232,137,26,0.35)', borderRadius: 3, padding: '5px 14px', marginBottom: 28 }}>
            <span style={{ color: '#e8891a', fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Kenya's Leading POS
            </span>
          </div>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 'clamp(32px, 3.5vw, 48px)', color: '#fff', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.01em' }}>
            Sell Smarter.<br />
            <span style={{ color: '#e8891a' }}>Track Everything.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 1.75, maxWidth: 380, marginBottom: 40 }}>
            Your complete point of sale system for retail, restaurants, hotels and bars across Kenya.
          </p>

          {/* Feature chips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: '📱', label: 'Works on Any Phone' },
              { icon: '🏪', label: 'Multi-Branch Ready' },
              { icon: '💳', label: 'M-Pesa Supported' },
              { icon: '🖨️', label: 'Thermal Printing' },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stars / rating */}
        <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
          <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
            {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#e8891a', fontSize: 16 }}>★</span>)}
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>
            "Reliable, affordable and very easy to use. Highly recommended for Kenyan businesses."
          </p>
          <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>— 500+ Verified Clients</div>
        </div>
      </div>

      {/* ── RIGHT PANEL (FORM) ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }} className="lg:hidden">
            <div style={{ width: 40, height: 40, background: '#e8891a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }} stroke="#fff" strokeWidth="2.2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#1a3a6b' }}>Smart POS</div>
              <div style={{ fontSize: 10, color: '#e8891a', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>by Zetu Business Solutions</div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'inline-block', background: '#fff3e0', border: '1px solid #fbbf72', borderRadius: 3, padding: '4px 12px', marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#e8891a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Welcome Back</span>
            </div>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 32, color: '#1a3a6b', letterSpacing: '-0.01em', marginBottom: 8 }}>Sign In</h1>
            <p style={{ color: '#6b7a99', fontSize: 14, lineHeight: 1.6 }}>Pick up right where your business left off.</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: 13.5, color: '#dc2626', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1a3a6b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email Address
              </label>
              <input
                className="inp"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: '#1a3a6b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="inp"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ paddingRight: 48 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: 2 }}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 800,
              background: loading ? '#6b7a99' : '#1a3a6b',
              color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
            }}>
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e8f0fb' }} />
            <span style={{ fontSize: 12, color: '#a0aec0', fontWeight: 500 }}>New to Smart POS?</span>
            <div style={{ flex: 1, height: 1, background: '#e8f0fb' }} />
          </div>

          <Link href="/register" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '13px', border: '2px solid #e8891a',
            borderRadius: 4, color: '#e8891a', background: 'transparent',
            fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.07em', transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e8891a'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e8891a' }}>
            Start Free Trial
          </Link>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#a0aec0', marginTop: 24 }}>
            14-day free trial · No credit card needed · Setup in minutes
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 1024px) { .hidden { display: none !important; } }
        .lg\\:hidden { display: none; }
        @media (max-width: 1024px) { .lg\\:hidden { display: flex !important; } }
      `}</style>
    </div>
  )
}
