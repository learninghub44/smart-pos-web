'use client'

import { useEffect, useState } from 'react'
import { getCurrentAuthUser } from '@/lib/auth'
import Link from 'next/link'
import { 
  DollarSign, ShoppingCart, Package, TrendingUp,
  AlertCircle, TrendingDown, ArrowRight, Activity
} from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    todaySales: 0, todayRevenue: 0, todayProfit: 0,
    weeklyRevenue: 0, monthlyRevenue: 0,
    totalProducts: 0, lowStockItems: 0, outOfStockItems: 0,
    averageTransactionValue: 0,
    todaySalesChange: 0, todayRevenueChange: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
    loadStats()
  }, [])

  const loadUserData = async () => {
    setUser(await getCurrentAuthUser())
  }

  const loadStats = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const today = new Date(); today.setHours(0,0,0,0)
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1)
      const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate()-7)
      const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth()-1)

      const [{ data: salesData }, { data: productsData }] = await Promise.all([
        supabase.from('sales').select('*, sale_items(*, products(*))').gte('created_at', monthAgo.toISOString()).order('created_at', { ascending: false }),
        supabase.from('products').select('id, stock, minimum_stock, cost_price, name').eq('archived', false)
      ])

      if (salesData && productsData) {
        const todaySales = salesData.filter(s => new Date(s.created_at) >= today)
        const yesterdaySales = salesData.filter(s => new Date(s.created_at) >= yesterday && new Date(s.created_at) < today)
        const weeklySales = salesData.filter(s => new Date(s.created_at) >= weekAgo)

        const todayRevenue = todaySales.reduce((s, x) => s + Number(x.total_amount), 0)
        const yesterdayRevenue = yesterdaySales.reduce((s, x) => s + Number(x.total_amount), 0)
        const weeklyRevenue = weeklySales.reduce((s, x) => s + Number(x.total_amount), 0)
        const monthlyRevenue = salesData.reduce((s, x) => s + Number(x.total_amount), 0)

        let todayCost = 0
        todaySales.forEach(sale => {
          sale.sale_items?.forEach((item: any) => {
            if (item.products) todayCost += (item.products.cost_price||0)*item.quantity
          })
        })

        const productSales = new Map<string, {sold:number;revenue:number}>()
        salesData.forEach(sale => {
          sale.sale_items?.forEach((item: any) => {
            const n = item.products?.name || 'Unknown'
            const cur = productSales.get(n)||{sold:0,revenue:0}
            productSales.set(n, { sold: cur.sold+item.quantity, revenue: cur.revenue+(item.price*item.quantity) })
          })
        })

        setStats({
          todaySales: todaySales.length,
          todayRevenue,
          todayProfit: todayRevenue - todayCost,
          weeklyRevenue,
          monthlyRevenue,
          totalProducts: productsData.length,
          lowStockItems: productsData.filter(p => p.stock > 0 && p.stock <= (p.minimum_stock||10)).length,
          outOfStockItems: productsData.filter(p => p.stock === 0).length,
          averageTransactionValue: todaySales.length ? todayRevenue/todaySales.length : 0,
          todaySalesChange: yesterdaySales.length ? ((todaySales.length-yesterdaySales.length)/yesterdaySales.length)*100 : 0,
          todayRevenueChange: yesterdayRevenue ? ((todayRevenue-yesterdayRevenue)/yesterdayRevenue)*100 : 0,
        })
        setRecentTransactions(salesData.slice(0,8).map(s => ({
          id: s.receipt_pin, items: s.sale_items?.length||0,
          total: Number(s.total_amount), method: s.payment_method,
          time: new Date(s.created_at).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})
        })))
        setTopProducts(Array.from(productSales.entries())
          .map(([name,data]) => ({name,...data}))
          .sort((a,b) => b.revenue-a.revenue).slice(0,5))
      }
    } catch(e) { console.log('Stats error:', e) }
    finally { setLoading(false) }
  }

  const fmt = (n: number) => `KES ${Math.round(n).toLocaleString()}`
  const pct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <Link href="/pos" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <ShoppingCart className="h-4 w-4" />
          <span>Open POS</span>
        </Link>
      </div>

      {/* Alerts */}
      {(stats.lowStockItems > 0 || stats.outOfStockItems > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.lowStockItems > 0 && (
            <Link href="/inventory?filter=low" className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3.5 hover:bg-yellow-100 transition-colors">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yellow-900">Low Stock</p>
                <p className="text-xs text-yellow-700">{stats.lowStockItems} products need restocking</p>
              </div>
              <ArrowRight className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            </Link>
          )}
          {stats.outOfStockItems > 0 && (
            <Link href="/inventory?filter=out" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3.5 hover:bg-red-100 transition-colors">
              <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-900">Out of Stock</p>
                <p className="text-xs text-red-700">{stats.outOfStockItems} products unavailable</p>
              </div>
              <ArrowRight className="h-4 w-4 text-red-600 flex-shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Today's Sales", value: stats.todaySales.toString(), sub: pct(stats.todaySalesChange)+' vs yesterday', icon: ShoppingCart, color: 'blue', trend: stats.todaySalesChange },
          { label: "Today's Revenue", value: fmt(stats.todayRevenue), sub: pct(stats.todayRevenueChange)+' vs yesterday', icon: DollarSign, color: 'green', trend: stats.todayRevenueChange },
          { label: "Today's Profit", value: fmt(stats.todayProfit), sub: 'Revenue minus cost', icon: TrendingUp, color: 'purple', trend: stats.todayProfit },
          { label: 'Avg Transaction', value: fmt(stats.averageTransactionValue), sub: 'Today', icon: Activity, color: 'orange', trend: 0 },
        ].map((card) => {
          const Icon = card.icon
          const colorMap: Record<string, string> = {
            blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500', orange: 'bg-orange-500'
          }
          const bgLight: Record<string, string> = {
            blue: 'bg-blue-50', green: 'bg-green-50', purple: 'bg-purple-50', orange: 'bg-orange-50'
          }
          return (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 truncate">{card.label}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1 truncate">{card.value}</p>
                  <p className={`text-xs mt-1 font-medium ${card.trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {card.sub}
                  </p>
                </div>
                <div className={`${bgLight[card.color]} p-2.5 rounded-xl flex-shrink-0`}>
                  <Icon className={`h-4 w-4 text-${card.color}-600`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue overview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Weekly Revenue</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{fmt(stats.weeklyRevenue)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Monthly Revenue</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{fmt(stats.monthlyRevenue)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
        </div>
      </div>

      {/* Inventory quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/inventory" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-gray-50 transition-colors">
          <Package className="h-5 w-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p>
          <p className="text-xs text-gray-500 mt-0.5">Products</p>
        </Link>
        <Link href="/inventory" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-yellow-50 transition-colors">
          <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-yellow-600">{stats.lowStockItems}</p>
          <p className="text-xs text-gray-500 mt-0.5">Low Stock</p>
        </Link>
        <Link href="/inventory" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-red-50 transition-colors">
          <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-red-600">{stats.outOfStockItems}</p>
          <p className="text-xs text-gray-500 mt-0.5">Out of Stock</p>
        </Link>
      </div>

      {/* Recent + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Sales</h2>
            <Link href="/sales-history" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No sales yet today</div>
            ) : recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-mono font-medium text-gray-900">{t.id}</p>
                  <p className="text-xs text-gray-400">{t.items} item{t.items!==1?'s':''} · {t.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">KES {t.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 capitalize">{t.method?.replace(/_/g,' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Top Products (Month)</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {topProducts.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No sales data yet</div>
            ) : topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 px-5 py-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i+1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.sold} sold</p>
                </div>
                <p className="text-sm font-bold text-gray-900 flex-shrink-0">KES {p.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
