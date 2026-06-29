import { NextRequest } from 'next/server'
import { requireAuth, ok, err } from '@/lib/api-helper'
import { query, queryOne, pool } from '@/lib/db'

const MAX_LIMIT = 200

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  const url = new URL(req.url)

  // Clamp limit/offset to prevent DoS via unbounded queries
  const limit  = Math.min(Math.max(parseInt(url.searchParams.get('limit')  || '50'), 1), MAX_LIMIT)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)
  const branch_id = url.searchParams.get('branch_id')
  const from = url.searchParams.get('from')
  const to   = url.searchParams.get('to')

  let sql = `
    SELECT s.*, c.name as customer_name,
      json_agg(json_build_object(
        'id',si.id,'product_id',si.product_id,'name',p.name,
        'quantity',si.quantity,'price',si.price,'cost_price',p.cost_price
      )) as items
    FROM sales s
    LEFT JOIN customers c ON c.id = s.customer_id
    LEFT JOIN sale_items si ON si.sale_id = s.id
    LEFT JOIN products p ON p.id = si.product_id
    WHERE s.tenant_id = $1`
  const params: any[] = [user.tenant_id]
  let i = 2

  if (branch_id) { sql += ` AND s.branch_id = $${i++}`; params.push(branch_id) }
  // Cashiers can only see their own branch's sales
  if (user.role === 'cashier' && user.branch_id) { sql += ` AND s.branch_id = $${i++}`; params.push(user.branch_id) }
  if (from) { sql += ` AND s.created_at >= $${i++}`; params.push(from) }
  if (to)   { sql += ` AND s.created_at <= $${i++}`; params.push(to) }

  sql += ` GROUP BY s.id, c.name ORDER BY s.created_at DESC LIMIT $${i++} OFFSET $${i++}`
  params.push(limit, offset)

  return ok(await query(sql, params))
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth

  const b = await req.json()
  const { items, payment_method, total_amount, discount_amount, customer_id, branch_id, notes, cash_given, change_given } = b

  if (!Array.isArray(items) || items.length === 0) return err('No items in cart')
  if (items.length > 500) return err('Too many items in a single sale')

  const VALID_PAYMENT_METHODS = ['cash', 'mpesa', 'card', 'bank_transfer', 'credit_account', 'mixed']
  if (!VALID_PAYMENT_METHODS.includes(payment_method)) return err('Invalid payment method')

  const parsedTotal = parseFloat(total_amount)
  if (isNaN(parsedTotal) || parsedTotal < 0) return err('Invalid total amount')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // ── Server-side stock validation ─────────────────────────────
    // Lock the product rows to prevent race conditions (concurrent checkouts)
    for (const item of items) {
      if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        await client.query('ROLLBACK')
        return err(`Invalid item quantity for product ${item.id}`)
      }

      const product = await client.query(
        'SELECT id, name, stock, selling_price FROM products WHERE id = $1 AND tenant_id = $2 AND archived = false FOR UPDATE',
        [item.id, user.tenant_id]
      )
      if (product.rows.length === 0) {
        await client.query('ROLLBACK')
        return err(`Product not found: ${item.id}`)
      }
      const p = product.rows[0]
      if (p.stock < item.quantity) {
        await client.query('ROLLBACK')
        return err(`Insufficient stock for "${p.name}": available ${p.stock}, requested ${item.quantity}`)
      }
    }

    // ── Insert sale ──────────────────────────────────────────────
    const pin = 'S' + Date.now().toString().slice(-6)
    const sale = await client.query(
      `INSERT INTO sales (tenant_id,branch_id,cashier_id,customer_id,payment_method,total_amount,
        discount_amount,cash_given,change_given,notes,receipt_pin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [user.tenant_id, branch_id || user.branch_id, user.id,
       customer_id || null, payment_method,
       parsedTotal, Math.max(parseFloat(discount_amount) || 0, 0),
       cash_given || null, change_given || null, notes || null, pin]
    )
    const saleId = sale.rows[0].id

    // ── Insert items + decrement stock ───────────────────────────
    for (const item of items) {
      await client.query(
        'INSERT INTO sale_items (sale_id,product_id,quantity,price) VALUES ($1,$2,$3,$4)',
        [saleId, item.id, item.quantity, item.price]
      )
      await client.query(
        'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
        [item.quantity, item.id, user.tenant_id]
      )
    }

    await client.query('COMMIT')
    return ok(sale.rows[0], 201)
  } catch (e: any) {
    await client.query('ROLLBACK')
    console.error('Sale error:', e.message)
    return err('Sale could not be processed. Please try again.', 500)
  } finally {
    client.release()
  }
}
