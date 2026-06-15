'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { Eye, EyeOff } from 'lucide-react'

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
    if (result.success) { router.push('/dashboard') }
    else { setError(result.error || 'Invalid email or password') }
    setLoading(false)
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f5f9',
    caretColor: '#3b82f6'
  }
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.border = '1px solid #3b82f6'
    e.target.style.background = 'rgba(59,130,246,0.07)'
  }
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.border = '1px solid rgba(255,255,255,0.1)'
    e.target.style.background = 'rgba(255,255,255,0.05)'
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0f172a' }}>

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 60%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">Smart POS</div>
            <div className="text-xs font-medium" style={{ color: '#60a5fa' }}>by Zetu Business Solutions</div>
          </div>
        </div>

        {/* Hero copy */}
        <div>
          <div className="inline-block text-xs font-semibold tracking-widest uppercase mb-6 px-3 py-1 rounded-full"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
            Point of Sale System
          </div>
          <h2 className="text-5xl font-bold leading-tight mb-6"
            style={{ color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Sell smarter.<br />Track everything.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.7' }}>
            Inventory, sales, receipts, and reports — all in one place, even offline.
          </p>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'M-Pesa Ready', icon: '📱' },
            { label: 'Works Offline', icon: '📶' },
            { label: 'Thermal Print', icon: '🖨️' },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-xs font-medium" style={{ color: '#64748b' }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Brand footer */}
        <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-xs" style={{ color: '#334155' }}>Powered by</span>
          <span className="text-xs font-semibold" style={{ color: '#475569' }}>Zetu Business Solutions</span>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight">Smart POS</div>
              <div className="text-xs" style={{ color: '#60a5fa' }}>by Zetu Business Solutions</div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p style={{ color: '#64748b' }}>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" required autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded" style={{ color: '#475569' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all mt-2"
              style={{ background: loading ? '#1e40af' : '#3b82f6', color: '#fff', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs mt-8" style={{ color: '#334155' }}>
            Smart POS · <span style={{ color: '#475569' }}>Zetu Business Solutions</span>
          </p>
        </div>
      </div>
    </div>
  )
}
