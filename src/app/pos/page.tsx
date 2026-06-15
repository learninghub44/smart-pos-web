'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, Camera, X, Percent, Tag, Printer, CheckCircle, Package } from 'lucide-react'
import { getAllProducts, getProductByBarcode } from '@/lib/indexeddb'
import { getCurrentAuthUser } from '@/lib/auth'
import BarcodeScanner from '@/components/BarcodeScanner'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import Receipt from '@/components/Receipt'

interface CartItem {
  id: string
  name: string
  barcode: string
  price: number
  quantity: number
  stock: number
  discountAmount: number
  image_url: string | null
}

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [scanFlash, setScanFlash] = useState<{ name: string; price: number; image_url: string | null } | null>(null)
  const [showUSBScanner, setShowUSBScanner] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'credit_account' | 'mixed'>('cash')
  const [cashInput, setCashInput] = useState('')
  const [mpesaInput, setMpesaInput] = useState('')
  const [cardInput, setCardInput] = useState('')
  const [bankInput, setBankInput] = useState('')
  const [creditInput, setCreditInput] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null)
  const [discountValue, setDiscountValue] = useState('')
  const [saleNotes, setSaleNotes] = useState('')
  const [completedSale, setCompletedSale] = useState<any>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [businessSettings, setBusinessSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const usbInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProducts()
    loadUser()
    loadBusinessSettings()
  }, [])

  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: !showCameraScanner && !showCheckout && !showUSBScanner
  })

  async function handleBarcodeScan(barcode: string) {
    const product = products.find(p => p.barcode === barcode) || await getProductByBarcode(barcode)
    if (product) {
      addToCart(product)
      setScanFlash({ name: product.name, price: product.selling_price, image_url: product.image_url || null })
      setTimeout(() => setScanFlash(null), 1800)
    } else {
      alert(`Product not found: ${barcode}`)
    }
  }

  async function loadUser() {
    const u = getCurrentAuthUser()
    setUser(u)
  }

  async function loadBusinessSettings() {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('settings').select('*').eq('key', 'business').single()
      if (data) { setBusinessSettings(data.value); return }
    } catch (_) {}
    try {
      const { getSettingByKey } = await import('@/lib/indexeddb')
      const s = await getSettingByKey('business')
      if (s) setBusinessSettings(s.value)
    } catch (_) {}
  }

  async function loadProducts() {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('products').select('*').eq('archived', false).order('name')
      if (data && !error) {
        setProducts(data)
        setLoading(false)
        return
      }
    } catch (_) {}
    const local = await getAllProducts()
    setProducts(local.filter(p => !p.archived))
    setLoading(false)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode || '').includes(searchTerm) ||
    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  function addToCart(product: any) {
    if (product.stock <= 0) { alert(`${product.name} is out of stock`); return }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) { alert(`Only ${product.stock} in stock`); return prev }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { id: product.id, name: product.name, barcode: product.barcode, price: product.selling_price, quantity: 1, stock: product.stock, discountAmount: 0, image_url: product.image_url || null }]
    })
  }

  function removeFromCart(id: string) { setCart(p => p.filter(i => i.id !== id)) }

  function updateQty(id: string, qty: number) {
    setCart(p => p.map(i => i.id === id
      ? qty < 1 ? i : qty > i.stock ? i : { ...i, quantity: qty }
      : i
    ))
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const discount = discountType && discountValue
    ? discountType === 'percentage' ? subtotal * (parseFloat(discountValue) / 100) : parseFloat(discountValue)
    : 0
  const total = Math.max(0, subtotal - discount)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const paidAmount = paymentMethod === 'mixed'
    ? (parseFloat(cashInput) || 0) + (parseFloat(mpesaInput) || 0) + (parseFloat(cardInput) || 0) + (parseFloat(bankInput) || 0) + (parseFloat(creditInput) || 0)
    : total
  const change = paymentMethod === 'cash' ? Math.max(0, (parseFloat(cashInput) || 0) - total) : 0
  const outstanding = Math.max(0, total - paidAmount)

  async function completeSale() {
    if (cart.length === 0) return
    if (paymentMethod === 'mixed' && outstanding > 0) {
      alert(`Payment incomplete! Still need KES ${outstanding.toLocaleString()}`)
      return
    }
    setCompleting(true)
    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const receiptNumber = `RCP-${dateStr}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const receiptPin = `POS-${Math.random().toString(36).substr(2, 8).toUpperCase()}`

      const sale: any = {
        id: crypto.randomUUID(),
        total_amount: total,
        discount_amount: discount,
        discount_type: discountType,
        payment_method: paymentMethod,
        cash_amount: paymentMethod === 'cash' ? total : paymentMethod === 'mixed' ? parseFloat(cashInput) || null : null,
        mpesa_amount: paymentMethod === 'mpesa' ? total : paymentMethod === 'mixed' ? parseFloat(mpesaInput) || null : null,
        card_amount: paymentMethod === 'card' ? total : paymentMethod === 'mixed' ? parseFloat(cardInput) || null : null,
        bank_amount: paymentMethod === 'bank_transfer' ? total : paymentMethod === 'mixed' ? parseFloat(bankInput) || null : null,
        credit_amount: paymentMethod === 'credit_account' ? total : paymentMethod === 'mixed' ? parseFloat(creditInput) || null : null,
        receipt_pin: receiptPin,
        receipt_number: receiptNumber,
        cashier_id: user?.id || null,
        notes: saleNotes || null,
        created_at: new Date().toISOString(),
        synced: false
      }

      const saleItems = cart.map(item => ({
        id: crypto.randomUUID(),
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        discount_amount: item.discountAmount,
        created_at: new Date().toISOString()
      }))

      // Save to Supabase
      try {
        const { supabase } = await import('@/lib/supabase')
        const { error: saleErr } = await supabase.from('sales').insert({ ...sale, synced: true })
        if (!saleErr) {
          await supabase.from('sale_items').insert(saleItems)
          for (const item of cart) {
            await supabase.from('products').update({ stock: item.stock - item.quantity, updated_at: new Date().toISOString() }).eq('id', item.id)
          }
          sale.synced = true
        }
      } catch (_) {}

      // Always save to IndexedDB
      const { addSaleToDB, addSaleItemToDB } = await import('@/lib/indexeddb')
      await addSaleToDB(sale)
      for (const item of saleItems) await addSaleItemToDB(item)

      setCompletedSale({ ...sale, items: saleItems.map(si => ({ ...si, name: cart.find(c => c.id === si.product_id)?.name || '' })) })
      setShowCheckout(false)
      setShowReceipt(true)

      // Reset
      setCart([])
      setPaymentMethod('cash')
      setCashInput(''); setMpesaInput(''); setCardInput(''); setBankInput(''); setCreditInput('')
      setDiscountType(null); setDiscountValue('')
      setSaleNotes('')
      loadProducts()
    } finally {
      setCompleting(false)
    }
  }

  const payMethods = [
    { id: 'cash', label: 'Cash' },
    { id: 'mpesa', label: 'M-Pesa' },
    { id: 'card', label: 'Card' },
    { id: 'bank_transfer', label: 'Bank' },
    { id: 'credit_account', label: 'Credit' },
    { id: 'mixed', label: 'Mixed' },
  ] as const

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 lg:-m-6">
      {/* Camera Scanner */}
      {showCameraScanner && (
        <BarcodeScanner onScan={async (b) => { await handleBarcodeScan(b); setShowCameraScanner(false) }} onClose={() => setShowCameraScanner(false)} continuous={false} showFlashlight={true} />
      )}

      {/* Scan success flash */}
      {scanFlash && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
          <div className="flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl animate-bounce-in">
            {scanFlash.image_url ? (
              <img src={scanFlash.image_url} alt={scanFlash.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-green-400 flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-green-500/20 border-2 border-green-400 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 text-xl font-bold">{scanFlash.name.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-green-400 uppercase tracking-wide">Added to cart</span>
              </div>
              <p className="font-semibold text-sm leading-tight truncate max-w-[180px]">{scanFlash.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">KES {Number(scanFlash.price).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* USB Scanner modal */}
      {showUSBScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">USB / Manual Barcode</h3>
              <button onClick={() => setShowUSBScanner(false)}><X className="w-5 h-5" /></button>
            </div>
            <input ref={usbInputRef} type="text" placeholder="Scan or type barcode, press Enter"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
              onKeyDown={async e => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  await handleBarcodeScan(e.currentTarget.value)
                  e.currentTarget.value = ''
                  setShowUSBScanner(false)
                }
              }} />
            <p className="text-xs text-gray-500 mt-2">Scan with USB scanner or type barcode and press Enter</p>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {showReceipt && completedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Sale Complete</span>
              </div>
              <button onClick={() => setShowReceipt(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <Receipt
                sale={completedSale}
                items={completedSale.items}
                shopName={businessSettings?.name || 'SMART POS'}
                shopAddress={businessSettings?.address || ''}
                shopPhone={businessSettings?.phone || ''}
                shopEmail={businessSettings?.email || ''}
                cashierName={user?.name || 'Cashier'}
              />
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setShowReceipt(false)} className="w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="font-semibold text-lg">Checkout</h3>
              <button onClick={() => setShowCheckout(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {/* Order summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-KES {discount.toLocaleString()}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>KES {total.toLocaleString()}</span></div>
              </div>

              {/* Discount */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Discount (optional)</label>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setDiscountType('percentage')}
                    className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1 ${discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <Percent className="w-3.5 h-3.5" /> Percent
                  </button>
                  <button onClick={() => setDiscountType('fixed')}
                    className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1 ${discountType === 'fixed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <Tag className="w-3.5 h-3.5" /> Fixed KES
                  </button>
                  {discountType && <button onClick={() => { setDiscountType(null); setDiscountValue('') }} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">Clear</button>}
                </div>
                {discountType && (
                  <input type="number" min="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'e.g. 10 (%)' : 'e.g. 500 (KES)'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                )}
              </div>

              {/* Payment method */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {payMethods.map(m => (
                    <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${paymentMethod === m.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash input */}
              {paymentMethod === 'cash' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Amount Tendered</label>
                  <input type="number" min={total} value={cashInput} onChange={e => setCashInput(e.target.value)}
                    placeholder={`Min KES ${total.toLocaleString()}`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  {cashInput && parseFloat(cashInput) >= total && (
                    <p className="text-green-600 text-sm mt-1 font-medium">Change: KES {(parseFloat(cashInput) - total).toLocaleString()}</p>
                  )}
                </div>
              )}

              {/* Mixed payment */}
              {paymentMethod === 'mixed' && (
                <div className="grid grid-cols-2 gap-3">
                  {[['Cash', cashInput, setCashInput], ['M-Pesa', mpesaInput, setMpesaInput], ['Card', cardInput, setCardInput], ['Bank', bankInput, setBankInput], ['Credit', creditInput, setCreditInput]].map(([label, val, setter]: any) => (
                    <div key={label}>
                      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                      <input type="number" min="0" value={val} onChange={e => setter(e.target.value)} placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <div className={`flex justify-between text-sm font-medium p-2 rounded-lg ${outstanding > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      <span>{outstanding > 0 ? 'Outstanding' : 'Balanced'}</span>
                      <span>KES {outstanding > 0 ? outstanding.toLocaleString() : '0'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notes (optional)</label>
                <textarea value={saleNotes} onChange={e => setSaleNotes(e.target.value)} rows={2} placeholder="Add sale notes..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            <div className="p-4 border-t flex gap-3 flex-shrink-0">
              <button onClick={() => setShowCheckout(false)} className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={completeSale}
                disabled={completing || (paymentMethod === 'mixed' && outstanding > 0)}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completing ? 'Processing...' : `Confirm — KES ${total.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Products panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="flex gap-2 p-4 bg-white border-b">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name, barcode or SKU..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => setShowUSBScanner(true)} className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm">
              USB
            </button>
            <button onClick={() => setShowCameraScanner(true)} className="px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1.5">
              <Camera className="w-4 h-4" /><span className="hidden sm:inline">Scan</span>
            </button>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{searchTerm ? 'No products match your search' : 'No products in inventory'}</p>
                <p className="text-sm mt-1">{!searchTerm && 'Add products in the Inventory page'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0}
                    className={`text-left bg-white border rounded-xl overflow-hidden transition-all ${p.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:shadow-md active:scale-95'}`}>
                    {/* Product image */}
                    <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-300 leading-none">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-[9px] text-gray-300 mt-0.5 font-mono">{p.barcode?.slice(-4)}</div>
                          </div>
                        </div>
                      )}
                      <span className={`absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${p.stock <= 0 ? 'bg-red-500 text-white' : p.stock < 10 ? 'bg-amber-400 text-white' : 'bg-green-500 text-white'}`}>
                        {p.stock <= 0 ? 'Out' : p.stock}
                      </span>
                    </div>
                    {/* Product info */}
                    <div className="p-2.5">
                      <p className="font-semibold text-gray-900 text-xs leading-tight mb-1 line-clamp-2">{p.name}</p>
                      <span className="text-blue-600 font-bold text-sm">KES {Number(p.selling_price).toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart — desktop side panel */}
        <div className="hidden lg:flex w-80 flex-col bg-white border-l">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Cart</span>
              {cartCount > 0 && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{cartCount}</span>}
            </div>
            {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">Clear</button>}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Tap a product to add</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2 gap-2">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name}
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  <p className="text-sm font-medium text-gray-900 leading-tight flex-1">{item.name}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1}
                      className="w-7 h-7 flex items-center justify-center bg-white border rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-30">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}
                      className="w-7 h-7 flex items-center justify-center bg-white border rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-30">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-gray-900">KES {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t space-y-3">
            {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-KES {discount.toLocaleString()}</span></div>}
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>KES {total.toLocaleString()}</span></div>
            <button onClick={() => { if (cart.length === 0) return; setShowCheckout(true) }}
              disabled={cart.length === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile cart FAB */}
      <div className="lg:hidden fixed bottom-4 right-4 z-30">
        <button onClick={() => setShowCart(true)}
          className="relative w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all">
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile cart sheet */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Cart ({cartCount})</span>
              </div>
              <button onClick={() => setShowCart(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cart.length === 0 ? <p className="text-center text-gray-400 py-8">Cart is empty</p> :
                cart.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">KES {item.price.toLocaleString()} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1}
                        className="w-7 h-7 flex items-center justify-center bg-white border rounded disabled:opacity-30">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}
                        className="w-7 h-7 flex items-center justify-center bg-white border rounded disabled:opacity-30">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              }
            </div>
            <div className="p-4 border-t space-y-3">
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>KES {total.toLocaleString()}</span></div>
              <button onClick={() => { setShowCart(false); if (cart.length > 0) setShowCheckout(true) }}
                disabled={cart.length === 0}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40">
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Fix missing import