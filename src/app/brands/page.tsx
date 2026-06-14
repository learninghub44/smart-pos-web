'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: ''
  })

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name')
      
      if (data && !error) {
        setBrands(data)
        const { addBrandToDB } = await import('@/lib/indexeddb')
        for (const brand of data) {
          await addBrandToDB(brand)
        }
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { getAllBrands } = await import('@/lib/indexeddb')
    const allBrands = await getAllBrands()
    setBrands(allBrands)
  }

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = () => {
    setEditingBrand(null)
    setFormData({ name: '' })
    setShowModal(true)
  }

  const handleEdit = (brand: any) => {
    setEditingBrand(brand)
    setFormData({ name: brand.name })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return
    
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id)
      
      if (!error) {
        const { deleteBrandFromDB } = await import('@/lib/indexeddb')
        await deleteBrandFromDB(id)
        loadBrands()
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { deleteBrandFromDB } = await import('@/lib/indexeddb')
    await deleteBrandFromDB(id)
    loadBrands()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (editingBrand) {
        const { error } = await supabase
          .from('brands')
          .update({
            name: formData.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBrand.id)
        
        if (!error) {
          const { updateBrandInDB } = await import('@/lib/indexeddb')
          await updateBrandInDB({
            ...editingBrand,
            name: formData.name,
            updated_at: new Date().toISOString()
          })
          loadBrands()
          setShowModal(false)
          return
        }
      } else {
        const { data, error } = await supabase
          .from('brands')
          .insert({
            name: formData.name
          })
          .select()
          .single()
        
        if (data && !error) {
          const { addBrandToDB } = await import('@/lib/indexeddb')
          await addBrandToDB(data)
          loadBrands()
          setShowModal(false)
          return
        }
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { addBrandToDB, updateBrandInDB } = await import('@/lib/indexeddb')
    
    if (editingBrand) {
      await updateBrandInDB({
        ...editingBrand,
        name: formData.name,
        updated_at: new Date().toISOString()
      })
    } else {
      await addBrandToDB({
        id: crypto.randomUUID(),
        name: formData.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    loadBrands()
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-600 mt-1">Manage product brands</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add Brand</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(brand)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBrands.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No brands found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingBrand ? 'Edit Brand' : 'Add Brand'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
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
                  {editingBrand ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
