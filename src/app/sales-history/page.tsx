'use client'

import { useState, useEffect } from 'react'
import { Search, Calendar, Filter, Eye } from 'lucide-react'
import Receipt from '@/components/Receipt'

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [showReceipt, setShowReceipt] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [selectedSaleItems, setSelectedSaleItems] = useState<any[]>([])

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(*, products(*))')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (data && !error) {
        setSales(data)
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { getAllSales } = await import('@/lib/indexeddb')
    const allSales = await getAllSales()
    setSales(allSales)
  }

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.receipt_pin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDate = () => {
      if (dateFilter === 'all') return true
      const saleDate = new Date(sale.created_at)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (dateFilter === 'today') {
        return saleDate >= today
      }
      if (dateFilter === 'week') {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return saleDate >= weekAgo
      }
      if (dateFilter === 'month') {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return saleDate >= monthAgo
      }
      return true
    }
    
    const matchesPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter
    
    return matchesSearch && matchesDate() && matchesPayment
  })

  const handleViewReceipt = async (sale: any) => {
    setSelectedSale(sale)
    
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('sale_items')
        .select('*, products(*)')
        .eq('sale_id', sale.id)
      
      if (data && !error) {
        setSelectedSaleItems(data)
      } else {
        setSelectedSaleItems([])
      }
    } catch (error) {
      console.log('Error loading sale items')
      setSelectedSaleItems([])
    }
    
    setShowReceipt(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
        <p className="text-gray-600 mt-1">View and manage all sales transactions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PIN or receipt #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-lg font-bold text-blue-600">KES {totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Receipt PIN</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Items</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Payment</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Cashier</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{sale.receipt_pin}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(sale.created_at)}</td>
                  <td className="py-3 px-4 text-gray-600">{sale.sale_items?.length || 0}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">KES {Number(sale.total_amount).toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600 capitalize">{sale.payment_method.replace('_', ' ')}</td>
                  <td className="py-3 px-4 text-gray-600">{sale.cashier_id || 'N/A'}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleViewReceipt(sale)}
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 justify-end"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No sales found</p>
          </div>
        )}
      </div>

      {showReceipt && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Receipt Details</h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <Receipt
              sale={selectedSale}
              items={selectedSaleItems.map(item => ({
                name: item.products?.name || 'Product',
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity
              }))}
            />
          </div>
        </div>
      )}
    </div>
  )
}
