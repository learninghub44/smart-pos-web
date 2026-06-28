'use client'
import { useState, useEffect } from 'react'
import { Download, RefreshCw, BarChart2 } from 'lucide-react'
import * as XLSX from 'xlsx'

type ReportType = 'sales'|'products'|'inventory'

export default function ReportsPage() {
  const [tab, setTab]           = useState<ReportType>('sales')
  const [data, setData]         = useState<any[]>([])
  const [loading, setLoading]   = useState(false)
  const [from, setFrom] = useState(() => { const d=new Date(); d.setDate(1); return d.toISOString().split('T')[0] })
  const [to, setTo]     = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { load() }, [tab, from, to])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?type=${tab}&from=${from}T00:00:00Z&to=${to}T23:59:59Z`)
      if (res.ok) { const d = await res.json(); setData(Array.isArray(d)?d:d.rows||[]) }
    } catch {}
    setLoading(false)
  }

  function exportXlsx() {
    if (!data.length) return
    const ws   = XLSX.utils.json_to_sheet(data.map((r,i)=>({...r,'#':i+1})))
    const wb   = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, tab)
    XLSX.writeFile(wb, `${tab}-report-${from}-to-${to}.xlsx`)
  }

  // Derive totals
  const totalRevenue = tab==='sales' ? data.reduce((a,r)=>a+Number(r.revenue||r.total||0),0) : 0
  const totalUnits   = tab==='products' ? data.reduce((a,r)=>a+Number(r.qty_sold||0),0) : 0

  const TABS: {id:ReportType, label:string}[] = [
    { id:'sales',     label:'Sales Summary' },
    { id:'products',  label:'Product Performance' },
    { id:'inventory', label:'Inventory Valuation' },
  ]

  return (
    <div className="xl-page">
      {/* Toolbar */}
      <div className="xl-toolbar">
        <BarChart2 size={14} color="var(--xl-green)"/>
        <span className="xl-toolbar-title">Reports</span>
        <div className="xl-toolbar-sep"/>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="input"/>
        <span style={{fontSize:11,color:'var(--txt-3)'}}>to</span>
        <input type="date" value={to}   onChange={e=>setTo(e.target.value)}   className="input"/>
        <button onClick={load} className="btn btn-ghost btn-icon"><RefreshCw size={13}/></button>
        <div className="xl-toolbar-sep"/>
        <button onClick={exportXlsx} className="btn btn-primary" disabled={!data.length}>
          <Download size={12}/> Export .xlsx
        </button>
      </div>

      {/* Tab strip */}
      <div className="xl-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`xl-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ flex:1, overflow:'auto' }}>
        {loading ? (
          <div className="loading-center"><div className="spinner"/><span>Generating report…</span></div>
        ) : data.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-title">No data for this period</div><div className="empty-state-sub">Adjust the date range and refresh</div></div>
        ) : (
          <table className="xl-grid" style={{ minWidth:700 }}>
            <thead>
              <tr>
                <th className="row-num">#</th>
                {Object.keys(data[0]).map(k => (
                  <th key={k} className={typeof data[0][k]==='number'?'num':''}>{k.replace(/_/g,' ').toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row,i) => (
                <tr key={i}>
                  <td className="row-num">{i+1}</td>
                  {Object.entries(row).map(([k,v]:any) => (
                    <td key={k} className={typeof v==='number'?'num':''}>
                      {typeof v==='number' ? v.toLocaleString(undefined,{minimumFractionDigits:v%1!==0?2:0}) : String(v??'—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status bar */}
      <div className="xl-statusbar">
        <span className="xl-statusbar-item">Rows: <strong>{data.length}</strong></span>
        {tab==='sales' && totalRevenue>0 && <>
          <span className="xl-statusbar-sep">|</span>
          <span className="xl-statusbar-item">Total Revenue: <strong>KES {Math.round(totalRevenue).toLocaleString()}</strong></span>
        </>}
        {tab==='products' && totalUnits>0 && <>
          <span className="xl-statusbar-sep">|</span>
          <span className="xl-statusbar-item">Units Sold: <strong>{totalUnits.toLocaleString()}</strong></span>
        </>}
      </div>
    </div>
  )
}
