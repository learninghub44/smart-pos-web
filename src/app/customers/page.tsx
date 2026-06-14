'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, Phone, Mail, MapPin, Camera, User, X } from 'lucide-react'
import BarcodeScanner from '@/components/BarcodeScanner'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { getCustomerByPhone } from '@/lib/indexeddb'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showCustomerProfile, setShowCustomerProfile] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    loyalty_card_number: '',
    loyalty_status: 'inactive' as 'active' | 'inactive'
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleLoyaltyScan = async (code: string) => {
    // Try to find customer by phone or loyalty card number
    let customer = await getCustomerByPhone(code)
    
    if (!customer) {
      // Try searching by loyalty card number
      const { getAllCustomers } = await import('@/lib/indexeddb')
      const allCustomers = await getAllCustomers()
      customer = allCustomers.find(c => c.loyalty_card_number === code)
    }
    
    if (customer) {
      setSelectedCustomer(customer)
      setShowCustomerProfile(true)
      setShowCameraScanner(false)
    } else {
      alert(`Customer not found with code: ${code}`)
    }
  }

  // USB barcode scanner integration
  useBarcodeScanner({
    onScan: handleLoyaltyScan,
    enabled: !showModal && !showCameraScanner
  })

  const loadCustomers = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')
      
      if (data && !error) {
        setCustomers(data)
        const { addCustomerToDB } = await import('@/lib/indexeddb')
        for (const customer of data) {
          await addCustomerToDB(customer)
        }
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { getAllCustomers } = await import('@/lib/indexeddb')
    const allCustomers = await getAllCustomers()
    setCustomers(allCustomers)
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = () => {
    setEditingCustomer(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      loyalty_card_number: '',
      loyalty_status: 'inactive'
    })
    setShowModal(true)
  }

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      loyalty_card_number: customer.loyalty_card_number || '',
      loyalty_status: customer.loyalty_status || 'inactive'
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
      
      if (!error) {
        const { deleteCustomerFromDB } = await import('@/lib/indexeddb')
        await deleteCustomerFromDB(id)
        loadCustomers()
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { deleteCustomerFromDB } = await import('@/lib/indexeddb')
    await deleteCustomerFromDB(id)
    loadCustomers()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            loyalty_card_number: formData.loyalty_card_number || null,
            loyalty_status: formData.loyalty_status,
            loyalty_enrollment_date: formData.loyalty_status === 'active' && !editingCustomer.loyalty_enrollment_date ? new Date().toISOString() : editingCustomer.loyalty_enrollment_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCustomer.id)
        
        if (!error) {
          const { updateCustomerInDB } = await import('@/lib/indexeddb')
          await updateCustomerInDB({
            ...editingCustomer,
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            loyalty_card_number: formData.loyalty_card_number || null,
            loyalty_status: formData.loyalty_status,
            loyalty_enrollment_date: formData.loyalty_status === 'active' && !editingCustomer.loyalty_enrollment_date ? new Date().toISOString() : editingCustomer.loyalty_enrollment_date,
            updated_at: new Date().toISOString()
          })
          loadCustomers()
          setShowModal(false)
          return
        }
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert({
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            loyalty_card_number: formData.loyalty_card_number || null,
            loyalty_status: formData.loyalty_status,
            loyalty_enrollment_date: formData.loyalty_status === 'active' ? new Date().toISOString() : null,
            loyalty_points: 0,
            total_spent: 0
          })
          .select()
          .single()
        
        if (data && !error) {
          const { addCustomerToDB } = await import('@/lib/indexeddb')
          await addCustomerToDB(data)
          loadCustomers()
          setShowModal(false)
          return
        }
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { addCustomerToDB, updateCustomerInDB } = await import('@/lib/indexeddb')
    
    if (editingCustomer) {
      await updateCustomerInDB({
        ...editingCustomer,
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        loyalty_card_number: formData.loyalty_card_number || null,
        loyalty_status: formData.loyalty_status,
        loyalty_enrollment_date: formData.loyalty_status === 'active' && !editingCustomer.loyalty_enrollment_date ? new Date().toISOString() : editingCustomer.loyalty_enrollment_date,
        updated_at: new Date().toISOString()
      })
    } else {
      await addCustomerToDB({
        id: crypto.randomUUID(),
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        loyalty_card_number: formData.loyalty_card_number || null,
        loyalty_status: formData.loyalty_status,
        loyalty_enrollment_date: formData.loyalty_status === 'active' ? new Date().toISOString() : null,
        loyalty_points: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    loadCustomers()
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage customer information</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCameraScanner(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <Camera className="h-5 w-5" />
            <span>Scan Loyalty</span>
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Phone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Address</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Loyalty Points</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Total Spent</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{customer.name}</td>
                  <td className="py-3 px-4 text-gray-600 flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone || '-'}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email || '-'}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{customer.address || '-'}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{customer.loyalty_points}</td>
                  <td className="py-3 px-4 text-gray-600">KES {customer.total_spent?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No customers found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Street address, City, Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loyalty Card Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.loyalty_card_number}
                  onChange={(e) => setFormData({ ...formData, loyalty_card_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="LOY-123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loyalty Status
                </label>
                <select
                  value={formData.loyalty_status}
                  onChange={(e) => setFormData({ ...formData, loyalty_status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="inactive">Inactive (Walk-in Customer)</option>
                  <option value="active">Active (Loyalty Member)</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCameraScanner && (
        <BarcodeScanner
          onScan={handleLoyaltyScan}
          onClose={() => setShowCameraScanner(false)}
          continuous={false}
          showFlashlight={true}
        />
      )}

      {showCustomerProfile && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold">Customer Profile</h3>
              </div>
              <button onClick={() => setShowCustomerProfile(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 mb-1">Name</div>
                <div className="font-semibold text-gray-900">{selectedCustomer.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">Phone</div>
                  <div className="font-semibold text-gray-900">{selectedCustomer.phone || 'N/A'}</div>
                </div>
                <div className={`rounded-lg p-4 ${selectedCustomer.loyalty_status === 'active' ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`text-sm mb-1 ${selectedCustomer.loyalty_status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>Loyalty Status</div>
                  <div className="font-semibold text-gray-900 capitalize">{selectedCustomer.loyalty_status || 'Inactive'}</div>
                </div>
              </div>

              {selectedCustomer.loyalty_card_number && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-sm text-indigo-600 mb-1">Loyalty Card</div>
                  <div className="font-semibold text-gray-900">{selectedCustomer.loyalty_card_number}</div>
                </div>
              )}

              {selectedCustomer.loyalty_enrollment_date && (
                <div className="bg-teal-50 rounded-lg p-4">
                  <div className="text-sm text-teal-600 mb-1">Enrollment Date</div>
                  <div className="font-semibold text-gray-900">{new Date(selectedCustomer.loyalty_enrollment_date).toLocaleDateString()}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-1">Points</div>
                  <div className="font-semibold text-gray-900">{selectedCustomer.loyalty_points || 0}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 mb-1">Total Spent</div>
                  <div className="font-semibold text-gray-900">KES {(selectedCustomer.total_spent || 0).toLocaleString()}</div>
                </div>
              </div>

              {selectedCustomer.email && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Email</div>
                  <div className="font-semibold text-gray-900">{selectedCustomer.email}</div>
                </div>
              )}

              {selectedCustomer.address && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Address</div>
                  <div className="font-semibold text-gray-900">{selectedCustomer.address}</div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCustomerProfile(false)}
              className="w-full mt-6 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
