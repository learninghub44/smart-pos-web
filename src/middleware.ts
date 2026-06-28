import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

/**
 * Middleware – runs at the Edge before any page/API handler.
 *
 * Rules:
 *  • /admin/dashboard and /admin/tenants require a valid `smartpos_admin`
 *    cookie whose JWT payload has role === 'super_admin'.
 *    Any other visitor is redirected to /admin (the login page).
 *
 *  • /dashboard (and all tenant pages) require a valid `smartpos_token`
 *    cookie (any role).  If absent → redirect to /login.
 *
 *  • Everything else (public pages, API routes) passes through untouched.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── 1. Protect super-admin pages ──────────────────────────────
  const isAdminPage =
    pathname.startsWith('/admin/dashboard') ||
    pathname.startsWith('/admin/tenants')

  if (isAdminPage) {
    const adminToken = getCookie(req, 'smartpos_admin')
    if (!adminToken || !(await hasRole(adminToken, 'super_admin'))) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // ── 2. Protect tenant/business pages ─────────────────────────
  const isTenantPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/pos') ||
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/sales-history') ||
    pathname.startsWith('/customers') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/branches') ||
    pathname.startsWith('/suppliers') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/brands') ||
    pathname.startsWith('/returns') ||
    pathname.startsWith('/receipts') ||
    pathname.startsWith('/inventory-count') ||
    pathname.startsWith('/billing') ||
    pathname.startsWith('/support')

  if (isTenantPage) {
    const tenantToken = getCookie(req, 'smartpos_token')
    if (!tenantToken || !(await isValidToken(tenantToken))) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // If the tenant hasn't paid yet, send them to billing (except /billing itself)
    if (!pathname.startsWith('/billing')) {
      const payload = await verifyJwt(tenantToken)
      if (payload?.tenantStatus === 'pending_payment') {
        const billingUrl = req.nextUrl.clone()
        billingUrl.pathname = '/billing'
        billingUrl.searchParams.set('onboarding', '1')
        return NextResponse.redirect(billingUrl)
      }
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

// ── Helpers ───────────────────────────────────────────────────

function getCookie(req: NextRequest, name: string): string | null {
  const header = req.headers.get('cookie') || ''
  const match = header.split(';').find(c => c.trim().startsWith(name + '='))
  return match ? match.split('=').slice(1).join('=').trim() : null
}

async function verifyJwt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

async function hasRole(token: string, role: string): Promise<boolean> {
  const payload = await verifyJwt(token)
  return payload?.role === role
}

async function isValidToken(token: string): Promise<boolean> {
  const payload = await verifyJwt(token)
  return payload !== null
}

// Only run middleware on page routes (not static files / _next internals)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|logo|.*\\.(?:png|jpg|jpeg|svg|ico|webp)).*)',
  ],
}
