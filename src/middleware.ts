import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/', '/login', '/register', '/billing/success',
  '/api/auth/login', '/api/auth/register', '/api/auth/logout',
  '/api/billing/webhook', '/api/health',
  '/_next', '/favicon.ico', '/file.svg', '/globe.svg',
  '/next.svg', '/window.svg', '/vercel.svg',
  '/logo', '/icon', '/images',
]

/** Verify a HS256 JWT using the Web Crypto API (Edge-compatible, no Node built-ins) */
async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signingInput = enc.encode(`${parts[0]}.${parts[1]}`)
    const signatureBytes = Uint8Array.from(
      atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    )
    const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, signingInput)
    if (!valid) return null

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null

    return payload
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const secret = process.env.JWT_SECRET

  // No fallback: a hardcoded default here would let anyone reading this
  // public repo forge valid tokens for any deployment that forgot to set
  // the real secret. Public paths still pass through below (no point
  // breaking the login page itself), but anything requiring a verified
  // token fails closed instead of silently trusting a known-to-everyone key.
  if (!secret) {
    console.error('JWT_SECRET is not set — rejecting all authenticated requests.')
  }

  // ── 1. Super-admin pages ──────────────────────────────────────
  const isAdminPage =
    pathname.startsWith('/admin/dashboard') ||
    pathname.startsWith('/admin/tenants') ||
    pathname.startsWith('/api/admin')

  if (isAdminPage) {
    const adminToken = req.cookies.get('smartpos_admin')?.value
    if (!adminToken) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    const payload = secret ? await verifyJwt(adminToken, secret) : null
    if (!payload || payload.role !== 'super_admin') {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.next()
  }

  // ── 2. Public paths pass through ─────────────────────────────
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  // ── 3. All other paths require a valid tenant token ──────────
  const cookie = req.cookies.get('smartpos_token')?.value
  if (!cookie) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = secret ? await verifyJwt(cookie, secret) : null
  if (!payload) {
    const res = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Session expired' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('smartpos_token')
    return res
  }

  // ── 4. Suspended / cancelled tenants → billing only ──────────
  if (['suspended', 'cancelled'].includes(payload.tenantStatus as string)) {
    if (!pathname.startsWith('/billing') && !pathname.startsWith('/api/billing') && !pathname.startsWith('/api/auth')) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Subscription expired' }, { status: 403 })
      return NextResponse.redirect(new URL('/billing', req.url))
    }
  }

  // ── 5. Pending-payment tenants → billing only ────────────────
  if (payload.tenantStatus === 'pending_payment') {
    const billingOk = pathname.startsWith('/billing') || pathname.startsWith('/api/billing') ||
      pathname.startsWith('/api/tenant') || pathname.startsWith('/api/auth')
    if (!billingOk) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Payment required', code: 'PAYMENT_REQUIRED' }, { status: 403 })
      return NextResponse.redirect(new URL('/billing?onboarding=1', req.url))
    }
  }

  // NOTE: tenant/user context is intentionally NOT forwarded via headers
  // here. `res.headers.set(...)` on a NextResponse.next() result sets
  // headers on the outgoing response to the browser, not on the request
  // reaching the route handler — so a previous version of this code was
  // both a no-op (nothing read those headers) and an info leak (it exposed
  // tenant_id/user_id/role in every response). Every API route re-verifies
  // the session from the cookie itself (see requireAuth in api-helper.ts),
  // which is also the safer pattern: route handlers should never trust
  // headers that could, on a misconfigured deploy, be reachable without
  // passing through this middleware.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
