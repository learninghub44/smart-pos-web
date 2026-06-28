import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/tenant-auth'
import { query, queryOne } from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getSessionFromCookie(req.headers.get('cookie'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [tenant, subscription, invoices] = await Promise.all([
    queryOne<any>(`
      SELECT t.*, p.name as plan_name, p.price_monthly, p.price_once,
             p.max_branches, p.max_users, p.max_products, p.features
      FROM tenants t
      JOIN plans p ON p.id = t.plan_id
      WHERE t.id = $1
    `, [user.tenant_id]),

    queryOne<any>(`
      SELECT * FROM subscriptions
      WHERE tenant_id = $1
      ORDER BY created_at DESC LIMIT 1
    `, [user.tenant_id]),

    query<any>(`
      SELECT id, amount, status, paystack_ref, period_start, period_end, created_at
      FROM invoices WHERE tenant_id = $1
      ORDER BY created_at DESC LIMIT 12
    `, [user.tenant_id]),
  ])

  // Usage stats
  const [branchCount, userCount, productCount] = await Promise.all([
    queryOne<any>('SELECT COUNT(*)::int as n FROM branches WHERE tenant_id = $1', [user.tenant_id]),
    queryOne<any>('SELECT COUNT(*)::int as n FROM tenant_users WHERE tenant_id = $1', [user.tenant_id]),
    queryOne<any>('SELECT COUNT(*)::int as n FROM products WHERE tenant_id = $1 AND archived = false', [user.tenant_id]),
  ])

  return NextResponse.json({
    tenant,
    subscription,
    invoices,
    usage: {
      branches: branchCount?.n || 0,
      users: userCount?.n || 0,
      products: productCount?.n || 0,
    },
  })
}
