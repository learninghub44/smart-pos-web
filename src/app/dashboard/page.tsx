'use client'

import { useEffect, useState } from 'react'
import { getCurrentAuthUser } from '@/lib/auth'
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  AlertCircle,
  TrendingDown
} from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    todayProfit: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    averageTransactionValue: 0,
    todaySalesChange: 0,
    todayRevenueChange: 0,
    todayProfitChange: 0,
    weeklyRevenueChange: 0,
    monthlyRevenueChange: 0,
    yearlyRevenueChange: 0,
    totalProductsChange: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
    loadStats()
  }, [])

  const loadUserData = () => {
    const currentUser = getCurrentAuthUser()
    setUser(currentUser)
  }

  const loadStats = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Get today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const lastWeekStart = new Date(weekAgo)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      
      const lastMonthStart = new Date(monthAgo)
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
      
      const yearAgo = new Date(today)
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      
      const lastYearStart = new Date(yearAgo)
      lastYearStart.setFullYear(lastYearStart.getFullYear() - 1)
      
      // Get sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, sale_items(*, products(*))')
        .gte('created_at', yearAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50)
      
      // Get products data
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
      
      if (!salesError && salesData && !productsError && productsData) {
        // Calculate stats
        const todaySales = salesData.filter(s => new Date(s.created_at) >= today)
        const yesterdaySales = salesData.filter(s => new Date(s.created_at) >= yesterday && new Date(s.created_at) < today)
        const weeklySales = salesData.filter(s => new Date(s.created_at) >= weekAgo)
        const lastWeekSales = salesData.filter(s => new Date(s.created_at) >= lastWeekStart && new Date(s.created_at) < weekAgo)
        const monthlySales = salesData.filter(s => new Date(s.created_at) >= monthAgo)
        const lastMonthSales = salesData.filter(s => new Date(s.created_at) >= lastMonthStart && new Date(s.created_at) < monthAgo)
        const yearlySales = salesData
        const lastYearSales = salesData.filter(s => new Date(s.created_at) >= lastYearStart && new Date(s.created_at) < yearAgo)
        
        const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
        const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
        const weeklyRevenue = weeklySales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
        const lastWeekRevenue = lastWeekSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
        const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
        const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
        const yearlyRevenue = yearlySales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
        const lastYearRevenue = lastYearSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
        
        // Calculate profit (revenue - cost)
        let todayCost = 0
        let yesterdayCost = 0
        todaySales.forEach(sale => {
          sale.sale_items?.forEach((item: any) => {
            if (item.products) {
              todayCost += (item.products.cost_price || 0) * item.quantity
            }
          })
        })
        yesterdaySales.forEach(sale => {
          sale.sale_items?.forEach((item: any) => {
            if (item.products) {
              yesterdayCost += (item.products.cost_price || 0) * item.quantity
            }
          })
        })
        const todayProfit = todayRevenue - todayCost
        const yesterdayProfit = yesterdayRevenue - yesterdayCost
        
        const totalProducts = productsData.length
        const lowStockItems = productsData.filter(p => p.stock > 0 && p.stock < 10).length
        const outOfStockItems = productsData.filter(p => p.stock === 0).length
        
        const averageTransactionValue = todaySales.length > 0 
          ? todayRevenue / todaySales.length 
          : 0
        
        // Get recent transactions
        const recent = salesData.slice(0, 10).map(sale => ({
          id: sale.receipt_pin,
          items: sale.sale_items?.length || 0,
          total: Number(sale.total_amount),
          method: sale.payment_method,
          time: new Date(sale.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
        }))
        
        // Get top products
        const productSales = new Map<string, { sold: number; revenue: number }>()
        salesData.forEach(sale => {
          sale.sale_items?.forEach((item: any) => {
            const productName = item.products?.name || 'Unknown'
            const current = productSales.get(productName) || { sold: 0, revenue: 0 }
            productSales.set(productName, {
              sold: current.sold + item.quantity,
              revenue: current.revenue + (item.price * item.quantity)
            })
          })
        })
        
        const topProductsArray = Array.from(productSales.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
        
        // Calculate percentage changes
        const todaySalesChange = yesterdaySales.length > 0 
          ? ((todaySales.length - yesterdaySales.length) / yesterdaySales.length) * 100 
          : 0
        
        const todayRevenueChange = yesterdayRevenue > 0 
          ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
          : 0
        
        const todayProfitChange = yesterdayProfit > 0 
          ? ((todayProfit - yesterdayProfit) / yesterdayProfit) * 100 
          : 0
        
        const weeklyRevenueChange = lastWeekRevenue > 0 
          ? ((weeklyRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
          : 0
        
        const monthlyRevenueChange = lastMonthRevenue > 0 
          ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : 0
        
        const yearlyRevenueChange = lastYearRevenue > 0 
          ? ((yearlyRevenue - lastYearRevenue) / lastYearRevenue) * 100 
          : 0
        
        const totalProductsChange = 0 // Products don't change much, can be calculated if needed
        
        setStats({
          todaySales: todaySales.length,
          todayRevenue,
          todayProfit,
          weeklyRevenue,
          monthlyRevenue,
          yearlyRevenue,
          totalProducts,
          lowStockItems,
          outOfStockItems,
          averageTransactionValue,
          todaySalesChange,
          todayRevenueChange,
          todayProfitChange,
          weeklyRevenueChange,
          monthlyRevenueChange,
          yearlyRevenueChange,
          totalProductsChange
        })
        setRecentTransactions(recent)
        setTopProducts(topProductsArray)
        return
      }
    } catch (error) {
      console.log('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Today Sales',
      value: stats.todaySales,
      icon: ShoppingCart,
      color: 'blue',
      change: stats.todaySalesChange >= 0 ? `+${stats.todaySalesChange.toFixed(1)}%` : `${stats.todaySalesChange.toFixed(1)}%`
    },
    {
      title: 'Today Revenue',
      value: `KES ${stats.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
      change: stats.todayRevenueChange >= 0 ? `+${stats.todayRevenueChange.toFixed(1)}%` : `${stats.todayRevenueChange.toFixed(1)}%`
    },
    {
      title: 'Today Profit',
      value: `KES ${stats.todayProfit.toLocaleString()}`,
      icon: TrendingUp,
      color: 'purple',
      change: stats.todayProfitChange >= 0 ? `+${stats.todayProfitChange.toFixed(1)}%` : `${stats.todayProfitChange.toFixed(1)}%`
    },
    {
      title: 'Avg Transaction',
      value: `KES ${Math.round(stats.averageTransactionValue).toLocaleString()}`,
      icon: DollarSign,
      color: 'indigo',
      change: '+0%' // Average transaction doesn't have a meaningful period comparison
    },
    {
      title: 'Weekly Revenue',
      value: `KES ${stats.weeklyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'teal',
      change: stats.weeklyRevenueChange >= 0 ? `+${stats.weeklyRevenueChange.toFixed(1)}%` : `${stats.weeklyRevenueChange.toFixed(1)}%`
    },
    {
      title: 'Monthly Revenue',
      value: `KES ${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'emerald',
      change: stats.monthlyRevenueChange >= 0 ? `+${stats.monthlyRevenueChange.toFixed(1)}%` : `${stats.monthlyRevenueChange.toFixed(1)}%`
    },
    {
      title: 'Yearly Revenue',
      value: `KES ${stats.yearlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'cyan',
      change: stats.yearlyRevenueChange >= 0 ? `+${stats.yearlyRevenueChange.toFixed(1)}%` : `${stats.yearlyRevenueChange.toFixed(1)}%`
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'orange',
      change: '+0%' // Products don't change much, can be calculated if needed
    }
  ]

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500',
    teal: 'bg-teal-500',
    emerald: 'bg-emerald-500',
    cyan: 'bg-cyan-500',
    orange: 'bg-orange-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`${colorClasses[stat.color as keyof typeof colorClasses]} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stock Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.lowStockItems > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">Low Stock Alert</h3>
                <p className="text-yellow-700 text-sm">
                  {stats.lowStockItems} products are running low on stock. Check inventory for details.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {stats.outOfStockItems > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <TrendingDown className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Out of Stock</h3>
                <p className="text-red-700 text-sm">
                  {stats.outOfStockItems} products are out of stock. Restock immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{transaction.id}</p>
                    <p className="text-sm text-gray-600">{transaction.items} items • {transaction.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">KES {transaction.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 capitalize">{transaction.method}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Products (All Time)</h2>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sold} sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">KES {product.revenue.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
