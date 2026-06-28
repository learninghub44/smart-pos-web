'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

function SuccessContent() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const ref = params.get('ref') || params.get('reference')
    if (ref) {
      fetch(`/api/billing/verify?ref=${ref}`).catch(() => {})
    }
    const t = setTimeout(() => router.push('/dashboard'), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Payment Successful!</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Your subscription is now active. Redirecting to your dashboard…</p>
        <div style={{ width: 48, height: 48, border: '3px solid #1e293b', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}

export default function BillingSuccessPage() {
  return <Suspense><SuccessContent /></Suspense>
}
