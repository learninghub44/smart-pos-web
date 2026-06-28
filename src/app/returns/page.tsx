'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Check, X, Eye } from 'lucide-react'

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<any>(null)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [formData, setFormData] = useState({
    sale_id: '',
    customer_id: '',
    reason: '',
    items: [] as any[]
  })

  useEffect(() => { loadReturns(); loadSales() }, [])

  const loadReturns = async () => {
    try {
      const res = await fetch('/api/returns'); const json = await res.json(); const data = json.data ?? json; const error = null
      if (data && !error) { setReturns(data); return }
    } catch {}
    const { getAllReturns } = await import('@/lib/indexeddb')
    setReturns(await getAllReturns())
  }

  const loadSales = async () => {
    try {
      const res2 = await fetch('/api/sales?limit=50'); const json2 = await res2.json(); const data = json2.data ?? json2; const error = null
      if (data && !error) { setSales(data); return }
    } catch {}
    const { getAllSales } = await import('@/lib/indexeddb')
    setSales(await getAllSales())
  }

  const filtered = returns.filter(r => {
    const matchSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) || r.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/returns', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, status: 'approved', approved_at: new Date().toISOString() }) }); const { error } = res.ok ? {} : { error: true }
      if (!error) { loadReturns(); return }
    } catch {}
    const { updateReturnInDB } = await import('@/lib/indexeddb')
    const r = returns.find(x => x.id === id)
    if (r) { await updateReturnInDB({ ...r, status: 'approved', approved_at: new Date().toISOString() }); loadReturns() }
  }

  const handleReject = async (id: string) => {
    try {
      const res = await fetch('/api/returns', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, status: 'rejected' }) }); const { error } = res.ok ? {} : { error: true }
      if (!error) { loadReturns(); return }
    } catch {}
    const { updateReturnInDB } = await import('@/lib/indexeddb')
    const r = returns.find(x => x.id === id)
    if (r) { await updateReturnInDB({ ...r, status: 'rejected' }); loadReturns() }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const totalAmount = formData.items.reduce((s, i) => s + i.price * i.quantity, 0)
    try {
      const postRes = await fetch('/api/returns', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ sale_id: formData.sale_id || null, reason: formData.reason, total_amount: totalAmount, status: 'pending' }) }); const postJson = await postRes.json(); const { data, error } = postRes.ok ? { data: postJson.data ?? postJson, error: null } : { data: null, error: true }
      if (data && !error) { loadReturns(); setShowModal(false); return }
    } catch {}
    const { addReturnToDB } = await import('@/lib/indexeddb')
    await addReturnToDB({ id: crypto.randomUUID(), sale_id: formData.sale_id || null, reason: formData.reason, total_amount: totalAmount, status: 'pending', created_at: new Date().toISOString() })
    loadReturns(); setShowModal(false)
  }

  const fmt = (d: string) => new Date(d).toLocaleString('en-KE', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })

  const statusBadge: Record<string,string> = {
    pending: 'badge badge-yellow',
    approved: 'badge badge-green',
    rejected: 'badge badge-red',
    completed: 'badge badge-blue'
  }

  return (
    <div className="xl-page">
      {/* Toolbar */}
      <div className="xl-toolbar">
        <span className="xl-toolbar-title">Returns &amp; Refunds</span>
        <div className="xl-toolbar-sep" />
        <button className="btn btn-primary" onClick={() => { setFormData({ sale_id:'', customer_id:'', reason:'', items:[] }); setShowModal(true) }}>
          <Plus size={13} /> New Return
        </button>
        <div style={{ flex:1 }} />
        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width:130 }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Formula bar */}
      <div className="xl-formulabar">
        <span className="xl-formulabar-label"><Search size={11} style={{ marginRight:4 }} />SEARCH</span>
        <input placeholder="Search by ID or reason…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* Grid */}
      <div className="xl-page-inner">
        <div className="xl-grid-wrap">
          <table className="xl-grid">
            <thead>
              <tr>
                <th className="row-num">#</th>
                <th>Return ID</th>
                <th>Date</th>
                <th>Reason</th>
                <th className="num">Amount (KES)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ret, i) => (
                <tr key={ret.id}>
                  <td className="row-num muted">{i+1}</td>
                  <td className="font-mono">{ret.id.slice(0,8)}…</td>
                  <td className="muted">{fmt(ret.created_at)}</td>
                  <td>{ret.reason}</td>
                  <td className="num fw-700">KES {Number(ret.total_amount).toLocaleString()}</td>
                  <td><span className={statusBadge[ret.status] || 'badge badge-gray'}>{ret.status}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-icon" title="View" onClick={() => { setSelectedReturn(ret); setShowViewModal(true) }}><Eye size={13} /></button>
                      {ret.status === 'pending' && (
                        <>
                          <button className="btn btn-ghost btn-icon" title="Approve" style={{ color:'var(--green)' }} onClick={() => handleApprove(ret.id)}><Check size={13} /></button>
                          <button className="btn btn-ghost btn-icon" title="Reject" style={{ color:'var(--red)' }} onClick={() => handleReject(ret.id)}><X size={13} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state"><div className="empty-state-title">No returns found</div><div className="empty-state-sub">Adjust filters or create a new return</div></div>}
        </div>
      </div>

      {/* Status bar */}
      <div className="xl-statusbar">
        <span className="xl-statusbar-item">RECORDS: {filtered.length}</span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">PENDING: {returns.filter(r=>r.status==='pending').length}</span>
        <span className="xl-statusbar-sep">|</span>
        <span className="xl-statusbar-item">APPROVED: {returns.filter(r=>r.status==='approved').length}</span>
      </div>

      {/* New Return Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:560 }}>
            <div className="modal-header">
              <span className="modal-title">New Return</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={13} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Linked Sale (optional)</label>
                  <select className="input" style={{ width:'100%' }} value={formData.sale_id} onChange={e => {
                    const sale = sales.find(s => s.id === e.target.value)
                    setSelectedSale(sale || null)
                    setFormData(prev => ({
                      ...prev, sale_id: e.target.value,
                      items: sale?.sale_items?.map((it: any) => ({ product_id: it.product_id, name: it.products?.name||'Product', quantity:0, price: it.price })) || []
                    }))
                  }}>
                    <option value="">— no sale —</option>
                    {sales.map(s => <option key={s.id} value={s.id}>{s.receipt_pin} — {fmt(s.created_at)} — KES {Number(s.total_amount).toLocaleString()}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason *</label>
                  <textarea className="input" style={{ width:'100%' }} rows={3} required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                </div>
                {formData.items.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Items to Return</label>
                    <div className="xl-grid-wrap">
                      <table className="xl-grid">
                        <thead><tr><th>Product</th><th className="num">Unit Price</th><th className="num">Qty</th></tr></thead>
                        <tbody>
                          {formData.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.name}</td>
                              <td className="num">KES {item.price.toLocaleString()}</td>
                              <td className="num">
                                <input type="number" min="0" className="input input-sm" style={{ width:60, textAlign:'right' }} value={item.quantity}
                                  onChange={e => { const items = [...formData.items]; items[idx].quantity = parseInt(e.target.value)||0; setFormData({...formData, items}) }} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Return</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedReturn && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Return Details — {selectedReturn.id.slice(0,8)}…</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowViewModal(false)}><X size={13} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row" style={{ marginBottom:12 }}>
                <div><div className="form-label">Date</div><div>{fmt(selectedReturn.created_at)}</div></div>
                <div><div className="form-label">Status</div><span className={statusBadge[selectedReturn.status]||'badge badge-gray'}>{selectedReturn.status}</span></div>
                <div><div className="form-label">Amount</div><div className="fw-700">KES {Number(selectedReturn.total_amount).toLocaleString()}</div></div>
              </div>
              <div className="form-group"><div className="form-label">Reason</div><div>{selectedReturn.reason}</div></div>
              {selectedReturn.return_items?.length > 0 && (
                <div className="xl-grid-wrap">
                  <table className="xl-grid">
                    <thead><tr><th>Product</th><th className="num">Qty</th><th className="num">Price</th></tr></thead>
                    <tbody>
                      {selectedReturn.return_items.map((it: any) => (
                        <tr key={it.id}>
                          <td>{it.products?.name||'Product'}</td>
                          <td className="num">{it.quantity}</td>
                          <td className="num">KES {Number(it.price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer"><button className="btn" onClick={() => setShowViewModal(false)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
