'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, X, Printer, FileText } from 'lucide-react'
import Receipt from '@/components/Receipt'

export default function SalesHistoryPage() {
  const [sales, setSales]         = useState<any[]>([])
  const [search, setSearch]       = useState('')
  const [dateFilter, setDate]     = useState('today')
  const [payFilter, setPay]       = useState('all')
  const [selected, setSelected]   = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [showReceipt, setShowReceipt]     = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(quantity, price, product_id, products(name))')
        .order('created_at', { ascending: false })
        .limit(300)
      if (data && !error) { setSales(data); setLoading(false); return }
    } catch {}
    const { getAllSales } = await import('@/lib/indexeddb')
    setSales(await getAllSales())
    setLoading(false)
  }

  const filtered = sales.filter(s => {
    const d  = new Date(s.created_at)
    const t  = new Date(); t.setHours(0,0,0,0)
    const w  = new Date(t); w.setDate(t.getDate()-7)
    const m  = new Date(t); m.setMonth(t.getMonth()-1)
    const inDate = dateFilter==='all' || (dateFilter==='today' && d>=t) || (dateFilter==='week' && d>=w) || (dateFilter==='month' && d>=m)
    const inPay  = payFilter==='all' || s.payment_method===payFilter
    const inSrch = !search || s.receipt_pin?.toLowerCase().includes(search.toLowerCase()) || s.receipt_number?.toLowerCase().includes(search.toLowerCase())
    return inDate && inPay && inSrch
  })

  const revenue = filtered.reduce((a, s) => a + Number(s.total_amount), 0)
  const avgTx   = filtered.length ? revenue / filtered.length : 0

  const handleView = async (sale: any) => {
    setSelected(sale)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('sale_items').select('*, products(name)').eq('sale_id', sale.id)
      setSelectedItems(data || sale.sale_items || [])
    } catch { setSelectedItems(sale.sale_items || []) }
    setShowReceipt(true)
  }

  const fmt = (d: string) => new Date(d).toLocaleString('en-KE', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
  const payBadge = (m: string) => m==='cash' ? 'badge-green' : m==='mpesa' ? 'badge-blue' : m==='card' ? 'badge-purple' : 'badge-gray'

  return (
    <div style={{ maxWidth:1200, margin:'0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="page-sub">{filtered.length} transactions · KES {revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding:'14px 16px', marginBottom:16, display:'flex', flexWrap:'wrap', gap:10 }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)' }} />
          <input className="input" style={{ paddingLeft:30 }} placeholder="Search by PIN or receipt #…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width:'auto', minWidth:130 }} value={dateFilter} onChange={e => setDate(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
        <select className="input" style={{ width:'auto', minWidth:140 }} value={payFilter} onChange={e => setPay(e.target.value)}>
          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="mpesa">M-Pesa</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="credit_account">Credit</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Transactions', value: filtered.length.toString() },
          { label:'Total Revenue', value:`KES ${revenue.toLocaleString()}` },
          { label:'Average Sale', value:`KES ${Math.round(avgTx).toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'12px 16px' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{s.label}</p>
            <p style={{ fontSize:17, fontWeight:800, color:'var(--txt-1)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card table-wrap">
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <div style={{ width:28, height:28, border:'3px solid var(--blue)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Receipt PIN</th>
                <th>Date & Time</th>
                <th>Items</th>
                <th style={{ textAlign:'right' }}>Total</th>
                <th>Payment</th>
                <th style={{ textAlign:'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty"><FileText size={28} /><p>No sales found</p></div>
                </td></tr>
              ) : filtered.map(sale => (
                <tr key={sale.id}>
                  <td>
                    <p style={{ fontSize:12, fontFamily:'monospace', fontWeight:700 }}>{sale.receipt_pin}</p>
                    {sale.receipt_number && <p style={{ fontSize:11, color:'var(--txt-3)' }}>{sale.receipt_number}</p>}
                  </td>
                  <td style={{ color:'var(--txt-2)', fontSize:12 }}>{fmt(sale.created_at)}</td>
                  <td style={{ color:'var(--txt-2)', fontSize:12 }}>{sale.sale_items?.length || 0}</td>
                  <td style={{ textAlign:'right' }}>
                    <p style={{ fontWeight:700, fontSize:13 }}>KES {Number(sale.total_amount).toLocaleString()}</p>
                    {Number(sale.discount_amount) > 0 && (
                      <p style={{ fontSize:11, color:'var(--green)' }}>-KES {Number(sale.discount_amount).toLocaleString()} disc</p>
                    )}
                  </td>
                  <td><span className={`badge ${payBadge(sale.payment_method)}`} style={{ textTransform:'capitalize' }}>{sale.payment_method?.replace(/_/g,' ')}</span></td>
                  <td style={{ textAlign:'right' }}>
                    <button onClick={() => handleView(sale)} className="btn btn-ghost" style={{ padding:'5px 10px', fontSize:11 }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Receipt modal */}
      {showReceipt && selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:380, maxHeight:'92vh', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <p style={{ fontSize:14, fontWeight:700 }}>Receipt</p>
              <button onClick={() => setShowReceipt(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-2)' }}><X size={16} /></button>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              <Receipt sale={selected} items={selectedItems} />
            </div>
            <div style={{ display:'flex', gap:10, padding:'12px 18px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
              <button onClick={() => setShowReceipt(false)} className="btn btn-ghost" style={{ flex:1 }}>Close</button>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ flex:1 }}>
                <Printer size={13} /> Print
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
