import { NextRequest } from 'next/server'
import { requireAuth, ok, err } from '@/lib/api-helper'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'sales'
  const from = url.searchParams.get('from') || new Date(Date.now() - 30*86400000).toISOString()
  const to = url.searchParams.get('to') || new Date().toISOString()
  const tid = user.tenant_id

  if (type === 'sales') {
    const data = await query(
      `SELECT DATE(s.created_at) as date, COUNT(*)::int as count,
       SUM(s.total_amount) as revenue, s.payment_method
       FROM sales s WHERE s.tenant_id=$1 AND s.created_at BETWEEN $2 AND $3
       GROUP BY DATE(s.created_at), s.payment_method ORDER BY date DESC`,
      [tid, from, to]
    )
    return ok(data)
  }
  if (type === 'products') {
    const data = await query(
      `SELECT p.name, SUM(si.quantity)::int as sold, SUM(si.price*si.quantity) as revenue
       FROM sale_items si JOIN products p ON p.id=si.product_id
       JOIN sales s ON s.id=si.sale_id
       WHERE s.tenant_id=$1 AND s.created_at BETWEEN $2 AND $3
       GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 20`,
      [tid, from, to]
    )
    return ok(data)
  }
  if (type === 'inventory') {
    const data = await query(
      `SELECT p.name, p.stock, p.minimum_stock, p.cost_price, p.selling_price,
       (p.stock * p.cost_price) as stock_value,
       c.name as category, b.name as brand
       FROM products p
       LEFT JOIN categories c ON c.id=p.category_id
       LEFT JOIN brands b ON b.id=p.brand_id
       WHERE p.tenant_id=$1 AND p.archived=false ORDER BY p.stock ASC`,
      [tid]
    )
    return ok(data)
  }
  return err('Unknown report type')
}
