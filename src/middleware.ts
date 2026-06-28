import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register',
  '/api/billing/webhook', '/_next', '/favicon.ico', '/file.svg', '/globe.svg', '/next.svg',
  '/window.svg', '/vercel.svg']

const ADMIN_PATHS = ['/admin', '/api/admin']

/** Lightweight Edge-compatible JWT decode (no signature verify — just read payload). 
 *  Full signature verification happens in API routes via jsonwebtoken on Node runtime. */
function decodeJwtPayload(token: string): { userId?: string; tenantId?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(payload)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow admin routes — they have their own smartpos_admin cookie auth
  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  // Require auth for everything else
  const cookie = req.cookies.get('smartpos_token')?.value
  if (!cookie) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const payload = decodeJwtPayload(cookie)
  if (!payload || !payload.userId || (payload.exp && payload.exp * 1000 < Date.now())) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('smartpos_token')
    return res
  }

  // Attach tenant info to headers for server components
  const res = NextResponse.next()
  if (payload.tenantId) res.headers.set('x-tenant-id', payload.tenantId)
  if (payload.userId) res.headers.set('x-user-id', payload.userId)
  if (payload.role) res.headers.set('x-user-role', payload.role)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
