'use client'

import { useState, useEffect } from 'react'
import { Receipt as ReceiptIcon, X, Camera } from 'lucide-react'
import { getSaleByReceiptPin, getSaleItemsBySaleId, getAllProducts } from '@/lib/indexeddb'
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
  const [businessSettings, setBusinessSettings] = useState<any>(null)

  useEffect(() => {
    loadBusinessSettings()
  }, [])

  const loadBusinessSettings = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('settings').select('*').eq('key', 'business').single()
      if (data) { setBusinessSettings(data.value); return }
    } catch (_) {}
    try {
      const { getSettingByKey } = await import('@/lib/indexeddb')
      const business = await getSettingByKey('business')
      if (business) setBusinessSettings(business.value)
    } catch (_) {}
  }

  const handleReceiptScan = async (pin: string) => {
    setSearchPin(pin)
    await doSearch(pin)
    setShowCameraScanner(false)
  }

  useBarcodeScanner({
    onScan: handleReceiptScan,
    enabled: !showReceipt && !showCameraScanner
  })

  const doSearch = async (pin: string) => {
    if (!pin.trim()) return

    try {
      const { supabase } = await import('@/lib/supabase')

      let query = supabase.from('sales').select('*')

      if (searchType === 'receipt_pin') {
        query = query.eq('receipt_pin', pin.toUpperCase())
      } else if (searchType === 'receipt_number') {
        query = query.eq('receipt_number', pin.toUpperCase())
      } else if (searchType === 'customer_phone') {
        const { data: customers } = await supabase
          .from('customers').select('id').eq('phone', pin).single()
        if (customers) {
          query = query.eq('customer_id', (customers as any).id)
        } else {
          alert('Customer not found'); return
        }
      } else if (searchType === 'customer_name') {
        const { data: customers } = await supabase
          .from('customers').select('id').ilike('name', `%${pin}%`)
        if (customers && customers.length > 0) {
          query = query.in('customer_id', customers.map((c: any) => c.id))
        } else {
          alert('Customer not found'); return
        }
      } else if (searchType === 'sale_date') {
        query = query
          .gte('created_at', `${pin}T00:00:00`)
          .lte('created_at', `${pin}T23:59:59`)
      }

      const { data: sale, error: saleError } = await query.single()

      if (sale && !saleError) {
        // Fetch cashier name from users table
        let cashierName = 'Cashier'
        if (sale.cashier_id) {
          const { data: cashierData } = await supabase
            .from('users').select('name').eq('id', sale.cashier_id).single()
          if (cashierData) cashierName = (cashierData as any).name
        }

        setFoundSale({ ...sale, cashier_name: cashierName })

        const { data: items, error: itemsError } = await supabase
          .from('sale_items').select('*, products(name)').eq('sale_id', sale.id)

        if (items && !itemsError) {
          setSaleItems(items.map((item: any) => ({
            ...item,
            name: item.products?.name || 'Unknown Product',
            total: item.price * item.quantity
          })))
          setShowReceipt(true)
          return
        }
      }
    } catch (_) {
      console.log('Supabase not available, using IndexedDB')
    }

    // Fallback to IndexedDB
    const sale = await getSaleByReceiptPin(pin.toUpperCase())
    if (sale) {
      setFoundSale(sale)
      const items = await getSaleItemsBySaleId(sale.id)
      const allProducts = await getAllProducts()
      const productMap = new Map(allProducts.map(p => [p.id, p.name]))
      setSaleItems(items.map((item: any) => ({
        ...item,
        name: item.product_id ? (productMap.get(item.product_id) || 'Unknown Product') : 'Unknown Product',
        total: item.price * item.quantity
      })))
      setShowReceipt(true)
    } else {
      alert('Receipt not found with this PIN')
      setFoundSale(null)
      setSaleItems([])
      setShowReceipt(false)
    }
  }

  const handleSearch = () => doSearch(searchPin)

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const clearSearch = () => {
    setSearchPin('')
    setFoundSale(null)
    setSaleItems([])
    setShowReceipt(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
        <p className="text-gray-600 mt-1">Search and verify receipts by PIN</p>
      </div>

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
                  searchType === 'receipt_number' ? 'Enter Receipt Number' :
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

      {showReceipt && foundSale && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Receipt
            sale={foundSale}
            items={saleItems}
            shopName={businessSettings?.name || 'SMART POS'}
            shopAddress={businessSettings?.address || ''}
            shopPhone={businessSettings?.phone || ''}
            shopEmail={businessSettings?.email || ''}
            cashierName={foundSale.cashier_name || 'Cashier'}
          />
        </div>
      )}

      {!showReceipt && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to verify a receipt:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Ask the customer for their Receipt PIN</li>
            <li>Enter the PIN in the search field above</li>
            <li>Click &quot;Search&quot; to view the receipt details</li>
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
