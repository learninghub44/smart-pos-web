'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Check, X, Eye, RotateCcw } from 'lucide-react'

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<any>(null)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [formData, setFormData] = useState({
    sale_id: '',
    customer_id: '',
    reason: '',
    items: [] as any[]
  })

  useEffect(() => {
    loadReturns()
    loadSales()
  }, [])

  const loadReturns = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('returns')
        .select('*, return_items(*, products(*))')
        .order('created_at', { ascending: false })
      
      if (data && !error) {
        setReturns(data)
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { getAllReturns } = await import('@/lib/indexeddb')
    const allReturns = await getAllReturns()
    setReturns(allReturns)
  }

  const loadSales = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(*, products(*))')
        .order('created_at', { ascending: false })
        .limit(50)
      
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

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = 
      ret.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.reason.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || ret.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleNewReturn = () => {
    setFormData({ sale_id: '', customer_id: '', reason: '', items: [] })
    setShowModal(true)
  }

  const handleApprove = async (id: string) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('returns')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (!error) {
        loadReturns()
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { updateReturnInDB } = await import('@/lib/indexeddb')
    const returnData = returns.find(r => r.id === id)
    if (returnData) {
      await updateReturnInDB({
        ...returnData,
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      loadReturns()
    }
  }

  const handleReject = async (id: string) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('returns')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (!error) {
        loadReturns()
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { updateReturnInDB } = await import('@/lib/indexeddb')
    const returnData = returns.find(r => r.id === id)
    if (returnData) {
      await updateReturnInDB({
        ...returnData,
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      loadReturns()
    }
  }

  const handleView = (ret: any) => {
    setSelectedReturn(ret)
    setShowViewModal(true)
  }

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { data, error } = await supabase
        .from('returns')
        .insert({
          sale_id: formData.sale_id || null,
          customer_id: formData.customer_id || null,
          total_amount: formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          reason: formData.reason,
          status: 'pending'
        })
        .select()
        .single()
      
      if (data && !error) {
        const returnItems = formData.items.map((item: any) => ({
          id: crypto.randomUUID(),
          return_id: data.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          created_at: new Date().toISOString()
        }))
        
        await supabase.from('return_items').insert(returnItems)
        
        const { addReturnToDB, addReturnItemToDB } = await import('@/lib/indexeddb')
        await addReturnToDB(data)
        for (const item of returnItems) {
          await addReturnItemToDB(item)
        }
        
        loadReturns()
        setShowModal(false)
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { addReturnToDB, addReturnItemToDB } = await import('@/lib/indexeddb')
    const newReturn = {
      id: crypto.randomUUID(),
      sale_id: formData.sale_id || null,
      customer_id: formData.customer_id || null,
      total_amount: formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      reason: formData.reason,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    await addReturnToDB(newReturn)
    
    const returnItems = formData.items.map((item: any) => ({
      id: crypto.randomUUID(),
      return_id: newReturn.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      created_at: new Date().toISOString()
    }))
    
    for (const item of returnItems) {
      await addReturnItemToDB(item)
    }
    
    loadReturns()
    setShowModal(false)
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

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Returns & Refunds</h1>
          <p className="text-gray-600 mt-1">Manage product returns and refunds</p>
        </div>
        <button
          onClick={handleNewReturn}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>New Return</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Reason</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((ret) => (
                <tr key={ret.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{ret.id.slice(0, 8)}...</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(ret.created_at)}</td>
                  <td className="py-3 px-4 text-gray-600">{ret.reason}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">KES {Number(ret.total_amount).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ret.status as keyof typeof statusColors]}`}>
                      {ret.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleView(ret)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {ret.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(ret.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(ret.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReturns.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No returns found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">New Return</h2>
            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Sale (Optional)
                </label>
                <select
                  value={formData.sale_id}
                  onChange={(e) => {
                    setFormData({ ...formData, sale_id: e.target.value })
                    const sale = sales.find(s => s.id === e.target.value)
                    if (sale) {
                      setSelectedSale(sale)
                      setFormData(prev => ({
                        ...prev,
                        items: sale.sale_items?.map((item: any) => ({
                          product_id: item.product_id,
                          name: item.products?.name || 'Product',
                          quantity: 0,
                          price: item.price
                        })) || []
                      }))
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a sale...</option>
                  {sales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.receipt_pin} - {formatDate(sale.created_at)} - KES {Number(sale.total_amount).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Return
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              {formData.items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items to Return
                  </label>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">KES {item.price.toLocaleString()}</p>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...formData.items]
                            newItems[index].quantity = parseInt(e.target.value) || 0
                            setFormData({ ...formData, items: newItems })
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Qty"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Return Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Return ID</p>
                  <p className="font-medium">{selectedReturn.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{formatDate(selectedReturn.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedReturn.status as keyof typeof statusColors]}`}>
                    {selectedReturn.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-bold">KES {Number(selectedReturn.total_amount).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reason</p>
                <p className="font-medium">{selectedReturn.reason}</p>
              </div>
              {selectedReturn.return_items && selectedReturn.return_items.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Returned Items</p>
                  <div className="space-y-2">
                    {selectedReturn.return_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{item.products?.name || 'Product'}</span>
                        <span>{item.quantity} x KES {item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
