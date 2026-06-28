import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { verifyPassword, signToken, makeCookie, isTenantActive } from '@/lib/tenant-auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const emailLower = email.trim().toLowerCase()

    // Find user with tenant info
    const user = await queryOne<any>(`
      SELECT tu.*, t.status as tenant_status, t.plan_id, t.business_name,
             t.trial_ends_at, t.currency, t.logo_url, b.name as branch_name
      FROM tenant_users tu
      JOIN tenants t ON t.id = tu.tenant_id
      LEFT JOIN branches b ON b.id = tu.branch_id
      WHERE tu.email = $1 AND tu.is_active = true
    `, [emailLower])

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Allow pending_payment tenants to log in so they can reach billing.
    // Block only expired/cancelled/suspended tenants.
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

    // Update last login
    await queryOne(
      'UPDATE tenant_users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    )

    // Embed tenantStatus so the middleware can redirect without a DB call
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
