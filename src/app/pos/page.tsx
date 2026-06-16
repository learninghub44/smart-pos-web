'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Camera,
  X, Percent, DollarSign, AlertCircle, Printer, ScanLine, CheckCircle2, Package
} from 'lucide-react'
import { getAllProducts, getProductByBarcode, syncProductsFromSupabase } from '@/lib/indexeddb'
import { getCurrentAuthUser } from '@/lib/auth'
import BarcodeScanner from '@/components/BarcodeScanner'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import Receipt from '@/components/Receipt'

interface CartItem {
  id: string; name: string; barcode: string
  price: number; quantity: number; stock: number
}
type PayMethod = 'cash' | 'mpesa' | 'card' | 'bank_transfer' | 'credit_account' | 'mixed'

export default function POSPage() {
  const [products, setProducts]       = useState<any[]>([])
  const [search, setSearch]           = useState('')
  const [cart, setCart]               = useState<CartItem[]>([])
  const [user, setUser]               = useState<any>(null)
  const [bizSettings, setBizSettings] = useState<any>(null)
  const [scanError, setScanError]     = useState<string|null>(null)
  const [showCamera, setShowCamera]   = useState(false)
  const [showUSB, setShowUSB]         = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [showCheckout, setShowCheckout]     = useState(false)
  const [showReceipt, setShowReceipt]       = useState(false)
  const [completedSale, setCompletedSale]   = useState<any>(null)
  const [processing, setProcessing]   = useState(false)
  // Payment
  const [payMethod, setPayMethod]  = useState<PayMethod>('cash')
  const [cashGiven, setCashGiven]  = useState('')
  const [mpesaAmt, setMpesaAmt]   = useState('')
  const [cardAmt, setCardAmt]      = useState('')
  const [bankAmt, setBankAmt]      = useState('')
  const [creditAmt, setCreditAmt]  = useState('')
  const [discType, setDiscType]    = useState<'pct'|'fixed'|null>(null)
  const [discVal, setDiscVal]      = useState('')
  const [notes, setNotes]          = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ;(async () => { const u = await getCurrentAuthUser(); if (u) setUser(u) })()
    loadProducts()
    loadBiz()
    setTimeout(() => searchRef.current?.focus(), 400)
  }, [])

  useBarcodeScanner({ onScan: handleBarcode, enabled: !showCamera && !showCheckout && !showUSB })

  async function loadProducts() {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('products').select('*').eq('archived', false).gt('stock', 0).order('name')
      if (data && !error) { setProducts(data); await syncProductsFromSupabase(data); return }
    } catch {}
    const all = await getAllProducts()
    setProducts(all.filter((p: any) => !p.archived && p.stock > 0))
  }

  async function loadBiz() {
    try {
      const { getSettingByKey } = await import('@/lib/indexeddb')
      const s = await getSettingByKey('business')
      if (s) setBizSettings(s.value)
    } catch {}
  }

  async function handleBarcode(barcode: string) {
    const p = await getProductByBarcode(barcode)
    if (p) { addToCart(p); setScanError(null) }
    else { setScanError(`No product found: ${barcode}`); setSearch(barcode) }
  }

  const addToCart = (p: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id)
      if (ex) {
        if (ex.quantity >= p.stock) return prev
        return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { id:p.id, name:p.name, barcode:p.barcode, price:p.selling_price, quantity:1, stock:p.stock }]
    })
  }

  const setQty = (id: string, qty: number) =>
    setCart(prev => prev.map(i => i.id !== id ? i : qty < 1 || qty > i.stock ? i : { ...i, quantity: qty }))

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const discount = discType && discVal
    ? discType === 'pct' ? subtotal * (parseFloat(discVal) / 100) : parseFloat(discVal)
    : 0
  const total    = Math.max(0, subtotal - discount)
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0)
  const cashNum  = parseFloat(cashGiven) || 0
  const change   = payMethod === 'cash' && cashNum > total ? cashNum - total : 0
  const mixedPaid = (parseFloat(mpesaAmt)||0) + (parseFloat(cardAmt)||0) + (parseFloat(bankAmt)||0) + (parseFloat(creditAmt)||0) + cashNum
  const mixedBal  = payMethod === 'mixed' ? total - mixedPaid : 0

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)
  )

  const clearCheckout = () => {
    setCart([]); setPayMethod('cash'); setCashGiven(''); setMpesaAmt(''); setCardAmt('')
    setBankAmt(''); setCreditAmt(''); setDiscType(null); setDiscVal(''); setNotes('')
    setShowMobileCart(false)
  }

  const completeSale = async () => {
    if (processing || cart.length === 0) return
    if (payMethod === 'cash' && cashNum < total) return alert(`Cash given (KES ${cashNum.toLocaleString()}) is less than total (KES ${total.toLocaleString()})`)
    if (payMethod === 'mixed' && mixedBal > 0.01) return alert(`Remaining: KES ${mixedBal.toLocaleString()}`)

    setProcessing(true)
    const now = new Date().toISOString()
    const date = now.slice(0,10).replace(/-/g,'')
    const pin  = `POS-${Math.random().toString(36).substr(2,9).toUpperCase()}`
    const rcpt = `RCP-${date}-${Math.random().toString(36).substr(2,6).toUpperCase()}`

    let cashA=0, mpesaA=0, cardA=0, bankA=0, creditA=0
    if (payMethod==='cash') cashA=total
    else if (payMethod==='mpesa') mpesaA=total
    else if (payMethod==='card') cardA=total
    else if (payMethod==='bank_transfer') bankA=total
    else if (payMethod==='credit_account') creditA=total
    else { cashA=parseFloat(cashGiven)||0; mpesaA=parseFloat(mpesaAmt)||0; cardA=parseFloat(cardAmt)||0; bankA=parseFloat(bankAmt)||0; creditA=parseFloat(creditAmt)||0 }

    const sale = {
      id: crypto.randomUUID(), total_amount: total, discount_amount: discount,
      discount_type: discType, payment_method: payMethod,
      cash_amount: cashA||null, mpesa_amount: mpesaA||null, card_amount: cardA||null,
      bank_amount: bankA||null, credit_amount: creditA||null,
      receipt_pin: pin, receipt_number: rcpt,
      cashier_id: user?.id, notes: notes||null, created_at: now, synced: true
    }
    const saleItems = cart.map(item => ({
      id: crypto.randomUUID(), sale_id: sale.id, product_id: item.id,
      product_name: item.name, quantity: item.quantity, price: item.price,
      discount_amount: 0, created_at: now
    }))

    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('sales').insert(sale)
      await supabase.from('sale_items').insert(saleItems)
      for (const item of cart)
        await supabase.from('products').update({ stock: item.stock - item.quantity, updated_at: now }).eq('id', item.id)
    } catch {
      const idb = await import('@/lib/indexeddb')
      await idb.addSaleToDB({ ...sale, synced: false })
      for (const item of saleItems) await idb.addSaleItemToDB(item)
    }

    setCompletedSale({ ...sale, items: saleItems, change })
    setShowCheckout(false)
    setShowReceipt(true)
    clearCheckout()
    setProcessing(false)
    loadProducts()
  }

  const PAY_METHODS: { key: PayMethod; label: string }[] = [
    { key:'cash', label:'Cash' }, { key:'mpesa', label:'M-Pesa' },
    { key:'card', label:'Card' }, { key:'bank_transfer', label:'Bank' },
    { key:'credit_account', label:'Credit' }, { key:'mixed', label:'Mixed' }
  ]

  // ── Cart panel (shared desktop + mobile drawer) ──
  const CartPanel = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 16px', borderBottom:'1px solid var(--border)', flexShrink:0
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <ShoppingCart size={15} color="var(--blue)" />
          <span style={{ fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>Cart</span>
          {totalQty > 0 && (
            <span style={{
              background:'var(--blue)', color:'#fff',
              fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:99
            }}>{totalQty}</span>
          )}
        </div>
        {cart.length > 0 && (
          <button onClick={() => setCart([])} style={{
            fontSize:11, color:'var(--txt-3)', background:'none', border:'none', cursor:'pointer'
          }}>Clear</button>
        )}
      </div>

      {/* Items */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
        {cart.length === 0 ? (
          <div className="empty" style={{ padding:'32px 16px' }}>
            <ShoppingCart size={28} />
            <p>Cart is empty</p>
            <span>Tap a product to add</span>
          </div>
        ) : cart.map(item => (
          <div key={item.id} style={{
            background:'var(--bg)', borderRadius:'var(--radius-sm)',
            padding:'10px 12px', marginBottom:6
          }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--txt-1)', flex:1, lineHeight:1.3 }}>{item.name}</p>
              <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:'var(--txt-3)', flexShrink:0 }}>
                <Trash2 size={13} />
              </button>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <button onClick={() => setQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1}
                  style={{
                    width:24, height:24, borderRadius:6, background:'var(--surface)',
                    border:'1px solid var(--border)', cursor:'pointer', display:'flex',
                    alignItems:'center', justifyContent:'center', color:'var(--txt-2)'
                  }}>
                  <Minus size={11} />
                </button>
                <span style={{ fontSize:13, fontWeight:700, minWidth:20, textAlign:'center', color:'var(--txt-1)' }}>{item.quantity}</span>
                <button onClick={() => setQty(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}
                  style={{
                    width:24, height:24, borderRadius:6, background:'var(--surface)',
                    border:'1px solid var(--border)', cursor:'pointer', display:'flex',
                    alignItems:'center', justifyContent:'center', color:'var(--txt-2)'
                  }}>
                  <Plus size={11} />
                </button>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:13, fontWeight:800, color:'var(--txt-1)' }}>
                  KES {(item.price * item.quantity).toLocaleString()}
                </p>
                <p style={{ fontSize:10, color:'var(--txt-3)' }}>@ KES {item.price.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding:'14px 16px', borderTop:'1px solid var(--border)', flexShrink:0, background:'var(--surface)' }}>
        {discount > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:12, color:'var(--green)' }}>Discount</span>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--green)' }}>-KES {discount.toLocaleString()}</span>
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--txt-1)' }}>Total</span>
          <span style={{ fontSize:16, fontWeight:800, color:'var(--blue)' }}>KES {total.toLocaleString()}</span>
        </div>
        <button onClick={() => { setShowMobileCart(false); setShowCheckout(true) }}
          disabled={cart.length === 0}
          className="btn btn-primary" style={{ width:'100%', padding:'11px', fontSize:14 }}>
          Checkout
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 56px - 48px)' }}>

      {/* Page header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, gap:10 }}>
        <h1 style={{ fontSize:18, fontWeight:700, color:'var(--txt-1)' }}>Point of Sale</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowUSB(true)} className="btn btn-ghost" style={{ padding:'7px 12px' }}>
            <ScanLine size={14} /> <span className="hide-sm">USB Scan</span>
          </button>
          <button onClick={() => setShowCamera(true)} className="btn btn-primary" style={{ padding:'7px 12px' }}>
            <Camera size={14} /> <span className="hide-sm">Camera</span>
          </button>
        </div>
      </div>

      {scanError && (
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:'var(--red-lt)', border:'1px solid #FECACA',
          borderRadius:'var(--radius-sm)', padding:'8px 12px', marginBottom:10,
          fontSize:12, color:'var(--red)'
        }}>
          <AlertCircle size={14} style={{ flexShrink:0 }} />
          <span style={{ flex:1 }}>{scanError}</span>
          <button onClick={() => setScanError(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)' }}><X size={14} /></button>
        </div>
      )}

      {/* Main split */}
      <div style={{ flex:1, display:'flex', gap:16, minHeight:0 }}>

        {/* Products */}
        <div className="card" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Search */}
          <div style={{ padding:'12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ position:'relative' }}>
              <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)' }} />
              <input
                ref={searchRef}
                className="input"
                style={{ paddingLeft:32 }}
                placeholder="Search product or scan barcode…"
                value={search}
                onChange={e => { setSearch(e.target.value); setScanError(null) }}
              />
            </div>
          </div>

          {/* Grid */}
          <div style={{ flex:1, overflowY:'auto', padding:12 }}>
            {filtered.length === 0 ? (
              <div className="empty">
                <Package size={32} />
                <p>{search ? 'No products match' : 'No products in stock'}</p>
                <span>{search ? 'Try a different search' : 'Add products in Inventory'}</span>
              </div>
            ) : (
              <div className="product-grid">
                {filtered.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)} style={{
                    background:'var(--bg)', border:'1.5px solid var(--border)',
                    borderRadius:'var(--radius)', padding:'12px 10px',
                    cursor:'pointer', textAlign:'left', transition:'all .12s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--blue)'; e.currentTarget.style.background='var(--blue-lt)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg)' }}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} style={{ width:'100%', height:64, objectFit:'contain', marginBottom:8, borderRadius:6 }} />
                    ) : (
                      <div style={{
                        width:'100%', height:48, background:'var(--surface)',
                        borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center',
                        marginBottom:8
                      }}>
                        <Package size={20} color="var(--txt-3)" />
                      </div>
                    )}
                    <p style={{ fontSize:12, fontWeight:600, color:'var(--txt-1)', lineHeight:1.3, marginBottom:4 }} className="line-clamp-2">{p.name}</p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <p style={{ fontSize:13, fontWeight:800, color:'var(--blue)' }}>KES {Number(p.selling_price).toLocaleString()}</p>
                      <span className={`badge ${p.stock < 5 ? 'badge-red' : p.stock < 10 ? 'badge-yellow' : 'badge-green'}`}>
                        {p.stock}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop cart */}
        <div className="card desktop-cart" style={{ width:300, display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>
          <CartPanel />
        </div>
      </div>

      {/* Mobile cart FAB */}
      <button onClick={() => setShowMobileCart(true)} className="mobile-cart-fab" style={{
        position:'fixed', bottom:20, right:20, zIndex:30,
        width:56, height:56, borderRadius:'50%',
        background:'var(--blue)', color:'#fff', border:'none',
        cursor:'pointer', boxShadow:'var(--shadow-lg)',
        display:'none', alignItems:'center', justifyContent:'center'
      }}>
        <ShoppingCart size={22} />
        {totalQty > 0 && (
          <span style={{
            position:'absolute', top:-4, right:-4, background:'var(--red)',
            color:'#fff', fontSize:10, fontWeight:800, width:18, height:18,
            borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'
          }}>{totalQty > 9 ? '9+' : totalQty}</span>
        )}
      </button>

      {/* Mobile cart drawer */}
      {showMobileCart && (
        <div style={{ position:'fixed', inset:0, zIndex:50 }}>
          <div onClick={() => setShowMobileCart(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.5)' }} />
          <div style={{
            position:'absolute', bottom:0, left:0, right:0,
            background:'var(--surface)', borderRadius:'20px 20px 0 0',
            maxHeight:'88vh', display:'flex', flexDirection:'column'
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 16px 0' }}>
              <p style={{ fontSize:15, fontWeight:700 }}>Cart</p>
              <button onClick={() => setShowMobileCart(false)} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ flex:1, overflow:'hidden' }}><CartPanel /></div>
          </div>
        </div>
      )}

      {/* USB Scanner */}
      {showUSB && (
        <Modal title="USB Barcode Scanner" onClose={() => setShowUSB(false)}>
          <p style={{ fontSize:13, color:'var(--txt-2)', marginBottom:12 }}>Type or scan a barcode, then press Enter:</p>
          <input className="input" autoFocus placeholder="Scan barcode here…"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const v = e.currentTarget.value.trim()
                if (v) { handleBarcode(v); setShowUSB(false) }
              }
            }}
          />
          <p style={{ fontSize:11, color:'var(--txt-3)', marginTop:6 }}>Press Enter after scanning</p>
        </Modal>
      )}

      {/* Camera */}
      {showCamera && (
        <BarcodeScanner onScan={c => { handleBarcode(c); setShowCamera(false) }} onClose={() => setShowCamera(false)} continuous={false} showFlashlight />
      )}

      {/* Checkout modal */}
      {showCheckout && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:50 }} className="modal-center">
          <div style={{
            background:'var(--surface)', width:'100%', maxWidth:480,
            borderRadius:'20px 20px 0 0', maxHeight:'94vh',
            display:'flex', flexDirection:'column'
          }} className="modal-rounded">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <p style={{ fontSize:16, fontWeight:700 }}>Checkout</p>
              <button onClick={() => setShowCheckout(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-2)' }}><X size={18} /></button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
              {/* Summary */}
              <div style={{ background:'var(--bg)', borderRadius:'var(--radius)', padding:14, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:'var(--txt-2)' }}>Subtotal ({totalQty} items)</span>
                  <span style={{ fontSize:12, color:'var(--txt-1)' }}>KES {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:'var(--green)' }}>Discount</span>
                    <span style={{ fontSize:12, color:'var(--green)', fontWeight:600 }}>-KES {discount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px dashed var(--border-md)', marginTop:4 }}>
                  <span style={{ fontSize:14, fontWeight:700 }}>Total</span>
                  <span style={{ fontSize:16, fontWeight:800, color:'var(--blue)' }}>KES {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Discount */}
              <div style={{ marginBottom:16 }}>
                <p className="label">Discount (Optional)</p>
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  {([['pct','% Off'],['fixed','Fixed KES']] as const).map(([k,l]) => (
                    <button key={k} onClick={() => setDiscType(discType === k ? null : k)}
                      style={{
                        flex:1, padding:'8px', borderRadius:'var(--radius-sm)',
                        border:'1.5px solid', fontSize:12, fontWeight:600, cursor:'pointer',
                        borderColor: discType === k ? 'var(--blue)' : 'var(--border)',
                        background: discType === k ? 'var(--blue-lt)' : 'var(--surface)',
                        color: discType === k ? 'var(--blue)' : 'var(--txt-2)',
                      }}>
                      {discType === k ? <CheckCircle2 size={12} style={{ display:'inline', marginRight:4 }} /> : null}
                      {l}
                    </button>
                  ))}
                </div>
                {discType && (
                  <input className="input" type="number" value={discVal} onChange={e => setDiscVal(e.target.value)}
                    placeholder={discType === 'pct' ? 'e.g. 10 (10%)' : 'e.g. 500'}
                    min="0" max={discType === 'pct' ? '100' : subtotal.toString()}
                  />
                )}
              </div>

              {/* Payment method */}
              <div style={{ marginBottom:16 }}>
                <p className="label">Payment Method</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                  {PAY_METHODS.map(({ key, label }) => (
                    <button key={key} onClick={() => setPayMethod(key)}
                      style={{
                        padding:'9px 4px', borderRadius:'var(--radius-sm)',
                        border:'1.5px solid', fontSize:12, fontWeight:600, cursor:'pointer',
                        borderColor: payMethod === key ? 'var(--blue)' : 'var(--border)',
                        background: payMethod === key ? 'var(--blue)' : 'var(--surface)',
                        color: payMethod === key ? '#fff' : 'var(--txt-2)',
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash input */}
              {payMethod === 'cash' && (
                <div style={{ marginBottom:16 }}>
                  <p className="label">Cash Received (KES)</p>
                  <input className="input" type="number" value={cashGiven}
                    onChange={e => setCashGiven(e.target.value)}
                    placeholder={`Min KES ${total.toLocaleString()}`} min={total}
                  />
                  {change > 0 && (
                    <div style={{
                      marginTop:8, background:'var(--green-lt)', border:'1px solid #BBF7D0',
                      borderRadius:'var(--radius-sm)', padding:'8px 12px',
                      display:'flex', justifyContent:'space-between'
                    }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--green)' }}>Change Due</span>
                      <span style={{ fontSize:13, fontWeight:800, color:'var(--green)' }}>KES {change.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mixed */}
              {payMethod === 'mixed' && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                    {[
                      ['Cash', cashGiven, setCashGiven],
                      ['M-Pesa', mpesaAmt, setMpesaAmt],
                      ['Card', cardAmt, setCardAmt],
                      ['Bank Transfer', bankAmt, setBankAmt],
                      ['Credit', creditAmt, setCreditAmt],
                    ].map(([label, val, setter]: any) => (
                      <div key={label as string}>
                        <p className="label" style={{ marginBottom:3 }}>{label}</p>
                        <input className="input" type="number" value={val} onChange={e => setter(e.target.value)} placeholder="0" min="0" />
                      </div>
                    ))}
                  </div>
                  <div style={{
                    borderRadius:'var(--radius-sm)', padding:'8px 12px',
                    display:'flex', justifyContent:'space-between',
                    background: mixedBal <= 0 ? 'var(--green-lt)' : 'var(--yellow-lt)',
                    border: `1px solid ${mixedBal <= 0 ? '#BBF7D0' : '#FDE68A'}`
                  }}>
                    <span style={{ fontSize:12, fontWeight:600, color: mixedBal <= 0 ? 'var(--green)' : 'var(--yellow)' }}>
                      {mixedBal <= 0 ? 'Fully Paid' : 'Remaining'}
                    </span>
                    <span style={{ fontSize:13, fontWeight:800, color: mixedBal <= 0 ? 'var(--green)' : 'var(--yellow)' }}>
                      {mixedBal <= 0 ? `KES ${Math.abs(mixedBal).toLocaleString()} change` : `KES ${mixedBal.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="label">Notes (Optional)</p>
                <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes…" style={{ resize:'none' }} />
              </div>
            </div>

            <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
              <button onClick={completeSale} disabled={processing || cart.length === 0}
                className="btn btn-success" style={{ width:'100%', padding:'13px', fontSize:14 }}>
                {processing
                  ? <><span className="spinner" /> Processing…</>
                  : <><CheckCircle2 size={16} /> Complete Sale · KES {total.toLocaleString()}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt */}
      {showReceipt && completedSale && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
          <div style={{
            background:'var(--surface)', borderRadius:'var(--radius-lg)',
            width:'100%', maxWidth:380, maxHeight:'92vh',
            display:'flex', flexDirection:'column'
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <CheckCircle2 size={16} color="var(--green)" />
                <p style={{ fontSize:14, fontWeight:700 }}>Sale Complete!</p>
              </div>
              <button onClick={() => setShowReceipt(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-2)' }}><X size={16} /></button>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              <Receipt sale={completedSale} items={completedSale.items} products={products}
                shopName={bizSettings?.name} shopAddress={bizSettings?.address}
                shopPhone={bizSettings?.phone} cashierName={user?.name} change={completedSale.change}
              />
            </div>
            <div style={{ display:'flex', gap:10, padding:'12px 18px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
              <button onClick={() => setShowReceipt(false)} className="btn btn-ghost" style={{ flex:1 }}>Close</button>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ flex:1 }}>
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }
        .hide-sm { }
        @media (max-width: 1023px) {
          .desktop-cart { display: none !important; }
          .mobile-cart-fab { display: flex !important; }
        }
        @media (max-width: 480px) {
          .hide-sm { display: none; }
          .product-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
        }
        @media (min-width: 768px) {
          .modal-center { align-items: center !important; }
          .modal-rounded { border-radius: var(--radius-lg) !important; }
        }
        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60, padding:16 }}>
      <div style={{ background:'var(--surface)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:420 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--border)' }}>
          <p style={{ fontSize:14, fontWeight:700 }}>{title}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-2)' }}><X size={16} /></button>
        </div>
        <div style={{ padding:'16px 18px' }}>{children}</div>
      </div>
    </div>
  )
}
