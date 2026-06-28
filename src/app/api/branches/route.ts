import { NextRequest } from 'next/server'
import { requireAuth, ok, err } from '@/lib/api-helper'
import { query, queryOne } from '@/lib/db'
import { checkPlanLimit } from '@/lib/tenant-auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  return ok(await query('SELECT * FROM branches WHERE tenant_id=$1 ORDER BY name', [auth.user.tenant_id]))
}
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role !== 'owner') return err('Only owner can create branches', 403)
  const check = await checkPlanLimit(user.tenant_id, 'branches')
  if (!check.allowed) return err(`Plan limit: ${check.limit} branch${check.limit===1?'':'es'} max`, 403)
  const b = await req.json()
  return ok(await queryOne(
    'INSERT INTO branches (tenant_id,name,address,phone) VALUES ($1,$2,$3,$4) RETURNING *',
    [user.tenant_id, b.name, b.address||null, b.phone||null]
  ), 201)
}
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role === 'cashier') return err('Forbidden', 403)
  const b = await req.json()
  return ok(await queryOne(
    'UPDATE branches SET name=$2,address=$3,phone=$4,updated_at=NOW() WHERE id=$1 AND tenant_id=$5 RETURNING *',
    [b.id, b.name, b.address||null, b.phone||null, user.tenant_id]
  ))
}
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role !== 'owner') return err('Only owner can delete branches', 403)
  const { id } = await req.json()
  await query('DELETE FROM branches WHERE id=$1 AND tenant_id=$2', [id, user.tenant_id])
  return ok({ success: true })
}
