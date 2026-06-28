import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/tenant-auth'

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register',
  '/api/billing/webhook', '/_next', '/favicon.ico', '/file.svg', '/globe.svg', '/next.svg',
  '/window.svg', '/vercel.svg']

const ADMIN_PATHS = ['/admin', '/api/admin']

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

  const payload = verifyToken(cookie)
  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('smartpos_token')
    return res
  }

  // Attach tenant info to headers for server components
  const res = NextResponse.next()
  res.headers.set('x-tenant-id', payload.tenantId)
  res.headers.set('x-user-id', payload.userId)
  res.headers.set('x-user-role', payload.role)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
