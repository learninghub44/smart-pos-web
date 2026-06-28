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

  const inputStyle = { background: '#FFFCF6', border: '1px solid #E4DCC8', color: '#1B2A41', caretColor: '#C97F1E' }
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.border = '1px solid #C97F1E'; e.target.style.boxShadow = '0 0 0 3px rgba(201,127,30,0.12)' }
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.border = '1px solid #E4DCC8'; e.target.style.boxShadow = 'none' }

  return (
    <div className="min-h-screen flex" style={{ background: '#FBF7EF', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,900&family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* ── Editorial side panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-14" style={{ background: '#16243F', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,162,61,0.18), transparent 70%)' }} />

        <div className="flex items-center gap-3" style={{ zIndex: 1 }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#E8A23D' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="#16243F" strokeWidth="2.2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>Smart POS</div>
            <div className="text-xs font-medium" style={{ color: '#E8A23D' }}>by Zetu Business Solutions</div>
          </div>
        </div>

        <div style={{ zIndex: 1 }}>
          <div className="inline-block text-xs font-semibold tracking-widest uppercase mb-6 px-3 py-1 rounded-full"
            style={{ background: 'rgba(232,162,61,0.15)', color: '#E8A23D' }}>Point of Sale, Issue No. 01</div>
          <h2 className="leading-tight mb-6" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '3.1rem', color: '#FBF7EF', letterSpacing: '-0.01em' }}>
            Sell smarter.<br />Track everything.
          </h2>
          <p style={{ color: '#AEB9CC', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: 380 }}>
            Inventory, sales, receipts and reports — all in one place, on any screen you&apos;ve got.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4" style={{ zIndex: 1 }}>
          {[{ label: 'Works on Phone', icon: '📱' }, { label: 'Multi-Branch', icon: '🏪' }, { label: 'Thermal Print', icon: '🖨️' }].map(item => (
            <div key={item.label} className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-xs font-medium" style={{ color: '#8C97AD' }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', zIndex: 1 }}>
          <span className="text-xs" style={{ color: '#5B677F' }}>Powered by</span>
          <span className="text-xs font-semibold" style={{ color: '#8C97AD' }}>Zetu Business Solutions</span>
        </div>
      </div>

      {/* ── Form side ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#E8A23D' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#16243F" strokeWidth="2.2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-base leading-tight" style={{ color: '#16243F' }}>Smart POS</div>
              <div className="text-xs" style={{ color: '#C97F1E' }}>by Zetu Business Solutions</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#C97F1E' }}>Welcome back</div>
            <h1 className="mb-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '2.3rem', color: '#16243F', letterSpacing: '-0.01em' }}>Sign in</h1>
            <p style={{ color: '#7A7164' }}>Pick up right where your shop left off.</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg mb-6 text-sm"
              style={{ background: '#FDEFEC', border: '1px solid #F3C7BC', color: '#B23A2E' }}>
              <span className="mt-0.5">⚠</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#5B5346' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#5B5346' }}>Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" required className="w-full px-4 py-3 pr-12 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded" style={{ color: '#A89B82' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg text-sm font-semibold transition-all mt-2 flex items-center justify-center gap-2"
              style={{ background: loading ? '#D9A24A' : '#E8A23D', color: '#16243F', opacity: loading ? 0.8 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Signing in…</span>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs mt-8" style={{ color: '#A89B82' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#C97F1E', fontWeight: 600 }}>Start free trial</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
