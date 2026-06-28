import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/tenant-auth'
import { queryOne } from '@/lib/db'
import { initializePayment, generateRef, PLAN_AMOUNTS } from '@/lib/paystack'

export async function POST(req: NextRequest) {
  const user = await getSessionFromCookie(req.headers.get('cookie'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId, billingType } = await req.json()
  // billingType: 'monthly' | 'lifetime'

  const plan = await queryOne<any>('SELECT * FROM plans WHERE id = $1', [planId])
  if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const amounts = PLAN_AMOUNTS[planId]
  if (!amounts) return NextResponse.json({ error: 'Plan pricing not configured' }, { status: 400 })

  const isLifetime = billingType === 'lifetime' || planId === 'lifetime'
  const amountKobo = isLifetime ? amounts.once : amounts.monthly

  if (amountKobo === 0) {
    return NextResponse.json({ error: 'This plan has no charge' }, { status: 400 })
  }

  const tenant = await queryOne<any>('SELECT email FROM tenants WHERE id = $1', [user.tenant_id])
  const reference = generateRef(user.tenant_id, isLifetime ? 'LTM' : 'SUB')

  // Store pending invoice
  await queryOne(`
    INSERT INTO invoices (tenant_id, amount, status, paystack_ref, period_start, period_end)
    VALUES ($1, $2, 'pending', $3, NOW(), NOW() + INTERVAL '1 month')
  `, [user.tenant_id, amountKobo / 100, reference])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const result = await initializePayment({
    email: tenant.email,
    amountKobo,
    reference,
    callbackUrl: `${appUrl}/api/billing/verify?ref=${reference}`,
    metadata: {
      tenant_id: user.tenant_id,
      plan_id: planId,
      billing_type: isLifetime ? 'lifetime' : 'monthly',
      user_id: user.id,
    },
  })

  if (!result.status) {
    return NextResponse.json({ error: result.message || 'Payment initialization failed' }, { status: 500 })
  }

  return NextResponse.json({
    authorizationUrl: result.data.authorization_url,
    reference,
  })
}
