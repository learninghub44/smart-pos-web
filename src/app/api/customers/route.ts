import { NextRequest } from 'next/server'
import { requireAuth, ok, err } from '@/lib/api-helper'
import { query, queryOne } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  return ok(await query(
    'SELECT *, (SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE customer_id=customers.id) as total_spent FROM customers WHERE tenant_id=$1 ORDER BY name',
    [auth.user.tenant_id]
  ))
}
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  const b = await req.json()
  return ok(await queryOne(
    'INSERT INTO customers (tenant_id,name,phone,email,credit_limit) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [user.tenant_id, b.name, b.phone||null, b.email||null, b.credit_limit||0]
  ), 201)
}
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  const b = await req.json()
  return ok(await queryOne(
    'UPDATE customers SET name=$2,phone=$3,email=$4,credit_limit=$5,updated_at=NOW() WHERE id=$1 AND tenant_id=$6 RETURNING *',
    [b.id, b.name, b.phone||null, b.email||null, b.credit_limit||0, user.tenant_id]
  ))
}
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role === 'cashier') return err('Forbidden', 403)
  const { id } = await req.json()
  await query('DELETE FROM customers WHERE id=$1 AND tenant_id=$2', [id, user.tenant_id])
  return ok({ success: true })
}
