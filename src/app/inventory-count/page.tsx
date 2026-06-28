'use client'

import { useState, useEffect } from 'react'
import { Camera, Package, CheckCircle, X, Save, Download, ScanLine } from 'lucide-react'
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

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    const products = await getAllProducts()
    setCountItems(products.map(p => ({
      productId: p.id, productName: p.name, barcode: p.barcode,
      systemStock: p.stock, countedStock: 0, variance: 0
    })))
  }

  const handleBarcodeScan = async (barcode: string) => {
    const product = await getProductByBarcode(barcode)
    if (product) {
      setCountItems(prev => {
        const ex = prev.find(i => i.productId === product.id)
        if (ex) return prev.map(i => i.productId === product.id
          ? { ...i, countedStock: i.countedStock + 1, variance: (i.countedStock + 1) - i.systemStock }
          : i)
        return [...prev, { productId: product.id, productName: product.name, barcode: product.barcode, systemStock: product.stock, countedStock: 1, variance: 1 - product.stock }]
      })
      setCurrentBarcode(barcode)
      setShowCameraScanner(false)
    } else {
      alert(`Product not found: ${barcode}`)
    }
  }

  useBarcodeScanner({ onScan: handleBarcodeScan, enabled: sessionActive && !showCameraScanner })

  const startSession = () => {
    if (!sessionName.trim()) { alert('Enter a session name'); return }
    setSessionActive(true)
    loadProducts()
  }

  const updateCountedStock = (productId: string, newCount: number) => {
    setCountItems(prev => prev.map(i => i.productId === productId
      ? { ...i, countedStock: newCount, variance: newCount - i.systemStock } : i))
  }

  const saveCount = async () => {
    for (const item of countItems) {
      if (item.countedStock !== item.systemStock) {
        try {
          const { supabase } = await import('@/lib/supabase')
          await supabase.from('products').update({ stock: item.countedStock }).eq('id', item.productId)
        } catch {}
        await updateProductInDB({ id: item.productId, stock: item.countedStock } as any)
      }
    }
    alert('Inventory count saved')
    loadProducts()
  }

  const exportReport = () => {
    const report = { sessionName, date: new Date().toISOString(), items: countItems.filter(i => i.countedStock > 0) }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `inventory-count-${sessionName}-${Date.now()}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const countedItems = countItems.filter(i => i.countedStock > 0)
  const varianceItems = countItems.filter(i => i.variance !== 0)

  return (
    <div className="xl-page">
      {/* Toolbar */}
      <div className="xl-toolbar">
        <span className="xl-toolbar-title">Inventory Count</span>
        <div className="xl-toolbar-sep" />
        {sessionActive ? (
          <>
            <button className="btn btn-primary" onClick={saveCount}><Save size={13} /> Save Count</button>
            <button className="btn" onClick={exportReport}><Download size={13} /> Export</button>
            <button className="btn" onClick={() => setShowCameraScanner(true)}><Camera size={13} /> Scan</button>
            <div className="xl-toolbar-sep" />
            <button className="btn btn-ghost" style={{ color:'var(--red)' }} onClick={() => setSessionActive(false)}><X size={13} /> End Session</button>
          </>
        ) : null}
        <div style={{ flex:1 }} />
        {sessionActive && currentBarcode && (
          <span style={{ fontSize:11, color:'var(--green)', display:'flex', alignItems:'center', gap:4 }}>
            <CheckCircle size={12} /> Last: {currentBarcode}
          </span>
        )}
      </div>

      <div className="xl-page-inner">
        {!sessionActive ? (
          /* Start session card */
          <div className="card" style={{ maxWidth:420, margin:'40px auto', padding:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <ScanLine size={20} style={{ color:'var(--xl-green)' }} />
              <span style={{ fontSize:15, fontWeight:700 }}>Start New Count Session</span>
            </div>
            <div className="form-group">
              <label className="form-label">Session Name</label>
              <input className="input" style={{ width:'100%' }} value={sessionName}
                onChange={e => setSessionName(e.target.value)}
                placeholder="e.g. Monthly Count — June 2026"
                onKeyDown={e => e.key === 'Enter' && startSession()} />
            </div>
            <button className="btn btn-primary" style={{ width:'100%', marginTop:8 }} onClick={startSession}>
              Start Session
            </button>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="xl-kpi-row" style={{ marginBottom:16 }}>
              <div className="xl-kpi"><span className="xl-kpi-label">Session</span><span className="xl-kpi-value" style={{ fontSize:14 }}>{sessionName}</span></div>
              <div className="xl-kpi"><span className="xl-kpi-label">Items Counted</span><span className="xl-kpi-value xl-kpi-up">{countedItems.length}</span></div>
              <div className="xl-kpi"><span className="xl-kpi-label">Variances</span><span className="xl-kpi-value xl-kpi-down">{varianceItems.length}</span></div>
              <div className="xl-kpi"><span className="xl-kpi-label">Total Products</span><span className="xl-kpi-value">{countItems.length}</span></div>
            </div>

            {/* Counted items grid */}
            <div className="xl-grid-wrap" style={{ marginBottom:16 }}>
              <div style={{ padding:'6px 12px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--txt-2)', textTransform:'uppercase', letterSpacing:'.04em' }}>
                Counted Items
              </div>
              <table className="xl-grid">
                <thead>
                  <tr>
                    <th className="row-num">#</th>
                    <th>Product</th>
                    <th>Barcode</th>
                    <th className="num">System Stock</th>
                    <th className="num">Counted</th>
                    <th className="num">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {countedItems.map((item, i) => (
                    <tr key={item.productId}>
                      <td className="row-num muted">{i+1}</td>
                      <td className="fw-700">{item.productName}</td>
                      <td className="font-mono muted">{item.barcode}</td>
                      <td className="num">{item.systemStock}</td>
                      <td className="num">
                        <input type="number" className="input input-sm" style={{ width:64, textAlign:'right' }}
                          value={item.countedStock}
                          onChange={e => updateCountedStock(item.productId, parseInt(e.target.value)||0)} />
                      </td>
                      <td className="num">
                        <span className={item.variance===0?'muted':item.variance>0?'text-green':'text-red'} style={{ fontWeight:600 }}>
                          {item.variance>0?'+':''}{item.variance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {countedItems.length === 0 && (
                <div className="empty-state">
                  <Package size={28} style={{ margin:'0 auto 8px', opacity:.3 }} />
                  <div className="empty-state-title">No items counted yet</div>
                  <div className="empty-state-sub">Scan barcodes or use USB scanner to count items</div>
                </div>
              )}
            </div>

            {/* Variance report */}
            {varianceItems.length > 0 && (
              <div className="xl-grid-wrap">
                <div style={{ padding:'6px 12px', background:'var(--red-lt)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, color:'var(--red)', textTransform:'uppercase', letterSpacing:'.04em' }}>
                  Variance Report — {varianceItems.length} discrepancies
                </div>
                <table className="xl-grid">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Barcode</th>
                      <th className="num">System</th>
                      <th className="num">Counted</th>
                      <th className="num">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {varianceItems.map(item => (
                      <tr key={item.productId}>
                        <td className="fw-700">{item.productName}</td>
                        <td className="font-mono muted">{item.barcode}</td>
                        <td className="num">{item.systemStock}</td>
                        <td className="num">{item.countedStock}</td>
                        <td className="num">
                          <span className={item.variance>0?'text-green':'text-red'} style={{ fontWeight:700 }}>
                            {item.variance>0?'+':''}{item.variance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status bar */}
      <div className="xl-statusbar">
        <span className="xl-statusbar-item">SESSION: {sessionActive ? sessionName : 'None'}</span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">COUNTED: {countedItems.length}</span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">VARIANCES: {varianceItems.length}</span>
      </div>

      {showCameraScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowCameraScanner(false)} continuous={true} showFlashlight={true} />
      )}
    </div>
  )
}
