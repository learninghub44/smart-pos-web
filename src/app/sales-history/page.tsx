'use client'
import { useState, useEffect } from 'react'
import { Search, Download, RefreshCw } from 'lucide-react'

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState(() => { const d=new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0] })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { load() }, [from, to])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sales?from=${from}T00:00:00Z&to=${to}T23:59:59Z&limit=200`)
      if (res.ok) setSales(await res.json())
    } catch {}
    setLoading(false)
  }

  const filtered = sales.filter(s =>
    !search || (s.receipt_pin||'').toLowerCase().includes(search.toLowerCase()) || (s.customer_name||'').toLowerCase().includes(search.toLowerCase())
  )
  const total = filtered.reduce((a,s)=>a+Number(s.total_amount),0)

  return (
    <div style={{ maxWidth:1100, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, gap:12, flexWrap:'wrap' }}>
        <h1 style={{ fontSize:20, fontWeight:700, color:'var(--txt-1)' }}>Sales History</h1>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="input" style={{ fontSize:12 }}/>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="input" style={{ fontSize:12 }}/>
          <button onClick={load} className="btn btn-ghost"><RefreshCw size={14}/></button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Sales', value:filtered.length },
          { label:'Revenue', value:`KES ${Math.round(total).toLocaleString()}` },
          { label:'Avg Sale', value:`KES ${filtered.length?Math.round(total/filtered.length).toLocaleString():0}` },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:'12px 16px' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--txt-3)', textTransform:'uppercase', marginBottom:4 }}>{s.label}</p>
            <p style={{ fontSize:18, fontWeight:800, color:'var(--txt-1)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:8 }}>
          <div style={{ position:'relative', flex:1 }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search receipt or customer…" className="input" style={{ paddingLeft:30, width:'100%', fontSize:12 }}/>
          </div>
        </div>
        {loading?(
          <div style={{ padding:40, textAlign:'center', color:'var(--txt-3)' }}>Loading…</div>
        ):(
          <div style={{ overflow:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Receipt','Date','Items','Method','Customer','Total'].map(h=>(
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--txt-3)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0?(
                  <tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'var(--txt-3)' }}>No sales found</td></tr>
                ):filtered.map(s=>(
                  <tr key={s.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px 16px', fontSize:12, fontWeight:600, color:'var(--blue)' }}>{s.receipt_pin}</td>
                    <td style={{ padding:'10px 16px', fontSize:12, color:'var(--txt-2)', whiteSpace:'nowrap' }}>{new Date(s.created_at).toLocaleString('en-KE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                    <td style={{ padding:'10px 16px', fontSize:12 }}>{Array.isArray(s.items)?s.items.filter(Boolean).length:'-'}</td>
                    <td style={{ padding:'10px 16px' }}>
                      <span className={`badge badge-${s.payment_method==='cash'?'green':s.payment_method==='mpesa'?'blue':s.payment_method==='card'?'purple':'gray'}`}>{s.payment_method?.replace(/_/g,' ')}</span>
                    </td>
                    <td style={{ padding:'10px 16px', fontSize:12, color:'var(--txt-2)' }}>{s.customer_name||'—'}</td>
                    <td style={{ padding:'10px 16px', fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>KES {Number(s.total_amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
