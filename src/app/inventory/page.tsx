'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  Search, Plus, Edit, Trash2, Package, AlertCircle, 
  Camera, X, Loader2, CheckCircle2, ImageOff, Truck
} from 'lucide-react'
import { 
  getAllProducts, addProductToDB, updateProductInDB, 
  deleteProductFromDB, getProductByBarcode, syncProductsFromSupabase,
  getAllCategories, addCategoryToDB, getAllBrands, addBrandToDB, getAllSuppliers
} from '@/lib/indexeddb'
import BarcodeScanner from '@/components/BarcodeScanner'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { lookupBarcode, ProductLookupResult } from '@/lib/productLookup'
import { getActiveBranchId } from '@/lib/auth'

interface Product {
  id: string
  name: string
  sku: string | null
  barcode: string
  category_id: string | null
  brand_id: string | null
  supplier_id?: string | null
  brand?: string | null
  category?: string | null
  unit: string | null
  cost_price: number
  selling_price: number
  tax_rate: number
  stock: number
  minimum_stock: number
  image_url: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

const EMPTY_FORM = {
  name: '', sku: '', barcode: '', unit: '',
  category_id: '', brand_id: '', supplier_id: '',
  cost_price: '', selling_price: '', tax_rate: '0',
  stock: '', minimum_stock: '10',
  image_url: ''
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')

  // Linked lookups: categories, brands, suppliers
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [quickAdd, setQuickAdd] = useState<{ type: 'category' | 'brand' | null, value: string, saving: boolean }>({ type: null, value: '', saving: false })
  
  // Lookup state
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState<ProductLookupResult | null>(null)
  const [lookupNotFound, setLookupNotFound] = useState(false)
  const barcodeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { loadProducts(); loadLookups() }, [])

