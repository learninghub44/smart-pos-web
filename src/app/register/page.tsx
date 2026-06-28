'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'

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
      router.push('/dashboard')
    } catch {
      setError('Network error. Please try again.'); setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Open Sans', system-ui, sans-serif", background: '#f4f8ff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        input { font-family: 'Open Sans', sans-serif; }
        .inp {
          width: 100%; padding: 12px 14px;
          background: #fff; border: 1px solid #d0dff5;
          border-radius: 4px; color: #1a3a6b;
          font-size: 13.5px; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .inp:focus { border-color: #1a3a6b; box-shadow: 0 0 0 3px rgba(26,58,107,0.1); background: #fff; }
        .inp::placeholder { color: #a0aec0; }
        .plan-btn { transition: all 0.18s; cursor: pointer; }
        .plan-btn:hover { transform: translateY(-1px); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ── LEFT: PLAN SELECTION PANEL ── */}
      <div style={{ width: '40%', background: '#1a3a6b', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}
        className="hidden lg:flex">
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,137,26,0.25), transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,137,26,0.12), transparent 65%)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 46, height: 46, background: '#e8891a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }} stroke="#fff" strokeWidth="2.2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#fff' }}>Smart POS</div>
            <div style={{ fontSize: 10, color: '#e8891a', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>by Zetu Business Solutions</div>
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#e8891a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Choose Your Plan
            </div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 28, color: '#fff', lineHeight: 1.15 }}>
              Start with a<br /><span style={{ color: '#e8891a' }}>14-day free trial</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLANS.map(plan => (
              <button key={plan.id} className="plan-btn" onClick={() => setForm(f => ({ ...f, planId: plan.id }))}
                style={{
                  padding: '14px 18px', borderRadius: 6, border: '1px solid',
                  borderColor: form.planId === plan.id ? plan.color : 'rgba(255,255,255,0.15)',
                  background: form.planId === plan.id ? `${plan.color}` : 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: form.planId === plan.id ? `0 4px 16px rgba(0,0,0,0.3)` : 'none',
                }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 2 }}>{plan.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{plan.features[0]} · {plan.features[1]}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#e8891a' }}>{plan.price}</span>
                  {form.planId === plan.id && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#e8891a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom trust */}
        <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {['✅ No credit card', '✅ Cancel anytime', '✅ Setup in minutes'].map(t => (
              <span key={t} style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: FORM ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }} className="lg:hidden">
            <div style={{ width: 38, height: 38, background: '#e8891a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }} stroke="#fff" strokeWidth="2.2">
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
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-block', background: '#fff3e0', border: '1px solid #fbbf72', borderRadius: 3, padding: '4px 12px', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#e8891a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {selectedPlan.name} Plan · 14-day Free Trial
              </span>
            </div>
            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 30, color: '#1a3a6b', letterSpacing: '-0.01em', marginBottom: 6 }}>Create Your Account</h1>
            <p style={{ color: '#6b7a99', fontSize: 14, lineHeight: 1.6 }}>No credit card needed. Cancel anytime.</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="15" height="15" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <div style={{ background: '#fff', border: '1px solid #d0dff5', borderRadius: 6, padding: '28px', boxShadow: '0 4px 24px rgba(26,58,107,0.07)', display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#1a3a6b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Business / Shop Name *
              </label>
              <input className="inp" value={form.businessName} onChange={set('businessName')} placeholder="e.g. Kamau Supermarket" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#1a3a6b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your Full Name *
              </label>
              <input className="inp" value={form.name} onChange={set('name')} placeholder="John Kamau" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#1a3a6b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Email *
                </label>
                <input className="inp" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#1a3a6b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Phone
                </label>
                <input className="inp" value={form.phone} onChange={set('phone')} placeholder="+254 700 000 000" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#1a3a6b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input className="inp" type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min. 8 characters" style={{ paddingRight: 46 }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: 2 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#1a3a6b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input className="inp" type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder="Repeat your password" style={{ paddingRight: 46 }} />
                <button type="button" onClick={() => setShowConfirm(s => !s)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: 2 }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Mobile plan selector */}
            <div style={{ background: '#f4f8ff', border: '1px solid #d0dff5', borderRadius: 4, padding: '14px 16px' }} className="lg:hidden">
              <label style={{ display: 'block', fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#1a3a6b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Select Plan
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PLANS.map(plan => (
                  <button key={plan.id} onClick={() => setForm(f => ({ ...f, planId: plan.id }))}
                    style={{ padding: '10px 12px', border: '1px solid', borderRadius: 4, cursor: 'pointer', textAlign: 'left', background: form.planId === plan.id ? plan.color : '#fff', borderColor: form.planId === plan.id ? plan.color : '#d0dff5' }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12, color: form.planId === plan.id ? '#fff' : '#1a3a6b' }}>{plan.name}</div>
                    <div style={{ fontSize: 10, color: form.planId === plan.id ? 'rgba(255,255,255,0.7)' : '#6b7a99', marginTop: 2 }}>{plan.price}</div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 800,
              background: loading ? '#6b7a99' : '#e8891a',
              color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4, transition: 'background 0.2s',
            }}>
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating Account…
                </>
              ) : (
                <>Create Account & Start Trial <ArrowRight size={15} /></>
              )}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7a99', marginTop: 20 }}>
            Already have an account?{' '}
            <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: '#e8891a', fontFamily: "'Montserrat', sans-serif", fontWeight: 800, cursor: 'pointer', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sign In
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .hidden { display: none !important; }
          .lg\\:hidden { display: block !important; }
        }
        .lg\\:hidden { display: none; }
      `}</style>
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
