import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import {
  hashPassword, signToken, makeCookie, generateSlug,
} from '@/lib/tenant-auth'

export async function POST(req: NextRequest) {
  try {
    const { businessName, email, password, phone, planId } = await req.json()

    // Validation
    if (!businessName || !email || !password) {
      return NextResponse.json({ error: 'Business name, email and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const emailLower = email.trim().toLowerCase()
    const plan = planId || 'starter'

    // Check email not already taken
    const existing = await queryOne(
      'SELECT id FROM tenants WHERE email = $1', [emailLower]
    )
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // Check plan exists
    const planRow = await queryOne('SELECT * FROM plans WHERE id = $1 AND is_active = true', [plan])
    if (!planRow) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)
    const slug = generateSlug(businessName)

    // Trial: 14 days
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    // Create tenant
    const tenant = await queryOne<any>(`
      INSERT INTO tenants (business_name, slug, email, phone, plan_id, trial_ends_at, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'trial')
      RETURNING *
    `, [businessName.trim(), slug, emailLower, phone || null, plan, trialEndsAt.toISOString()])

    // Create default branch
    const branch = await queryOne<any>(`
      INSERT INTO branches (tenant_id, name, location, is_active)
      VALUES ($1, 'Main Branch', '', true)
      RETURNING id
    `, [tenant.id])

    // Create owner user
    const user = await queryOne<any>(`
      INSERT INTO tenant_users (tenant_id, name, email, password_hash, role, branch_id)
      VALUES ($1, $2, $3, $4, 'owner', $5)
      RETURNING id, tenant_id, name, email, role
    `, [tenant.id, businessName.trim(), emailLower, passwordHash, branch?.id || null])

    // Insert default settings for the tenant
    await query(`
      INSERT INTO settings (tenant_id, key, value) VALUES
      ($1, 'business', $2),
      ($1, 'receipt',  $3),
      ($1, 'loyalty',  $4),
      ($1, 'tax',      $5)
      ON CONFLICT (tenant_id, key) DO NOTHING
    `, [
      tenant.id,
      JSON.stringify({ name: businessName.trim(), address: '', phone: phone || '', email: emailLower, currency: 'KES' }),
      JSON.stringify({ footer: 'Thank you for your purchase!', paper_size: '80mm', auto_print: false }),
      JSON.stringify({ points_per_currency: 0.01, redemption_rate: 0.01, enabled: true }),
      JSON.stringify({ vat_rate: 16, enabled: false }),
    ])

    // Sign JWT
    const token = signToken({ userId: user.id, tenantId: tenant.id, role: user.role })

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tenant_id: tenant.id },
      tenant: { id: tenant.id, business_name: tenant.business_name, slug: tenant.slug, plan_id: plan },
      trialEndsAt: trialEndsAt.toISOString(),
      // If plan is NOT lifetime/paid, redirect to dashboard (trial)
      // If paid plan selected, redirect to payment
      requiresPayment: plan !== 'starter' || false,
    })
    response.headers.set('Set-Cookie', makeCookie(token))
    return response

  } catch (err: any) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
