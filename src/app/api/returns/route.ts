import { NextRequest } from 'next/server'
import { requireAuth, ok, err } from '@/lib/api-helper'
import { query, queryOne, pool } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  return ok(await query(
    `SELECT r.*, s.receipt_pin, p.name as product_name FROM returns r
     JOIN sales s ON s.id=r.sale_id
     JOIN products p ON p.id=r.product_id
     WHERE r.tenant_id=$1 ORDER BY r.created_at DESC LIMIT 100`,
    [user.tenant_id]
  ))
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  const b = await req.json()
  const { sale_id, product_id, quantity, reason, refund_amount, restock } = b
  if (!sale_id || !product_id || !quantity) return err('sale_id, product_id, quantity required')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const ret = await client.query(
      `INSERT INTO returns (tenant_id,sale_id,product_id,quantity,reason,refund_amount,processed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [user.tenant_id, sale_id, product_id, quantity, reason||null, refund_amount||0, user.id]
    )
    if (restock) {
      await client.query('UPDATE products SET stock=stock+$1 WHERE id=$2 AND tenant_id=$3', [quantity, product_id, user.tenant_id])
    }
    await client.query('COMMIT')
    return ok(ret.rows[0], 201)
  } catch (e: any) {
    await client.query('ROLLBACK')
    return err(e.message, 500)
  } finally {
    client.release()
  }
}
