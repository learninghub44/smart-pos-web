'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, MapPin, Phone, Mail, CheckCircle, XCircle, X, Building2, Users } from 'lucide-react'
import { getCurrentAuthUser, isOwner } from '@/lib/auth'

interface Branch {
  id: string; name: string; location: string | null
  phone: string | null; email: string | null; is_active: boolean
  created_at: string
}
interface BranchUser { id: string; name: string; email: string; role: string }

async function apiBranch(method: string, body?: any) {
  const res = await fetch('/api/branches', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  return json.data ?? json
}

export default function BranchesPage() {
  const [user, setUser] = useState<import('@/lib/auth').User | null>(null)
  const [owner, setOwner] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchUsers, setBranchUsers] = useState<Record<string, BranchUser[]>>({})
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', phone: '', email: '' })

  useEffect(() => {
    getCurrentAuthUser().then(u => { setUser(u); setOwner(isOwner(u)) })
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      const data: Branch[] = await apiBranch('GET')
      if (data) {
        setBranches(data)
        // Load users per branch via tenant_users API
        const res = await fetch('/api/settings/users')
        if (res.ok) {
          const json = await res.json()
          const users: BranchUser[] = json.data ?? json
          const map: Record<string, BranchUser[]> = {}
          for (const u of users) {
            if ((u as any).branch_id) {
              if (!map[(u as any).branch_id]) map[(u as any).branch_id] = []
              map[(u as any).branch_id].push(u)
            }
          }
          setBranchUsers(map)
        }
      }
    } catch (_) {}
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', location: '', phone: '', email: '' })
    setShowModal(true)
  }

  const openEdit = (b: Branch) => {
    setEditing(b)
    setForm({ name: b.name, location: b.location || '', phone: b.phone || '', email: b.email || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { name: form.name, location: form.location || null, phone: form.phone || null, email: form.email || null }
      if (editing) {
        await apiBranch('PUT', { ...payload, id: editing.id })
      } else {
        await apiBranch('POST', payload)
      }
      setShowModal(false)
      loadBranches()
    } catch (_) {}
    setSaving(false)
  }

  const toggleActive = async (b: Branch) => {
    try {
      await apiBranch('PUT', { id: b.id, is_active: !b.is_active })
      loadBranches()
    } catch (_) {}
  }

  const handleDelete = async (b: Branch) => {
    if (!confirm(`Delete branch "${b.name}"? This cannot be undone.`)) return
    try {
      await apiBranch('DELETE', { id: b.id })
      loadBranches()
    } catch (_) {}
  }

  if (!owner) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Access restricted</p>
          <p className="text-sm text-gray-400 mt-1">Only the owner can manage branches</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
            <p className="text-sm text-gray-500 mt-0.5">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" /> Add Branch
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map(b => (
            <div key={b.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 ${!b.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${b.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Building2 className={`w-5 h-5 ${b.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 leading-tight">{b.name}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 ${b.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {b.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4 text-gray-500" /></button>
                  <button onClick={() => toggleActive(b)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={b.is_active ? 'Deactivate' : 'Activate'}>
                    {b.is_active ? <XCircle className="w-4 h-4 text-amber-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                  </button>
                  <button onClick={() => handleDelete(b)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600">
                {b.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span>{b.location}</span></div>}
                {b.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span>{b.phone}</span></div>}
                {b.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span>{b.email}</span></div>}
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Staff ({(branchUsers[b.id] || []).length})</span>
                </div>
                {(branchUsers[b.id] || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No staff assigned yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(branchUsers[b.id] || []).map(u => (
                      <span key={u.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        <span className={`w-1.5 h-1.5 rounded-full ${u.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                        {u.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Branch' : 'Add Branch'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Branch Name *</label>
                <input required type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Kisii Town Branch" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Location / Address</label>
                <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Kisii Town, Kenya" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+254..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="branch@..." />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
