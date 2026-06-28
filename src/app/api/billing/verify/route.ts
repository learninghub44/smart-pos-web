import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyTransaction } from '@/lib/paystack'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.redirect(new URL('/billing?error=missing_ref', req.url))

  try {
    const result = await verifyTransaction(ref)

    if (!result.status || result.data?.status !== 'success') {
      return NextResponse.redirect(new URL('/billing?error=payment_failed', req.url))
    }

    const meta = result.data.metadata
    const tenantId = meta?.tenant_id
    const planId = meta?.plan_id
    const billingType = meta?.billing_type || 'monthly'
    const amountPaid = result.data.amount / 100 // convert from kobo

    if (!tenantId || !planId) {
      return NextResponse.redirect(new URL('/billing?error=invalid_meta', req.url))
    }

    // Check not already processed
    const invoice = await queryOne<any>(
      'SELECT * FROM invoices WHERE paystack_ref = $1', [ref]
    )
    if (invoice?.status === 'paid') {
      return NextResponse.redirect(new URL('/billing?success=already_active', req.url))
    }

    const now = new Date()
    const periodEnd = new Date(now)
    if (billingType === 'lifetime') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 100)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // Update invoice
    await query(`
      UPDATE invoices
      SET status = 'paid', paystack_event = $1, period_start = $2, period_end = $3
      WHERE paystack_ref = $4
    `, [JSON.stringify(result.data), now.toISOString(), periodEnd.toISOString(), ref])

    // Upsert subscription
    const existingSub = await queryOne<any>(
      'SELECT id FROM subscriptions WHERE tenant_id = $1 AND status != $2',
      [tenantId, 'cancelled']
    )

    if (existingSub) {
      await query(`
        UPDATE subscriptions
        SET plan_id = $1, billing_type = $2, amount_paid = $3,
            paystack_ref = $4, current_period_start = $5,
            current_period_end = $6, status = $7, updated_at = NOW()
        WHERE id = $8
      `, [planId, billingType, amountPaid, ref, now.toISOString(),
          periodEnd.toISOString(),
          billingType === 'lifetime' ? 'lifetime' : 'active',
          existingSub.id])
    } else {
      await query(`
        INSERT INTO subscriptions
          (tenant_id, plan_id, billing_type, amount_paid, paystack_ref,
           current_period_start, current_period_end, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [tenantId, planId, billingType, amountPaid, ref,
          now.toISOString(), periodEnd.toISOString(),
          billingType === 'lifetime' ? 'lifetime' : 'active'])
    }

    // Activate tenant
    await query(`
      UPDATE tenants
      SET status = 'active', plan_id = $1, trial_ends_at = NULL, updated_at = NOW()
      WHERE id = $2
    `, [planId, tenantId])

    return NextResponse.redirect(new URL('/billing?success=activated', req.url))

  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.redirect(new URL('/billing?error=server_error', req.url))
  }
}
