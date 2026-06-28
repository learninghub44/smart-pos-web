import { NextRequest } from 'next/server'
import { requireAuth, ok, err } from '@/lib/api-helper'
import { query, queryOne } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  return ok(await query('SELECT * FROM categories WHERE tenant_id=$1 ORDER BY name', [auth.user.tenant_id]))
}
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role === 'cashier') return err('Forbidden', 403)
  const { name } = await req.json()
  if (!name) return err('Name required')
  return ok(await queryOne('INSERT INTO categories (tenant_id,name) VALUES ($1,$2) RETURNING *', [user.tenant_id,name]), 201)
}
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role === 'cashier') return err('Forbidden', 403)
  const { id } = await req.json()
  await query('DELETE FROM categories WHERE id=$1 AND tenant_id=$2', [id, user.tenant_id])
  return ok({ success: true })
}
