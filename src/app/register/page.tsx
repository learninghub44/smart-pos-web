'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Eye, EyeOff, ArrowRight, Check,
  CheckCircle, AlertCircle, Zap, Shield, Users
} from 'lucide-react'

const PLANS = [
  { id: 'starter', name: 'Starter', price: 'KES 250/mo', color: '#1a3a6b', features: ['1 Branch', '3 Staff', '500 Products'] },
  { id: 'business', name: 'Business', price: 'KES 999/mo', color: '#e8891a', features: ['5 Branches', '15 Staff', '5,000 Products'] },
  { id: 'enterprise', name: 'Enterprise', price: 'KES 2,000/mo', color: '#0f2347', features: ['Unlimited Branches', 'Unlimited Staff', 'Unlimited Products'] },
  { id: 'lifetime', name: 'Lifetime', price: 'KES 16,000 once', color: '#2d7a55', features: ['All Business Features', 'Lifetime Updates', 'No Monthly Fees'] },
]

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [form, setForm] = useState({
    businessName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    planId: params.get('plan') || 'starter',
  })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedPlan = PLANS.find(p => p.id === form.planId) || PLANS[0]

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.businessName || !form.name || !form.email || !form.password) {
      setError('Please fill in all required fields'); return
    }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: form.businessName, name: form.name, email: form.email, phone: form.phone, password: form.password, planId: form.planId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return }
      // Always redirect to billing — trial starts only after first payment
      router.push('/billing?onboarding=1')
    } catch {
      setError('Network error. Please try again.'); setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif", background: '#f8faff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        input { font-family: 'Inter', sans-serif; }
        .inp {
          width: 100%; padding: 12px 14px;
          background: #fff; border: 1.5px solid #e4ecf8;
          border-radius: 8px; color: #1a3a6b;
          font-size: 13.5px; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .inp:focus { border-color: #1a3a6b; box-shadow: 0 0 0 3px rgba(26,58,107,0.1); }
        .inp::placeholder { color: #a0aec0; }
        .plan-btn { transition: all 0.18s; cursor: pointer; border: none; }
        .plan-btn:hover { transform: translateY(-1px); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .left-panel { display: flex; }
        @media (max-width: 960px) { .left-panel { display: none !important; } .mobile-logo { display: flex !important; } .mobile-plans { display: grid !important; } }
        .mobile-logo { display: none; }
        .mobile-plans { display: none; }
      `}</style>

      {/* ── LEFT: PLAN PANEL ── */}
      <div className="left-panel" style={{ width: '38%', background: 'linear-gradient(155deg, #1a3a6b 0%, #0a1b3c 100%)', padding: '52px 40px', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,137,26,0.22), transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,82,152,0.3), transparent 65%)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 6, display: 'inline-flex', alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            <img src="/logo-zetu-icon.png" alt="POS Zetu" style={{ height: 32, width: 'auto' }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.02em' }}>POS ZETU</div>
            <div style={{ fontSize: 9.5, color: '#4d9fff', fontWeight: 600, letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>poszetupos.co.ke</div>
          </div>
        </div>

        {/* Plan picker */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#e8891a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Choose Your Plan
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 28, color: '#fff', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
              Start with a<br /><span style={{ color: '#e8891a' }}>14-day free trial</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLANS.map(plan => {
              const active = form.planId === plan.id
              return (
                <button key={plan.id} className="plan-btn"
                  onClick={() => setForm(f => ({ ...f, planId: plan.id }))}
                  style={{
                    padding: '14px 18px', borderRadius: 8,
                    borderColor: active ? plan.color : 'transparent',
                    borderWidth: '1.5px', borderStyle: 'solid',
                    background: active ? `${plan.color}` : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: active ? `0 4px 16px rgba(0,0,0,0.25)` : 'none',
                  }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13.5, color: '#fff', marginBottom: 2, letterSpacing: '-0.01em' }}>{plan.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{plan.features[0]} · {plan.features[1]}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: active ? '#fff' : '#e8891a' }}>{plan.price}</span>
                    {active && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#e8891a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Trust line */}
        <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { Icon: Shield, label: 'No credit card required' },
            { Icon: Zap, label: 'Cancel anytime' },
            { Icon: Users, label: 'Setup in under 5 minutes' },
          ].map(({ Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={13} color="#e8891a" strokeWidth={2.5} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: FORM ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* Mobile logo */}
          <div className="mobile-logo" style={{ alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <img src="/logo-zetu-icon.png" alt="POS Zetu" style={{ height: 30, width: 'auto' }} />
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#1a3a6b', letterSpacing: '-0.01em' }}>POS ZETU</div>
              <div style={{ fontSize: 9.5, color: '#1d6fe0', fontWeight: 600, letterSpacing: '0.06em' }}>poszetupos.co.ke</div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff8f0', border: '1px solid #fde0b8', borderRadius: 20, padding: '4px 12px', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#e8891a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {selectedPlan.name} Plan · 14-day Free Trial
              </span>
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 32, color: '#1a3a6b', letterSpacing: '-0.025em', marginBottom: 6 }}>Create Your Account</h1>
            <p style={{ color: '#6b7a99', fontSize: 14.5, lineHeight: 1.6 }}>No credit card needed. Cancel anytime.</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={15} color="#dc2626" strokeWidth={2} />
              <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Form card */}
          <div style={{ background: '#fff', border: '1.5px solid #e4ecf8', borderRadius: 12, padding: '30px', boxShadow: '0 4px 24px rgba(26,58,107,0.07)', display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Business / Shop Name *
              </label>
              <input className="inp" value={form.businessName} onChange={set('businessName')} placeholder="e.g. Kamau Supermarket" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Full Name *
              </label>
              <input className="inp" value={form.name} onChange={set('name')} placeholder="John Kamau" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email *
                </label>
                <input className="inp" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Phone
                </label>
                <input className="inp" value={form.phone} onChange={set('phone')} placeholder="+254 700 000 000" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input className="inp" type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min. 8 characters" style={{ paddingRight: 46 }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                  {showPass ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input className="inp" type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder="Repeat your password" style={{ paddingRight: 46 }} />
                <button type="button" onClick={() => setShowConfirm(s => !s)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                  {showConfirm ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
            </div>

            {/* Mobile plan selector */}
            <div className="mobile-plans" style={{ background: '#f8faff', border: '1.5px solid #e4ecf8', borderRadius: 8, padding: '16px', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PLANS.map(plan => (
                <button key={plan.id} onClick={() => setForm(f => ({ ...f, planId: plan.id }))}
                  style={{ padding: '10px 12px', border: '1.5px solid', borderRadius: 7, cursor: 'pointer', textAlign: 'left', background: form.planId === plan.id ? plan.color : '#fff', borderColor: form.planId === plan.id ? plan.color : '#e4ecf8', transition: 'all 0.15s' }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: form.planId === plan.id ? '#fff' : '#1a3a6b' }}>{plan.name}</div>
                  <div style={{ fontSize: 10, color: form.planId === plan.id ? 'rgba(255,255,255,0.7)' : '#6b7a99', marginTop: 2 }}>{plan.price}</div>
                </button>
              ))}
            </div>

            <button onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 800,
              background: loading ? '#94a3b8' : '#e8891a',
              color: '#fff', letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4, transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(232,137,26,0.35)',
            }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#c97615'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = loading ? '#94a3b8' : '#e8891a'; e.currentTarget.style.transform = 'none' }}>
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating Account…
                </>
              ) : (
                <>Create Account & Start Trial <ArrowRight size={15} strokeWidth={2.5} /></>
              )}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13.5, color: '#6b7a99', marginTop: 20 }}>
            Already have an account?{' '}
            <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: '#e8891a', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, cursor: 'pointer', fontSize: 13.5, letterSpacing: '-0.01em' }}>
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
