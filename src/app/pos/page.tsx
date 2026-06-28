'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, Camera, X, Percent, DollarSign, AlertCircle, Printer, ScanLine, CheckCircle2, Package } from 'lucide-react'
import { getCurrentAuthUser } from '@/lib/auth'
import BarcodeScanner from '@/components/BarcodeScanner'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import Receipt from '@/components/Receipt'

interface CartItem { id:string; name:string; barcode:string; price:number; quantity:number; stock:number }
type PayMethod = 'cash'|'mpesa'|'card'|'bank_transfer'|'credit_account'|'mixed'

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [user, setUser] = useState<any>(null)
  const [bizSettings, setBizSettings] = useState<any>(null)
  const [scanError, setScanError] = useState<string|null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [showUSB, setShowUSB] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [completedSale, setCompletedSale] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [payMethod, setPayMethod] = useState<PayMethod>('cash')
  const [cashGiven, setCashGiven] = useState('')
  const [mpesaAmt, setMpesaAmt] = useState('')
  const [cardAmt, setCardAmt] = useState('')
  const [bankAmt, setBankAmt] = useState('')
  const [creditAmt, setCreditAmt] = useState('')
  const [discType, setDiscType] = useState<'pct'|'fixed'|null>(null)
  const [discVal, setDiscVal] = useState('')
  const [notes, setNotes] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getCurrentAuthUser().then(u => { if (u) setUser(u) })
    loadProducts()
    loadBiz()
    setTimeout(() => searchRef.current?.focus(), 400)
  }, [])

  useBarcodeScanner({ onScan: handleBarcode, enabled: !showCamera && !showCheckout && !showUSB })

  async function loadProducts() {
    try {
      const res = await fetch('/api/products?in_stock=true')
      if (res.ok) { const data = await res.json(); setProducts(data); return }
    } catch {}
    try {
      const { getAllProducts } = await import('@/lib/indexeddb')
      const all = await getAllProducts()
      setProducts(all.filter((p: any) => !p.archived && p.stock > 0))
    } catch {}
  }

  async function loadBiz() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) { const data = await res.json(); if (data.business) setBizSettings(JSON.parse(data.business)) }
    } catch {}
  }

  async function handleBarcode(barcode: string) {
    const p = products.find(x => x.barcode === barcode)
    if (p) { addToCart(p); setScanError(null) }
    else { setScanError(`No product found: ${barcode}`); setSearch(barcode) }
  }

  const addToCart = (p: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id)
      if (ex) {
        if (ex.quantity >= p.stock) return prev
        return prev.map(i => i.id===p.id ? {...i, quantity:i.quantity+1} : i)
      }
      return [...prev, { id:p.id, name:p.name, barcode:p.barcode||'', price:p.selling_price, quantity:1, stock:p.stock }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id===id ? {...i, quantity:Math.max(1,Math.min(i.quantity+delta,i.stock))} : i).filter(i=>i.quantity>0))
  }
  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id!==id))
  const clearCart = () => { setCart([]); setDiscType(null); setDiscVal('') }

  const subtotal = cart.reduce((a,i) => a+i.price*i.quantity, 0)
  const discountAmt = discType==='pct' ? subtotal*(parseFloat(discVal)||0)/100 : discType==='fixed' ? Math.min(parseFloat(discVal)||0,subtotal) : 0
  const total = subtotal - discountAmt

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode||'').includes(search) || (p.sku||'').includes(search)
  )

  async function handleCheckout() {
    if (!cart.length) return
    setProcessing(true)
    try {
      let payment_method = payMethod
      let breakdown: any = {}
      if (payMethod==='cash') breakdown = { cash_given:parseFloat(cashGiven)||total, change_given:Math.max(0,(parseFloat(cashGiven)||0)-total) }
      else if (payMethod==='mpesa') breakdown = { mpesa_amount:total }
      else if (payMethod==='mixed') {
        const parts: any = {}
        if (parseFloat(mpesaAmt)>0) parts.mpesa=parseFloat(mpesaAmt)
        if (parseFloat(cashGiven)>0) parts.cash=parseFloat(cashGiven)
        if (parseFloat(cardAmt)>0) parts.card=parseFloat(cardAmt)
        if (parseFloat(bankAmt)>0) parts.bank=parseFloat(bankAmt)
        if (parseFloat(creditAmt)>0) parts.credit=parseFloat(creditAmt)
        breakdown = parts
      }

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          items: cart.map(i=>({ id:i.id, quantity:i.quantity, price:i.price })),
          payment_method, total_amount:total, discount_amount:discountAmt,
          branch_id: user?.branch_id || null, notes,
          ...breakdown,
        }),
      })
      if (!res.ok) { const d=await res.json(); alert(d.error||'Sale failed'); return }
      const sale = await res.json()
      setCompletedSale({ ...sale, items:cart, total, discountAmt, payMethod, bizSettings, user })
      setShowCheckout(false)
      setShowReceipt(true)
      clearCart()
      loadProducts()
    } catch (e: any) { alert(e.message) }
    finally { setProcessing(false) }
  }

  const S: React.CSSProperties = { fontSize:13 }

  return (
    <div style={{ display:'flex', height:'calc(100vh - 56px)', overflow:'hidden', gap:0 }}>
      {/* Products panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Search bar */}
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:8 }}>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)' }}/>
            <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search products, barcode, SKU…" className="input"
              style={{ paddingLeft:32, width:'100%' }}/>
          </div>
          <button className="btn btn-ghost" onClick={()=>setShowCamera(!showCamera)} title="Camera scanner"><Camera size={15}/></button>
          <button className="btn btn-ghost" onClick={()=>setShowUSB(!showUSB)} title="USB scanner"><ScanLine size={15}/></button>
        </div>

        {showCamera&&<BarcodeScanner onScan={b=>{handleBarcode(b);setShowCamera(false)}} onClose={()=>setShowCamera(false)}/>}

        {scanError&&(
          <div style={{ margin:'8px 16px', padding:'8px 12px', background:'var(--red-lt)', border:'1px solid #FECACA', borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--red)' }}>
            <AlertCircle size={14}/>{scanError}<button onClick={()=>setScanError(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'var(--red)' }}><X size={12}/></button>
          </div>
        )}

        {/* Product grid */}
        <div style={{ flex:1, overflow:'auto', padding:12 }}>
          {filteredProducts.length===0?(
            <div className="empty" style={{ marginTop:40 }}>
              <Package size={32}/><p>{search?`No products matching "${search}"`:'No products in stock'}</p>
            </div>
          ):(
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8 }}>
              {filteredProducts.map(p=>(
                <button key={p.id} onClick={()=>addToCart(p)} className="card" style={{ textAlign:'left', padding:10, cursor:'pointer', border:'1px solid var(--border)' }}>
                  {p.image_url?(
                    <img src={p.image_url} alt={p.name} style={{ width:'100%', height:64, objectFit:'cover', borderRadius:4, marginBottom:6 }}/>
                  ):(
                    <div style={{ width:'100%', height:64, background:'var(--bg)', borderRadius:4, marginBottom:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Package size={24} color="var(--txt-3)"/>
                    </div>
                  )}
                  <p style={{ fontSize:12, fontWeight:600, color:'var(--txt-1)', marginBottom:2, lineHeight:1.3 }}>{p.name}</p>
                  <p style={{ fontSize:13, fontWeight:700, color:'var(--blue)' }}>KES {Number(p.selling_price).toLocaleString()}</p>
                  <p style={{ fontSize:10, color:p.stock<5?'var(--red)':'var(--txt-3)', marginTop:2 }}>{p.stock} in stock</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart panel */}
      <div style={{ width:300, borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0 }} className="cart-panel">
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <ShoppingCart size={16} color="var(--blue)"/>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>Cart</span>
            {cart.length>0&&<span style={{ background:'var(--blue)', color:'#fff', fontSize:10, fontWeight:700, borderRadius:10, padding:'1px 6px' }}>{cart.reduce((a,i)=>a+i.quantity,0)}</span>}
          </div>
          {cart.length>0&&<button onClick={clearCart} className="btn btn-ghost" style={{ padding:'2px 8px', fontSize:11 }}>Clear</button>}
        </div>

        <div style={{ flex:1, overflow:'auto', padding:8 }}>
          {cart.length===0?(
            <div className="empty" style={{ marginTop:32 }}><ShoppingCart size={28}/><p>Cart is empty</p></div>
          ):cart.map(item=>(
            <div key={item.id} style={{ padding:'8px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', marginBottom:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:4, marginBottom:4 }}>
                <p style={{ fontSize:12, fontWeight:600, color:'var(--txt-1)', lineHeight:1.3, flex:1 }}>{item.name}</p>
                <button onClick={()=>removeFromCart(item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-3)', padding:0, flexShrink:0 }}><X size={12}/></button>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <button onClick={()=>updateQty(item.id,-1)} className="btn btn-ghost" style={{ padding:'2px 6px' }}><Minus size={10}/></button>
                  <span style={{ fontSize:12, fontWeight:600, minWidth:20, textAlign:'center' }}>{item.quantity}</span>
                  <button onClick={()=>updateQty(item.id,1)} className="btn btn-ghost" style={{ padding:'2px 6px' }} disabled={item.quantity>=item.stock}><Plus size={10}/></button>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--txt-1)' }}>KES {(item.price*item.quantity).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {cart.length>0&&(
          <div style={{ padding:12, borderTop:'1px solid var(--border)' }}>
            {/* Discount */}
            <div style={{ marginBottom:10, display:'flex', gap:6 }}>
              <button onClick={()=>setDiscType(discType==='pct'?null:'pct')} className={`btn btn-ghost ${discType==='pct'?'btn-active':''}`} style={{ flex:1, fontSize:11, padding:'4px 0' }}><Percent size={11}/> %</button>
              <button onClick={()=>setDiscType(discType==='fixed'?null:'fixed')} className={`btn btn-ghost ${discType==='fixed'?'btn-active':''}`} style={{ flex:1, fontSize:11, padding:'4px 0' }}><DollarSign size={11}/> Fixed</button>
              {discType&&<input type="number" value={discVal} onChange={e=>setDiscVal(e.target.value)} placeholder={discType==='pct'?'%':'KES'} className="input" style={{ width:70, fontSize:11, padding:'4px 8px' }}/>}
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:12, color:'var(--txt-3)' }}>Subtotal</span>
              <span style={{ fontSize:12, fontWeight:600 }}>KES {subtotal.toLocaleString()}</span>
            </div>
            {discountAmt>0&&(
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                <span style={{ fontSize:12, color:'var(--green)' }}>Discount</span>
                <span style={{ fontSize:12, fontWeight:600, color:'var(--green)' }}>-KES {Math.round(discountAmt).toLocaleString()}</span>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, paddingTop:6, borderTop:'1px solid var(--border)' }}>
              <span style={{ fontSize:14, fontWeight:700, color:'var(--txt-1)' }}>Total</span>
              <span style={{ fontSize:16, fontWeight:800, color:'var(--blue)' }}>KES {Math.round(total).toLocaleString()}</span>
            </div>
            <button onClick={()=>setShowCheckout(true)} className="btn btn-primary" style={{ width:'100%', fontSize:14, padding:'10px 0' }}>
              Checkout →
            </button>
          </div>
        )}
      </div>

      {/* Checkout modal */}
      {showCheckout&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card" style={{ width:'100%', maxWidth:420, maxHeight:'90vh', overflow:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'var(--txt-1)' }}>Complete Sale</h2>
              <button onClick={()=>setShowCheckout(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-3)' }}><X size={18}/></button>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:12, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={S}>Items</span><span style={{ ...S, fontWeight:600 }}>{cart.reduce((a,i)=>a+i.quantity,0)}</span></div>
                {discountAmt>0&&<div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ ...S, color:'var(--green)' }}>Discount</span><span style={{ ...S, color:'var(--green)', fontWeight:600 }}>-KES {Math.round(discountAmt).toLocaleString()}</span></div>}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid var(--border)', marginTop:4 }}>
                  <span style={{ fontWeight:700 }}>Total</span>
                  <span style={{ fontSize:18, fontWeight:800, color:'var(--blue)' }}>KES {Math.round(total).toLocaleString()}</span>
                </div>
              </div>

              <p style={{ fontSize:11, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', marginBottom:8 }}>Payment Method</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:16 }}>
                {(['cash','mpesa','card','bank_transfer','credit_account','mixed'] as PayMethod[]).map(m=>(
                  <button key={m} onClick={()=>setPayMethod(m)} className={`btn ${payMethod===m?'btn-primary':'btn-ghost'}`} style={{ fontSize:11, padding:'6px 0' }}>
                    {m==='bank_transfer'?'Bank':m==='credit_account'?'Credit':m.charAt(0).toUpperCase()+m.slice(1)}
                  </button>
                ))}
              </div>

              {payMethod==='cash'&&(
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, color:'var(--txt-3)', display:'block', marginBottom:4 }}>Cash Given (KES)</label>
                  <input type="number" value={cashGiven} onChange={e=>setCashGiven(e.target.value)} placeholder={Math.round(total).toString()} className="input" style={{ width:'100%' }}/>
                  {parseFloat(cashGiven)>0&&<p style={{ fontSize:12, color:'var(--green)', marginTop:4 }}>Change: KES {Math.max(0,parseFloat(cashGiven)-total).toLocaleString()}</p>}
                </div>
              )}
              {payMethod==='mixed'&&(
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                  {[['M-Pesa',mpesaAmt,setMpesaAmt],['Cash',cashGiven,setCashGiven],['Card',cardAmt,setCardAmt],['Bank',bankAmt,setBankAmt]].map(([label,val,setter])=>(
                    <div key={label as string}>
                      <label style={{ fontSize:11, color:'var(--txt-3)', display:'block', marginBottom:2 }}>{label as string}</label>
                      <input type="number" value={val as string} onChange={e=>(setter as any)(e.target.value)} placeholder="0" className="input" style={{ width:'100%', fontSize:12 }}/>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, color:'var(--txt-3)', display:'block', marginBottom:4 }}>Notes (optional)</label>
                <input type="text" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add a note…" className="input" style={{ width:'100%' }}/>
              </div>

              <button onClick={handleCheckout} disabled={processing} className="btn btn-primary" style={{ width:'100%', fontSize:14, padding:'12px 0' }}>
                {processing?'Processing…':'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt&&completedSale&&(
        <Receipt sale={completedSale} onClose={()=>setShowReceipt(false)}/>
      )}

      <style>{`
        @media(max-width:768px){.cart-panel{display:none}}
        .btn-active{background:var(--blue-lt)!important;color:var(--blue)!important;border-color:var(--blue)!important}
      `}</style>
    </div>
  )
}
