'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import {
  Eye, EyeOff, ArrowRight, ShoppingCart,
  Smartphone, GitBranch, CreditCard, Printer,
  Star, AlertCircle
} from 'lucide-react'
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
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        input { font-family: 'Inter', sans-serif; }
        .inp {
          width: 100%; padding: 13px 16px;
          background: #f8faff; border: 1.5px solid #e4ecf8;
          border-radius: 8px; color: #1a3a6b;
          font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .inp:focus { border-color: #1a3a6b; box-shadow: 0 0 0 3px rgba(26,58,107,0.1); background: #fff; }
        .inp::placeholder { color: #a0aec0; }
        .chip { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .left-panel { display: flex; }
        @media (max-width: 960px) { .left-panel { display: none !important; } .mobile-logo { display: flex !important; } }
        .mobile-logo { display: none; }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="left-panel" style={{ width: '46%', background: 'linear-gradient(155deg, #1a3a6b 0%, #0a1b3c 100%)', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, right: -80, width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,137,26,0.2), transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,82,152,0.4), transparent 65%)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 48, height: 48, background: '#e8891a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(232,137,26,0.4)' }}>
            <ShoppingCart size={22} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.02em' }}>Smart POS</div>
            <div style={{ fontSize: 10, color: '#e8891a', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>by Zetu Business Solutions</div>
          </div>
        </div>

        {/* Main copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,137,26,0.15)', border: '1px solid rgba(232,137,26,0.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ color: '#e8891a', fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Kenya's Leading POS
            </span>
          </div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 'clamp(34px, 3.5vw, 50px)', color: '#fff', lineHeight: 1.08, marginBottom: 18, letterSpacing: '-0.025em' }}>
            Sell Smarter.<br />
            <span style={{ color: '#e8891a' }}>Track Everything.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.8, maxWidth: 380, marginBottom: 40 }}>
            Your complete point of sale system for retail, restaurants, hotels and bars across Kenya.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { Icon: Smartphone, label: 'Works on Any Phone' },
              { Icon: GitBranch, label: 'Multi-Branch Ready' },
              { Icon: CreditCard, label: 'M-Pesa Supported' },
              { Icon: Printer, label: 'Thermal Printing' },
            ].map(({ Icon, label }) => (
              <div key={label} className="chip">
                <div style={{ width: 34, height: 34, borderRadius: 7, background: 'rgba(232,137,26,0.15)', border: '1px solid rgba(232,137,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color="#e8891a" strokeWidth={2} />
                </div>
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.82)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, lineHeight: 1.3 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rating footer */}
        <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
          <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={14} color="#e8891a" fill="#e8891a" />)}
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginLeft: 8, fontWeight: 500 }}>500+ verified clients</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: 1.6 }}>
            "Reliable, affordable and very easy to use. Highly recommended for Kenyan businesses."
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div className="mobile-logo" style={{ alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{ width: 40, height: 40, background: '#e8891a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={18} color="#fff" strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#1a3a6b', letterSpacing: '-0.01em' }}>Smart POS</div>
              <div style={{ fontSize: 9.5, color: '#e8891a', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>by Zetu Business Solutions</div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff8f0', border: '1px solid #fde0b8', borderRadius: 20, padding: '4px 12px', marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#e8891a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Welcome Back</span>
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 34, color: '#1a3a6b', letterSpacing: '-0.025em', marginBottom: 8 }}>Sign In</h1>
            <p style={{ color: '#6b7a99', fontSize: 14.5, lineHeight: 1.6 }}>Pick up right where your business left off.</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={16} color="#dc2626" strokeWidth={2} />
              <span style={{ fontSize: 13.5, color: '#dc2626', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#374151', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#374151', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Password
                </label>
              </div>
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
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14.5, fontWeight: 800,
              background: loading ? '#94a3b8' : '#1a3a6b',
              color: '#fff', letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 14px rgba(26,58,107,0.3)',
            }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#122d55'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = loading ? '#94a3b8' : '#1a3a6b'; e.currentTarget.style.transform = 'none' }}>
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight size={16} strokeWidth={2.5} /></>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#f0f4fd' }} />
            <span style={{ fontSize: 12, color: '#a0aec0', fontWeight: 500 }}>New to Smart POS?</span>
            <div style={{ flex: 1, height: 1, background: '#f0f4fd' }} />
          </div>

          <Link href="/register" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '13px', border: '1.5px solid #e8891a',
            borderRadius: 8, color: '#e8891a', background: 'transparent',
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 800,
            letterSpacing: '-0.01em', transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e8891a'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e8891a' }}>
            Start 14-Day Free Trial
          </Link>

          <p style={{ textAlign: 'center', fontSize: 12.5, color: '#a0aec0', marginTop: 24, lineHeight: 1.6 }}>
            14-day free trial · No credit card needed · Setup in minutes
          </p>
        </div>
      </div>
    </div>
  )
}
