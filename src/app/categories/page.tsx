'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    parent_id: ''
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (data && !error) {
        setCategories(data)
        const { addCategoryToDB } = await import('@/lib/indexeddb')
        for (const category of data) {
          await addCategoryToDB(category)
        }
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { getAllCategories } = await import('@/lib/indexeddb')
    const allCategories = await getAllCategories()
    setCategories(allCategories)
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = () => {
    setEditingCategory(null)
    setFormData({ name: '', parent_id: '' })
    setShowModal(true)
  }

  const handleEdit = (category: any) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      parent_id: category.parent_id || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      
      if (!error) {
        const { deleteCategoryFromDB } = await import('@/lib/indexeddb')
        await deleteCategoryFromDB(id)
        loadCategories()
        return
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { deleteCategoryFromDB } = await import('@/lib/indexeddb')
    await deleteCategoryFromDB(id)
    loadCategories()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            parent_id: formData.parent_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id)
        
        if (!error) {
          const { updateCategoryInDB } = await import('@/lib/indexeddb')
          await updateCategoryInDB({
            ...editingCategory,
            name: formData.name,
            parent_id: formData.parent_id || null,
            updated_at: new Date().toISOString()
          })
          loadCategories()
          setShowModal(false)
          return
        }
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            name: formData.name,
            parent_id: formData.parent_id || null
          })
          .select()
          .single()
        
        if (data && !error) {
          const { addCategoryToDB } = await import('@/lib/indexeddb')
          await addCategoryToDB(data)
          loadCategories()
          setShowModal(false)
          return
        }
      }
    } catch (error) {
      console.log('Supabase not available, using IndexedDB')
    }
    
    const { addCategoryToDB, updateCategoryInDB } = await import('@/lib/indexeddb')
    
    if (editingCategory) {
      await updateCategoryInDB({
        ...editingCategory,
        name: formData.name,
        parent_id: formData.parent_id || null,
        updated_at: new Date().toISOString()
      })
    } else {
      await addCategoryToDB({
        id: crypto.randomUUID(),
        name: formData.name,
        parent_id: formData.parent_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    loadCategories()
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage product categories</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {category.parent_id && (
                <p className="text-sm text-gray-600">Parent: {category.parent_id}</p>
              )}
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No categories found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
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
                  Parent Category (Optional)
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {categories
                    .filter(c => c.id !== editingCategory?.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
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
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
