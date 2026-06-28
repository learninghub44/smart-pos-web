'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingCart, Eye, EyeOff, Check } from 'lucide-react'

const PLANS = [
  { id: 'starter', name: 'Starter', monthly: 250, color: '#3b82f6' },
  { id: 'business', name: 'Business', monthly: 999, color: '#8b5cf6' },
  { id: 'enterprise', name: 'Enterprise', monthly: 2000, color: '#f59e0b' },
  { id: 'lifetime', name: 'Lifetime', monthly: null, lifetime: 16000, color: '#10b981' },
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
      width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#f1f5f9',
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

      // Free trial — go straight to dashboard
      if (form.planId === 'starter' || true) {
        router.push('/dashboard')
        return
      }
    } catch {
      setError('Network error. Please try again.'); setLoading(false)
    }
  }

  const labelStyle = { display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 500 }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
            <ShoppingCart size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create your account</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Start your 14-day free trial · No credit card needed</p>
        </div>

        {/* Plan selector */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Choose your plan</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {PLANS.map(plan => (
              <button key={plan.id} onClick={() => setForm(f => ({ ...f, planId: plan.id, billing: plan.id === 'lifetime' ? 'lifetime' : f.billing }))}
                style={{ padding: '0.625rem 0.75rem', background: form.planId === plan.id ? `${plan.color}20` : 'transparent', border: `1px solid ${form.planId === plan.id ? plan.color : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: form.planId === plan.id ? plan.color : '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{plan.name}</span>
                <span style={{ fontWeight: 700 }}>
                  {plan.id === 'lifetime' ? `KES ${plan.lifetime?.toLocaleString()}` : `KES ${plan.monthly}/mo`}
                </span>
              </button>
            ))}
          </div>
          <div style={{ background: `${selectedPlan.color}15`, border: `1px solid ${selectedPlan.color}40`, borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: selectedPlan.color, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={13} strokeWidth={2.5} />
            {selectedPlan.id === 'lifetime' ? `One-time KES ${selectedPlan.lifetime?.toLocaleString()} — pay after trial` : `14-day free trial, then KES ${selectedPlan.monthly}/month`}
          </div>
        </div>

        {/* Form */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', color: '#fca5a5', fontSize: '0.85rem' }}>
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
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Confirm Password *</label>
            <input {...inp('confirm')} type="password" placeholder="Repeat password" />
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '0.875rem', background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none', borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.25rem' }}>
            {loading ? 'Creating account…' : 'Create Account & Start Trial'}
          </button>

          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            Already have an account?{' '}
            <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem' }}>Sign in</button>
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
