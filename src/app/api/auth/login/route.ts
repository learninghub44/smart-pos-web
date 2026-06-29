import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyPassword, signToken, makeCookie, isTenantActive } from '@/lib/tenant-auth'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Rate limit: max 10 login attempts per IP per 15 minutes
  const ip = getClientIp(req)
  if (isRateLimited(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const email    = typeof body.email    === 'string' ? body.email.trim().toLowerCase()  : ''
    const password = typeof body.password === 'string' ? body.password                    : ''

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    if (email.length > 254 || password.length > 256) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
    }

    const user = await queryOne<any>(`
      SELECT tu.*, t.status as tenant_status, t.plan_id, t.business_name,
             t.trial_ends_at, t.currency, t.logo_url, b.name as branch_name
      FROM tenant_users tu
      JOIN tenants t ON t.id = tu.tenant_id
      LEFT JOIN branches b ON b.id = tu.branch_id
      WHERE tu.email = $1 AND tu.is_active = true
    `, [email])

    // Constant-time: always verify even when user is null to prevent timing attacks
    const hash = user?.password_hash || '$2a$12$LCKz2tqFfuMzOoKFQMCLZeYoX3kZGZ5Lx8FZkH1mN2oP3qR4sT5uV'
    let valid = false
    try { valid = await verifyPassword(password, hash) } catch { valid = false }

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

    const token = signToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      tenantStatus: user.tenant_status,
    })

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
