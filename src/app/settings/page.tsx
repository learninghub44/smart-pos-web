'use client'

import { useState, useEffect } from 'react'
import { Save, Building2, Receipt, DollarSign, Users, Plus, X, Eye, EyeOff, Settings, CreditCard, Pencil, Trash2, Upload, Trash } from 'lucide-react'
import { getCurrentAuthUser, isOwner, isAdmin, updateRememberedLogo } from '@/lib/auth'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'business' | 'receipt' | 'tax' | 'payment' | 'staff' | 'system'>('business')
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoSaving, setLogoSaving] = useState(false)
  const [logoError, setLogoError] = useState('')
  
  const [businessSettings, setBusinessSettings] = useState({
    name: 'SMART POS',
    address: '',
    phone: '',
    email: '',
    currency: 'KES'
  })
  
  const [receiptSettings, setReceiptSettings] = useState({
    footer: 'Thank you for your purchase!',
    served_by: '',
    paper_size: '80mm',
    auto_print: false
  })
  
  const [taxSettings, setTaxSettings] = useState({
    vat_rate: 16,
    enabled: false
  })

  // Payment methods (Till / Paybill / Send Money / Bank) shown on receipts
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [paymentForm, setPaymentForm] = useState({ type: 'till', label: '', number: '', account_name: '', active: true })
  const [savingPayment, setSavingPayment] = useState(false)

  // Staff management state
  const [staffList, setStaffList] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'cashier', branch_id: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [savingStaff, setSavingStaff] = useState(false)

  useEffect(() => {
    loadUser()
    loadSettings()
    loadStaff()
    // Load current logo
    fetch('/api/tenant/logo').then(r => r.json()).then(d => { if (d.logo_url) setLogoUrl(d.logo_url) }).catch(() => {})
  }, [])

  const loadUser = async () => {
    const currentUser = await getCurrentAuthUser()
    setUser(currentUser)
  }

  const loadStaff = async () => {
    try {
      const [{ data: users }, { data: branchData }] = await Promise.all([
        fetch('/api/settings/users').then(r=>r.json()).then(j=>({data: j.data??j})),
        fetch('/api/branches').then(r=>r.json()).then(j=>({data: (j.data??j).filter((b:any)=>b.is_active)}))
      ])
      if (users) setStaffList(users)
      if (branchData) setBranches(branchData)
    } catch (_) {}
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingStaff(true)
    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffForm.name,
          email: staffForm.email,
          password: staffForm.password,
          role: staffForm.role,
          branch_id: staffForm.branch_id || null,
        }),
      })
      const result = await res.json()
      if (res.ok && result.success !== false) {
        setShowStaffModal(false)
        setStaffForm({ name: '', email: '', password: '', role: 'cashier', branch_id: '' })
        loadStaff()
      } else {
        alert(result.error || 'Failed to add staff')
      }
    } catch {
      alert('Failed to add staff')
    }
    setSavingStaff(false)
  }

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the system?`)) return
    try {
      await fetch('/api/settings/users', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
      loadStaff()
    } catch (_) {}
  }

  const loadSettings = async () => {
    try {
      const settRes = await fetch('/api/settings'); const settJson = await settRes.json(); const data = Object.entries(settJson.data ?? settJson).map(([key, value]) => ({ key, value }))
      if (data && data.length > 0) {
        data.forEach((s: any) => {
          if (s.key === 'business') setBusinessSettings(s.value)
          if (s.key === 'receipt') setReceiptSettings(s.value)
          if (s.key === 'tax') setTaxSettings(s.value)
          if (s.key === 'payment_methods') setPaymentMethods(s.value || [])
        })
        return
      }
    } catch (_) {}
    try {
      const { getSettingByKey } = await import('@/lib/indexeddb')
      const business = await getSettingByKey('business')
      if (business) setBusinessSettings(business.value)
      const receipt = await getSettingByKey('receipt')
      if (receipt) setReceiptSettings(receipt.value)
      const tax = await getSettingByKey('tax')
      if (tax) setTaxSettings(tax.value)
      const payment = await getSettingByKey('payment_methods')
      if (payment) setPaymentMethods(payment.value || [])
    } catch (error) {
      console.log('Error loading settings')
    }
  }

  // Persist the full payment methods array to Supabase + IndexedDB
  const savePaymentMethods = async (methods: any[]) => {
    setPaymentMethods(methods)
    const now = new Date().toISOString()
    try {
      const { addSettingToDB, updateSettingToDB, getSettingByKey } = await import('@/lib/indexeddb')
      const existing = await getSettingByKey('payment_methods')
      if (existing) await updateSettingToDB({ id: existing.id, key: 'payment_methods', value: methods, updated_at: now })
      else await addSettingToDB({ id: crypto.randomUUID(), key: 'payment_methods', value: methods, updated_at: now })
    } catch (_) {}
    try {
      await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ key: 'payment_methods', value: methods }) })
    } catch (_) {}
  }

  const openAddPayment = () => {
    setEditingPayment(null)
    setPaymentForm({ type: 'till', label: '', number: '', account_name: '', active: true })
    setShowPaymentModal(true)
  }

  const openEditPayment = (method: any) => {
    setEditingPayment(method)
    setPaymentForm({
      type: method.type || 'till',
      label: method.label || '',
      number: method.number || '',
      account_name: method.account_name || '',
      active: method.active !== false
    })
    setShowPaymentModal(true)
  }

  const handleSavePayment = async () => {
    if (!paymentForm.label.trim() || !paymentForm.number.trim()) return
    setSavingPayment(true)
    if (editingPayment) {
      const updated = paymentMethods.map(m => m.id === editingPayment.id ? { ...m, ...paymentForm } : m)
      await savePaymentMethods(updated)
    } else {
      const newMethod = { id: crypto.randomUUID(), ...paymentForm }
      await savePaymentMethods([...paymentMethods, newMethod])
    }
    setSavingPayment(false)
    setShowPaymentModal(false)
  }

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Remove this payment method? It will no longer appear on receipts.')) return
    await savePaymentMethods(paymentMethods.filter(m => m.id !== id))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const { addSettingToDB, updateSettingToDB, getAllSettings, getSettingByKey } = await import('@/lib/indexeddb')
      
      // Save business settings
      const existingBusiness = await getSettingByKey('business')
      if (existingBusiness) {
        await updateSettingToDB({
          id: existingBusiness.id,
          key: 'business',
          value: businessSettings,
          updated_at: new Date().toISOString()
        })
      } else {
        await addSettingToDB({
          id: crypto.randomUUID(),
          key: 'business',
          value: businessSettings,
          updated_at: new Date().toISOString()
        })
      }
      
      // Save receipt settings
      const existingReceipt = await getSettingByKey('receipt')
      if (existingReceipt) {
        await updateSettingToDB({
          id: existingReceipt.id,
          key: 'receipt',
          value: receiptSettings,
          updated_at: new Date().toISOString()
        })
      } else {
        await addSettingToDB({
          id: crypto.randomUUID(),
          key: 'receipt',
          value: receiptSettings,
          updated_at: new Date().toISOString()
        })
      }
      
      // Save tax settings
      const existingTax = await getSettingByKey('tax')
      if (existingTax) {
        await updateSettingToDB({
          id: existingTax.id,
          key: 'tax',
          value: taxSettings,
          updated_at: new Date().toISOString()
        })
      } else {
        await addSettingToDB({
          id: crypto.randomUUID(),
          key: 'tax',
          value: taxSettings,
          updated_at: new Date().toISOString()
        })
      }
      
      // Also save to API
      try {
        await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ key: 'business', value: businessSettings }) })
        await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ key: 'receipt', value: receiptSettings }) })
        await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ key: 'tax', value: taxSettings }) })
      } catch (error) {
        console.log('Supabase sync failed, settings saved locally')
      }
      
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const owner = isOwner(user)
  const admin = isAdmin(user)
  const tabs = [
    { id: 'business' as const, label: 'Business', icon: Building2 },
    { id: 'receipt' as const, label: 'Receipt', icon: Receipt },
    { id: 'tax' as const, label: 'Tax', icon: DollarSign },
    ...(admin ? [{ id: 'payment' as const, label: 'Payment Methods', icon: CreditCard }] : []),
    ...(owner ? [{ id: 'staff' as const, label: 'Staff', icon: Users }] : []),
    { id: 'system' as const, label: 'System', icon: Settings }
  ]

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setLogoError('Please select an image file'); return }
    if (file.size > 400_000) { setLogoError('Image must be under 400 KB'); return }
    setLogoError('')
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setLogoSaving(true)
      try {
        const res = await fetch('/api/tenant/logo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo_url: dataUrl }) })
        const data = await res.json()
        if (res.ok) { setLogoUrl(dataUrl); updateRememberedLogo(dataUrl) }
        else setLogoError(data.error || 'Upload failed')
      } catch { setLogoError('Network error') }
      setLogoSaving(false)
    }
    reader.readAsDataURL(file)
  }

  const handleLogoRemove = async () => {
    if (!confirm('Remove logo? The system icon will be shown instead.')) return
    setLogoSaving(true)
    try {
      const res = await fetch('/api/tenant/logo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo_url: null }) })
      if (res.ok) { setLogoUrl(null); updateRememberedLogo(null) }
      else setLogoError('Failed to remove logo')
    } catch { setLogoError('Network error') }
    setLogoSaving(false)
  }

  return (
    <div className="xl-page">
      {/* Ribbon tabs */}
      <div className="xl-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`xl-tab${activeTab === tab.id ? ' active' : ''}`}
              style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Icon size={12} />{tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="xl-page-inner">
          {activeTab === 'business' && (
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <h2 style={{fontSize:13,fontWeight:700,color:"var(--txt-1)",marginBottom:12}}>Business Settings</h2>

              {/* ── LOGO UPLOAD ── */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px', marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Business Logo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  {/* Preview */}
                  <div style={{ width: 80, height: 80, borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {logoUrl
                      ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                      : <Settings size={28} color="var(--txt-3)" strokeWidth={1.5} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 13, color: 'var(--txt-1)', fontWeight: 600, marginBottom: 6 }}>
                      {logoUrl ? 'Logo uploaded' : 'No logo set'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 14, lineHeight: 1.5 }}>
                      PNG or SVG recommended. Max 400 KB. Shows in the sidebar and on receipts.
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--accent)', color: '#fff', borderRadius: 7, cursor: logoSaving ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, opacity: logoSaving ? 0.6 : 1 }}>
                        <Upload size={13} strokeWidth={2.5} />
                        {logoSaving ? 'Saving…' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
                        <input type="file" accept="image/*" onChange={handleLogoFile} style={{ display: 'none' }} disabled={logoSaving} />
                      </label>
                      {logoUrl && (
                        <button onClick={handleLogoRemove} disabled={logoSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'transparent', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', borderRadius: 7, cursor: logoSaving ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                          <Trash size={13} strokeWidth={2} />
                          Remove
                        </button>
                      )}
                    </div>
                    {logoError && <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{logoError}</div>}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessSettings.name}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, name: e.target.value })}
                    className="input" style={{width:"100%"}}
                  />
                </div>
                
                <div>
                  <label className="form-label">
                    Currency
                  </label>
                  <select
                    value={businessSettings.currency}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, currency: e.target.value })}
                    className="input" style={{width:"100%"}}
                  >
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">
                    Address
                  </label>
                  <input
                    type="text"
                    value={businessSettings.address}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                    className="input" style={{width:"100%"}}
                    placeholder="Street address, City, Country"
                  />
                </div>
                
                <div>
                  <label className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={businessSettings.phone}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                    className="input" style={{width:"100%"}}
                    placeholder="+254 700 000 000"
                  />
                </div>
                
                <div>
                  <label className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    value={businessSettings.email}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                    className="input" style={{width:"100%"}}
                    placeholder="contact@business.com"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <h2 style={{fontSize:13,fontWeight:700,color:"var(--txt-1)",marginBottom:12}}>Receipt Settings</h2>
              
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div>
                  <label className="form-label">
                    Footer Text
                  </label>
                  <textarea
                    value={receiptSettings.footer}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, footer: e.target.value })}
                    className="input" style={{width:"100%"}}
                    rows={3}
                    placeholder="Thank you for your purchase!"
                  />
                </div>
                
                <div>
                  <label className="form-label">
                    Served By (appears on receipt)
                  </label>
                  <input
                    type="text"
                    value={receiptSettings.served_by}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, served_by: e.target.value })}
                    className="input" style={{width:"100%"}}
                    placeholder="e.g. Jane Doe, Front Desk, Cashier 1"
                  />
                  <p className="muted" style={{fontSize:11}}>Leave blank to use the logged-in user's name</p>
                </div>

                <div>
                  <label className="form-label">
                    Paper Size
                  </label>
                  <select
                    value={receiptSettings.paper_size}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, paper_size: e.target.value })}
                    className="input" style={{width:"100%"}}
                  >
                    <option value="58mm">58mm (Small)</option>
                    <option value="80mm">80mm (Standard)</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="auto-print"
                    checked={receiptSettings.auto_print}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, auto_print: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="auto-print" style={{fontSize:12,color:"var(--txt-1)"}}>
                    Auto-print receipts after sale
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <h2 style={{fontSize:13,fontWeight:700,color:"var(--txt-1)",marginBottom:12}}>Tax Settings</h2>
              
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="tax-enabled"
                    checked={taxSettings.enabled}
                    onChange={(e) => setTaxSettings({ ...taxSettings, enabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tax-enabled" style={{fontSize:12,color:"var(--txt-1)"}}>
                    Enable Tax/VAT
                  </label>
                </div>
                
                <div>
                  <label className="form-label">
                    VAT Rate (%)
                  </label>
                  <input
                    type="number"
                    value={taxSettings.vat_rate}
                    onChange={(e) => setTaxSettings({ ...taxSettings, vat_rate: parseFloat(e.target.value) || 0 })}
                    className="input" style={{width:"100%"}}
                    min="0"
                    max="100"
                    step="0.5"
                  />
                </div>
                
                <div style={{background:"var(--surface-2)",padding:12,border:"1px solid var(--border)"}}>
                  <p className="muted" style={{fontSize:12}}>
                    <strong>Note:</strong> When tax is enabled, it will be automatically calculated and added to product prices during checkout.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 style={{fontSize:13,fontWeight:700,color:"var(--txt-1)",marginBottom:12}}>Payment Methods</h2>
                  <p className="muted" style={{fontSize:11}}>Till, Paybill, and Send Money numbers shown on every printed receipt</p>
                </div>
                <button
                  onClick={openAddPayment}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="empty-state">
                  <CreditCard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="muted" style={{fontSize:11}}>No payment methods yet. Add a Till, Paybill, or Send Money number.</p>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {paymentMethods.map((m) => {
                    const typeLabel = m.type === 'till' ? 'Till Number' : m.type === 'paybill' ? 'Paybill' : m.type === 'send_money' ? 'Send Money' : 'Bank Account'
                    return (
                      <div key={m.id} className="card" style={{padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div style={{width:28,height:28,borderRadius:'var(--radius)',display:'flex',alignItems:'center',justifyContent:'center',background:m.active?'var(--green-lt)':'var(--surface-2)',flexShrink:0}}>
                            <CreditCard style={{color:m.active?'var(--green)':'var(--txt-3)'}} />
                          </div>
                          <div className="min-w-0">
                            <p style={{fontWeight:600,fontSize:12}}>{m.label} <span style={{color:"var(--txt-3)",fontWeight:400}}>· {typeLabel}</span></p>
                            <p className="muted" style={{fontSize:11}}>
                              {m.number}{m.account_name ? ` · Acc: ${m.account_name}` : ''}
                              {!m.active && <span className="text-amber-600 ml-2">Hidden from receipts</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => openEditPayment(m)} className="btn btn-ghost btn-icon">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeletePayment(m.id)} className="btn btn-ghost btn-icon" style={{color:"var(--red)"}}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Staff Tab */}

          {activeTab === 'system' && (
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <h3 style={{fontSize:13,fontWeight:700,color:"var(--txt-1)"}}>System & Cache</h3>
                <p className="muted" style={{fontSize:11}}>Manage offline cache and local data</p>
              </div>

              <div className="card" style={{padding:16,marginBottom:12}}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p style={{fontWeight:600,fontSize:12}}>Clear Offline Cache</p>
                    <p className="muted" style={{fontSize:11}}>
                      Removes all locally cached products, sales, and customers from this browser.
                      Fresh data will be loaded from the server on next visit.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm('Clear all offline cache? This will reload fresh data from the server.')) return
                      try {
                        const { clearProductsFromDB } = await import('@/lib/indexeddb')
                        await clearProductsFromDB()
                        // Clear all IndexedDB
                        const dbs = await indexedDB.databases?.() || []
                        for (const db of dbs) {
                          if (db.name) indexedDB.deleteDatabase(db.name)
                        }
                        alert('Cache cleared. Page will reload.')
                        window.location.reload()
                      } catch {
                        alert('Cache cleared. Page will reload.')
                        window.location.reload()
                      }
                    }}
                    className="btn" style={{background:"var(--orange)",color:"#fff",borderColor:"var(--orange)"}}
                  >
                    Clear Cache
                  </button>
                </div>
              </div>

              <div className="card" style={{padding:16,marginBottom:12,borderColor:"var(--red)"}}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-red-700 text-sm">Force Sync from Server</p>
                    <p className="muted" style={{fontSize:11}}>
                      Clears local cache and reloads all products fresh from Supabase.
                      Use this if products are not showing or showing deleted items.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm('This will clear local cache and reload all data from server. Continue?')) return
                      try {
                        const { clearProductsFromDB } = await import('@/lib/indexeddb')
                        await clearProductsFromDB()
                        alert('Local cache cleared. Go to Inventory to reload products.')
                      } catch (e) {
                        alert('Done. Go to Inventory to reload.')
                      }
                    }}
                    className="btn btn-red"
                  >
                    Force Sync
                  </button>
                </div>
              </div>

              <div style={{background:"var(--surface-2)",padding:12,border:"1px solid var(--border)"}}>
                <p className="form-label">TIPS</p>
                <ul style={{paddingLeft:14,fontSize:11,color:"var(--txt-3)"}}>
                  <li>Products deleted on one device may still show on others until cache is cleared</li>
                  <li>If a barcode says "already exists" for a deleted product, click Force Sync</li>
                  <li>Cache is per-browser — clear on each device separately</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div className="flex items-center justify-between">
                <h2 style={{fontSize:13,fontWeight:700,color:"var(--txt-1)",marginBottom:12}}>Staff Management</h2>
                <button onClick={() => setShowStaffModal(true)}
                  className="btn btn-primary">
                  <Plus className="w-4 h-4" /> Add Staff
                </button>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {staffList.map(u => (
                  <div key={u.id} className="card" style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:12}}>
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 text-sm font-bold">{u.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{fontWeight:600,fontSize:12}}>{u.name}</p>
                      <p className="muted" style={{fontSize:11}}>{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                      {(u as any).branches?.name ? (
                        <span className="badge badge-gray">
                          {(u as any).branches.name}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">All Branches</span>
                      )}
                      <button onClick={() => handleDeleteStaff(u.id, u.name)}
                        className="btn btn-ghost btn-icon" style={{color:"var(--red)"}}>
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
                {staffList.length === 0 && (
                  <p className="empty-state">No staff yet. Add your first staff member.</p>
                )}
              </div>
            </div>
          )}

          {activeTab !== 'staff' && (
            <div style={{ paddingTop:16, borderTop:'1px solid var(--border)', marginTop:16 }}>
              <button onClick={saveSettings} disabled={saving} className="btn btn-primary">
                <Save size={13} />
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          )}
        </div>

      {showStaffModal && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:400}}>
            <div className="modal-header">
              <span className="modal-title">Add Staff Member</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowStaffModal(false)}><X size={13} /></button>
            </div>
            <form onSubmit={handleAddStaff}>
              <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="form-label">Full Name *</label>
                <input required type="text" value={staffForm.name} onChange={e => setStaffForm(p => ({ ...p, name: e.target.value }))}
                  className="input" style={{width:"100%"}}
                  placeholder="e.g. Jane Doe" />
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input required type="email" value={staffForm.email} onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))}
                  className="input" style={{width:"100%"}}
                  placeholder="jane@shop.com" />
              </div>
              <div>
                <label className="form-label">Password *</label>
                <div className="relative">
                  <input required type={showPassword ? 'text' : 'password'} value={staffForm.password}
                    onChange={e => setStaffForm(p => ({ ...p, password: e.target.value }))}
                    className="input" style={{width:"100%",paddingRight:36}}
                    placeholder="Min 8 characters" minLength={8} />
                  <button type="button" onClick={() => setShowPassword(o => !o)}
                    style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--txt-3)"}}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label className="form-label">Role *</label>
                  <select value={staffForm.role} onChange={e => setStaffForm(p => ({ ...p, role: e.target.value }))}
                    className="input" style={{width:"100%"}}>
                    <option value="cashier">Cashier</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Branch</label>
                  <select value={staffForm.branch_id} onChange={e => setStaffForm(p => ({ ...p, branch_id: e.target.value }))}
                    className="input" style={{width:"100%"}}>
                    <option value="">All Branches</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowStaffModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingStaff}>
                  {savingStaff ? 'Adding…' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Payment Method Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:400}}>
            <div className="modal-header">
              <span className="modal-title">{editingPayment ? 'Edit Payment Method' : 'Add Payment Method'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowPaymentModal(false)}><X size={13} /></button>
            </div>
            <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="form-label">Type *</label>
                <select value={paymentForm.type} onChange={e => setPaymentForm(p => ({ ...p, type: e.target.value }))}
                  className="input" style={{width:"100%"}}>
                  <option value="till">M-Pesa Till Number</option>
                  <option value="paybill">M-Pesa Paybill</option>
                  <option value="send_money">Send Money (Phone)</option>
                  <option value="bank">Bank Account</option>
                </select>
              </div>
              <div>
                <label className="form-label">Label *</label>
                <input type="text" value={paymentForm.label} onChange={e => setPaymentForm(p => ({ ...p, label: e.target.value }))}
                  className="input" style={{width:"100%"}}
                  placeholder="e.g. Main Till" />
              </div>
              <div>
                <label className="form-label">
                  {paymentForm.type === 'send_money' ? 'Phone Number *' : paymentForm.type === 'bank' ? 'Account Number *' : 'Number *'}
                </label>
                <input type="text" value={paymentForm.number} onChange={e => setPaymentForm(p => ({ ...p, number: e.target.value }))}
                  className="input" style={{width:"100%"}}
                  placeholder={paymentForm.type === 'send_money' ? 'e.g. 0712 345 678' : 'e.g. 123456'} />
              </div>
              {(paymentForm.type === 'paybill' || paymentForm.type === 'bank') && (
                <div>
                  <label className="form-label">
                    {paymentForm.type === 'paybill' ? 'Account Number' : 'Bank & Branch'}
                  </label>
                  <input type="text" value={paymentForm.account_name} onChange={e => setPaymentForm(p => ({ ...p, account_name: e.target.value }))}
                    className="input" style={{width:"100%"}}
                    placeholder={paymentForm.type === 'paybill' ? 'e.g. your phone number or shop code' : 'e.g. Equity Bank, Kisumu'} />
                </div>
              )}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="payment-active"
                  checked={paymentForm.active}
                  onChange={(e) => setPaymentForm(p => ({ ...p, active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="payment-active" style={{fontSize:12,color:"var(--txt-1)"}}>
                  Show on printed receipts
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSavePayment} disabled={savingPayment || !paymentForm.label.trim() || !paymentForm.number.trim()}>
                  {savingPayment ? 'Saving…' : editingPayment ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
