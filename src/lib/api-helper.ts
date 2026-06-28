import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, TenantUser, isTenantActive, getTenant } from './tenant-auth'

export async function requireAuth(req: NextRequest): Promise<
  { user: TenantUser; error?: never } | { user?: never; error: NextResponse }
> {
  const cookie = req.headers.get('cookie')
  const user = await getSessionFromCookie(cookie)
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  // pending_payment tenants can only access billing routes
  const pathname = req.nextUrl.pathname
  const tenant = await getTenant(user.tenant_id)
  if (!tenant) {
    return { error: NextResponse.json({ error: 'Tenant not found' }, { status: 404 }) }
  }

  if (tenant.status === 'pending_payment') {
    const isBillingRoute = pathname.startsWith('/api/billing') || pathname.startsWith('/api/auth') || pathname.startsWith('/api/tenant')
    if (!isBillingRoute) {
      return { error: NextResponse.json({ error: 'Payment required', code: 'PAYMENT_REQUIRED' }, { status: 403 }) }
    }
    return { user }
  }

  if (!isTenantActive(tenant)) {
    return { error: NextResponse.json({ error: 'Subscription expired', code: 'SUBSCRIPTION_EXPIRED' }, { status: 403 }) }
  }

  return { user }
}

export function ok(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
