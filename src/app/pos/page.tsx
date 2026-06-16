'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, Camera, X, 
  Percent, DollarSign, AlertCircle, Printer, ScanLine, CheckCircle2
} from 'lucide-react'
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
}

type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'credit_account' | 'mixed'

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [showUSBScanner, setShowUSBScanner] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showCartMobile, setShowCartMobile] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashGiven, setCashGiven] = useState('')
  const [mpesaAmount, setMpesaAmount] = useState('')
  const [cardAmount, setCardAmount] = useState('')
  const [bankAmount, setBankAmount] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null)
  const [discountValue, setDiscountValue] = useState('')
  const [saleNotes, setSaleNotes] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [completedSale, setCompletedSale] = useState<any>(null)
  const [businessSettings, setBusinessSettings] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProducts()
    loadUser()
    loadBusinessSettings()
    // Focus search on mount
    setTimeout(() => searchRef.current?.focus(), 300)
  }, [])

  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: !showCameraScanner && !showCheckout && !showUSBScanner
  })

  async function handleBarcodeScan(barcode: string) {
    const product = await getProductByBarcode(barcode)
    if (product) {
      addToCart(product)
      setSearchTerm('')
      setScanError(null)
    } else {
      setScanError(`No product found for barcode: ${barcode}`)
      setSearchTerm(barcode)
    }
  }

  const loadBusinessSettings = async () => {
    try {
      const { getSettingByKey } = await import('@/lib/indexeddb')
      const business = await getSettingByKey('business')
      if (business) setBusinessSettings(business.value)
    } catch {}
  }

  const loadUser = async () => {
    const currentUser = await getCurrentAuthUser()
    setUser(currentUser)
  }

  const loadProducts = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('archived', false)
        .gt('stock', 0)
        .order('name')
      if (data && !error) {
        setProducts(data)
        const { syncProductsFromSupabase } = await import('@/lib/indexeddb')
        await syncProductsFromSupabase(data)
        return
      }
    } catch {}
    const all = await getAllProducts()
    setProducts(all.filter((p: any) => !p.archived && p.stock > 0))
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm)
  )

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        id: product.id, name: product.name, barcode: product.barcode,
        price: product.selling_price, quantity: 1, stock: product.stock, discountAmount: 0
      }]
    })
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id))

  const updateQuantity = (id: string, qty: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i
      if (qty < 1 || qty > i.stock) return i
      return { ...i, quantity: qty }
    }))
  }

  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartDiscount = discountType && discountValue
    ? discountType === 'percentage'
      ? cartSubtotal * (parseFloat(discountValue) / 100)
      : parseFloat(discountValue)
    : 0
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount)
  const cartItemsCount = cart.reduce((s, i) => s + i.quantity, 0)

  // For cash: change calculation
  const cashGivenNum = parseFloat(cashGiven) || 0
  const change = paymentMethod === 'cash' && cashGivenNum > cartTotal
    ? cashGivenNum - cartTotal
    : 0

  // Mixed total paid
  const mixedPaid = (parseFloat(mpesaAmount) || 0) + (parseFloat(cardAmount) || 0) +
    (parseFloat(bankAmount) || 0) + (parseFloat(creditAmount) || 0) + cashGivenNum
  const mixedBalance = paymentMethod === 'mixed' ? cartTotal - mixedPaid : 0

  const completeSale = async () => {
    if (processing) return
    if (cart.length === 0) return

    // Validate payment
    if (paymentMethod === 'cash' && cashGivenNum < cartTotal) {
      alert(`Cash given (KES ${cashGivenNum.toLocaleString()}) is less than total (KES ${cartTotal.toLocaleString()})`)
      return
    }
    if (paymentMethod === 'mixed' && mixedBalance > 0.01) {
      alert(`Payment incomplete. Remaining: KES ${mixedBalance.toLocaleString()}`)
      return
    }

    setProcessing(true)

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const receiptNumber = `RCP-${dateStr}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const receiptPin = `POS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    let cashAmt = 0, mpesaAmt = 0, cardAmt = 0, bankAmt = 0, creditAmt = 0
    if (paymentMethod === 'cash') cashAmt = cartTotal
    else if (paymentMethod === 'mpesa') mpesaAmt = cartTotal
    else if (paymentMethod === 'card') cardAmt = cartTotal
    else if (paymentMethod === 'bank_transfer') bankAmt = cartTotal
    else if (paymentMethod === 'credit_account') creditAmt = cartTotal
    else {
      cashAmt = parseFloat(cashGiven) || 0
      mpesaAmt = parseFloat(mpesaAmount) || 0
      cardAmt = parseFloat(cardAmount) || 0
      bankAmt = parseFloat(bankAmount) || 0
      creditAmt = parseFloat(creditAmount) || 0
    }

    const sale = {
      id: crypto.randomUUID(),
      total_amount: cartTotal,
      discount_amount: cartDiscount,
      discount_type: discountType,
      payment_method: paymentMethod,
      cash_amount: cashAmt || null,
      mpesa_amount: mpesaAmt || null,
      card_amount: cardAmt || null,
      bank_amount: bankAmt || null,
      credit_amount: creditAmt || null,
      receipt_pin: receiptPin,
      receipt_number: receiptNumber,
      cashier_id: user?.id,
      notes: saleNotes || null,
      created_at: new Date().toISOString(),
      synced: true
    }

    const saleItems = cart.map(item => ({
      id: crypto.randomUUID(),
      sale_id: sale.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
      discount_amount: item.discountAmount,
      created_at: new Date().toISOString()
    }))

    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('sales').insert(sale)
      await supabase.from('sale_items').insert(saleItems)
      for (const item of cart) {
        await supabase.from('products')
          .update({ stock: item.stock - item.quantity, updated_at: new Date().toISOString() })
          .eq('id', item.id)
      }
    } catch {
      try {
        const { addSaleToDB, addSaleItemToDB } = await import('@/lib/indexeddb')
        await addSaleToDB({ ...sale, synced: false })
        for (const item of saleItems) await addSaleItemToDB(item)
      } catch (e) {
        console.error('Failed to save sale:', e)
      }
    }

    setCompletedSale({ ...sale, items: saleItems, change })
    setShowCheckout(false)
    setShowReceipt(true)
    setCart([])
    setPaymentMethod('cash')
    setCashGiven('')
    setMpesaAmount('')
    setCardAmount('')
    setBankAmount('')
    setCreditAmount('')
    setDiscountType(null)
    setDiscountValue('')
    setSaleNotes('')
    setProcessing(false)
    setShowCartMobile(false)
    loadProducts()
  }

  const paymentMethods: { key: PaymentMethod; label: string }[] = [
    { key: 'cash', label: 'Cash' },
    { key: 'mpesa', label: 'M-Pesa' },
    { key: 'card', label: 'Card' },
    { key: 'bank_transfer', label: 'Bank' },
    { key: 'credit_account', label: 'Credit' },
    { key: 'mixed', label: 'Mixed' },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-64px-32px)] md:h-[calc(100vh-64px-48px)]">
      {/* Page header - compact */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-gray-900">Point of Sale</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUSBScanner(true)}
            className="flex items-center gap-1.5 bg-gray-700 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 text-sm"
          >
            <ScanLine className="h-4 w-4" />
            <span className="hidden sm:inline">USB Scan</span>
          </button>
          <button
            onClick={() => setShowCameraScanner(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Camera</span>
          </button>
        </div>
      </div>

      {/* Scan error */}
      {scanError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{scanError}</span>
          <button onClick={() => setScanError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Main layout: products + cart side by side on lg+ */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* Products panel */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden min-w-0">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search product or scan barcode..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setScanError(null) }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Package className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">{searchTerm ? 'No products match your search' : 'No products in stock'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="text-left bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-xl p-3 transition-all active:scale-95 group"
                  >
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight mb-0.5 line-clamp-2">{product.name}</p>
                    <p className="text-xs text-gray-500 mb-1.5">{product.barcode}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-blue-600 text-sm">KES {Number(product.selling_price).toLocaleString()}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        product.stock < 5 ? 'bg-red-100 text-red-600' : 
                        product.stock < 10 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {product.stock}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart — hidden on mobile, shown via bottom bar */}
        <div className="hidden lg:flex w-80 xl:w-96 bg-white rounded-xl shadow-sm flex-col overflow-hidden flex-shrink-0">
          <CartPanel
            cart={cart}
            cartItemsCount={cartItemsCount}
            cartSubtotal={cartSubtotal}
            cartDiscount={cartDiscount}
            cartTotal={cartTotal}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            onCheckout={() => setShowCheckout(true)}
          />
        </div>
      </div>

      {/* Mobile cart FAB */}
      <div className="lg:hidden fixed bottom-4 right-4 z-30">
        <button
          onClick={() => setShowCartMobile(true)}
          className="relative bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
        >
          <ShoppingCart className="h-6 w-6" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {cartItemsCount > 9 ? '9+' : cartItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile cart drawer */}
      {showCartMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCartMobile(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">Cart ({cartItemsCount})</h3>
              <button onClick={() => setShowCartMobile(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CartPanel
                cart={cart}
                cartItemsCount={cartItemsCount}
                cartSubtotal={cartSubtotal}
                cartDiscount={cartDiscount}
                cartTotal={cartTotal}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                onCheckout={() => { setShowCartMobile(false); setShowCheckout(true) }}
              />
            </div>
          </div>
        </div>
      )}

      {/* USB Scanner modal */}
      {showUSBScanner && (
        <Modal onClose={() => setShowUSBScanner(false)} title="USB Barcode Scanner">
          <p className="text-sm text-gray-600 mb-3">Point your USB scanner or type the barcode below:</p>
          <input
            type="text"
            placeholder="Scan or enter barcode, then press Enter..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value.trim()
                if (val) { handleBarcodeScan(val); setShowUSBScanner(false) }
              }
            }}
          />
          <p className="text-xs text-gray-400 mt-2">Press Enter after scanning</p>
        </Modal>
      )}

      {/* Camera scanner */}
      {showCameraScanner && (
        <BarcodeScanner
          onScan={(code) => { handleBarcodeScan(code); setShowCameraScanner(false) }}
          onClose={() => setShowCameraScanner(false)}
          continuous={false}
          showFlashlight={true}
        />
      )}

      {/* Checkout modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Order summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({cartItemsCount} items)</span>
                  <span>KES {cartSubtotal.toLocaleString()}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-KES {cartDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total</span>
                  <span className="text-blue-600">KES {cartTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Discount */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Discount (Optional)</p>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setDiscountType(discountType === 'percentage' ? null : 'percentage')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${
                      discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Percent className="h-3.5 w-3.5" /> Percentage
                  </button>
                  <button
                    onClick={() => setDiscountType(discountType === 'fixed' ? null : 'fixed')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${
                      discountType === 'fixed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Fixed KES
                  </button>
                </div>
                {discountType && (
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'Enter % (e.g. 10)' : 'Enter amount (e.g. 500)'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max={discountType === 'percentage' ? '100' : cartSubtotal.toString()}
                  />
                )}
              </div>

              {/* Payment method */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setPaymentMethod(key)}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                        paymentMethod === key
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment inputs */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Cash Received (KES)</label>
                    <input
                      type="number"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      placeholder={`Minimum ${cartTotal.toLocaleString()}`}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      min={cartTotal}
                    />
                  </div>
                  {change > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between">
                      <span className="text-green-800 font-medium text-sm">Change Due</span>
                      <span className="text-green-700 font-bold">KES {change.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'mixed' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Cash', value: cashGiven, setter: setCashGiven },
                      { label: 'M-Pesa', value: mpesaAmount, setter: setMpesaAmount },
                      { label: 'Card', value: cardAmount, setter: setCardAmount },
                      { label: 'Bank Transfer', value: bankAmount, setter: setBankAmount },
                      { label: 'Credit Account', value: creditAmount, setter: setCreditAmount },
                    ].map(({ label, value, setter }) => (
                      <div key={label}>
                        <label className="text-xs font-medium text-gray-600 block mb-1">{label} (KES)</label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                  <div className={`rounded-lg p-3 flex justify-between text-sm font-medium ${
                    mixedBalance <= 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <span className={mixedBalance <= 0 ? 'text-green-800' : 'text-yellow-800'}>
                      {mixedBalance <= 0 ? 'Fully Paid' : 'Remaining'}
                    </span>
                    <span className={mixedBalance <= 0 ? 'text-green-700' : 'text-yellow-700'}>
                      {mixedBalance <= 0 ? `KES ${Math.abs(mixedBalance).toLocaleString()} change` : `KES ${mixedBalance.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notes (Optional)</label>
                <textarea
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="Add any notes..."
                />
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 border-t flex-shrink-0">
              <button
                onClick={completeSale}
                disabled={processing || cart.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Complete Sale — KES {cartTotal.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt modal */}
      {showReceipt && completedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="font-bold text-gray-900">Sale Complete!</h3>
              </div>
              <button onClick={() => setShowReceipt(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Receipt
                sale={completedSale}
                items={completedSale.items}
                products={products}
                shopName={businessSettings?.name || 'SMART POS'}
                shopAddress={businessSettings?.address || ''}
                shopPhone={businessSettings?.phone || ''}
                shopEmail={businessSettings?.email || ''}
                cashierName={user?.name || 'Cashier'}
                change={completedSale.change || 0}
              />
            </div>
            <div className="px-5 pb-5 pt-3 border-t flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Cart panel component (shared between desktop sidebar and mobile drawer)
function CartPanel({
  cart, cartItemsCount, cartSubtotal, cartDiscount, cartTotal,
  updateQuantity, removeFromCart, onCheckout
}: {
  cart: CartItem[]
  cartItemsCount: number
  cartSubtotal: number
  cartDiscount: number
  cartTotal: number
  updateQuantity: (id: string, qty: number) => void
  removeFromCart: (id: string) => void
  onCheckout: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <ShoppingCart className="h-4 w-4 text-blue-600" />
        <span className="font-semibold text-gray-900 text-sm">Cart</span>
        {cartItemsCount > 0 && (
          <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {cartItemsCount} items
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <ShoppingCart className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">Cart is empty</p>
            <p className="text-xs">Tap a product to add</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-gray-900 text-sm leading-tight flex-1">{item.name}</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-400 hover:text-red-600 flex-shrink-0 p-0.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="font-bold text-gray-900 text-sm">
                  KES {(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-1">@ KES {item.price.toLocaleString()} each</p>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-100 space-y-3 flex-shrink-0">
        {cartDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span className="font-medium">-KES {cartDiscount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span className="text-blue-600">KES {cartTotal.toLocaleString()}</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition-colors"
        >
          Checkout
        </button>
      </div>
    </div>
  )
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// Fix missing import
function Package({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  )
}
