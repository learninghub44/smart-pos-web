import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register',
  '/api/billing/webhook', '/api/health', '/_next', '/favicon.ico', '/file.svg', '/globe.svg', '/next.svg',
  '/window.svg', '/vercel.svg']

const ADMIN_PATHS = ['/admin', '/api/admin']

/** Verify a HS256 JWT using the Web Crypto API (Edge-compatible, no Node built-ins) */
async function verifyJwt(token: string, secret: string): Promise<{ userId?: string; tenantId?: string; role?: string } | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // Import the key
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // Verify signature
    const signingInput = enc.encode(`${parts[0]}.${parts[1]}`)
    const signatureBytes = Uint8Array.from(
      atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    )
    const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, signingInput)
    if (!valid) return null

    // Decode and check expiry
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null

    return payload
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  const cookie = req.cookies.get('smartpos_token')?.value
  if (!cookie) return NextResponse.redirect(new URL('/login', req.url))

  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production'
  const payload = await verifyJwt(cookie, secret)

  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('smartpos_token')
    return res
  }

  const res = NextResponse.next()
  if (payload.tenantId) res.headers.set('x-tenant-id', payload.tenantId)
  if (payload.userId) res.headers.set('x-user-id', payload.userId)
  if (payload.role) res.headers.set('x-user-role', payload.role)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