  const loadLookups = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const [{ data: cats }, { data: brs }, { data: sups }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
      ])
      if (cats) { setCategories(cats); for (const c of cats) await addCategoryToDB(c) }
      if (brs) { setBrands(brs); for (const b of brs) await addBrandToDB(b) }
      if (sups) setSuppliers(sups)
      if (cats && brs && sups) return
    } catch {}
    setCategories(await getAllCategories())
    setBrands(await getAllBrands())
    setSuppliers(await getAllSuppliers())
  }

  // Auto-trigger lookup when barcode is typed (with debounce)
  const onBarcodeChange = (val: string) => {
    setFormData(prev => ({ ...prev, barcode: val }))
    setLookupResult(null)
    setLookupNotFound(false)
    if (barcodeDebounce.current) clearTimeout(barcodeDebounce.current)
    if (val.trim().length >= 6) {
      barcodeDebounce.current = setTimeout(() => triggerLookup(val.trim()), 800)
    }
  }

  const triggerLookup = async (barcode: string) => {
    setLookupLoading(true)
    setLookupResult(null)
    setLookupNotFound(false)
    try {
      const result = await lookupBarcode(barcode)
      if (result) {
        setLookupResult(result)
        const brandId = result.brand ? await findOrCreateBrand(result.brand) : null
        const categoryId = result.category ? await findOrCreateCategory(result.category) : null
        // Auto-fill form fields from lookup
        setFormData(prev => ({
          ...prev,
          name: result.name || prev.name,
          brand_id: brandId || prev.brand_id,
          category_id: categoryId || prev.category_id,
          unit: result.unit || prev.unit,
          image_url: result.imageUrl || prev.image_url,
        }))
      } else {
        setLookupNotFound(true)
      }
    } catch {
      setLookupNotFound(true)
    }
    setLookupLoading(false)
  }

  // Find an existing brand/category by name (case-insensitive), or create one on the fly
  const findOrCreateBrand = async (name: string): Promise<string | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const existing = brands.find(b => b.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing.id
    return createBrand(trimmed)
  }

  const findOrCreateCategory = async (name: string): Promise<string | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing.id
    return createCategory(trimmed)
  }

  const createBrand = async (name: string): Promise<string | null> => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const brand = { id, name, created_at: now, updated_at: now }
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.from('brands').insert(brand)
      if (error) throw error
    } catch { /* offline — saved locally only below */ }
    await addBrandToDB(brand)
    setBrands(prev => [...prev, brand].sort((a, b) => a.name.localeCompare(b.name)))
    return id
  }

  const createCategory = async (name: string): Promise<string | null> => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const category = { id, name, parent_id: null, created_at: now, updated_at: now }
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.from('categories').insert(category)
      if (error) throw error
    } catch { /* offline — saved locally only below */ }
    await addCategoryToDB(category)
    setCategories(prev => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)))
    return id
  }

  const handleQuickAddSubmit = async () => {
    if (!quickAdd.type || !quickAdd.value.trim()) return
    setQuickAdd(prev => ({ ...prev, saving: true }))
    const id = quickAdd.type === 'brand'
      ? await createBrand(quickAdd.value.trim())
      : await createCategory(quickAdd.value.trim())
    if (id) {
      setFormData(prev => ({
        ...prev,
        ...(quickAdd.type === 'brand' ? { brand_id: id } : { category_id: id })
      }))
    }
    setQuickAdd({ type: null, value: '', saving: false })
  }

  const handleBarcodeScan = async (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }))
    setShowCameraScanner(false)
    setError(null)
    // Trigger online lookup immediately
    triggerLookup(barcode)
  }

  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: showModal && !showCameraScanner
  })

  const loadProducts = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const branchId = getActiveBranchId()
      let query = supabase.from('products').select('*').order('name', { ascending: true })
      if (branchId) query = query.eq('branch_id', branchId)
      const { data, error } = await query
      if (data && !error) {
        setProducts(data)
        await syncProductsFromSupabase(data)
        return
      }
    } catch {}
    const all = await getAllProducts()
    setProducts(all)
  }

  const displayedProducts = products
    .filter(p => !p.archived)
    .filter(p => {
      if (filter === 'low') return p.stock > 0 && p.stock <= (p.minimum_stock || 10)
      if (filter === 'out') return p.stock === 0
      return true
    })
    .filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

  const openAdd = () => {
    setEditingProduct(null)
    setFormData(EMPTY_FORM)
    setError(null)
    setLookupResult(null)
    setLookupNotFound(false)
    setShowModal(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    // Legacy products may only have a text brand/category with no _id set —
    // fall back to matching by name so existing data still shows correctly.
    const legacyBrand = (product as any).brand as string | undefined
    const legacyCategory = (product as any).category as string | undefined
    const resolvedBrandId = product.brand_id
      || (legacyBrand ? brands.find(b => b.name.toLowerCase() === legacyBrand.toLowerCase())?.id : null)
      || ''
    const resolvedCategoryId = product.category_id
      || (legacyCategory ? categories.find(c => c.name.toLowerCase() === legacyCategory.toLowerCase())?.id : null)
      || ''
    setFormData({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode,
      category_id: resolvedCategoryId,
      brand_id: resolvedBrandId,
      supplier_id: product.supplier_id || '',
      unit: product.unit || '',
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
      tax_rate: product.tax_rate.toString(),
      stock: product.stock.toString(),
      minimum_stock: product.minimum_stock.toString(),
      image_url: product.image_url || ''
    })
    setError(null)
    setLookupResult(null)
    setLookupNotFound(false)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('products').delete().eq('id', id)
    } catch {}
    await deleteProductFromDB(id)
    loadProducts()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) return setError('Product name is required')
    if (!formData.barcode.trim()) return setError('Barcode is required')
    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) 
      return setError('Selling price must be greater than 0')
    if (formData.cost_price && parseFloat(formData.cost_price) < 0) 
      return setError('Cost price cannot be negative')
    if (formData.stock && parseInt(formData.stock) < 0) 
      return setError('Stock cannot be negative')

    // Check barcode uniqueness — check Supabase first, fall back to IndexedDB
    if (!editingProduct || editingProduct.barcode !== formData.barcode) {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data: existing } = await supabase
          .from('products')
          .select('id, name')
          .eq('barcode', formData.barcode.trim())
          .eq('archived', false)
          .single()
        if (existing && existing.id !== editingProduct?.id)
          return setError(`Barcode already used by: ${existing.name}`)
      } catch {
        // Offline: fall back to IndexedDB
        const existing = await getProductByBarcode(formData.barcode)
        if (existing && existing.id !== editingProduct?.id)
          return setError(`Barcode already used by: ${existing.name}`)
      }
    }

    setSaving(true)
    const now = new Date().toISOString()
    const branchId = getActiveBranchId()

    const selectedCategory = categories.find(c => c.id === formData.category_id)
    const selectedBrand = brands.find(b => b.id === formData.brand_id)

    // Build clean product object — only columns that exist in schema
    const productData: any = {
      name: formData.name.trim(),
      sku: formData.sku.trim() || null,
      barcode: formData.barcode.trim(),
      category_id: formData.category_id || null,
      brand_id: formData.brand_id || null,
      supplier_id: formData.supplier_id || null,
      unit: formData.unit.trim() || null,
      cost_price: parseFloat(formData.cost_price) || 0,
      selling_price: parseFloat(formData.selling_price),
      tax_rate: parseFloat(formData.tax_rate) || 0,
      stock: parseInt(formData.stock) || 0,
      minimum_stock: parseInt(formData.minimum_stock) || 10,
      image_url: formData.image_url.trim() || null,
      archived: false,
      updated_at: now,
    }
    // Add branch if it exists (multi-branch support)
    if (branchId) productData.branch_id = branchId

    // Add denormalized text brand/category (some installs have these as legacy
    // text columns alongside the _id columns). We'll try with them and retry
    // without if Supabase rejects.
    const productDataWithMeta = {
      ...productData,
      brand: selectedBrand?.name || null,
      category: selectedCategory?.name || null,
    }

    try {
      const { supabase } = await import('@/lib/supabase')
      
      const tryInsert = async (data: any) => {
        if (editingProduct) {
          const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id)
          return error
        } else {
          const id = crypto.randomUUID()
          const { error } = await supabase.from('products').insert({ ...data, id, created_at: now })
          if (!error) await addProductToDB({ ...data, id, created_at: now })
          return error
        }
      }

      // Try with brand/category text + supplier_id first
      let err = await tryInsert(productDataWithMeta)

      // If failed (legacy brand/category text columns don't exist), retry without them
      if (err) {
        err = await tryInsert(productData)
      }

      // If still failed (supplier_id column doesn't exist — migration 002 not run yet), drop it too
      if (err) {
        const { supplier_id, ...withoutSupplier } = productData
        err = await tryInsert(withoutSupplier)
        if (err) throw err
      }

      if (editingProduct) {
        await updateProductInDB({ ...productDataWithMeta, id: editingProduct.id, created_at: editingProduct.created_at })
      }
    } catch (err: any) {
      console.error('Supabase save failed, using IndexedDB:', err?.message)
      // Offline fallback
      if (editingProduct) {
        await updateProductInDB({ ...productDataWithMeta, id: editingProduct.id, created_at: editingProduct.created_at })
      } else {
        await addProductToDB({ ...productDataWithMeta, id: crypto.randomUUID(), created_at: now })
      }
    }

    setSaving(false)
    setShowModal(false)
    loadProducts()
  }

  const totalProducts = products.filter(p => !p.archived).length
  const lowStockCount = products.filter(p => !p.archived && p.stock > 0 && p.stock <= (p.minimum_stock || 10)).length
  const outOfStockCount = products.filter(p => !p.archived && p.stock === 0).length

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-0.5">{totalProducts} products</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-semibold text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'All Products', value: totalProducts, key: 'all', color: 'blue' },
          { label: 'Low Stock', value: lowStockCount, key: 'low', color: 'yellow' },
          { label: 'Out of Stock', value: outOfStockCount, key: 'out', color: 'red' },
        ].map(({ label, value, key, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`bg-white rounded-xl p-3 text-center border-2 transition-all shadow-sm ${
              filter === key 
                ? `border-${color}-500 bg-${color}-50` 
                : 'border-transparent hover:border-gray-200'
            }`}
          >
            <p className={`text-xl font-bold ${
              key === 'low' ? 'text-yellow-600' : key === 'out' ? 'text-red-600' : 'text-gray-900'
            }`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search name, barcode, SKU, brand..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Desktop table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Barcode</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Margin</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedProducts.map((product) => {
                const margin = product.cost_price > 0
                  ? (((product.selling_price - product.cost_price) / product.cost_price) * 100).toFixed(0)
                  : null
                const stockStatus = product.stock === 0 ? 'out' : product.stock <= (product.minimum_stock||10) ? 'low' : 'ok'
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                        ) : (
                          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-blue-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                          {((product as any).brand || product.unit) && (
                            <p className="text-xs text-gray-400">
                              {(product as any).brand}{(product as any).brand && product.unit ? ' · ' : ''}{product.unit}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-700">{product.barcode}</p>
                      {product.sku && <p className="text-xs text-gray-400">SKU: {product.sku}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-sm text-gray-600">KES {Number(product.cost_price).toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-sm font-bold text-gray-900">KES {Number(product.selling_price).toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {margin && <span className="text-xs font-medium text-green-600">{margin}%</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        stockStatus === 'out' ? 'bg-red-100 text-red-700' :
                        stockStatus === 'low' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {product.stock} {stockStatus !== 'ok' ? `(${stockStatus})` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {displayedProducts.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs mt-1">{searchTerm ? 'Try a different search' : 'Click "Add Product" to get started'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {displayedProducts.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No products found</p>
          </div>
        ) : displayedProducts.map((product) => {
          const stockStatus = product.stock === 0 ? 'out' : product.stock <= (product.minimum_stock||10) ? 'low' : 'ok'
          return (
            <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                ) : (
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-blue-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                  {(product as any).brand && <p className="text-xs text-gray-400">{(product as any).brand}</p>}
                  <p className="text-xs text-gray-400">{product.barcode}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                  stockStatus === 'out' ? 'bg-red-100 text-red-700' :
                  stockStatus === 'low' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>{product.stock}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-blue-600">KES {Number(product.selling_price).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Cost: KES {Number(product.cost_price).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(product)} className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg font-medium">Edit</button>
                  <button onClick={() => handleDelete(product.id)} className="px-3 py-1.5 text-sm bg-red-50 text-red-500 rounded-lg font-medium">Delete</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[97vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* STEP 1: Barcode — scan first */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Barcode *
                  <span className="text-xs font-normal text-gray-400 ml-2">Scan first — details auto-fill</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => onBarcodeChange(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Scan, or type barcode here..."
                    autoFocus={!editingProduct}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCameraScanner(true)}
                    className="px-3 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex-shrink-0"
                    title="Camera scan"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                {/* Lookup states */}
                {lookupLoading && (
                  <div className="mt-3 flex items-center gap-3 bg-gray-900 text-white rounded-xl p-3.5 animate-pulse">
                    <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                    <span className="text-sm">Looking up barcode online...</span>
                  </div>
                )}

                {lookupResult && !lookupLoading && (
                  <div className="mt-3 bg-gray-900 rounded-xl overflow-hidden">
                    <div className="flex gap-3 p-3.5">
                      {lookupResult.imageUrl ? (
                        <img
                          src={lookupResult.imageUrl}
                          alt={lookupResult.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-white"
                          onError={(e) => { (e.target as any).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ImageOff className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <span className="text-xs text-green-400 font-medium">Found — fields auto-filled ↓</span>
                        </div>
                        <p className="font-bold text-white text-sm leading-tight">{lookupResult.name}</p>
                        {lookupResult.brand && <p className="text-xs text-gray-400 mt-0.5">{lookupResult.brand}</p>}
                        {lookupResult.category && (
                          <span className="mt-1 inline-block text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            {lookupResult.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="px-3.5 pb-2 text-xs text-gray-500">
                      Source: {lookupResult.source} · Set prices & stock below
                    </div>
                  </div>
                )}

                {lookupNotFound && !lookupLoading && formData.barcode.length >= 6 && (
                  <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    No online match — fill details manually below
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Coca-Cola 500ml"
                />
              </div>

              {/* Brand + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-gray-700">Brand</label>
                    <button type="button" onClick={() => setQuickAdd({ type: 'brand', value: '', saving: false })} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                      + New
                    </button>
                  </div>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-gray-700">Category</label>
                    <button type="button" onClick={() => setQuickAdd({ type: 'category', value: '', saving: false })} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                      + New
                    </button>
                  </div>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Supplier */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-gray-700">Supplier</label>
                  <Link href="/suppliers" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Truck className="h-3 w-3" /> Manage suppliers
                  </Link>
                </div>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* SKU + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">SKU (Optional)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. SKU-001"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Unit / Size</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="500ml, 1kg, pcs"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Cost Price (KES) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Selling Price (KES) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Margin preview */}
              {formData.cost_price && formData.selling_price && parseFloat(formData.cost_price) > 0 && parseFloat(formData.selling_price) > 0 && (
                <div className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  parseFloat(formData.selling_price) >= parseFloat(formData.cost_price)
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {parseFloat(formData.selling_price) >= parseFloat(formData.cost_price) ? '✓' : '⚠'}{' '}
                  Profit: KES {(parseFloat(formData.selling_price) - parseFloat(formData.cost_price)).toLocaleString()}{' '}
                  ({(((parseFloat(formData.selling_price) - parseFloat(formData.cost_price)) / parseFloat(formData.cost_price)) * 100).toFixed(1)}% margin)
                  {parseFloat(formData.selling_price) < parseFloat(formData.cost_price) && ' — selling below cost!'}
                </div>
              )}

              {/* Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Low Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Tax rate */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">VAT in Kenya is 16%. Leave 0 if price already includes tax.</p>
              </div>

              {/* Product Image URL (auto-filled from lookup) */}
              {formData.image_url && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Product Image</label>
                  <div className="flex gap-3 items-center">
                    <img src={formData.image_url} alt="Product" className="w-16 h-16 rounded-xl object-cover border border-gray-200" 
                      onError={(e) => { (e.target as any).style.display='none' }} />
                    <div className="flex-1">
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="https://..."
                      />
                      <button type="button" onClick={() => setFormData({ ...formData, image_url: '' })} className="text-xs text-red-500 mt-1 hover:underline">
                        Remove image
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-3 border-t flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 className="animate-spin h-4 w-4" /> Saving...</>
                ) : (
                  editingProduct ? 'Update Product' : 'Add Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner */}
      {showCameraScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowCameraScanner(false)}
          continuous={false}
          showFlashlight={true}
        />
      )}

      {/* Quick-add Brand/Category */}
      {quickAdd.type && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5">
            <h3 className="text-base font-bold text-gray-900 mb-3">
              New {quickAdd.type === 'brand' ? 'Brand' : 'Category'}
            </h3>
            <input
              type="text"
              autoFocus
              value={quickAdd.value}
              onChange={(e) => setQuickAdd(prev => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAddSubmit() }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder={quickAdd.type === 'brand' ? 'e.g. Coca-Cola' : 'e.g. Beverages'}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setQuickAdd({ type: null, value: '', saving: false })}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickAddSubmit}
                disabled={quickAdd.saving || !quickAdd.value.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {quickAdd.saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

