import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('q') || ''
  const status = req.nextUrl.searchParams.get('status') || ''

  const conditions = ['1=1']
  const values: any[] = []
  let idx = 1

  if (search) {
    conditions.push(`(t.business_name ILIKE $${idx} OR t.email ILIKE $${idx})`)
    values.push(`%${search}%`)
    idx++
  }
  if (status) {
    conditions.push(`t.status = $${idx}`)
    values.push(status)
    idx++
  }

  const tenants = await query<any>(`
    SELECT t.*, p.name AS plan_name,
           (SELECT COUNT(*)::int FROM tenant_users WHERE tenant_id = t.id) AS user_count,
           (SELECT COUNT(*)::int FROM branches WHERE tenant_id = t.id) AS branch_count
    FROM tenants t JOIN plans p ON p.id = t.plan_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY t.created_at DESC LIMIT 100
  `, values)

  return NextResponse.json({ tenants })
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tenantId, status, planId } = await req.json()
  if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 })

  const updates: string[] = ['updated_at = NOW()']
  const values: any[] = []
  let idx = 1

  if (status) { updates.push(`status = $${idx++}`); values.push(status) }
  if (planId) { updates.push(`plan_id = $${idx++}`); values.push(planId) }

  values.push(tenantId)
  await query(
    `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${idx}`,
    values
  )

  return NextResponse.json({ success: true })
}
