import { NextRequest, NextResponse } from 'next/server'

// Routes that don't need authentication
const PUBLIC_ROUTES = new Set(['/', '/login', '/register', '/billing/success'])
const PUBLIC_PREFIXES = ['/api/auth/', '/api/billing/webhook', '/_next/', '/favicon', '/logo', '/icon', '/images']

// Admin-only routes
const ADMIN_PREFIXES = ['/admin', '/api/admin']

// Routes available to pending_payment tenants
const BILLING_ROUTES = new Set(['/billing', '/api/billing/initialize', '/api/billing/invoices', '/api/tenant/plan', '/api/auth/me', '/api/auth/logout'])

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow public assets and auth routes
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (PUBLIC_ROUTES.has(pathname)) return NextResponse.next()

  // Parse JWT from cookie — fast path, no DB call
  const cookie = req.cookies.get('smartpos_token')?.value
  const adminCookie = req.cookies.get('smartpos_admin')?.value

  // Admin routes
  if (ADMIN_PREFIXES.some(p => pathname.startsWith(p))) {
    if (!adminCookie) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.next()
  }

  // All other routes require a user cookie
  if (!cookie) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Decode JWT payload without verification (verification happens in API routes via getSessionFromCookie)
  // This is purely for routing decisions — not a security boundary
  try {
    const [, payloadB64] = cookie.split('.')
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))

    // Expired token
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Session expired' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', req.url))
      response.cookies.delete('smartpos_token')
      return response
    }

    // Pending payment: only billing routes allowed
    if (payload.tenantStatus === 'pending_payment') {
      const isBillingRoute = BILLING_ROUTES.has(pathname) || pathname.startsWith('/api/billing') || pathname.startsWith('/api/tenant')
      if (!isBillingRoute) {
        if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Payment required', code: 'PAYMENT_REQUIRED' }, { status: 403 })
        return NextResponse.redirect(new URL('/billing?onboarding=1', req.url))
      }
    }

    // Suspended / cancelled
    if (['suspended', 'cancelled'].includes(payload.tenantStatus || '')) {
      if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
        return NextResponse.json({ error: 'Subscription expired' }, { status: 403 })
      }
      if (!pathname.startsWith('/billing') && !pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/billing', req.url))
      }
    }
  } catch {
    // Malformed token — clear it and redirect to login
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', req.url))
    response.cookies.delete('smartpos_token')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.*|icon.*|images/.*).*)',
  ],
}
