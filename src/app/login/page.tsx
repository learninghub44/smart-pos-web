'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { Eye, EyeOff, ShoppingBag } from 'lucide-react'

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

    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Invalid email or password')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0f172a' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 60%)',
          borderRight: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: '#3b82f6' }}
          >
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Smart POS</span>
        </div>

        {/* Center statement */}
        <div>
          <div
            className="inline-block text-xs font-semibold tracking-widest uppercase mb-6 px-3 py-1 rounded-full"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
          >
            Point of Sale
          </div>
          <h2
            className="text-5xl font-bold leading-tight mb-6"
            style={{ color: '#f8fafc', letterSpacing: '-0.02em' }}
          >
            Sell smarter.<br />
            Track everything.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.7' }}>
            Inventory, sales, receipts, and reports — all in one place, even offline.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'M-Pesa Ready', value: '✓' },
            { label: 'Works Offline', value: '✓' },
            { label: 'Thermal Print', value: '✓' },
          ].map(item => (
            <div
              key={item.label}
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-xl font-bold mb-1" style={{ color: '#3b82f6' }}>{item.value}</div>
              <div className="text-xs" style={{ color: '#64748b' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: '#3b82f6' }}
            >
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">Smart POS</span>
          </div>

          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}
            >
              Welcome back
            </h1>
            <p style={{ color: '#64748b' }}>Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-sm"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5'
              }}
            >
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#94a3b8' }}
                htmlFor="email"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9',
                  caretColor: '#3b82f6'
                }}
                onFocus={e => {
                  e.target.style.border = '1px solid #3b82f6'
                  e.target.style.background = 'rgba(59,130,246,0.07)'
                }}
                onBlur={e => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.1)'
                  e.target.style.background = 'rgba(255,255,255,0.05)'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#94a3b8' }}
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f1f5f9',
                    caretColor: '#3b82f6'
                  }}
                  onFocus={e => {
                    e.target.style.border = '1px solid #3b82f6'
                    e.target.style.background = 'rgba(59,130,246,0.07)'
                  }}
                  onBlur={e => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.1)'
                    e.target.style.background = 'rgba(255,255,255,0.05)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                  style={{ color: '#475569' }}
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all mt-2"
              style={{
                background: loading ? '#1e40af' : '#3b82f6',
                color: '#fff',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.01em'
              }}
            >
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

          {/* Footer */}
          <p
            className="text-center text-xs mt-8"
            style={{ color: '#334155' }}
          >
            Smart POS · Kadem Business Solutions
          </p>
        </div>
      </div>
    </div>
  )
}
