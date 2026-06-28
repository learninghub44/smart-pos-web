import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { validateWebhook } from '@/lib/paystack'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature') || ''

  if (!validateWebhook(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const { event: eventType, data } = event

  try {
    switch (eventType) {

      // ── Recurring charge succeeded ────────────────────────
      case 'charge.success': {
        const ref = data.reference
        const meta = data.metadata
        const tenantId = meta?.tenant_id
        if (!tenantId) break

        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + 1)

        // Record invoice
        await query(`
          INSERT INTO invoices (tenant_id, amount, status, paystack_ref, period_start, period_end, paystack_event)
          VALUES ($1, $2, 'paid', $3, $4, $5, $6)
          ON CONFLICT (paystack_ref) DO UPDATE SET status = 'paid', paystack_event = EXCLUDED.paystack_event
        `, [tenantId, data.amount / 100, ref,
            now.toISOString(), periodEnd.toISOString(), JSON.stringify(data)])

        // Extend subscription
        await query(`
          UPDATE subscriptions
          SET current_period_end = $1, status = 'active', updated_at = NOW()
          WHERE tenant_id = $2 AND status IN ('active','past_due')
        `, [periodEnd.toISOString(), tenantId])

        // Ensure tenant is active
        await query(
          `UPDATE tenants SET status = 'active', updated_at = NOW() WHERE id = $1`,
          [tenantId]
        )
        break
      }

      // ── Recurring charge failed ───────────────────────────
      case 'charge.failed':
      case 'subscription.not_renew': {
        const tenantId = data.metadata?.tenant_id
        if (!tenantId) break
        await query(`
          UPDATE subscriptions SET status = 'past_due', updated_at = NOW()
          WHERE tenant_id = $1
        `, [tenantId])
        break
      }

      // ── Subscription disabled ─────────────────────────────
      case 'subscription.disable': {
        const tenantId = data.metadata?.tenant_id
        if (!tenantId) break
        await query(`
          UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
          WHERE tenant_id = $1
        `, [tenantId])
        await query(`
          UPDATE tenants SET status = 'cancelled', updated_at = NOW() WHERE id = $1
        `, [tenantId])
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
