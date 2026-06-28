import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register',
  '/api/billing/webhook', '/api/health', '/_next', '/favicon.ico', '/file.svg', '/globe.svg', '/next.svg',
  '/window.svg', '/vercel.svg']

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

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production'

  // ── 1. Super-admin pages — require smartpos_admin cookie with role=super_admin ──
  const isAdminPage =
    pathname.startsWith('/admin/dashboard') ||
    pathname.startsWith('/admin/tenants') ||
    pathname.startsWith('/api/admin')

  if (isAdminPage) {
    const adminToken = req.cookies.get('smartpos_admin')?.value
    if (!adminToken) return NextResponse.redirect(new URL('/admin', req.url))
    const payload = await verifyJwt(adminToken, secret)
    if (!payload || payload.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.next()
  }

  // ── 2. Public paths pass through ──
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  // ── 3. All other paths require a valid tenant token ──
  const cookie = req.cookies.get('smartpos_token')?.value
  if (!cookie) return NextResponse.redirect(new URL('/login', req.url))

  const payload = await verifyJwt(cookie, secret)
  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('smartpos_token')
    return res
  }

  // ── 4. Pending-payment tenants can only access /billing ──
  if (payload.tenantStatus === 'pending_payment' && !pathname.startsWith('/billing')) {
    return NextResponse.redirect(new URL('/billing?onboarding=1', req.url))
  }

  const res = NextResponse.next()
  if (payload.tenantId) res.headers.set('x-tenant-id', payload.tenantId as string)
  if (payload.userId) res.headers.set('x-user-id', payload.userId as string)
  if (payload.role) res.headers.set('x-user-role', payload.role as string)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
