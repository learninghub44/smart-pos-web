'use client'

import { useState, useEffect } from 'react'
import { Calendar, Download, TrendingUp, DollarSign, Package, ShoppingCart, BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'products' | 'customers'>('sales')
  const [dateRange, setDateRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    loadReportData()
  }, [reportType, dateRange])

  const loadReportData = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let startDate = new Date(today)
      if (dateRange === 'week') {
        startDate.setDate(startDate.getDate() - 7)
      } else if (dateRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1)
      } else if (dateRange === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1)
      }
      
      if (reportType === 'sales') {
        const { data: salesData } = await supabase
          .from('sales')
          .select('*, sale_items(*, products(*))')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
        
        const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
        const totalSales = salesData?.length || 0
        const avgTransaction = totalSales > 0 ? totalRevenue / totalSales : 0
        
        const paymentMethods = salesData?.reduce((acc: any, sale) => {
          acc[sale.payment_method] = (acc[sale.payment_method] || 0) + Number(sale.total_amount)
          return acc
        }, {}) || {}
        
        const topProducts = new Map<string, { sold: number; revenue: number }>()
        salesData?.forEach((sale: any) => {
          sale.sale_items?.forEach((item: any) => {
            const productName = item.products?.name || 'Unknown'
            const current = topProducts.get(productName) || { sold: 0, revenue: 0 }
            topProducts.set(productName, {
              sold: current.sold + item.quantity,
              revenue: current.revenue + (item.price * item.quantity)
            })
          })
        })
        
        setReportData({
          totalRevenue,
          totalSales,
          avgTransaction,
          paymentMethods: paymentMethods || {},
          topProducts: Array.from(topProducts.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
        })
      } else if (reportType === 'inventory') {
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
        
        const totalProducts = productsData?.length || 0
        const totalStock = productsData?.reduce((sum, p) => sum + p.stock, 0) || 0
        const lowStock = productsData?.filter(p => p.stock > 0 && p.stock < 10).length || 0
        const outOfStock = productsData?.filter(p => p.stock === 0).length || 0
        const stockValue = productsData?.reduce((sum, p) => sum + (p.stock * p.cost_price), 0) || 0
        
        setReportData({
          totalProducts,
          totalStock,
          lowStock,
          outOfStock,
          stockValue
        })
      } else if (reportType === 'products') {
        const { data: productsData } = await supabase
          .from('products')
          .select('*, sale_items(quantity)')
        
        const productSales = productsData?.map((p: any) => ({
          ...p,
          totalSold: p.sale_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
        })) || []
        
        setReportData({
          products: productSales.sort((a: any, b: any) => b.totalSold - a.totalSold)
        })
      } else if (reportType === 'customers') {
        const { data: customersData } = await supabase
          .from('customers')
          .select('*')
          .order('total_spent', { ascending: false })
        
        const totalCustomers = customersData?.length || 0
        const totalRevenue = customersData?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0
        
        setReportData({
          totalCustomers,
          totalRevenue,
          topCustomers: customersData?.slice(0, 10) || []
        })
      }
    } catch (error) {
      console.log('Error loading report data')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${reportType}-report-${dateRange}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive business analytics and reports</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Download className="h-5 w-5" />
          <span>Export Report</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="products">Products Report</option>
              <option value="customers">Customers Report</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>

        {reportType === 'sales' && reportData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">KES {reportData.totalRevenue.toLocaleString()}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Total Sales</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{reportData.totalSales}</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-gray-600">Avg Transaction</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">KES {Math.round(reportData.avgTransaction).toLocaleString()}</p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <span className="text-sm text-gray-600">Payment Methods</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{Object.keys(reportData.paymentMethods).length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Revenue by Payment Method</h3>
                <div className="space-y-3">
                  {Object.entries(reportData.paymentMethods).map(([method, amount]) => (
                    <div key={method} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="capitalize">{method.replace('_', ' ')}</span>
                      <span className="font-semibold">KES {Number(amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Products</h3>
                <div className="space-y-3">
                  {reportData.topProducts.map((product: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <span>{product.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">KES {product.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">{product.sold} sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'inventory' && reportData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Products</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{reportData.totalProducts}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Total Stock</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{reportData.totalStock}</p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-gray-600">Low Stock</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{reportData.lowStock}</p>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-gray-600">Out of Stock</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{reportData.outOfStock}</p>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-gray-600">Total Stock Value</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">KES {reportData.stockValue.toLocaleString()}</p>
            </div>
          </div>
        )}

        {reportType === 'products' && reportData && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Products by Sales Volume</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Stock</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Cost Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Selling Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Total Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.products.map((product: any) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                      <td className="py-3 px-4 text-gray-600">{product.stock}</td>
                      <td className="py-3 px-4 text-gray-600">KES {product.cost_price.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-600">KES {product.selling_price.toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{product.totalSold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'customers' && reportData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Customers</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{reportData.totalCustomers}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-green-600">KES {reportData.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Phone</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Loyalty Points</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topCustomers.map((customer: any) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{customer.name}</td>
                        <td className="py-3 px-4 text-gray-600">{customer.phone || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{customer.loyalty_points}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">KES {customer.total_spent?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
