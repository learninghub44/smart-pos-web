import { NextRequest } from 'next/server'
import { requireAuth, ok } from '@/lib/api-helper'
import { query, queryOne } from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth.error) return auth.error
  const { user } = auth
  const tid = user.tenant_id

  const now = new Date()
  const today = new Date(now); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate()-7)
  const monthAgo = new Date(today); monthAgo.setMonth(today.getMonth()-1)

  const [sales, products, recentSales] = await Promise.all([
    query(`SELECT s.total_amount, s.created_at, s.payment_method, s.receipt_pin,
           json_agg(json_build_object('quantity',si.quantity,'price',si.price,'cost_price',p.cost_price)) as items
           FROM sales s
           LEFT JOIN sale_items si ON si.sale_id=s.id
           LEFT JOIN products p ON p.id=si.product_id
           WHERE s.tenant_id=$1 AND s.created_at >= $2
           GROUP BY s.id`, [tid, monthAgo.toISOString()]),
    query('SELECT stock, minimum_stock, name FROM products WHERE tenant_id=$1 AND archived=false', [tid]),
    query(`SELECT s.receipt_pin, s.total_amount, s.payment_method, s.created_at,
           COUNT(si.id) as item_count
           FROM sales s LEFT JOIN sale_items si ON si.sale_id=s.id
           WHERE s.tenant_id=$1 GROUP BY s.id ORDER BY s.created_at DESC LIMIT 6`, [tid]),
  ])

  const todaySales = sales.filter(s => new Date(s.created_at) >= today)
  const yesterdaySales = sales.filter(s => new Date(s.created_at) >= yesterday && new Date(s.created_at) < today)
  const weeklySales = sales.filter(s => new Date(s.created_at) >= weekAgo)

  const sum = (arr: any[]) => arr.reduce((a, s) => a + Number(s.total_amount), 0)
  const todayRev = sum(todaySales)
  const yesterdayRev = sum(yesterdaySales)

  let todayCost = 0
  todaySales.forEach(s => s.items?.forEach((i: any) => {
    if (i && i.cost_price) todayCost += Number(i.cost_price) * Number(i.quantity)
  }))

  const pMap = new Map<string, { sold: number; revenue: number }>()
  sales.forEach(s => s.items?.forEach((i: any) => {
    if (!i) return
    const key = i.name || 'Unknown'
    const cur = pMap.get(key) || { sold: 0, revenue: 0 }
    pMap.set(key, { sold: cur.sold + Number(i.quantity), revenue: cur.revenue + Number(i.price) * Number(i.quantity) })
  }))

  return ok({
    stats: {
      todaySales: todaySales.length,
      todayRevenue: todayRev,
      todayProfit: todayRev - todayCost,
      weeklyRevenue: sum(weeklySales),
      monthlyRevenue: sum(sales),
      averageTx: todaySales.length ? todayRev / todaySales.length : 0,
      totalProducts: products.length,
      lowStock: products.filter(p => p.stock > 0 && p.stock <= (p.minimum_stock || 10)).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      revenueChange: yesterdayRev ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : 0,
      salesChange: yesterdaySales.length ? ((todaySales.length - yesterdaySales.length) / yesterdaySales.length) * 100 : 0,
    },
    recent: recentSales.map(s => ({
      pin: s.receipt_pin,
      items: Number(s.item_count),
      total: Number(s.total_amount),
      method: s.payment_method,
      time: new Date(s.created_at).toLocaleTimeString('en-KE', { hour:'2-digit', minute:'2-digit' }),
    })),
    topProducts: Array.from(pMap.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
  })
}
