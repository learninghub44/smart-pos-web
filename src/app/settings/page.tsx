'use client'

import { useState, useEffect } from 'react'
import { Save, Building2, Receipt, DollarSign, Users, Plus, X, Eye, EyeOff } from 'lucide-react'
import { getCurrentAuthUser, isOwner, register } from '@/lib/auth'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'business' | 'receipt' | 'tax' | 'staff'>('business')
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
    if (!confirm(\`Remove \${name} from the system?\`)) return
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
    } catch (error) {
      console.log('Error loading settings')
    }
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
  const tabs = [
    { id: 'business' as const, label: 'Business', icon: Building2 },
    { id: 'receipt' as const, label: 'Receipt', icon: Receipt },
    { id: 'tax' as const, label: 'Tax', icon: DollarSign },
    ...(owner ? [{ id: 'staff' as const, label: 'Staff', icon: Users }] : [])
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your POS system settings</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'business' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Business Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessSettings.name}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={businessSettings.currency}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={businessSettings.address}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Street address, City, Country"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={businessSettings.phone}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+254 700 000 000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={businessSettings.email}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Footer Text
                  </label>
                  <textarea
                    value={receiptSettings.footer}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, footer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Thank you for your purchase!"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Served By (appears on receipt)
                  </label>
                  <input
                    type="text"
                    value={receiptSettings.served_by}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, served_by: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Jane Doe, Front Desk, Cashier 1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank to use the logged-in user's name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paper Size
                  </label>
                  <select
                    value={receiptSettings.paper_size}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, paper_size: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VAT Rate (%)
                  </label>
                  <input
                    type="number"
                    value={taxSettings.vat_rate}
                    onChange={(e) => setTaxSettings({ ...taxSettings, vat_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

          {/* Staff Tab */}
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
            <div className="pt-6 border-t mt-6">
              <button onClick={saveSettings} disabled={saving}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-bold text-gray-900">Add Staff Member</h2>
              <button onClick={() => setShowStaffModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Full Name *</label>
                <input required type="text" value={staffForm.name} onChange={e => setStaffForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Jane Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email *</label>
                <input required type="email" value={staffForm.email} onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jane@shop.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Password *</label>
                <div className="relative">
                  <input required type={showPassword ? 'text' : 'password'} value={staffForm.password}
                    onChange={e => setStaffForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    placeholder="Min 8 characters" minLength={8} />
                  <button type="button" onClick={() => setShowPassword(o => !o)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Role *</label>
                  <select value={staffForm.role} onChange={e => setStaffForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="cashier">Cashier</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Branch</label>
                  <select value={staffForm.branch_id} onChange={e => setStaffForm(p => ({ ...p, branch_id: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Branches</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowStaffModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={savingStaff}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {savingStaff ? 'Adding...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
