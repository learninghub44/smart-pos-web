'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Users, Phone, Mail, Star, X, AlertCircle } from 'lucide-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<any>(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string|null>(null)
  const [form, setForm]           = useState({ name:'', phone:'', email:'', address:'', loyalty_status:'inactive' })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('customers').select('*').order('name')
      if (data && !error) { setCustomers(data); return }
    } catch {}
    const { getAllCustomers } = await import('@/lib/indexeddb')
    setCustomers(await getAllCustomers())
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ name:'', phone:'', email:'', address:'', loyalty_status:'inactive' })
    setError(null)
    setShowModal(true)
  }

  const openEdit = (c: any) => {
    setEditing(c)
    setForm({ name:c.name||'', phone:c.phone||'', email:c.email||'', address:c.address||'', loyalty_status:c.loyalty_status||'inactive' })
    setError(null)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('customers').delete().eq('id', id)
    } catch {}
    const { deleteCustomerFromDB } = await import('@/lib/indexeddb')
    await deleteCustomerFromDB(id)
    load()
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Name is required')
    if (!form.phone.trim()) return setError('Phone is required')
    setSaving(true); setError(null)
    const now = new Date().toISOString()
    const data = { ...form, updated_at: now }
    try {
      const { supabase } = await import('@/lib/supabase')
      if (editing) {
        await supabase.from('customers').update(data).eq('id', editing.id)
      } else {
        const id = crypto.randomUUID()
        await supabase.from('customers').insert({ ...data, id, created_at: now })
      }
    } catch {}
    setSaving(false); setShowModal(false); load()
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-sub">{customers.length} total</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={14} /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:16 }}>
        <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)' }} />
        <input className="input" style={{ paddingLeft:30 }} placeholder="Search by name, phone or email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table - desktop */}
      <div className="card table-wrap desktop-only">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Loyalty</th><th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6}><div className="empty"><Users size={28}/><p>No customers found</p></div></td></tr>
            ) : filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--blue-lt)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--blue)' }}>{c.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <p style={{ fontSize:13, fontWeight:600, color:'var(--txt-1)' }}>{c.name}</p>
                  </div>
                </td>
                <td style={{ fontSize:13, color:'var(--txt-2)' }}>{c.phone || '—'}</td>
                <td style={{ fontSize:13, color:'var(--txt-2)' }}>{c.email || '—'}</td>
                <td style={{ fontSize:12, color:'var(--txt-3)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.address || '—'}</td>
                <td>
                  <span className={`badge ${c.loyalty_status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {c.loyalty_status === 'active' ? '★ Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ textAlign:'right' }}>
                  <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                    <button onClick={() => openEdit(c)} className="btn btn-ghost btn-icon"><Edit size={13} /></button>
                    <button onClick={() => handleDelete(c.id)} className="btn btn-ghost btn-icon" style={{ color:'var(--red)' }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only" style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0
          ? <div className="card empty"><Users size={28}/><p>No customers found</p></div>
          : filtered.map(c => (
            <div key={c.id} className="card" style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--blue-lt)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'var(--blue)' }}>{c.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'var(--txt-1)' }}>{c.name}</p>
                  <p style={{ fontSize:12, color:'var(--txt-3)' }}>{c.phone}</p>
                </div>
                <span className={`badge ${c.loyalty_status === 'active' ? 'badge-green' : 'badge-gray'}`}>{c.loyalty_status}</span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => openEdit(c)} className="btn btn-ghost" style={{ flex:1, fontSize:12 }}><Edit size={12}/>Edit</button>
                <button onClick={() => handleDelete(c.id)} className="btn btn-ghost" style={{ flex:1, fontSize:12, color:'var(--red)' }}><Trash2 size={12}/> Delete</button>
              </div>
            </div>
          ))
        }
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:50 }} className="modal-center">
          <div style={{ background:'var(--surface)', width:'100%', maxWidth:480, borderRadius:'20px 20px 0 0', maxHeight:'94vh', display:'flex', flexDirection:'column' }} className="modal-rounded">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <p style={{ fontSize:15, fontWeight:700 }}>{editing ? 'Edit Customer' : 'New Customer'}</p>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-2)' }}><X size={18} /></button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
              {error && (
                <div style={{ display:'flex', gap:8, background:'var(--red-lt)', border:'1px solid #FECACA', borderRadius:'var(--radius-sm)', padding:'8px 12px', fontSize:12, color:'var(--red)' }}>
                  <AlertCircle size={14} style={{ flexShrink:0 }} />{error}
                </div>
              )}
              {[
                { label:'Full Name *', key:'name', placeholder:'e.g. John Mwangi' },
                { label:'Phone *', key:'phone', placeholder:'e.g. 0712 345 678' },
                { label:'Email', key:'email', placeholder:'e.g. john@email.com', type:'email' },
                { label:'Address', key:'address', placeholder:'e.g. Nairobi, Kenya' },
              ].map(f => (
                <div key={f.key}>
                  <p className="label">{f.label}</p>
                  <input className="input" type={f.type || 'text'} value={(form as any)[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})} placeholder={f.placeholder} />
                </div>
              ))}
              <div>
                <p className="label">Loyalty Status</p>
                <div style={{ display:'flex', gap:8 }}>
                  {(['inactive','active'] as const).map(s => (
                    <button key={s} onClick={() => setForm({...form, loyalty_status: s})}
                      style={{
                        flex:1, padding:'8px', borderRadius:'var(--radius-sm)', border:'1.5px solid', cursor:'pointer',
                        borderColor: form.loyalty_status === s ? 'var(--blue)' : 'var(--border)',
                        background: form.loyalty_status === s ? 'var(--blue-lt)' : 'var(--surface)',
                        color: form.loyalty_status === s ? 'var(--blue)' : 'var(--txt-2)',
                        fontSize:12, fontWeight:600, textTransform:'capitalize'
                      }}>
                      {s === 'active' ? '★ ' : ''}{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:10, flexShrink:0 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex:1 }}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="btn btn-primary" style={{ flex:1 }}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .desktop-only { display: block; }
        .mobile-only  { display: none; }
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
