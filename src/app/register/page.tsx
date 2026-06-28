'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingCart, Eye, EyeOff, Check, ArrowRight } from 'lucide-react'

const PLANS = [
  { id: 'starter', name: 'Starter', monthly: 250, color: '#2F8F5B' },
  { id: 'business', name: 'Business', monthly: 999, color: '#C97F1E' },
  { id: 'enterprise', name: 'Enterprise', monthly: 2000, color: '#16243F' },
  { id: 'lifetime', name: 'Lifetime', monthly: null, lifetime: 16000, color: '#8B5A2B' },
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
    billing: (params.get('billing') || 'monthly') as 'monthly' | 'lifetime',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedPlan = PLANS.find(p => p.id === form.planId) || PLANS[0]

  const inp = (field: string) => ({
    value: (form as any)[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value })),
    style: {
      width: '100%', padding: '0.75rem', background: '#FFFCF6',
      border: '1px solid #E4DCC8', borderRadius: 8, color: '#1B2A41',
      fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
    },
  })

  const handleSubmit = async () => {
    if (!form.businessName || !form.name || !form.email || !form.password) {
      setError('Please fill in all required fields'); return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters'); return
    }
    setError(''); setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          planId: form.planId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return }

      if (form.planId === 'starter' || true) {
        router.push('/dashboard')
        return
      }
    } catch {
      setError('Network error. Please try again.'); setLoading(false)
    }
  }

  const labelStyle = { display: 'block', fontSize: '0.8rem', color: '#5B5346', marginBottom: '0.4rem', fontWeight: 600 }

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7EF', color: '#1B2A41', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>
      <div style={{ width: '100%', maxWidth: 540 }}>
        {/* Masthead */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{ width: 50, height: 50, background: '#E8A23D', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <ShoppingCart size={24} color="#16243F" />
          </div>
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#C97F1E' }}>Smart POS · Issue No. 02</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '2rem', letterSpacing: '-0.01em', color: '#16243F' }}>Create your account</h1>
          <p style={{ color: '#7A7164', fontSize: '0.9rem', marginTop: '0.4rem' }}>Start your 14-day free trial · No credit card needed · Works on phone, tablet or desktop</p>
        </div>

        {/* Plan selector */}
        <div style={{ background: '#F3EEE2', border: '1px solid #E4DCC8', borderRadius: 12, padding: '1.4rem', marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Choose your plan</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
            {PLANS.map(plan => (
              <button key={plan.id} onClick={() => setForm(f => ({ ...f, planId: plan.id, billing: plan.id === 'lifetime' ? 'lifetime' : f.billing }))}
                style={{ padding: '0.65rem 0.8rem', background: form.planId === plan.id ? `${plan.color}1A` : '#FFFCF6', border: `1px solid ${form.planId === plan.id ? plan.color : '#E4DCC8'}`, borderRadius: 8, color: form.planId === plan.id ? plan.color : '#7A7164', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{plan.name}</span>
                <span style={{ fontWeight: 700 }}>
                  {plan.id === 'lifetime' ? `KES ${plan.lifetime?.toLocaleString()}` : `KES ${plan.monthly}/mo`}
                </span>
              </button>
            ))}
          </div>
          <div style={{ background: `${selectedPlan.color}14`, border: `1px solid ${selectedPlan.color}40`, borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.8rem', color: selectedPlan.color, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
            <Check size={13} strokeWidth={2.5} />
            {selectedPlan.id === 'lifetime' ? `One-time KES ${selectedPlan.lifetime?.toLocaleString()} — pay after trial` : `14-day free trial, then KES ${selectedPlan.monthly}/month`}
          </div>
        </div>

        {/* Form card */}
        <div style={{ background: '#fff', border: '1px solid #E4DCC8', borderRadius: 12, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', boxShadow: '0 4px 24px rgba(27,42,65,0.05)' }}>
          {error && (
            <div style={{ background: '#FDEFEC', border: '1px solid #F3C7BC', borderRadius: 8, padding: '0.75rem', color: '#B23A2E', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>Business / Shop Name *</label>
            <input {...inp('businessName')} placeholder="e.g. Kamau Supermarket" />
          </div>
          <div>
            <label style={labelStyle}>Your Full Name *</label>
            <input {...inp('name')} placeholder="John Kamau" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Email *</label>
              <input {...inp('email')} type="email" placeholder="john@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Phone (optional)</label>
              <input {...inp('phone')} placeholder="+254 700 000 000" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input {...inp('password')} type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" style={{ ...inp('password').style, paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#A89B82', cursor: 'pointer', padding: 0 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Confirm Password *</label>
            <input {...inp('confirm')} type="password" placeholder="Repeat password" />
          </div>

          <button onClick={handleSubmit} disabled={loading} className="flex items-center justify-center gap-2" style={{ width: '100%', padding: '0.9rem', background: loading ? '#D9A24A' : '#E8A23D', color: '#16243F', border: 'none', borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.25rem' }}>
            {loading ? 'Creating account…' : <>Create Account & Start Trial <ArrowRight size={16} /></>}
          </button>

          <p style={{ textAlign: 'center', color: '#A89B82', fontSize: '0.8rem' }}>
            Already have an account?{' '}
            <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: '#C97F1E', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Sign in</button>
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
