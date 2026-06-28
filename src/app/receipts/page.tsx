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

  useEffect(() => { loadBusinessSettings() }, [])

  const loadBusinessSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const json = await res.json()
        const settings = json.data ?? json
        if (settings?.business) { setBusinessSettings(settings.business); return }
        if (settings) { setBusinessSettings(settings); return }
      }
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

  useBarcodeScanner({ onScan: handleReceiptScan, enabled: !showReceipt && !showCameraScanner })

  const doSearch = async (pin: string) => {
    if (!pin.trim()) return

    try {
      // Build query params
      const params = new URLSearchParams()
      if (searchType === 'receipt_pin') params.set('receipt_pin', pin.toUpperCase())
      else if (searchType === 'receipt_number') params.set('receipt_number', pin.toUpperCase())
      else if (searchType === 'customer_phone') params.set('customer_phone', pin)
      else if (searchType === 'customer_name') params.set('customer_name', pin)
      else if (searchType === 'sale_date') params.set('date', pin)

      const res = await fetch(`/api/sales?${params}`)
      if (res.ok) {
        const json = await res.json()
        const list: any[] = Array.isArray(json.data ?? json) ? (json.data ?? json) : []
        const sale = list[0]

        if (sale) {
          // Fetch sale items
          const itemsRes = await fetch(`/api/sales/${sale.id}/items`)
          let items: any[] = []
          if (itemsRes.ok) {
            const itemsJson = await itemsRes.json()
            items = Array.isArray(itemsJson.data ?? itemsJson) ? (itemsJson.data ?? itemsJson) : []
          }

          setFoundSale(sale)
          setSaleItems(items.map((item: any) => ({
            ...item,
            name: item.product_name || item.products?.name || 'Unknown Product',
            total: item.price * item.quantity
          })))
          setShowReceipt(true)
          return
        }
      }
    } catch (_) {}

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
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch() }
  const clearSearch = () => { setSearchPin(''); setFoundSale(null); setSaleItems([]); setShowReceipt(false) }

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
            <select value={searchType} onChange={(e) => setSearchType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
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
              <input type="text"
                placeholder={
                  searchType === 'receipt_pin' ? 'Enter Receipt PIN (e.g., POS-ABC123)' :
                  searchType === 'receipt_number' ? 'Enter Receipt Number' :
                  searchType === 'customer_phone' ? 'Enter Customer Phone' :
                  searchType === 'customer_name' ? 'Enter Customer Name' :
                  'Enter Sale Date (YYYY-MM-DD)'
                }
                value={searchPin} onChange={(e) => setSearchPin(e.target.value)} onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => setShowCameraScanner(true)} className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <Camera className="h-5 w-5" />
            </button>
            <button onClick={handleSearch} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Search</button>
            {searchPin && (
              <button onClick={clearSearch} className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showReceipt && foundSale && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <Receipt
            sale={foundSale} items={saleItems}
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
        <BarcodeScanner onScan={handleReceiptScan} onClose={() => setShowCameraScanner(false)} continuous={false} showFlashlight={true} />
      )}
    </div>
  )
}
