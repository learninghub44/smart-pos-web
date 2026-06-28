'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const EMPTY = { name:'', contact_person:'', phone:'', email:'', address:'', kra_pin:'', payment_terms:'', lead_time_days:'' }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<any>(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const r = await fetch('/api/suppliers'); if (r.ok) { const j = await r.json(); const d = j.data ?? j; if (Array.isArray(d)) setSuppliers(d) } } catch {}
    setLoading(false)
  }

  function openNew()    { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true) }
  function openEdit(s:any) { setEditing(s); setForm({ name:s.name||'', contact_person:s.contact_person||'', phone:s.phone||'', email:s.email||'', address:s.address||'', kra_pin:s.kra_pin||'', payment_terms:s.payment_terms||'', lead_time_days:String(s.lead_time_days||'') }); setError(''); setShowModal(true) }

  async function save() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    try {
      const body = { ...form, lead_time_days:parseInt(form.lead_time_days)||null, ...(editing?{id:editing.id}:{}) }
      const r = await fetch('/api/suppliers', { method:editing?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      if (r.ok) { setShowModal(false); load() } else setError((await r.json()).error||'Failed')
    } catch { setError('Network error') }
    setSaving(false)
  }

  async function del(id:string) {
    if (!confirm('Delete this supplier?')) return
    await fetch('/api/suppliers', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) })
    load()
  }

  function exportXlsx() {
    const rows = filtered.map((s,i) => ({
      '#':i+1, 'Supplier':s.name, 'Contact':s.contact_person||'', Phone:s.phone||'',
      Email:s.email||'', Address:s.address||'', 'KRA PIN':s.kra_pin||'',
      'Payment Terms':s.payment_terms||'', 'Lead Days':s.lead_time_days||'',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{wch:4},{wch:24},{wch:20},{wch:14},{wch:24},{wch:26},{wch:14},{wch:18},{wch:10}]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers')
    XLSX.writeFile(wb, `suppliers-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const filtered = suppliers.filter(s => !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_person||'').toLowerCase().includes(search.toLowerCase()) ||
    (s.phone||'').includes(search)
  )

  return (
    <div className="xl-page">
      <div className="xl-toolbar">
        <span className="xl-toolbar-title">Suppliers</span>
        <div className="xl-toolbar-sep"/>
        <button onClick={openNew} className="btn btn-primary"><Plus size={13}/> New Supplier</button>
        <button onClick={exportXlsx} className="btn" disabled={!filtered.length}><Download size={13}/> Export .xlsx</button>
      </div>

      <div className="xl-formulabar">
        <div className="xl-formulabar-label"><Search size={11} style={{marginRight:4}}/>SEARCH</div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter by name, contact or phone…"/>
        {search && <button onClick={()=>setSearch('')} className="btn btn-ghost" style={{height:28,borderRadius:0,borderLeft:'1px solid var(--border)'}}>✕</button>}
      </div>

      <div style={{flex:1,overflow:'auto'}}>
        {loading ? <div className="loading-center"><div className="spinner"/><span>Loading…</span></div> : (
          <table className="xl-grid" style={{minWidth:800}}>
            <thead>
              <tr>
                <th className="row-num">#</th>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>KRA PIN</th>
                <th>Payment Terms</th>
                <th className="num">Lead Days</th>
                <th style={{width:72}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{textAlign:'center',color:'var(--txt-3)',height:120,fontSize:12}}>No suppliers found</td></tr>
              ) : filtered.map((s,i) => (
                <tr key={s.id}>
                  <td className="row-num">{i+1}</td>
                  <td className="fw-700">{s.name}</td>
                  <td>{s.contact_person||'—'}</td>
                  <td className="font-mono">{s.phone||'—'}</td>
                  <td className="muted">{s.email||'—'}</td>
                  <td className="font-mono muted">{s.kra_pin||'—'}</td>
                  <td>{s.payment_terms||'—'}</td>
                  <td className="num">{s.lead_time_days||'—'}</td>
                  <td>
                    <div style={{display:'flex',gap:2}}>
                      <button onClick={()=>openEdit(s)} className="btn btn-ghost btn-icon"><Edit size={12}/></button>
                      <button onClick={()=>del(s.id)} className="btn btn-ghost btn-icon" style={{color:'var(--red)'}}><Trash2 size={12}/></button>
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
        <span className="xl-statusbar-item">Total Suppliers: <strong>{suppliers.length}</strong></span>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:560}}>
            <div className="modal-header">
              <span className="modal-title">{editing?'Edit Supplier':'New Supplier'}</span>
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost btn-icon">✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{marginBottom:12}}>{error}</div>}
              <div className="form-row">
                {(['name','contact_person'] as const).map(k => (
                  <div className="form-group" key={k}>
                    <label className="form-label">{k==='name'?'Supplier Name *':'Contact Person'}</label>
                    <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="input" style={{width:'100%'}}/>
                  </div>
                ))}
              </div>
              <div className="form-row">
                {(['phone','email'] as const).map(k => (
                  <div className="form-group" key={k}>
                    <label className="form-label">{k==='phone'?'Phone':'Email'}</label>
                    <input type={k==='email'?'email':'tel'} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="input" style={{width:'100%'}}/>
                  </div>
                ))}
              </div>
              <div className="form-row">
                {(['kra_pin','lead_time_days'] as const).map(k => (
                  <div className="form-group" key={k}>
                    <label className="form-label">{k==='kra_pin'?'KRA PIN':'Lead Time (days)'}</label>
                    <input type={k==='lead_time_days'?'number':'text'} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="input" style={{width:'100%'}}/>
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Payment Terms</label>
                <input value={form.payment_terms} onChange={e=>setForm(f=>({...f,payment_terms:e.target.value}))} className="input" style={{width:'100%'}} placeholder="e.g. Net 30"/>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} className="input" style={{width:'100%',height:60}}/>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={()=>setShowModal(false)} className="btn">Cancel</button>
              <button onClick={save} disabled={saving||!form.name} className="btn btn-primary">{saving?'Saving…':editing?'Update':'Add Supplier'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
