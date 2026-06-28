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

  // Check tenant is still active
  const tenant = await getTenant(user.tenant_id)
  if (!tenant || !isTenantActive(tenant)) {
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
