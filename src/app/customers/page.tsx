'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const EMPTY = { name:'', phone:'', email:'', credit_limit:'0' }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<any>(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const r = await fetch('/api/customers'); if (r.ok) setCustomers(await r.json()) } catch {}
    setLoading(false)
  }

  function openNew()    { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(c:any) { setEditing(c); setForm({ name:c.name, phone:c.phone||'', email:c.email||'', credit_limit:String(c.credit_limit||0) }); setShowModal(true) }

  async function save() {
    setSaving(true)
    try {
      const body = { ...form, credit_limit:parseFloat(form.credit_limit)||0, ...(editing?{id:editing.id}:{}) }
      const r = await fetch('/api/customers', { method:editing?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      if (r.ok) { setShowModal(false); load() }
    } catch {}
    setSaving(false)
  }

  async function del(id:string) {
    if (!confirm('Delete this customer?')) return
    await fetch('/api/customers', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) })
    load()
  }

  function exportXlsx() {
    const rows = filtered.map((c,i) => ({
      '#': i+1, Name:c.name, Phone:c.phone||'', Email:c.email||'',
      'Credit Limit (KES)': Number(c.credit_limit||0),
      'Total Spent (KES)':  Number(c.total_spent||0),
      'Since': new Date(c.created_at).toLocaleDateString('en-KE'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{wch:4},{wch:24},{wch:16},{wch:26},{wch:18},{wch:18},{wch:14}]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Customers')
    XLSX.writeFile(wb, `customers-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search)
  )
  const totalSpent = filtered.reduce((a,c) => a+Number(c.total_spent||0), 0)

  const F = ({ k }:{ k:string }) => (
    <div className="form-group">
      <label className="form-label">{k==='name'?'Full Name':k==='phone'?'Phone':k==='email'?'Email':'Credit Limit (KES)'}{k==='name'?' *':''}</label>
      <input type={k==='email'?'email':k==='credit_limit'?'number':'text'}
        value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
        className="input" style={{width:'100%'}}/>
    </div>
  )

  return (
    <div className="xl-page">
      <div className="xl-toolbar">
        <span className="xl-toolbar-title">Customers</span>
        <div className="xl-toolbar-sep"/>
        <button onClick={openNew} className="btn btn-primary"><Plus size={13}/> New Customer</button>
        <button onClick={exportXlsx} className="btn" disabled={!filtered.length}><Download size={13}/> Export .xlsx</button>
      </div>

      <div className="xl-formulabar">
        <div className="xl-formulabar-label"><Search size={11} style={{marginRight:4}}/>SEARCH</div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter by name or phone…"/>
        {search && <button onClick={()=>setSearch('')} className="btn btn-ghost" style={{height:28,borderRadius:0,borderLeft:'1px solid var(--border)'}}>✕</button>}
      </div>

      <div className="xl-kpi-row" style={{margin:0,borderRadius:0,borderLeft:'none',borderRight:'none'}}>
        {[
          { label:'Total Customers', value: filtered.length },
          { label:'Total Spent',     value: `KES ${Math.round(totalSpent).toLocaleString()}` },
          { label:'Avg Spend',       value: `KES ${filtered.length ? Math.round(totalSpent/filtered.length).toLocaleString() : 0}` },
        ].map(k => (
          <div key={k.label} className="xl-kpi" style={{padding:'8px 12px'}}>
            <div className="xl-kpi-label">{k.label}</div>
            <div className="xl-kpi-value" style={{fontSize:15}}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{flex:1,overflow:'auto'}}>
        {loading ? (
          <div className="loading-center"><div className="spinner"/><span>Loading…</span></div>
        ) : (
          <table className="xl-grid">
            <thead>
              <tr>
                <th className="row-num">#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th className="num">Credit Limit</th>
                <th className="num">Total Spent</th>
                <th>Since</th>
                <th style={{width:72}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{textAlign:'center',color:'var(--txt-3)',height:120,fontSize:12}}>No customers found</td></tr>
              ) : filtered.map((c,i) => (
                <tr key={c.id}>
                  <td className="row-num">{i+1}</td>
                  <td className="fw-700">{c.name}</td>
                  <td className="font-mono">{c.phone||'—'}</td>
                  <td className="muted">{c.email||'—'}</td>
                  <td className="num">KES {Number(c.credit_limit||0).toLocaleString()}</td>
                  <td className="num fw-700" style={{color:'var(--green)'}}>KES {Number(c.total_spent||0).toLocaleString()}</td>
                  <td className="muted">{new Date(c.created_at).toLocaleDateString('en-KE')}</td>
                  <td>
                    <div style={{display:'flex',gap:2}}>
                      <button onClick={()=>openEdit(c)} className="btn btn-ghost btn-icon"><Edit size={12}/></button>
                      <button onClick={()=>del(c.id)} className="btn btn-ghost btn-icon" style={{color:'var(--red)'}}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="xl-statusbar">
        <span className="xl-statusbar-item">Rows: <strong>{filtered.length}</strong></span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">SUM(Spent): <strong>KES {Math.round(totalSpent).toLocaleString()}</strong></span>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing?'Edit Customer':'New Customer'}</span>
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost btn-icon">✕</button>
            </div>
            <div className="modal-body">
              <F k="name"/><F k="phone"/><F k="email"/><F k="credit_limit"/>
            </div>
            <div className="modal-footer">
              <button onClick={()=>setShowModal(false)} className="btn">Cancel</button>
              <button onClick={save} disabled={saving||!form.name} className="btn btn-primary">{saving?'Saving…':editing?'Update':'Add Customer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
