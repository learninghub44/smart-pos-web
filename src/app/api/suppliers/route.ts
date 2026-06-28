import { NextRequest } from 'next/server'
import { requireAuth, ok, err } from '@/lib/api-helper'
import { query, queryOne } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  return ok(await query('SELECT * FROM suppliers WHERE tenant_id=$1 ORDER BY name', [auth.user.tenant_id]))
}
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role === 'cashier') return err('Forbidden', 403)
  const b = await req.json()
  return ok(await queryOne(
    'INSERT INTO suppliers (tenant_id,name,contact_name,phone,email,address) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [user.tenant_id, b.name, b.contact_name||null, b.phone||null, b.email||null, b.address||null]
  ), 201)
}
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role === 'cashier') return err('Forbidden', 403)
  const b = await req.json()
  return ok(await queryOne(
    'UPDATE suppliers SET name=$2,contact_name=$3,phone=$4,email=$5,address=$6,updated_at=NOW() WHERE id=$1 AND tenant_id=$7 RETURNING *',
    [b.id, b.name, b.contact_name||null, b.phone||null, b.email||null, b.address||null, user.tenant_id]
  ))
}
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role === 'cashier') return err('Forbidden', 403)
  const { id } = await req.json()
  await query('DELETE FROM suppliers WHERE id=$1 AND tenant_id=$2', [id, user.tenant_id])
  return ok({ success: true })
}
