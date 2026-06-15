'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, Edit, Trash2, Package, AlertCircle, Camera, Barcode, RefreshCw, X, Download, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { getAllProducts, addProductToDB, updateProductInDB, deleteProductFromDB, getProductByBarcode } from '@/lib/indexeddb'
import BarcodeScanner from '@/components/BarcodeScanner'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { lookupBarcode } from '@/lib/productLookup'

interface Product {
  id: string; name: string; sku: string | null; barcode: string
  category_id: string | null; brand_id: string | null; unit: string | null
  cost_price: number; selling_price: number; tax_rate: number
  stock: number; minimum_stock: number; image_url: string | null
  archived: boolean; created_at: string; updated_at: string
}

// Generate EAN13-style barcode number
function generateBarcode(): string {
  const prefix = '6' // East Africa region prefix
  const num = prefix + Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('')
  // Calculate check digit
  let sum = 0
  for (let i = 0; i < 12; i++) sum += parseInt(num[i]) * (i % 2 === 0 ? 1 : 3)
  const check = (10 - (sum % 10)) % 10
  return num + check
}

// SVG barcode renderer (Code128 simplified)
function BarcodeDisplay({ value, width = 200, height = 60 }: { value: string; width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !value) return
    try {
      import('jsbarcode').then(({ default: JsBarcode }) => {
        JsBarcode(svgRef.current, value, {
          format: 'EAN13',
          width: 1.5,
          height: height - 20,
          displayValue: true,
          fontSize: 11,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000'
        })
      }).catch(() => {
        // Fallback: show text barcode
        if (svgRef.current) {
          svgRef.current.innerHTML = `<text x="50%" y="50%" text-anchor="middle" font-family="monospace" font-size="12">${value}</text>`
        }
      })
    } catch (_) {}
  }, [value, height])

  return <svg ref={svgRef} width={width} height={height} />
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [showBarcodeModal, setShowBarcodeModal] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupResult, setLookupResult] = useState<{ source: string; name: string; brand?: string; category?: string; imageUrl?: string } | null>(null)
  const [lookupImageUrl, setLookupImageUrl] = useState<string>('')
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [formData, setFormData] = useState({
    name: '', sku: '', barcode: '', unit: '',
    cost_price: '', selling_price: '', tax_rate: '', stock: '', minimum_stock: ''
  })

  useEffect(() => { loadProducts() }, [])

  const handleBarcodeScan = async (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }))
    setShowCameraScanner(false)
    triggerLookup(barcode)
  }

  useBarcodeScanner({ onScan: handleBarcodeScan, enabled: showModal && !showCameraScanner })

  // Auto-lookup product details when barcode changes
  const triggerLookup = useCallback(async (barcode: string) => {
    if (!barcode || barcode.length < 8) return
    setLookingUp(true)
    setLookupResult(null)
    setLookupImageUrl('')
    try {
      const result = await lookupBarcode(barcode)
      if (result?.name) {
        setFormData(prev => ({
          ...prev,
          name: prev.name || result.name || '',
          unit: prev.unit || result.unit || '',
        }))
        if (result.imageUrl) setLookupImageUrl(result.imageUrl)
        setLookupResult({
          source: result.source || 'Online DB',
          name: result.name,
          brand: result.brand,
          category: result.category,
          imageUrl: result.imageUrl,
        })
      }
    } catch (_) {}
    setLookingUp(false)
  }, [])

  const handleBarcodeChange = (value: string) => {
    setFormData(prev => ({ ...prev, barcode: value }))
    setLookupResult(null)
    if (lookupTimer.current) clearTimeout(lookupTimer.current)
    if (value.length >= 8) {
      lookupTimer.current = setTimeout(() => triggerLookup(value), 600)
    }
  }

  const loadProducts = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (data && !error) {
        setProducts(data)
        for (const p of data) await updateProductInDB(p)
        return
      }
    } catch (_) {}
    const local = await getAllProducts()
    setProducts(local)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode || '').includes(searchTerm) ||
    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openAdd = () => {
    setEditingProduct(null)
    setLookupResult(null)
    setLookingUp(false)
    setLookupImageUrl('')
    setFormData({ name: '', sku: '', barcode: generateBarcode(), unit: '', cost_price: '', selling_price: '', tax_rate: '', stock: '', minimum_stock: '' })
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditingProduct(p)
    setLookupResult(null)
    setLookingUp(false)
    setLookupImageUrl(p.image_url || '')
    setFormData({
      name: p.name, sku: p.sku || '', barcode: p.barcode, unit: p.unit || '',
      cost_price: p.cost_price.toString(), selling_price: p.selling_price.toString(),
      tax_rate: p.tax_rate.toString(), stock: p.stock.toString(),
      minimum_stock: p.minimum_stock.toString()
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('products').delete().eq('id', id)
    } catch (_) {}
    await deleteProductFromDB(id)
    loadProducts()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const data = {
      name: formData.name, sku: formData.sku || null, barcode: formData.barcode,
      unit: formData.unit || null, category_id: null, brand_id: null,
      cost_price: parseFloat(formData.cost_price),
      selling_price: parseFloat(formData.selling_price),
      tax_rate: parseFloat(formData.tax_rate) || 0,
      stock: parseInt(formData.stock), minimum_stock: parseInt(formData.minimum_stock) || 0,
      image_url: lookupImageUrl || null, archived: false,
      created_at: editingProduct?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    try {
      const { supabase } = await import('@/lib/supabase')
      if (editingProduct) {
        await supabase.from('products').update(data).eq('id', editingProduct.id)
        await updateProductInDB({ ...data, id: editingProduct.id })
      } else {
        const id = crypto.randomUUID()
        await supabase.from('products').insert({ ...data, id })
        await addProductToDB({ ...data, id })
      }
    } catch (_) {
      if (editingProduct) {
        await updateProductInDB({ ...data, id: editingProduct.id })
      } else {
        await addProductToDB({ ...data, id: crypto.randomUUID() })
      }
    }
    setSaving(false)
    setShowModal(false)
    loadProducts()
  }

  const lowStock = products.filter(p => p.stock < (p.minimum_stock || 10) && !p.archived)

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500 mt-0.5">{products.length} products</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">Low Stock Alert</p>
              <p className="text-amber-700 text-sm">{lowStock.map(p => p.name).join(', ')}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search name, barcode, SKU..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Barcode</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-14 text-gray-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>{searchTerm ? 'No products match your search' : 'No products yet. Add your first product.'}</p>
                    </td>
                  </tr>
                ) : filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-lg object-contain bg-gray-50 border border-gray-200 flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{p.name}</div>
                          {p.sku && <div className="text-xs text-gray-400">{p.sku}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <button onClick={() => setShowBarcodeModal(p)}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-mono">
                        <Barcode className="w-3.5 h-3.5" />
                        {p.barcode || '—'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-gray-500">
                      KES {Number(p.cost_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      KES {Number(p.selling_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.stock <= 0 ? 'bg-red-100 text-red-700'
                        : p.stock < (p.minimum_stock || 10) ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                      }`}>
                        {p.stock <= 0 ? 'Out' : p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setShowBarcodeModal(p)} className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg sm:hidden">
                          <Barcode className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Barcode modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Barcode</h3>
              <button onClick={() => setShowBarcodeModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4 font-medium">{showBarcodeModal.name}</p>
            <div className="flex justify-center bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <BarcodeDisplay value={showBarcodeModal.barcode} width={220} height={80} />
            </div>
            <p className="text-center text-xs text-gray-400 font-mono mb-4">{showBarcodeModal.barcode}</p>
            <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              <Download className="w-4 h-4" /> Print Barcode
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
              <h2 className="font-bold text-gray-900 text-lg">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4">
              <form onSubmit={handleSubmit} className="space-y-4" id="product-form">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Product Name *</label>
                  <input required type="text" value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Coca Cola 500ml" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">SKU</label>
                    <input type="text" value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Unit</label>
                    <input type="text" value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="pcs, kg, L" />
                  </div>
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Barcode *</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input required type="text" value={formData.barcode}
                        onChange={e => handleBarcodeChange(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                        placeholder="Scan or enter barcode" />
                      {lookingUp && (
                        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                      )}
                    </div>
                    <button type="button" onClick={() => { const b = generateBarcode(); setFormData(prev => ({ ...prev, barcode: b })); triggerLookup(b) }}
                      title="Auto-generate barcode"
                      className="px-3 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-xs font-medium flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" /> Gen
                    </button>
                    <button type="button" onClick={() => setShowCameraScanner(true)}
                      title="Scan with camera"
                      className="px-3 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lookup result — rich product card */}
                  {lookupResult && (
                    <div className="mt-3 border border-green-200 bg-green-50 rounded-xl overflow-hidden">
                      <div className="flex items-stretch gap-0">
                        {lookupResult.imageUrl && (
                          <div className="w-20 flex-shrink-0 bg-white flex items-center justify-center p-1.5 border-r border-green-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={lookupResult.imageUrl}
                              alt={lookupResult.name}
                              className="w-full h-16 object-contain rounded"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          </div>
                        )}
                        <div className="flex-1 p-3 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            <span className="text-xs font-semibold text-green-700">Found via {lookupResult.source}</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900 leading-tight truncate">{lookupResult.name}</p>
                          {lookupResult.brand && (
                            <p className="text-xs text-gray-500 mt-0.5">Brand: <span className="font-medium text-gray-700">{lookupResult.brand}</span></p>
                          )}
                          {lookupResult.category && (
                            <p className="text-xs text-gray-500">Category: <span className="font-medium text-gray-700">{lookupResult.category}</span></p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {!lookingUp && !lookupResult && formData.barcode.length >= 8 && !editingProduct && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>No online match found — fill details manually</span>
                    </div>
                  )}

                  {formData.barcode && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-xl flex justify-center">
                      <BarcodeDisplay value={formData.barcode} width={180} height={55} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Cost Price (KES) *</label>
                    <input required type="number" step="0.01" min="0" value={formData.cost_price}
                      onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Selling Price (KES) *</label>
                    <input required type="number" step="0.01" min="0" value={formData.selling_price}
                      onChange={e => setFormData({ ...formData, selling_price: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Stock Qty *</label>
                    <input required type="number" min="0" value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Min Stock</label>
                    <input type="number" min="0" value={formData.minimum_stock}
                      onChange={e => setFormData({ ...formData, minimum_stock: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </form>
            </div>

            <div className="px-5 py-4 border-t flex gap-3 flex-shrink-0">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" form="product-form" disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : editingProduct ? 'Update' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCameraScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowCameraScanner(false)} continuous={false} />
      )}
    </>
  )
}
