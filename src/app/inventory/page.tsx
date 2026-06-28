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
      const [{ data: cats }, { data: brs }, { data: sups }] = await Promise.all([
        fetch('/api/categories').then(r=>r.json()).then(j=>({data: j.data??j})),
        fetch('/api/brands').then(r=>r.json()).then(j=>({data: j.data??j})),
        fetch('/api/suppliers').then(r=>r.json()).then(j=>({data: j.data??j})),
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
      const res = await fetch('/api/brands', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(brand) })
      const { error } = res.ok ? {} : { error: true }
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
      const res = await fetch('/api/categories', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(category) })
      const { error } = res.ok ? {} : { error: true }
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
      const branchId = getActiveBranchId()
      const params = new URLSearchParams({ order: 'name' })
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
      await fetch('/api/products', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
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

    // Check barcode uniqueness
    if (!editingProduct || editingProduct.barcode !== formData.barcode) {
      try {
        const res = await fetch(`/api/products?barcode=${encodeURIComponent(formData.barcode.trim())}`)
        if (res.ok) {
          const json = await res.json()
          const list: any[] = json.data ?? json
          const existing = list.find((p: any) => p.barcode === formData.barcode.trim() && !p.archived)
          if (existing && existing.id !== editingProduct?.id)
            return setError(`Barcode already used by: ${existing.name}`)
        }
      } catch {
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
      
      const tryInsert = async (data: any) => {
        if (editingProduct) {
          const { error } = await fetch('/api/products', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...data, id: editingProduct.id}) }).then(r=>r.ok?{}:{error:true})
          return error
        } else {
          const id = crypto.randomUUID()
          const { error } = await fetch('/api/products', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...data, id, created_at: now}) }).then(r=>r.ok?{}:{error:true})
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
    <div className="xl-page">
      {/* Toolbar */}
      <div className="xl-toolbar">
        <span className="xl-toolbar-title">Inventory</span>
        <div className="xl-toolbar-sep" />
        <button className="btn btn-primary" onClick={openAdd}><Plus size={13} /> Add Product</button>
        <div className="xl-toolbar-sep" />
        {[{label:'All',key:'all'},{label:'Low Stock',key:'low'},{label:'Out',key:'out'}].map(f => (
          <button key={f.key} className={`btn ${filter===f.key?'btn-primary':'btn-ghost'}`} onClick={() => setFilter(f.key as any)}>{f.label}</button>
        ))}
        <div style={{flex:1}} />
        <span className="xl-statusbar-item" style={{color:'var(--txt-3)',fontSize:11}}>
          {totalProducts} products · {lowStockCount} low · {outOfStockCount} out
        </span>
      </div>

      {/* Formula bar / search */}
      <div className="xl-formulabar">
        <span className="xl-formulabar-label"><Search size={11} style={{marginRight:4}} />SEARCH</span>
        <input
          type="text"
          placeholder="Search name, barcode, SKU, brand…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && <button className="btn btn-ghost btn-icon" onClick={() => setSearchTerm('')}><X size={12} /></button>}
      </div>

      {/* KPI row */}
      <div style={{padding:'8px 20px 0'}}>
        <div className="xl-kpi-row" style={{marginBottom:10}}>
          <div className="xl-kpi"><span className="xl-kpi-label">Total Products</span><span className="xl-kpi-value">{totalProducts}</span></div>
          <div className="xl-kpi"><span className="xl-kpi-label">Low Stock</span><span className="xl-kpi-value xl-kpi-down">{lowStockCount}</span></div>
          <div className="xl-kpi"><span className="xl-kpi-label">Out of Stock</span><span className="xl-kpi-value xl-kpi-down">{outOfStockCount}</span></div>
          <div className="xl-kpi"><span className="xl-kpi-label">In Stock</span><span className="xl-kpi-value xl-kpi-up">{totalProducts-outOfStockCount}</span></div>
        </div>
      </div>

      {/* Grid */}
      <div className="xl-page-inner" style={{paddingTop:0}}>
        <div className="xl-grid-wrap">
          <table className="xl-grid">
            <thead>
              <tr>
                <th className="row-num">#</th>
                <th>Product</th>
                <th>Barcode / SKU</th>
                <th className="num">Cost (KES)</th>
                <th className="num">Price (KES)</th>
                <th className="num">Margin</th>
                <th className="num">Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map((product, i) => {
                const margin = product.cost_price > 0
                  ? (((product.selling_price - product.cost_price) / product.cost_price) * 100).toFixed(0)
                  : null
                const stockStatus = product.stock === 0 ? 'out' : product.stock <= (product.minimum_stock||10) ? 'low' : 'ok'
                return (
                  <tr key={product.id}>
                    <td className="row-num muted">{i+1}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        {product.image_url
                          ? <img src={product.image_url} alt={product.name} style={{width:22,height:22,objectFit:'cover',borderRadius:2,border:'1px solid var(--border)',flexShrink:0}} />
                          : <Package size={14} style={{color:'var(--txt-3)',flexShrink:0}} />}
                        <div>
                          <div style={{fontWeight:600}}>{product.name}</div>
                          {((product as any).brand || product.unit) && <div style={{fontSize:11,color:'var(--txt-3)'}}>{(product as any).brand}{(product as any).brand && product.unit?' · ':''}{product.unit}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono muted">{product.barcode}{product.sku && <span style={{marginLeft:4,color:'var(--txt-3)'}}>· {product.sku}</span>}</td>
                    <td className="num">{Number(product.cost_price).toLocaleString()}</td>
                    <td className="num fw-700">{Number(product.selling_price).toLocaleString()}</td>
                    <td className="num">{margin ? <span className="text-green">{margin}%</span> : '—'}</td>
                    <td className="num">
                      <span className={`badge ${stockStatus==='out'?'badge-red':stockStatus==='low'?'badge-yellow':'badge-green'}`}>
                        {product.stock}{stockStatus!=='ok'?` (${stockStatus})`:''}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(product)}><Edit size={13} /></button>
                        <button className="btn btn-ghost btn-icon" title="Delete" style={{color:'var(--red)'}} onClick={() => handleDelete(product.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {displayedProducts.length === 0 && (
            <div className="empty-state">
              <Package size={28} style={{margin:'0 auto 8px',opacity:.3}} />
              <div className="empty-state-title">No products found</div>
              <div className="empty-state-sub">{searchTerm ? 'Try a different search' : 'Click "Add Product" to get started'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="xl-statusbar">
        <span className="xl-statusbar-item">SHOWING: {displayedProducts.length} of {totalProducts}</span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">LOW STOCK: {lowStockCount}</span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">OUT: {outOfStockCount}</span>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:540}}>
            <div className="modal-header">
              <span className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={13} /></button>
            </div>

            <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:12}}>
              {error && (
                <div className="alert alert-error">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* STEP 1: Barcode — scan first */}
              <div>
                <label className="form-label">
                  Barcode *
                  <span className="text-xs font-normal text-gray-400 ml-2">Scan first — details auto-fill</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => onBarcodeChange(e.target.value)}
                    className="input flex-1"
                    placeholder="Scan, or type barcode here..."
                    autoFocus={!editingProduct}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCameraScanner(true)}
                    className="btn btn-primary"
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
                  <div className="alert alert-warning">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    No online match — fill details manually below
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input" style={{width:"100%"}}
                  placeholder="e.g. Coca-Cola 500ml"
                />
              </div>

              {/* Brand + Category */}
              <div className="form-row">
                <div>
                  <div className="flex items-center justify-between" style={{marginBottom:4}}>
                    <label className="form-label">Brand</label>
                    <button type="button" onClick={() => setQuickAdd({ type: 'brand', value: '', saving: false })} className="btn btn-ghost" style={{fontSize:11,height:"auto",padding:"0 4px"}}>
                      + New
                    </button>
                  </div>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    className="input" style={{width:"100%"}}
                  >
                    <option value="">No brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between" style={{marginBottom:4}}>
                    <label className="form-label">Category</label>
                    <button type="button" onClick={() => setQuickAdd({ type: 'category', value: '', saving: false })} className="btn btn-ghost" style={{fontSize:11,height:"auto",padding:"0 4px"}}>
                      + New
                    </button>
                  </div>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="input" style={{width:"100%"}}
                  >
                    <option value="">No category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Supplier */}
              <div>
                <div className="flex items-center justify-between" style={{marginBottom:4}}>
                  <label className="form-label">Supplier</label>
                  <Link href="/suppliers" className="btn btn-ghost" style={{fontSize:11,height:"auto",padding:"0 4px"}}>
                    <Truck className="h-3 w-3" /> Manage suppliers
                  </Link>
                </div>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="input" style={{width:"100%"}}
                >
                  <option value="">No supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* SKU + Unit */}
              <div className="form-row">
                <div>
                  <label className="form-label">SKU (Optional)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input" style={{width:"100%"}}
                    placeholder="e.g. SKU-001"
                  />
                </div>
                <div>
                  <label className="form-label">Unit / Size</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input" style={{width:"100%"}}
                    placeholder="500ml, 1kg, pcs"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="form-row">
                <div>
                  <label className="form-label">Cost Price (KES) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="input" style={{width:"100%"}}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="form-label">Selling Price (KES) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="input" style={{width:"100%"}}
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
              <div className="form-row">
                <div>
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="input" style={{width:"100%"}}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="form-label">Low Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                    className="input" style={{width:"100%"}}
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Tax rate */}
              <div>
                <label className="form-label">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  className="input" style={{width:"100%"}}
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">VAT in Kenya is 16%. Leave 0 if price already includes tax.</p>
              </div>

              {/* Product Image URL (auto-filled from lookup) */}
              {formData.image_url && (
                <div>
                  <label className="form-label">Product Image</label>
                  <div className="flex gap-3 items-center">
                    <img src={formData.image_url} alt="Product" style={{width:48,height:48,objectFit:"cover",border:"1px solid var(--border)"}} 
                      onError={(e) => { (e.target as any).style.display='none' }} />
                    <div className="flex-1">
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="input" style={{width:"100%"}}
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
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : (editingProduct ? 'Update Product' : 'Add Product')}
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
        <div className="modal-overlay" style={{zIndex:110}}>
          <div className="modal" style={{maxWidth:360}}>
            <div className="modal-header">
              <span className="modal-title">New {quickAdd.type === 'brand' ? 'Brand' : 'Category'}</span>
            </div>
            <div className="modal-body">
              <input
                type="text"
                autoFocus
                className="input" style={{width:'100%'}}
                value={quickAdd.value}
                onChange={(e) => setQuickAdd(prev => ({ ...prev, value: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAddSubmit() }}
                placeholder={quickAdd.type === 'brand' ? 'e.g. Coca-Cola' : 'e.g. Beverages'}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setQuickAdd({ type: null, value: '', saving: false })}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleQuickAddSubmit} disabled={quickAdd.saving || !quickAdd.value.trim()}>
                {quickAdd.saving ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

