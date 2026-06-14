'use client'

import { useState, useEffect } from 'react'
import { Camera, Package, CheckCircle, X, Save, Download } from 'lucide-react'
import BarcodeScanner from '@/components/BarcodeScanner'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { getAllProducts, getProductByBarcode, updateProductInDB } from '@/lib/indexeddb'

interface CountItem {
  productId: string
  productName: string
  barcode: string
  systemStock: number
  countedStock: number
  variance: number
}

export default function InventoryCountPage() {
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [countItems, setCountItems] = useState<CountItem[]>([])
  const [currentBarcode, setCurrentBarcode] = useState('')
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionName, setSessionName] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const products = await getAllProducts()
    setCountItems(products.map(p => ({
      productId: p.id,
      productName: p.name,
      barcode: p.barcode,
      systemStock: p.stock,
      countedStock: 0,
      variance: 0
    })))
  }

  const handleBarcodeScan = async (barcode: string) => {
    const product = await getProductByBarcode(barcode)
    if (product) {
      const existingItem = countItems.find(item => item.productId === product.id)
      if (existingItem) {
        setCountItems(countItems.map(item =>
          item.productId === product.id
            ? { ...item, countedStock: item.countedStock + 1, variance: (item.countedStock + 1) - item.systemStock }
            : item
        ))
      } else {
        setCountItems([...countItems, {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          systemStock: product.stock,
          countedStock: 1,
          variance: 1 - product.stock
        }])
      }
      setCurrentBarcode(barcode)
      setShowCameraScanner(false)
    } else {
      alert(`Product not found: ${barcode}`)
    }
  }

  // USB barcode scanner integration
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: sessionActive && !showCameraScanner
  })

  const startSession = () => {
    if (!sessionName.trim()) {
      alert('Please enter a session name')
      return
    }
    setSessionActive(true)
    loadProducts()
  }

  const endSession = () => {
    setSessionActive(false)
  }

  const updateCountedStock = (productId: string, newCount: number) => {
    setCountItems(countItems.map(item =>
      item.productId === productId
        ? { ...item, countedStock: newCount, variance: newCount - item.systemStock }
        : item
    ))
  }

  const saveCount = async () => {
    for (const item of countItems) {
      if (item.countedStock !== item.systemStock) {
        try {
          const { supabase } = await import('@/lib/supabase')
          await supabase
            .from('products')
            .update({ stock: item.countedStock })
            .eq('id', item.productId)
          
          await updateProductInDB({ id: item.productId, stock: item.countedStock } as any)
        } catch (error) {
          console.log('Supabase not available, using IndexedDB only')
          await updateProductInDB({ id: item.productId, stock: item.countedStock } as any)
        }
      }
    }
    alert('Inventory count saved successfully')
    loadProducts()
  }

  const exportReport = () => {
    const report = {
      sessionName,
      date: new Date().toISOString(),
      items: countItems.filter(item => item.countedStock > 0)
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-count-${sessionName}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const countedItems = countItems.filter(item => item.countedStock > 0)
  const varianceItems = countItems.filter(item => item.variance !== 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Count</h1>
          <p className="text-gray-600 mt-1">Rapid stock counting with barcode scanner</p>
        </div>
        <button
          onClick={() => setShowCameraScanner(true)}
          disabled={!sessionActive}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Camera className="h-5 w-5" />
          <span>Scan</span>
        </button>
      </div>

      {!sessionActive ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Start New Count Session</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Name
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Monthly Count - June 2026"
              />
            </div>
            <button
              onClick={startSession}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
            >
              Start Session
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{sessionName}</h2>
                <p className="text-sm text-gray-600">
                  {countedItems.length} items counted
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={saveCount}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Save className="h-5 w-5" />
                  <span>Save</span>
                </button>
                <button
                  onClick={exportReport}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  <Download className="h-5 w-5" />
                  <span>Export</span>
                </button>
                <button
                  onClick={endSession}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  <X className="h-5 w-5" />
                  <span>End</span>
                </button>
              </div>
            </div>

            {currentBarcode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Last scanned: {currentBarcode}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Counted Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Barcode</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">System Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Counted</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {countedItems.map((item) => (
                    <tr key={item.productId} className="border-b">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.productName}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.barcode}</td>
                      <td className="px-4 py-3 text-gray-600">{item.systemStock}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.countedStock}
                          onChange={(e) => updateCountedStock(item.productId, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${
                          item.variance === 0
                            ? 'text-gray-600'
                            : item.variance > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {item.variance > 0 ? '+' : ''}{item.variance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {countedItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No items counted yet</p>
                <p className="text-sm text-gray-500 mt-2">Scan barcodes or use USB scanner to count items</p>
              </div>
            )}
          </div>

          {varianceItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Variance Report</h3>
              <div className="space-y-2">
                {varianceItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-600">{item.barcode}</div>
                    </div>
                    <div className={`font-bold ${
                      item.variance > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.variance > 0 ? '+' : ''}{item.variance}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showCameraScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowCameraScanner(false)}
          continuous={true}
          showFlashlight={true}
        />
      )}
    </div>
  )
}
