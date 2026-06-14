'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, Camera, X, Percent, DollarSign, AlertCircle, Printer } from 'lucide-react'
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

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'credit_account' | 'mixed'>('cash')
  const [cashAmount, setCashAmount] = useState('')
  const [mpesaAmount, setMpesaAmount] = useState('')
  const [cardAmount, setCardAmount] = useState('')
  const [bankAmount, setBankAmount] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null)
  const [discountValue, setDiscountValue] = useState('')
  const [saleNotes, setSaleNotes] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  const [showScanError, setShowScanError] = useState(false)
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [completedSale, setCompletedSale] = useState<any>(null)

  const handleBarcodeScan = async (barcode: string) => {
    const product = await getProductByBarcode(barcode)
    if (product) {
      addToCart(product)
      setSearchTerm('')
      setScanError(null)
      setShowScanError(false)
    } else {
      // Scan failure handling
      setScanError(`Product not found: ${barcode}`)
      setShowScanError(true)
      setSearchTerm(barcode)
    }
  }

  useEffect(() => {
    loadProducts()
    loadUser()
  }, [])

  // USB barcode scanner integration
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: !showCameraScanner && !showCheckout
  })

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
        .order('name')
      
      if (data && !error) {
        setProducts(data)
        const { updateProductInDB } = await import('@/lib/indexeddb')
        for (const product of data) {
          await updateProductInDB(product)
        }
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const allProducts = await getAllProducts()
    setProducts(allProducts)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  )

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ))
      }
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        price: product.selling_price,
        quantity: 1,
        stock: product.stock,
        discountAmount: 0
      }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    const item = cart.find(item => item.id === productId)
    if (item && newQuantity > 0 && newQuantity <= item.stock) {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  const cartDiscount = discountType && discountValue 
    ? discountType === 'percentage' 
      ? cartSubtotal * (parseFloat(discountValue) / 100)
      : parseFloat(discountValue)
    : 0
  
  const cartTotal = cartSubtotal - cartDiscount
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }
    setShowCheckout(true)
  }

  const completeSale = async () => {
    // Generate unique receipt number
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const receiptNumber = `RCP-${dateStr}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const receiptPin = `POS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    const total = cartTotal
    let cashPayment = 0
    let mpesaPayment = 0
    let cardPayment = 0
    let bankPayment = 0
    let creditPayment = 0

    if (paymentMethod === 'cash') {
      cashPayment = total
    } else if (paymentMethod === 'mpesa') {
      mpesaPayment = total
    } else if (paymentMethod === 'card') {
      cardPayment = total
    } else if (paymentMethod === 'bank_transfer') {
      bankPayment = total
    } else if (paymentMethod === 'credit_account') {
      creditPayment = total
    } else {
      cashPayment = parseFloat(cashAmount) || 0
      mpesaPayment = parseFloat(mpesaAmount) || 0
      cardPayment = parseFloat(cardAmount) || 0
      bankPayment = parseFloat(bankAmount) || 0
      creditPayment = parseFloat(creditAmount) || 0
    }

    // Partial payment protection - validate payment completion
    const totalPaid = cashPayment + mpesaPayment + cardPayment + bankPayment + creditPayment
    if (totalPaid < total) {
      const outstandingBalance = total - totalPaid
      alert(`Payment incomplete! Outstanding balance: KES ${outstandingBalance.toLocaleString()}`)
      return
    }

    // Overpayment handling - calculate change for cash payments
    let change = 0
    if (cashPayment > total) {
      change = cashPayment - total
      alert(`Change due: KES ${change.toLocaleString()}`)
    }

    const sale = {
      id: crypto.randomUUID(),
      total_amount: total,
      discount_amount: cartDiscount,
      discount_type: discountType,
      payment_method: paymentMethod,
      cash_amount: cashPayment || null,
      mpesa_amount: mpesaPayment || null,
      card_amount: cardPayment || null,
      bank_amount: bankPayment || null,
      credit_amount: creditPayment || null,
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
      quantity: item.quantity,
      price: item.price,
      discount_amount: item.discountAmount,
      created_at: new Date().toISOString()
    }))

    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { error: saleError } = await supabase
        .from('sales')
        .insert(sale)
      
      if (!saleError) {
        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems)
        
        if (!itemsError) {
          for (const item of cart) {
            await supabase
              .from('products')
              .update({ 
                stock: item.stock - item.quantity,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id)
          }
        }
      }
      
      // Award loyalty points only to enrolled customers
      // Get loyalty settings
      const { getSettingByKey } = await import('@/lib/indexeddb')
      const loyaltySettings = await getSettingByKey('loyalty')
      const pointsPerCurrency = (loyaltySettings?.value as any)?.points_per_currency || 0.01
      
      // Check if there's a customer enrolled in loyalty
      // For now, we'll implement this when customer selection is added to POS
      // This is a placeholder for the loyalty point awarding logic
      
      const { addSaleToDB, addSaleItemToDB } = await import('@/lib/indexeddb')
      await addSaleToDB(sale)
      for (const item of saleItems) {
        await addSaleItemToDB(item)
      }
    } catch (error) {
      console.log('Supabase not available, saving to IndexedDB only')
      const { addSaleToDB, addSaleItemToDB } = await import('@/lib/indexeddb')
      await addSaleToDB({ ...sale, synced: false })
      for (const item of saleItems) {
        await addSaleItemToDB(item)
      }
    }

    alert(`Sale completed! Receipt PIN: ${receiptPin}`)
    
    // Handle receipt delivery based on settings
    const { getSettingByKey } = await import('@/lib/indexeddb')
    const receiptSettings = await getSettingByKey('receipt')
    const deliveryMode = (receiptSettings?.value as any)?.delivery_mode || 'manual'
    
    try {
      if (deliveryMode === 'auto_print') {
        // Auto print receipt (to be implemented with printer integration)
        console.log('Auto printing receipt:', receiptNumber)
        // Print failure should not cancel sale
      } else if (deliveryMode === 'pdf_download') {
        // Download PDF (to be implemented with PDF generation)
        console.log('Downloading PDF receipt:', receiptNumber)
        // PDF generation failure should not cancel sale
      } else if (deliveryMode === 'digital') {
        // Show digital receipt on screen
        setCompletedSale({ ...sale, items: saleItems })
        setShowReceipt(true)
      }
      // Manual mode: show print button (default behavior)
      setCompletedSale({ ...sale, items: saleItems })
    } catch (printError) {
      console.error('Print/delivery error:', printError)
      // Print failure must not cancel sale - sale is already completed
      alert('Sale completed but receipt generation failed. You can reprint later from the Receipts page.')
    }
    
    setCart([])
    setShowCheckout(false)
    setPaymentMethod('cash')
    setCashAmount('')
    setMpesaAmount('')
    setCardAmount('')
    setBankAmount('')
    setDiscountType(null)
    setDiscountValue('')
    setSaleNotes('')
    loadProducts()
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCameraScanner(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Camera className="h-5 w-5" />
            <span>Camera Scan</span>
          </button>
          <button
            onClick={() => setShowScanner(!showScanner)}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            <Camera className="h-5 w-5" />
            <span>USB Scan</span>
          </button>
        </div>
      </div>

      {showCameraScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowCameraScanner(false)}
          continuous={true}
          showFlashlight={true}
        />
      )}

      {showScanError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Product Not Found</h3>
            </div>
            <p className="text-gray-600 mb-6">{scanError}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowScanError(false)
                  setShowCameraScanner(true)
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Scan Again
              </button>
              <button
                onClick={() => {
                  setShowScanError(false)
                }}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
              >
                Search Manually
              </button>
              <button
                onClick={() => {
                  setShowScanError(false)
                  // Navigate to product creation (to be implemented)
                  alert('Product creation feature coming soon')
                }}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Create Product
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scan Barcode</h3>
              <button onClick={() => setShowScanner(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter or scan barcode..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBarcodeScan(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
            <p className="text-sm text-gray-600 mt-2">
              Use USB scanner or type barcode and press Enter
            </p>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Checkout</h3>
              <button onClick={() => setShowCheckout(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">KES {cartSubtotal.toLocaleString()}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span className="font-medium">-KES {cartDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">KES {cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (Optional)
                </label>
                <div className="flex space-x-2 mb-2">
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 ${
                      discountType === 'percentage'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Percent className="h-4 w-4" />
                    <span>Percentage</span>
                  </button>
                  <button
                    onClick={() => setDiscountType('fixed')}
                    className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 ${
                      discountType === 'fixed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Fixed</span>
                  </button>
                  {discountType && (
                    <button
                      onClick={() => { setDiscountType(null); setDiscountValue('') }}
                      className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {discountType && (
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '10' : '1000'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {(['cash', 'mpesa', 'card', 'bank_transfer', 'credit_account', 'mixed'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`px-3 py-2 rounded-lg text-sm capitalize ${
                        paymentMethod === method
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'mixed' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cash</label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">M-Pesa</label>
                    <input
                      type="number"
                      value={mpesaAmount}
                      onChange={(e) => setMpesaAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card</label>
                    <input
                      type="number"
                      value={cardAmount}
                      onChange={(e) => setCardAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank</label>
                    <input
                      type="number"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Credit Account</label>
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sale Notes (Optional)
                </label>
                <textarea
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Add any notes about this sale..."
                />
              </div>

              <button
                onClick={() => setShowPaymentConfirmation(true)}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirm Payment</h3>
              <button onClick={() => setShowPaymentConfirmation(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold">KES {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium capitalize">{paymentMethod.replace('_', ' ')}</span>
                </div>
                {paymentMethod === 'mixed' && (
                  <>
                    {cashAmount && parseFloat(cashAmount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cash:</span>
                        <span className="font-medium">KES {parseFloat(cashAmount).toLocaleString()}</span>
                      </div>
                    )}
                    {mpesaAmount && parseFloat(mpesaAmount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">M-Pesa:</span>
                        <span className="font-medium">KES {parseFloat(mpesaAmount).toLocaleString()}</span>
                      </div>
                    )}
                    {cardAmount && parseFloat(cardAmount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Card:</span>
                        <span className="font-medium">KES {parseFloat(cardAmount).toLocaleString()}</span>
                      </div>
                    )}
                    {bankAmount && parseFloat(bankAmount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank:</span>
                        <span className="font-medium">KES {parseFloat(bankAmount).toLocaleString()}</span>
                      </div>
                    )}
                    {creditAmount && parseFloat(creditAmount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Credit:</span>
                        <span className="font-medium">KES {parseFloat(creditAmount).toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
                {paymentMethod === 'cash' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cash:</span>
                    <span className="font-medium">KES {cartTotal.toLocaleString()}</span>
                  </div>
                )}
                {paymentMethod === 'mpesa' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">M-Pesa:</span>
                    <span className="font-medium">KES {cartTotal.toLocaleString()}</span>
                  </div>
                )}
                {paymentMethod === 'card' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Card:</span>
                    <span className="font-medium">KES {cartTotal.toLocaleString()}</span>
                  </div>
                )}
                {paymentMethod === 'bank_transfer' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank Transfer:</span>
                    <span className="font-medium">KES {cartTotal.toLocaleString()}</span>
                  </div>
                )}
                {paymentMethod === 'credit_account' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credit Account:</span>
                    <span className="font-medium">KES {cartTotal.toLocaleString()}</span>
                  </div>
                )}
                {paymentMethod === 'cash' && (
                  <div className="flex justify-between text-green-600">
                    <span>Change:</span>
                    <span className="font-medium">KES 0.00</span>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Please verify all payment details before confirming.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentConfirmation(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowPaymentConfirmation(false)
                    completeSale()
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Confirm & Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReceipt && completedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Receipt</h3>
              <button onClick={() => setShowReceipt(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <Receipt
              sale={completedSale}
              items={completedSale.items}
              shopName="SMART POS"
              cashierName={user?.name || 'Cashier'}
            />

            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Print functionality (to be implemented with printer integration)
                  console.log('Printing receipt:', completedSale.receipt_number)
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Printer className="h-5 w-5" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 overflow-hidden flex flex-col">
          <div className="flex space-x-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              title="USB Scanner Input"
            >
              <Camera className="h-5 w-5" />
              <span className="hidden md:inline">Scan</span>
            </button>
            <button
              onClick={() => setShowCameraScanner(true)}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              title="Camera Scanner"
            >
              <Camera className="h-5 w-5" />
              <span className="hidden md:inline">Camera</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.barcode}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-blue-600">KES {product.selling_price.toLocaleString()}</p>
                    <p className={`text-sm ${product.stock < 10 ? 'text-red-600' : 'text-gray-600'}`}>
                      Stock: {product.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Cart</h2>
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm">
              {cartItemsCount}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">KES {item.price.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="font-bold text-gray-900">
                    KES {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mt-4 space-y-3">
            {cartDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="font-medium">Discount:</span>
                <span className="font-medium">-KES {cartDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg">
              <span className="font-bold">Total:</span>
              <span className="font-bold">KES {cartTotal.toLocaleString()}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
