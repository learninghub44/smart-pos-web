import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyPassword, signToken, makeCookie, isTenantActive, DUMMY_HASH } from '@/lib/tenant-auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const emailLower = email.trim().toLowerCase()
    const ip = getClientIp(req)

    // Rate limit by IP AND by email separately — IP limit stops a single
    // attacker hammering many accounts, email limit stops distributed
    // attempts (botnet) against one account.
    const limited = await checkRateLimit([
      { key: `login:ip:${ip}`, maxHits: 20, windowMs: 15 * 60 * 1000 },
      { key: `login:email:${emailLower}`, maxHits: 8, windowMs: 15 * 60 * 1000 },
    ])
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const user = await queryOne<any>(`
      SELECT tu.*, t.status as tenant_status, t.plan_id, t.business_name,
             t.trial_ends_at, t.currency, t.logo_url, b.name as branch_name
      FROM tenant_users tu
      JOIN tenants t ON t.id = tu.tenant_id
      LEFT JOIN branches b ON b.id = tu.branch_id
      WHERE tu.email = $1 AND tu.is_active = true
    `, [emailLower])

    // Always run bcrypt.compare — against the real hash if the user exists,
    // against a fixed dummy hash if not — so response time doesn't reveal
    // whether an email is registered. Both branches must genuinely await
    // verifyPassword; do not short-circuit before it.
    const valid = await verifyPassword(password, user?.password_hash || DUMMY_HASH)

    if (!user || !valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const blocked = ['suspended', 'cancelled']
    const tenantExpired =
      !isTenantActive({ status: user.tenant_status, trial_ends_at: user.trial_ends_at }) &&
      user.tenant_status !== 'pending_payment'

    if (blocked.includes(user.tenant_status) || tenantExpired) {
      return NextResponse.json({
        error: 'Your subscription has expired. Please renew to continue.',
        code: 'SUBSCRIPTION_EXPIRED',
      }, { status: 403 })
    }

    await queryOne(
      'UPDATE tenant_users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    )

    const token = signToken({ userId: user.id, tenantId: user.tenant_id, role: user.role, tenantStatus: user.tenant_status })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id,
        branch_name: user.branch_name,
        business_name: user.business_name,
        plan_id: user.plan_id,
        currency: user.currency,
        tenant_status: user.tenant_status,
        trial_ends_at: user.trial_ends_at,
        logo_url: user.logo_url,
      },
    })
    response.headers.set('Set-Cookie', makeCookie(token))
    return response

  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 })
  }
}
