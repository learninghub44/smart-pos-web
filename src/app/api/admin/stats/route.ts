import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [overview, planBreakdown, recentTenants, revenueByMonth] = await Promise.all([
    queryOne<any>(`
      SELECT
        COUNT(*)::int                                            AS total_tenants,
        COUNT(*) FILTER (WHERE status = 'active')::int         AS active_tenants,
        COUNT(*) FILTER (WHERE status = 'trial')::int          AS trial_tenants,
        COUNT(*) FILTER (WHERE status = 'suspended')::int      AS suspended_tenants,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int      AS cancelled_tenants
      FROM tenants
    `),

    query<any>(`
      SELECT t.plan_id, p.name, COUNT(*)::int AS count
      FROM tenants t JOIN plans p ON p.id = t.plan_id
      WHERE t.status IN ('active','trial')
      GROUP BY t.plan_id, p.name
      ORDER BY count DESC
    `),

    query<any>(`
      SELECT t.id, t.business_name, t.email, t.plan_id, t.status, t.trial_ends_at, t.created_at,
             p.name AS plan_name
      FROM tenants t JOIN plans p ON p.id = t.plan_id
      ORDER BY t.created_at DESC LIMIT 20
    `),

    query<any>(`
      SELECT DATE_TRUNC('month', created_at) AS month,
             SUM(amount)::int AS revenue,
             COUNT(*)::int AS payments
      FROM invoices WHERE status = 'paid'
      GROUP BY 1 ORDER BY 1 DESC LIMIT 12
    `),
  ])

  // MRR = sum of active monthly subscriptions
  const mrr = await queryOne<any>(`
    SELECT COALESCE(SUM(s.amount_paid), 0)::int AS mrr
    FROM subscriptions s
    JOIN tenants t ON t.id = s.tenant_id
    WHERE s.status = 'active' AND s.billing_type = 'monthly'
      AND t.status = 'active'
  `)

  return NextResponse.json({
    overview,
    mrr: mrr?.mrr || 0,
    planBreakdown,
    recentTenants,
    revenueByMonth,
  })
}
