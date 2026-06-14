'use client'

import { useState, useEffect } from 'react'
import { Search, Receipt as ReceiptIcon, X, Camera } from 'lucide-react'
import { getSaleByReceiptPin, getSaleItemsBySaleId } from '@/lib/indexeddb'
import Receipt from '@/components/Receipt'
import BarcodeScanner from '@/components/BarcodeScanner'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'

export default function ReceiptsPage() {
  const [searchPin, setSearchPin] = useState('')
  const [searchType, setSearchType] = useState<'receipt_pin' | 'receipt_number' | 'customer_phone' | 'customer_name' | 'sale_date'>('receipt_pin')
  const [foundSale, setFoundSale] = useState<any>(null)
  const [saleItems, setSaleItems] = useState<any[]>([])
  const [showReceipt, setShowReceipt] = useState(false)
  const [showCameraScanner, setShowCameraScanner] = useState(false)

  const handleReceiptScan = async (pin: string) => {
    setSearchPin(pin)
    await handleSearch()
    setShowCameraScanner(false)
  }

  // USB barcode scanner integration
  useBarcodeScanner({
    onScan: handleReceiptScan,
    enabled: !showReceipt && !showCameraScanner
  })

  const handleSearch = async () => {
    if (!searchPin.trim()) return

    try {
      const { supabase } = await import('@/lib/supabase')
      
      let query = supabase.from('sales').select('*')
      
      // Apply search based on search type
      if (searchType === 'receipt_pin') {
        query = query.eq('receipt_pin', searchPin.toUpperCase())
      } else if (searchType === 'receipt_number') {
        query = query.eq('receipt_number', searchPin.toUpperCase())
      } else if (searchType === 'customer_phone') {
        // Need to join with customers table
        const { data: customers } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', searchPin)
          .single()
        
        if (customers) {
          query = query.eq('customer_id', customers.id)
        } else {
          alert('Customer not found')
          return
        }
      } else if (searchType === 'customer_name') {
        const { data: customers } = await supabase
          .from('customers')
          .select('id')
          .ilike('name', `%${searchPin}%`)
        
        if (customers && customers.length > 0) {
          query = query.in('customer_id', customers.map(c => c.id))
        } else {
          alert('Customer not found')
          return
        }
      } else if (searchType === 'sale_date') {
        query = query.gte('created_at', `${searchPin}T00:00:00`)
          .lte('created_at', `${searchPin}T23:59:59`)
      }
      
      const { data: sale, error: saleError } = await query.single()
      
      if (sale && !saleError) {
        setFoundSale(sale)
        
        // Get sale items with product names
        const { data: items, error: itemsError } = await supabase
          .from('sale_items')
          .select('*, products(name)')
          .eq('sale_id', sale.id)
        
        if (items && !itemsError) {
          const itemsWithNames = items.map((item: any) => ({
            ...item,
            name: item.products?.name || `Product ${item.product_id.substring(0, 8)}`,
            total: item.price * item.quantity
          }))
          setSaleItems(itemsWithNames)
          setShowReceipt(true)
          return
        }
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    // Fall back to IndexedDB
    const sale = await getSaleByReceiptPin(searchPin.toUpperCase())
    
    if (sale) {
      setFoundSale(sale)
      const items = await getSaleItemsBySaleId(sale.id)
      // In production, you'd fetch product names from products table
      // For demo, we'll use placeholder names
      const itemsWithNames = items.map((item: any) => ({
        ...item,
        name: `Product ${item.product_id.substring(0, 8)}`,
        total: item.price * item.quantity
      }))
      setSaleItems(itemsWithNames)
      setShowReceipt(true)
    } else {
      alert('Receipt not found with this PIN')
      setFoundSale(null)
      setSaleItems([])
      setShowReceipt(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchPin('')
    setFoundSale(null)
    setSaleItems([])
    setShowReceipt(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
        <p className="text-gray-600 mt-1">Search and verify receipts by PIN</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search By</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="receipt_pin">Receipt PIN</option>
              <option value="receipt_number">Receipt Number</option>
              <option value="customer_phone">Customer Phone</option>
              <option value="customer_name">Customer Name</option>
              <option value="sale_date">Sale Date (YYYY-MM-DD)</option>
            </select>
          </div>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <ReceiptIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={
                  searchType === 'receipt_pin' ? 'Enter Receipt PIN (e.g., POS-ABC123)' :
                  searchType === 'receipt_number' ? 'Enter Receipt Number (e.g., RCP-20240614-ABC123)' :
                  searchType === 'customer_phone' ? 'Enter Customer Phone' :
                  searchType === 'customer_name' ? 'Enter Customer Name' :
                  'Enter Sale Date (YYYY-MM-DD)'
                }
                value={searchPin}
                onChange={(e) => setSearchPin(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowCameraScanner(true)}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Camera className="h-5 w-5" />
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
            {searchPin && (
              <button
                onClick={clearSearch}
                className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Display */}
      {showReceipt && foundSale && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Receipt
            sale={{
              ...foundSale,
              cashier_name: 'Cashier' // In production, fetch from users table
            }}
            items={saleItems}
            shopName="SMART POS"
          />
        </div>
      )}

      {/* Instructions */}
      {!showReceipt && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to verify a receipt:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Ask the customer for their Receipt PIN</li>
            <li>Enter the PIN in the search field above</li>
            <li>Click "Search" to view the receipt details</li>
            <li>Verify the items, total, and payment method</li>
            <li>Print the receipt if needed for returns or exchanges</li>
          </ol>
        </div>
      )}

      {showCameraScanner && (
        <BarcodeScanner
          onScan={handleReceiptScan}
          onClose={() => setShowCameraScanner(false)}
          continuous={false}
          showFlashlight={true}
        />
      )}
    </div>
  )
}
