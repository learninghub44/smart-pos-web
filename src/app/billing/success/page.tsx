'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

function SuccessContent() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const ref = params.get('ref') || params.get('reference')
    if (ref) fetch(`/api/billing/verify?ref=${ref}`).catch(() => {})
    const t = setTimeout(() => router.push('/dashboard'), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, padding: 40 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '40px 48px', textAlign: 'center', maxWidth: 420 }}>
        <CheckCircle size={48} color="var(--green)" style={{ margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt-1)', margin: '0 0 10px' }}>Payment Successful!</h1>
        <p style={{ fontSize: 13, color: 'var(--txt-2)', marginBottom: 24, lineHeight: 1.6 }}>
          Your account is now active. Redirecting you to the dashboard…
        </p>
        <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTop: `3px solid var(--xl-green)`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}

export default function BillingSuccessPage() {
  return <Suspense><SuccessContent /></Suspense>
}
