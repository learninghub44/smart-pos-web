'use client'

import { useEffect, useState } from 'react'
import { getCurrentAuthUser } from '@/lib/auth'
import Link from 'next/link'
import { ShoppingCart, ArrowRight, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData]     = useState<any>({ stats:{}, recent:[], topProducts:[] })

  useEffect(() => {
    getCurrentAuthUser().then(u => setUser(u))
    fetch('/api/dashboard').then(r=>r.json()).then(d=>{ setData(d); setLoading(false) }).catch(()=>setLoading(false))
  }, [])

  const { stats={}, recent=[], topProducts=[] } = data
  const fmt = (n: number) => `KES ${Math.round(n||0).toLocaleString()}`
  const pct = (n: number) => `${(n||0)>=0?'+':''}${(n||0).toFixed(1)}%`

  const kpis = [
    { label: "Today's Revenue",   value: fmt(stats.todayRevenue),  sub: pct(stats.revenueGrowth),  up: (stats.revenueGrowth||0)>=0 },
    { label: "Today's Sales",     value: stats.todaySales??'—',    sub: `${stats.avgItems??0} items/sale`, up: true },
    { label: 'Avg Transaction',   value: fmt(stats.avgTransaction),sub: 'per sale today',           up: true },
    { label: 'Month Revenue',     value: fmt(stats.monthRevenue),  sub: pct(stats.monthGrowth),     up: (stats.monthGrowth||0)>=0 },
    { label: 'Low Stock Items',   value: stats.lowStock??0,        sub: 'need reorder',             up: (stats.lowStock||0)===0 },
    { label: 'Out of Stock',      value: stats.outOfStock??0,      sub: 'items unavailable',        up: (stats.outOfStock||0)===0 },
  ]

  return (
    <div className="xl-page">
      {/* Toolbar */}
      <div className="xl-toolbar">
        <span className="xl-toolbar-title">Dashboard</span>
        <div className="xl-toolbar-sep"/>
        <span style={{ fontSize:11, color:'var(--txt-3)' }}>
          {new Date().toLocaleDateString('en-KE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </span>
        <div style={{ flex:1 }}/>
        <Link href="/pos" className="btn btn-primary">
          <ShoppingCart size={13}/> Open POS
        </Link>
      </div>

      <div className="xl-page-inner">
        {loading ? (
          <div className="loading-center"><div className="spinner"/><span>Loading dashboard…</span></div>
        ) : (
          <>
            {/* Alerts */}
            {((stats.lowStock||0)>0 || (stats.outOfStock||0)>0) && (
              <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                {(stats.lowStock||0)>0 && (
                  <Link href="/inventory" className="alert alert-warning" style={{ display:'flex', alignItems:'center', gap:8, marginBottom:0, textDecoration:'none' }}>
                    <AlertTriangle size={13}/> {stats.lowStock} products low on stock — click to restock
                    <ArrowRight size={12}/>
                  </Link>
                )}
                {(stats.outOfStock||0)>0 && (
                  <Link href="/inventory" className="alert alert-error" style={{ display:'flex', alignItems:'center', gap:8, marginBottom:0, textDecoration:'none' }}>
                    <AlertTriangle size={13}/> {stats.outOfStock} items out of stock
                    <ArrowRight size={12}/>
                  </Link>
                )}
              </div>
            )}

            {/* KPI Row */}
            <div className="xl-kpi-row">
              {kpis.map(k => (
                <div key={k.label} className="xl-kpi">
                  <div className="xl-kpi-label">{k.label}</div>
                  <div className="xl-kpi-value">{k.value}</div>
                  <div className={`xl-kpi-sub ${k.up?'xl-kpi-up':'xl-kpi-down'}`}>
                    {k.up ? <TrendingUp size={10} style={{display:'inline',marginRight:2}}/> : <TrendingDown size={10} style={{display:'inline',marginRight:2}}/>}
                    {k.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid row: recent sales + top products */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:1, marginTop:1 }}>

              {/* Recent Sales */}
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 12px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, fontWeight:700 }}>Recent Sales</span>
                  <Link href="/sales-history" className="btn btn-ghost" style={{ height:22, fontSize:11, padding:'0 8px' }}>View all →</Link>
                </div>
                <div className="xl-grid-wrap" style={{ borderTop:'none' }}>
                  <table className="xl-grid">
                    <thead>
                      <tr>
                        <th className="row-num">#</th>
                        <th>Receipt</th>
                        <th>Time</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th className="num">Amount (KES)</th>
                        <th>Payment</th>
                        <th>Cashier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.length === 0 ? (
                        <tr><td colSpan={8} className="empty-state" style={{ textAlign:'center', color:'var(--txt-3)', height:80 }}>No sales today yet</td></tr>
                      ) : recent.map((s:any, i:number) => (
                        <tr key={s.id}>
                          <td className="row-num">{i+1}</td>
                          <td className="font-mono">{s.receipt_pin}</td>
                          <td className="muted">{new Date(s.created_at).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})}</td>
                          <td>{s.customer_name||'—'}</td>
                          <td className="num">{s.item_count||s.items?.length||'—'}</td>
                          <td className="num fw-700">{Math.round(Number(s.total_amount)).toLocaleString()}</td>
                          <td><span className={`badge badge-${s.payment_method==='cash'?'green':'blue'}`}>{s.payment_method}</span></td>
                          <td className="muted truncate">{s.cashier_name||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Products */}
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 12px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, fontWeight:700 }}>Top Products</span>
                  <Link href="/reports" className="btn btn-ghost" style={{ height:22, fontSize:11, padding:'0 8px' }}>Reports →</Link>
                </div>
                <div className="xl-grid-wrap" style={{ borderTop:'none' }}>
                  <table className="xl-grid">
                    <thead>
                      <tr>
                        <th className="row-num">#</th>
                        <th>Product</th>
                        <th className="num">Sold</th>
                        <th className="num">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--txt-3)', height:80, fontSize:12 }}>No data yet</td></tr>
                      ) : topProducts.map((p:any, i:number) => (
                        <tr key={p.product_id}>
                          <td className="row-num">{i+1}</td>
                          <td className="truncate">{p.product_name}</td>
                          <td className="num">{p.qty_sold}</td>
                          <td className="num fw-700">{Math.round(Number(p.revenue)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <div className="xl-statusbar">
        <span className="xl-statusbar-item">Smart POS</span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">Today: <strong>{stats.todaySales||0}</strong> sales</span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">Revenue: <strong>{fmt(stats.todayRevenue)}</strong></span>
      </div>
    </div>
  )
}
