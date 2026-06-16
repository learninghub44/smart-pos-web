'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Truck, X, AlertCircle } from 'lucide-react'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<any>(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string|null>(null)
  const [form, setForm]           = useState({ name:'', contact_person:'', phone:'', email:'', address:'' })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('suppliers').select('*').order('name')
      if (data && !error) { setSuppliers(data); return }
    } catch {}
    const { getAllSuppliers } = await import('@/lib/indexeddb')
    setSuppliers(await getAllSuppliers())
  }

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  )

  const openAdd = () => { setEditing(null); setForm({ name:'', contact_person:'', phone:'', email:'', address:'' }); setError(null); setShowModal(true) }
  const openEdit = (s: any) => { setEditing(s); setForm({ name:s.name||'', contact_person:s.contact_person||'', phone:s.phone||'', email:s.email||'', address:s.address||'' }); setError(null); setShowModal(true) }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return
    try { const { supabase } = await import('@/lib/supabase'); await supabase.from('suppliers').delete().eq('id', id) } catch {}
    load()
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Supplier name is required')
    setSaving(true); setError(null)
    const now = new Date().toISOString()
    try {
      const { supabase } = await import('@/lib/supabase')
      if (editing) await supabase.from('suppliers').update({ ...form, updated_at: now }).eq('id', editing.id)
      else await supabase.from('suppliers').insert({ ...form, id: crypto.randomUUID(), created_at: now, updated_at: now })
    } catch {}
    setSaving(false); setShowModal(false); load()
  }

  const fields = [
    { key:'name', label:'Supplier Name *', placeholder:'e.g. Nairobi Foods Ltd' },
    { key:'contact_person', label:'Contact Person', placeholder:'e.g. Jane Wanjiru' },
    { key:'phone', label:'Phone', placeholder:'e.g. 0712 345 678' },
    { key:'email', label:'Email', placeholder:'e.g. orders@supplier.co.ke', type:'email' },
    { key:'address', label:'Address', placeholder:'e.g. Industrial Area, Nairobi' },
  ]

  return (
    <div style={{ maxWidth:1100, margin:'0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-sub">{suppliers.length} total</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary"><Plus size={14} /> Add Supplier</button>
      </div>

      <div style={{ position:'relative', marginBottom:16 }}>
        <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)' }} />
        <input className="input" style={{ paddingLeft:30 }} placeholder="Search suppliers…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Desktop */}
      <div className="card table-wrap desktop-only">
        <table className="tbl">
          <thead>
            <tr><th>Supplier</th><th>Contact</th><th>Phone</th><th>Email</th><th style={{ textAlign:'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={5}><div className="empty"><Truck size={28}/><p>No suppliers yet</p></div></td></tr>
              : filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <p style={{ fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>{s.name}</p>
                    {s.address && <p style={{ fontSize:11, color:'var(--txt-3)' }}>{s.address}</p>}
                  </td>
                  <td style={{ fontSize:13, color:'var(--txt-2)' }}>{s.contact_person || '—'}</td>
                  <td style={{ fontSize:13, color:'var(--txt-2)' }}>{s.phone || '—'}</td>
                  <td style={{ fontSize:13, color:'var(--txt-2)' }}>{s.email || '—'}</td>
                  <td style={{ textAlign:'right' }}>
                    <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                      <button onClick={() => openEdit(s)} className="btn btn-ghost btn-icon"><Edit size={13}/></button>
                      <button onClick={() => handleDelete(s.id)} className="btn btn-ghost btn-icon" style={{ color:'var(--red)' }}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="mobile-only" style={{ display:'none', flexDirection:'column', gap:10 }}>
        {filtered.map(s => (
          <div key={s.id} className="card" style={{ padding:'14px 16px' }}>
            <div style={{ marginBottom:8 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>{s.name}</p>
              {s.contact_person && <p style={{ fontSize:12, color:'var(--txt-2)' }}>{s.contact_person}</p>}
              <p style={{ fontSize:12, color:'var(--txt-3)' }}>{s.phone}{s.email ? ` · ${s.email}` : ''}</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => openEdit(s)} className="btn btn-ghost" style={{ flex:1, fontSize:12 }}>Edit</button>
              <button onClick={() => handleDelete(s.id)} className="btn btn-ghost" style={{ flex:1, fontSize:12, color:'var(--red)' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:50 }} className="modal-center">
          <div style={{ background:'var(--surface)', width:'100%', maxWidth:480, borderRadius:'20px 20px 0 0', maxHeight:'92vh', display:'flex', flexDirection:'column' }} className="modal-rounded">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <p style={{ fontSize:15, fontWeight:700 }}>{editing ? 'Edit Supplier' : 'New Supplier'}</p>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
              {error && <div style={{ display:'flex', gap:8, background:'var(--red-lt)', border:'1px solid #FECACA', borderRadius:'var(--radius-sm)', padding:'8px 12px', fontSize:12, color:'var(--red)' }}><AlertCircle size={14}/>{error}</div>}
              {fields.map(f => (
                <div key={f.key}>
                  <p className="label">{f.label}</p>
                  <input className="input" type={f.type||'text'} value={(form as any)[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:10, flexShrink:0 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex:1 }}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="btn btn-primary" style={{ flex:1 }}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Supplier'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .desktop-only { display: block; }
        @media (max-width: 767px) {
          .desktop-only { display: none !important; }
          .mobile-only  { display: flex !important; }
        }
        @media (min-width: 768px) {
          .modal-center  { align-items: center !important; }
          .modal-rounded { border-radius: var(--radius-lg) !important; }
        }
      `}</style>
    </div>
  )
}
