'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  postCount: number
}

interface CategoriesManagerProps {
  initialCategories: Category[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })

  function resetForm() {
    setFormData({ name: '', slug: '', description: '' })
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : slugify(name),
    }))
  }

  function handleEdit(category: Category) {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    })
    setEditingId(category.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : '/api/admin/categories'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan kategori')
      }

      router.refresh()
      resetForm()

      // Update local state
      if (editingId) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingId
              ? { ...cat, ...formData }
              : cat
          )
        )
      } else {
        setCategories((prev) => [...prev, { ...data.category, postCount: 0 }])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kategori')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Yakin ingin menghapus kategori "${name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setCategories((prev) => prev.filter((cat) => cat.id !== id))
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Gagal menghapus kategori')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Gagal menghapus kategori')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Form */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">
            {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
          </h2>

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1.5 rounded text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                Nama
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-xs font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                required
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
              >
                {loading ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Categories List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-md shadow-sm border border-gray-200">
          <div className="px-3 py-2.5 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 text-sm">Daftar Kategori</h2>
          </div>

          {categories.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              Belum ada kategori
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                    Nama
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                    Slug
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                    Artikel
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span className="font-medium text-gray-900 text-sm">{category.name}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {category.slug}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {category.postCount}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(category.id, category.name)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
