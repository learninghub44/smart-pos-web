'use client'
import { useState, useEffect } from 'react'
import { Search, Download, RefreshCw, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function SalesHistoryPage() {
  const [sales, setSales]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [from, setFrom] = useState(() => { const d=new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0] })
  const [to, setTo]     = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { load() }, [from, to])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sales?from=${from}T00:00:00Z&to=${to}T23:59:59Z&limit=500`)
      if (res.ok) { const j = await res.json(); const d = j.data ?? j; if (Array.isArray(d)) setSales(d) }
    } catch {}
    setLoading(false)
  }

  const filtered = sales.filter(s =>
    !search ||
    (s.receipt_pin||'').toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_name||'').toLowerCase().includes(search.toLowerCase())
  )

  const total   = filtered.reduce((a,s)=>a+Number(s.total_amount),0)
  const avgSale = filtered.length ? total/filtered.length : 0

  function exportXlsx() {
    const rows = filtered.map((s,i) => ({
      '#':              i+1,
      'Receipt':        s.receipt_pin,
      'Date':           new Date(s.created_at).toLocaleDateString('en-KE'),
      'Time':           new Date(s.created_at).toLocaleTimeString('en-KE'),
      'Customer':       s.customer_name||'Walk-in',
      'Items':          s.item_count||'',
      'Subtotal (KES)': Number(s.subtotal||0).toFixed(2),
      'Tax (KES)':      Number(s.tax_amount||0).toFixed(2),
      'Discount (KES)': Number(s.discount_amount||0).toFixed(2),
      'Total (KES)':    Number(s.total_amount||0).toFixed(2),
      'Payment':        s.payment_method||'',
      'Cashier':        s.cashier_name||'',
      'Branch':         s.branch_name||'',
      'Status':         s.status||'completed',
    }))

    // Summary rows
    rows.push({} as any)
    rows.push({ '#': 'SUMMARY', 'Receipt': '', 'Date': '', 'Time': '', 'Customer': '', 'Items': '', 'Subtotal (KES)': '', 'Tax (KES)': '', 'Discount (KES)': '', 'Total (KES)': '', 'Payment': '', 'Cashier': '', 'Branch': '', 'Status': '' } as any)
    rows.push({ '#': 'Total Sales',      'Total (KES)': filtered.length } as any)
    rows.push({ '#': 'Total Revenue',    'Total (KES)': total.toFixed(2) } as any)
    rows.push({ '#': 'Average Sale',     'Total (KES)': avgSale.toFixed(2) } as any)
    rows.push({ '#': 'Period',           'Total (KES)': `${from} → ${to}` } as any)
    rows.push({ '#': 'Exported',         'Total (KES)': new Date().toLocaleString('en-KE') } as any)

    const ws = XLSX.utils.json_to_sheet(rows)

    // Column widths
    ws['!cols'] = [
      {wch:4},{wch:12},{wch:12},{wch:10},{wch:20},{wch:6},
      {wch:14},{wch:12},{wch:14},{wch:14},{wch:12},{wch:18},{wch:16},{wch:12}
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sales History')
    XLSX.writeFile(wb, `sales-${from}-to-${to}.xlsx`)
  }

  return (
    <div className="xl-page">
      {/* Toolbar */}
      <div className="xl-toolbar">
        <span className="xl-toolbar-title">Sales History</span>
        <div className="xl-toolbar-sep"/>
        <FileSpreadsheet size={13} color="var(--xl-green)"/>
        <button onClick={exportXlsx} className="btn btn-primary" disabled={filtered.length===0}>
          <Download size={12}/> Export .xlsx
        </button>
        <div className="xl-toolbar-sep"/>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="input"/>
        <span style={{ fontSize:11, color:'var(--txt-3)' }}>to</span>
        <input type="date" value={to}   onChange={e=>setTo(e.target.value)}   className="input"/>
        <button onClick={load} className="btn btn-ghost btn-icon"><RefreshCw size={13}/></button>
      </div>

      {/* Formula bar / search */}
      <div className="xl-formulabar">
        <div className="xl-formulabar-label"><Search size={11} style={{marginRight:4}}/>SEARCH</div>
        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="Filter by receipt number or customer name…"
        />
        {search && (
          <button onClick={()=>setSearch('')} className="btn btn-ghost" style={{ height:28, borderRadius:0, borderLeft:'1px solid var(--border)' }}>
            ✕
          </button>
        )}
      </div>

      {/* KPI row */}
      <div className="xl-kpi-row" style={{ margin:'0', borderRadius:0, borderLeft:'none', borderRight:'none' }}>
        {[
          { label:'Total Sales',    value: filtered.length },
          { label:'Total Revenue',  value: `KES ${Math.round(total).toLocaleString()}` },
          { label:'Average Sale',   value: `KES ${Math.round(avgSale).toLocaleString()}` },
          { label:'Cash Sales',     value: filtered.filter(s=>s.payment_method==='cash').length },
          { label:'M-Pesa / Card',  value: filtered.filter(s=>s.payment_method!=='cash').length },
          { label:'Period',         value: `${from} → ${to}` },
        ].map(k => (
          <div key={k.label} className="xl-kpi" style={{ padding:'8px 12px' }}>
            <div className="xl-kpi-label">{k.label}</div>
            <div className="xl-kpi-value" style={{ fontSize:15 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ flex:1, overflow:'auto', borderTop:'1px solid var(--border)' }}>
        {loading ? (
          <div className="loading-center"><div className="spinner"/><span>Loading sales…</span></div>
        ) : (
          <table className="xl-grid" style={{ minWidth:900 }}>
            <thead>
              <tr>
                <th className="row-num">#</th>
                <th>Receipt</th>
                <th>Date</th>
                <th>Time</th>
                <th>Customer</th>
                <th className="num">Items</th>
                <th className="num">Subtotal</th>
                <th className="num">Tax</th>
                <th className="num">Discount</th>
                <th className="num">Total (KES)</th>
                <th>Payment</th>
                <th>Cashier</th>
                <th>Branch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ textAlign:'center', color:'var(--txt-3)', height:120, fontSize:12 }}>
                    No sales found for this period
                  </td>
                </tr>
              ) : filtered.map((s,i) => (
                <tr key={s.id}>
                  <td className="row-num">{i+1}</td>
                  <td className="font-mono">{s.receipt_pin}</td>
                  <td>{new Date(s.created_at).toLocaleDateString('en-KE')}</td>
                  <td className="muted">{new Date(s.created_at).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})}</td>
                  <td>{s.customer_name||'Walk-in'}</td>
                  <td className="num">{s.item_count||'—'}</td>
                  <td className="num">{Number(s.subtotal||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                  <td className="num">{Number(s.tax_amount||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                  <td className="num">{Number(s.discount_amount||0)>0?Number(s.discount_amount).toLocaleString(undefined,{minimumFractionDigits:2}):'—'}</td>
                  <td className="num fw-700">{Number(s.total_amount||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                  <td><span className={`badge badge-${s.payment_method==='cash'?'green':s.payment_method==='mpesa'?'blue':'yellow'}`}>{s.payment_method}</span></td>
                  <td className="truncate">{s.cashier_name||'—'}</td>
                  <td className="muted truncate">{s.branch_name||'Main'}</td>
                  <td><span className={`badge badge-${s.status==='completed'?'green':s.status==='returned'?'red':'gray'}`}>{s.status||'completed'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status bar */}
      <div className="xl-statusbar">
        <span className="xl-statusbar-item">Rows: <strong>{filtered.length}</strong></span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">SUM(Total): <strong>KES {Math.round(total).toLocaleString()}</strong></span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">AVG: <strong>KES {Math.round(avgSale).toLocaleString()}</strong></span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">Period: <strong>{from} → {to}</strong></span>
      </div>
    </div>
  )
}
