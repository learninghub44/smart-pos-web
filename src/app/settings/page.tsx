'use client'

import { useState, useEffect } from 'react'
import { Save, Building2, Receipt, DollarSign, Users, Plus, X, Eye, EyeOff, Settings, CreditCard, Pencil, Trash2 } from 'lucide-react'
import { getCurrentAuthUser, isOwner, isAdmin, register } from '@/lib/auth'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'business' | 'receipt' | 'tax' | 'payment' | 'staff' | 'system'>('business')
  const [saving, setSaving] = useState(false)
  
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
  }, [])

  const loadUser = () => {
    const currentUser = getCurrentAuthUser()
    setUser(currentUser)
  }

  const loadStaff = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const [{ data: users }, { data: branchData }] = await Promise.all([
        supabase.from('users').select('id,name,email,role,branch_id,created_at,branches(name)').order('created_at'),
        supabase.from('branches').select('id,name').eq('is_active', true).order('name')
      ])
      if (users) setStaffList(users)
      if (branchData) setBranches(branchData)
    } catch (_) {}
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingStaff(true)
    const result = await register(
      staffForm.name, staffForm.email, staffForm.password,
      staffForm.role as 'admin' | 'cashier',
      staffForm.branch_id || null
    )
    if (result.success) {
      setShowStaffModal(false)
      setStaffForm({ name: '', email: '', password: '', role: 'cashier', branch_id: '' })
      loadStaff()
    } else {
      alert(result.error || 'Failed to add staff')
    }
    setSavingStaff(false)
  }

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the system?`)) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('users').delete().eq('id', id)
      loadStaff()
    } catch (_) {}
  }

  const loadSettings = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('settings').select('*')
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
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('settings').upsert({ key: 'payment_methods', value: methods, updated_at: now }, { onConflict: 'key' })
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
      const { supabase } = await import('@/lib/supabase')
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
      
      // Also save to Supabase
      try {
        const { error: businessError } = await supabase
          .from('settings')
          .upsert({
            key: 'business',
            value: businessSettings,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' })
        
        const { error: receiptError } = await supabase
          .from('settings')
          .upsert({
            key: 'receipt',
            value: receiptSettings,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' })
        
        const { error: taxError } = await supabase
          .from('settings')
          .upsert({
            key: 'tax',
            value: taxSettings,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' })
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
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Business Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Receipt Settings</h2>
              
              <div className="space-y-6">
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
                  <p className="text-xs text-gray-500 mt-1">Leave blank to use the logged-in user's name</p>
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
                  <label htmlFor="auto-print" className="text-sm font-medium text-gray-700">
                    Auto-print receipts after sale
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Tax Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="tax-enabled"
                    checked={taxSettings.enabled}
                    onChange={(e) => setTaxSettings({ ...taxSettings, enabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tax-enabled" className="text-sm font-medium text-gray-700">
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
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Note:</strong> When tax is enabled, it will be automatically calculated and added to product prices during checkout.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Payment Methods</h2>
                  <p className="text-sm text-gray-500 mt-1">Till, Paybill, and Send Money numbers shown on every printed receipt</p>
                </div>
                <button
                  onClick={openAddPayment}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-semibold text-sm flex-shrink-0"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <CreditCard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No payment methods yet. Add a Till, Paybill, or Send Money number.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((m) => {
                    const typeLabel = m.type === 'till' ? 'Till Number' : m.type === 'paybill' ? 'Paybill' : m.type === 'send_money' ? 'Send Money' : 'Bank Account'
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${m.active ? 'bg-green-50' : 'bg-gray-100'}`}>
                            <CreditCard className={`h-4 w-4 ${m.active ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{m.label} <span className="text-gray-400 font-normal">· {typeLabel}</span></p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {m.number}{m.account_name ? ` · Acc: ${m.account_name}` : ''}
                              {!m.active && <span className="text-amber-600 ml-2">Hidden from receipts</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => openEditPayment(m)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeletePayment(m.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">System & Cache</h3>
                <p className="text-sm text-gray-500">Manage offline cache and local data</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Clear Offline Cache</p>
                    <p className="text-xs text-gray-500 mt-0.5">
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
                    className="flex-shrink-0 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>

              <div className="bg-white border border-red-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-red-700 text-sm">Force Sync from Server</p>
                    <p className="text-xs text-gray-500 mt-0.5">
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
                    className="flex-shrink-0 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    Force Sync
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium mb-2">TIPS</p>
                <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                  <li>Products deleted on one device may still show on others until cache is cleared</li>
                  <li>If a barcode says "already exists" for a deleted product, click Force Sync</li>
                  <li>Cache is per-browser — clear on each device separately</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Staff Management</h2>
                <button onClick={() => setShowStaffModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                  <Plus className="w-4 h-4" /> Add Staff
                </button>
              </div>

              <div className="space-y-2">
                {staffList.map(u => (
                  <div key={u.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 text-sm font-bold">{u.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                      {(u as any).branches?.name ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">
                          {(u as any).branches.name}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">All Branches</span>
                      )}
                      <button onClick={() => handleDeleteStaff(u.id, u.name)}
                        className="p-1.5 hover:bg-red-50 rounded-lg ml-1">
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
                {staffList.length === 0 && (
                  <p className="text-center text-gray-400 py-8 text-sm">No staff yet. Add your first staff member.</p>
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
      </div>

      {/* Add Staff Modal */}
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                <label htmlFor="payment-active" className="text-sm font-medium text-gray-700">
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
