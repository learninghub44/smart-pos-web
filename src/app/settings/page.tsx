'use client'

import { useState, useEffect } from 'react'
import { Save, Building2, Receipt, DollarSign } from 'lucide-react'
import { getCurrentAuthUser } from '@/lib/auth'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'business' | 'receipt' | 'tax'>('business')
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
    paper_size: '80mm',
    auto_print: false
  })
  
  const [taxSettings, setTaxSettings] = useState({
    vat_rate: 16,
    enabled: false
  })

  useEffect(() => {
    loadUser()
    loadSettings()
  }, [])

  const loadUser = async () => {
    const currentUser = await getCurrentAuthUser()
    setUser(currentUser)
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

  const tabs = [
    { id: 'business' as const, label: 'Business', icon: Building2 },
    { id: 'receipt' as const, label: 'Receipt', icon: Receipt },
    { id: 'tax' as const, label: 'Tax', icon: DollarSign }
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

          <div className="pt-6 border-t mt-6">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
