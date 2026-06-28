'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react'

export default function BrandsPage() {
  const [brands, setBrands]       = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<any>(null)
  const [form, setForm]           = useState({ name:'' })
  const [saving, setSaving]       = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const r = await fetch('/api/brands'); if (r.ok) { const j = await r.json(); const d = j.data ?? j; if (Array.isArray(d)) setBrands(d) } } catch {}
    setLoading(false)
  }

  function openNew()       { setEditing(null); setForm({ name:'' }); setShowModal(true) }
  function openEdit(b:any) { setEditing(b); setForm({ name:b.name||'' }); setShowModal(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const body = { ...form, ...(editing?{id:editing.id}:{}) }
      const r = await fetch('/api/brands', { method:editing?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      if (r.ok) { setShowModal(false); load() }
    } catch {}
    setSaving(false)
  }

  async function del(id:string) {
    if (!confirm('Delete this brand?')) return
    await fetch('/api/brands', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) })
    load()
  }

  const filtered = brands.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="xl-page">
      <div className="xl-toolbar">
        <Tag size={14} color="var(--xl-green)"/>
        <span className="xl-toolbar-title">Brands</span>
        <div className="xl-toolbar-sep"/>
        <button onClick={openNew} className="btn btn-primary"><Plus size={13}/> New Brand</button>
      </div>

      <div className="xl-formulabar">
        <div className="xl-formulabar-label"><Search size={11} style={{marginRight:4}}/>SEARCH</div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter brands…"/>
        {search && <button onClick={()=>setSearch('')} className="btn btn-ghost" style={{height:28,borderRadius:0,borderLeft:'1px solid var(--border)'}}>✕</button>}
      </div>

      <div style={{flex:1,overflow:'auto'}}>
        {loading ? <div className="loading-center"><div className="spinner"/><span>Loading…</span></div> : (
          <table className="xl-grid">
            <thead>
              <tr>
                <th className="row-num">#</th>
                <th>Brand Name</th>
                <th className="num">Products</th>
                <th>Created</th>
                <th style={{width:72}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center',color:'var(--txt-3)',height:120,fontSize:12}}>No brands yet</td></tr>
              ) : filtered.map((b,i) => (
                <tr key={b.id}>
                  <td className="row-num">{i+1}</td>
                  <td className="fw-700">{b.name}</td>
                  <td className="num">{b.product_count??'—'}</td>
                  <td className="muted">{new Date(b.created_at).toLocaleDateString('en-KE')}</td>
                  <td>
                    <div style={{display:'flex',gap:2}}>
                      <button onClick={()=>openEdit(b)} className="btn btn-ghost btn-icon"><Edit size={12}/></button>
                      <button onClick={()=>del(b.id)} className="btn btn-ghost btn-icon" style={{color:'var(--red)'}}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="xl-statusbar">
        <span className="xl-statusbar-item">Total Brands: <strong>{brands.length}</strong></span>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:360}}>
            <div className="modal-header">
              <span className="modal-title">{editing?'Edit Brand':'New Brand'}</span>
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost btn-icon">✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Brand Name *</label>
                <input value={form.name} onChange={e=>setForm({name:e.target.value})} className="input" style={{width:'100%'}} placeholder="e.g. Brookside"/>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={()=>setShowModal(false)} className="btn">Cancel</button>
              <button onClick={save} disabled={saving||!form.name} className="btn btn-primary">{saving?'Saving…':editing?'Update':'Add Brand'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
