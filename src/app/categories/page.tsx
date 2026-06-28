'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Layers } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState<any>(null)
  const [form, setForm]             = useState({ name:'', parent_id:'' })
  const [saving, setSaving]         = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const r = await fetch('/api/categories'); if (r.ok) { const j = await r.json(); const d = j.data ?? j; if (Array.isArray(d)) setCategories(d) } } catch {}
    setLoading(false)
  }

  function openNew()     { setEditing(null); setForm({ name:'', parent_id:'' }); setShowModal(true) }
  function openEdit(c:any) { setEditing(c); setForm({ name:c.name||'', parent_id:c.parent_id||'' }); setShowModal(true) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const body = { ...form, parent_id:form.parent_id||null, ...(editing?{id:editing.id}:{}) }
      const r = await fetch('/api/categories', { method:editing?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      if (r.ok) { setShowModal(false); load() }
    } catch {}
    setSaving(false)
  }

  async function del(id:string) {
    if (!confirm('Delete this category? Products using it will be unlinked.')) return
    await fetch('/api/categories', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) })
    load()
  }

  const roots    = categories.filter(c => !c.parent_id)
  const filtered = categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="xl-page">
      <div className="xl-toolbar">
        <Layers size={14} color="var(--xl-green)"/>
        <span className="xl-toolbar-title">Categories</span>
        <div className="xl-toolbar-sep"/>
        <button onClick={openNew} className="btn btn-primary"><Plus size={13}/> New Category</button>
      </div>

      <div className="xl-formulabar">
        <div className="xl-formulabar-label"><Search size={11} style={{marginRight:4}}/>SEARCH</div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter categories…"/>
        {search && <button onClick={()=>setSearch('')} className="btn btn-ghost" style={{height:28,borderRadius:0,borderLeft:'1px solid var(--border)'}}>✕</button>}
      </div>

      <div style={{flex:1,overflow:'auto'}}>
        {loading ? <div className="loading-center"><div className="spinner"/><span>Loading…</span></div> : (
          <table className="xl-grid">
            <thead>
              <tr>
                <th className="row-num">#</th>
                <th>Category Name</th>
                <th>Parent Category</th>
                <th className="num">Products</th>
                <th>Created</th>
                <th style={{width:72}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',color:'var(--txt-3)',height:120,fontSize:12}}>No categories yet — add your first one</td></tr>
              ) : filtered.map((c,i) => {
                const parent = categories.find(p => p.id === c.parent_id)
                return (
                  <tr key={c.id}>
                    <td className="row-num">{i+1}</td>
                    <td className="fw-700">{c.name}</td>
                    <td className="muted">{parent?.name||'—'}</td>
                    <td className="num">{c.product_count??'—'}</td>
                    <td className="muted">{new Date(c.created_at).toLocaleDateString('en-KE')}</td>
                    <td>
                      <div style={{display:'flex',gap:2}}>
                        <button onClick={()=>openEdit(c)} className="btn btn-ghost btn-icon"><Edit size={12}/></button>
                        <button onClick={()=>del(c.id)} className="btn btn-ghost btn-icon" style={{color:'var(--red)'}}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="xl-statusbar">
        <span className="xl-statusbar-item">Total: <strong>{categories.length}</strong></span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">Root categories: <strong>{roots.length}</strong></span>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:400}}>
            <div className="modal-header">
              <span className="modal-title">{editing?'Edit Category':'New Category'}</span>
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost btn-icon">✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input" style={{width:'100%'}} placeholder="e.g. Beverages"/>
              </div>
              <div className="form-group">
                <label className="form-label">Parent Category (optional)</label>
                <select value={form.parent_id} onChange={e=>setForm(f=>({...f,parent_id:e.target.value}))} className="input" style={{width:'100%'}}>
                  <option value="">— None (root category) —</option>
                  {roots.filter(r=>r.id!==editing?.id).map(r=>(
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={()=>setShowModal(false)} className="btn">Cancel</button>
              <button onClick={save} disabled={saving||!form.name} className="btn btn-primary">{saving?'Saving…':editing?'Update':'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
