'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Users } from 'lucide-react'

const EMPTY = { name:'', phone:'', email:'', credit_limit:'0' }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    try { const r=await fetch('/api/customers'); if(r.ok) setCustomers(await r.json()) } catch {}
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(c: any) { setEditing(c); setForm({ name:c.name, phone:c.phone||'', email:c.email||'', credit_limit:c.credit_limit||'0' }); setShowModal(true) }

  async function save() {
    setSaving(true)
    try {
      const body = { ...form, credit_limit:parseFloat(form.credit_limit)||0, ...(editing?{id:editing.id}:{}) }
      const r = await fetch('/api/customers',{ method:editing?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      if(r.ok){ setShowModal(false); load() }
    } catch {}
    setSaving(false)
  }

  async function del(id: string) {
    if(!confirm('Delete this customer?')) return
    await fetch('/api/customers',{ method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) })
    load()
  }

  const filtered = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search))

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, gap:12 }}>
        <h1 style={{ fontSize:20, fontWeight:700, color:'var(--txt-1)' }}>Customers</h1>
        <button onClick={openNew} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:6 }}><Plus size={14}/> Add Customer</button>
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:8 }}>
          <div style={{ position:'relative', flex:1 }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers…" className="input" style={{ paddingLeft:30, width:'100%', fontSize:12 }}/>
          </div>
        </div>
        {loading?<div style={{ padding:40, textAlign:'center', color:'var(--txt-3)' }}>Loading…</div>:(
          <div style={{ overflow:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Name','Phone','Email','Credit Limit','Total Spent',''].map(h=>(
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--txt-3)', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.length===0?<tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'var(--txt-3)' }}><Users size={32} style={{ margin:'0 auto 8px' }}/><br/>No customers yet</td></tr>
                :filtered.map(c=>(
                  <tr key={c.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px 16px', fontSize:13, fontWeight:600 }}>{c.name}</td>
                    <td style={{ padding:'10px 16px', fontSize:12, color:'var(--txt-2)' }}>{c.phone||'—'}</td>
                    <td style={{ padding:'10px 16px', fontSize:12, color:'var(--txt-2)' }}>{c.email||'—'}</td>
                    <td style={{ padding:'10px 16px', fontSize:12 }}>KES {Number(c.credit_limit||0).toLocaleString()}</td>
                    <td style={{ padding:'10px 16px', fontSize:12, fontWeight:600, color:'var(--green)' }}>KES {Number(c.total_spent||0).toLocaleString()}</td>
                    <td style={{ padding:'10px 16px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={()=>openEdit(c)} className="btn btn-ghost" style={{ padding:'4px 8px' }}><Edit size={13}/></button>
                        <button onClick={()=>del(c.id)} className="btn btn-ghost" style={{ padding:'4px 8px', color:'var(--red)' }}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card" style={{ width:'100%', maxWidth:400 }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontSize:15, fontWeight:700 }}>{editing?'Edit Customer':'New Customer'}</h2>
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost" style={{ padding:'2px 6px' }}>✕</button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              {[['Name','name','text',true],['Phone','phone','tel',false],['Email','email','email',false],['Credit Limit (KES)','credit_limit','number',false]].map(([label,key,type,req])=>(
                <div key={key as string}>
                  <label style={{ fontSize:12, color:'var(--txt-3)', display:'block', marginBottom:4 }}>{label as string}{req&&' *'}</label>
                  <input type={type as string} value={(form as any)[key as string]} onChange={e=>setForm(f=>({...f,[key as string]:e.target.value}))} className="input" style={{ width:'100%' }} required={!!req}/>
                </div>
              ))}
              <button onClick={save} disabled={saving||!form.name} className="btn btn-primary" style={{ width:'100%', marginTop:4 }}>{saving?'Saving…':editing?'Update':'Add Customer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
