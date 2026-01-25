"use client"

import { useState } from "react"

// Mock data
const initialTags = [
  { id: 1, name: "Depok", slug: "depok", postCount: 120 },
  { id: 2, name: "Jawa Barat", slug: "jawa-barat", postCount: 85 },
  { id: 3, name: "Infrastruktur", slug: "infrastruktur", postCount: 45 },
  { id: 4, name: "Kesehatan", slug: "kesehatan", postCount: 38 },
  { id: 5, name: "Pendidikan", slug: "pendidikan", postCount: 32 },
  { id: 6, name: "Ekonomi", slug: "ekonomi", postCount: 28 },
  { id: 7, name: "Politik", slug: "politik", postCount: 25 },
  { id: 8, name: "Olahraga", slug: "olahraga", postCount: 22 },
]

export default function TagsPage() {
  const [tags, setTags] = useState(initialTags)
  const [newTag, setNewTag] = useState("")

  const handleAdd = () => {
    if (!newTag.trim()) return

    const slug = newTag.toLowerCase().replace(/\s+/g, "-")
    setTags([
      ...tags,
      { id: Date.now(), name: newTag, slug, postCount: 0 },
    ])
    setNewTag("")
  }

  const handleDelete = (id: number) => {
    setTags(tags.filter((tag) => tag.id !== id))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
      </div>

      {/* Add Tag Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-medium text-gray-900 mb-4">Tambah Tag Baru</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            placeholder="Nama tag"
          />
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* Tags Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg group"
            >
              <span className="font-medium text-gray-700">{tag.name}</span>
              <span className="text-xs text-gray-500">({tag.postCount})</span>
              <button
                onClick={() => handleDelete(tag.id)}
                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {tags.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            Belum ada tag. Tambahkan tag pertama di atas.
          </p>
        )}
      </div>

      {/* Tags Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posts
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tags.map((tag) => (
              <tr key={tag.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {tag.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {tag.slug}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {tag.postCount}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
