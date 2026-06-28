import { NextRequest } from 'next/server'
import { requireAuth, ok, err } from '@/lib/api-helper'
import { query, queryOne } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const rows = await query('SELECT key, value FROM settings WHERE tenant_id=$1', [auth.user.tenant_id])
  const settings: Record<string, any> = {}
  for (const r of rows) settings[r.key] = r.value
  return ok(settings)
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  if (user.role === 'cashier') return err('Forbidden', 403)
  const { key, value } = await req.json()
  if (!key) return err('key required')
  await queryOne(
    `INSERT INTO settings (tenant_id,key,value) VALUES ($1,$2,$3)
     ON CONFLICT (tenant_id,key) DO UPDATE SET value=$3, updated_at=NOW()`,
    [user.tenant_id, key, JSON.stringify(value)]
  )
  return ok({ success: true })
}
