'use client'

import { useState, useEffect } from 'react'
import { Search, Calendar, Filter, Eye, X, Printer } from 'lucide-react'
import Receipt from '@/components/Receipt'

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [showReceipt, setShowReceipt] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [selectedSaleItems, setSelectedSaleItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSales() }, [])

  const loadSales = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(quantity, price, product_id, products(name))')
        .order('created_at', { ascending: false })
        .limit(200)
      if (data && !error) { setSales(data); setLoading(false); return }
    } catch {}
    const { getAllSales } = await import('@/lib/indexeddb')
    setSales(await getAllSales())
    setLoading(false)
  }

  const filteredSales = sales.filter(sale => {
    const matchSearch =
      sale.receipt_pin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const sd = new Date(sale.created_at)
    const today = new Date(); today.setHours(0,0,0,0)
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate()-7)
    const monthAgo = new Date(today); monthAgo.setMonth(today.getMonth()-1)
    const matchDate =
      dateFilter === 'all' ? true :
      dateFilter === 'today' ? sd >= today :
      dateFilter === 'week' ? sd >= weekAgo :
      dateFilter === 'month' ? sd >= monthAgo : true

    const matchPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter
    return matchSearch && matchDate && matchPayment
  })

  const totalRevenue = filteredSales.reduce((s, x) => s + Number(x.total_amount), 0)

  const handleView = async (sale: any) => {
    setSelectedSale(sale)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('sale_items').select('*, products(name)').eq('sale_id', sale.id)
      setSelectedSaleItems(data || sale.sale_items || [])
    } catch {
      setSelectedSaleItems(sale.sale_items || [])
    }
    setShowReceipt(true)
  }

  const fmt = (d: string) => new Date(d).toLocaleString('en-KE',{
    month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Sales History</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filteredSales.length} transactions · KES {totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by PIN or receipt #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="mpesa">M-Pesa</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="credit_account">Credit</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-lg font-bold text-gray-900">{filteredSales.length}</p>
          <p className="text-xs text-gray-500">Transactions</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-lg font-bold text-blue-600">KES {totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-lg font-bold text-gray-900">
            KES {filteredSales.length ? Math.round(totalRevenue/filteredSales.length).toLocaleString() : '0'}
          </p>
          <p className="text-xs text-gray-500">Avg Sale</p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden md:block">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Receipt PIN','Date & Time','Items','Total','Payment',''].map(h => (
                  <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h==='' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-mono font-medium text-gray-900">{sale.receipt_pin}</p>
                    {sale.receipt_number && <p className="text-xs text-gray-400">{sale.receipt_number}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{fmt(sale.created_at)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{sale.sale_items?.length || 0} items</td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-bold text-gray-900">KES {Number(sale.total_amount).toLocaleString()}</p>
                    {Number(sale.discount_amount) > 0 && (
                      <p className="text-xs text-green-600">-KES {Number(sale.discount_amount).toLocaleString()} disc.</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                      sale.payment_method==='cash' ? 'bg-green-100 text-green-700' :
                      sale.payment_method==='mpesa' ? 'bg-blue-100 text-blue-700' :
                      sale.payment_method==='card' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {sale.payment_method?.replace(/_/g,' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => handleView(sale)} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 ml-auto">
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filteredSales.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">No sales found for this filter</div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filteredSales.map((sale) => (
          <div key={sale.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-mono font-bold text-gray-900">{sale.receipt_pin}</p>
                <p className="text-xs text-gray-400">{fmt(sale.created_at)}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">KES {Number(sale.total_amount).toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                  sale.payment_method==='cash' ? 'bg-green-100 text-green-700' :
                  sale.payment_method==='mpesa' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{sale.payment_method?.replace(/_/g,' ')}</span>
                <span className="text-xs text-gray-400">{sale.sale_items?.length||0} items</span>
              </div>
              <button onClick={() => handleView(sale)} className="text-blue-600 text-sm font-medium flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> View
              </button>
            </div>
          </div>
        ))}
        {filteredSales.length === 0 && !loading && (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm">No sales found</div>
        )}
      </div>

      {/* Receipt modal */}
      {showReceipt && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
              <h3 className="font-bold text-gray-900">Receipt</h3>
              <button onClick={() => setShowReceipt(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Receipt sale={selectedSale} items={selectedSaleItems} />
            </div>
            <div className="px-5 pb-5 pt-3 border-t flex gap-3 flex-shrink-0">
              <button onClick={() => setShowReceipt(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">Close</button>
              <button onClick={() => window.print()} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
