'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Post {
  id: string
  title: string
  slug: string
  featuredImage: string | null
  publishedAt: Date | null
  pinnedOrder: number
  author: { name: string }
  categories: Array<{ name: string; slug: string }>
}

interface FeaturedPostsManagerProps {
  initialFeatured: Post[]
  initialAvailable: Post[]
}

export default function FeaturedPostsManager({
  initialFeatured,
  initialAvailable,
}: FeaturedPostsManagerProps) {
  const router = useRouter()
  const [featured, setFeatured] = useState(initialFeatured)
  const [available, setAvailable] = useState(initialAvailable)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filteredAvailable = available.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase())
  )

  async function addToFeatured(post: Post) {
    if (featured.length >= 5) {
      alert('Maksimal 5 artikel berita utama')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/posts/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          action: 'add',
          order: featured.length,
        }),
      })

      if (res.ok) {
        setFeatured([...featured, { ...post, pinnedOrder: featured.length }])
        setAvailable(available.filter(p => p.id !== post.id))
        router.refresh()
      } else {
        alert('Gagal menambahkan artikel')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Gagal menambahkan artikel')
    } finally {
      setSaving(false)
    }
  }

  async function removeFromFeatured(post: Post) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/posts/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          action: 'remove',
        }),
      })

      if (res.ok) {
        setFeatured(featured.filter(p => p.id !== post.id))
        setAvailable([post, ...available])
        router.refresh()
      } else {
        alert('Gagal menghapus artikel')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Gagal menghapus artikel')
    } finally {
      setSaving(false)
    }
  }

  async function moveUp(index: number) {
    if (index === 0) return

    const newFeatured = [...featured]
    const temp = newFeatured[index]
    newFeatured[index] = newFeatured[index - 1]
    newFeatured[index - 1] = temp

    setFeatured(newFeatured)
    await updateOrder(newFeatured)
  }

  async function moveDown(index: number) {
    if (index === featured.length - 1) return

    const newFeatured = [...featured]
    const temp = newFeatured[index]
    newFeatured[index] = newFeatured[index + 1]
    newFeatured[index + 1] = temp

    setFeatured(newFeatured)
    await updateOrder(newFeatured)
  }

  async function updateOrder(posts: Post[]) {
    setSaving(true)
    try {
      await fetch('/api/admin/posts/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          posts: posts.map((p, i) => ({ id: p.id, order: i })),
        }),
      })
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  function formatDate(date: Date | null): string {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Featured Posts */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200">
        <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Berita Utama ({featured.length}/5)
          </h2>
          {saving && (
            <span className="text-[10px] text-gray-500">Menyimpan...</span>
          )}
        </div>

        {featured.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500">
            <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Belum ada berita utama.<br />
            Pilih dari daftar artikel di sebelah kanan.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {featured.map((post, index) => (
              <div key={post.id} className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0 || saving}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === featured.length - 1 || saving}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {index + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-medium text-gray-900 truncate">
                    {post.title}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {post.categories[0]?.name || 'Tanpa Kategori'} • {formatDate(post.publishedAt)}
                  </p>
                </div>

                <button
                  onClick={() => removeFromFeatured(post)}
                  disabled={saving}
                  className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                  title="Hapus dari berita utama"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Posts */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200">
        <div className="px-3 py-2 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Artikel Tersedia
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari artikel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
            <svg
              className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
          {filteredAvailable.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">
              {search ? 'Tidak ada artikel ditemukan' : 'Semua artikel sudah dijadikan berita utama'}
            </div>
          ) : (
            filteredAvailable.map((post) => (
              <div key={post.id} className="px-3 py-2 hover:bg-gray-50 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-medium text-gray-900 truncate">
                    {post.title}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {post.categories[0]?.name || 'Tanpa Kategori'} • {formatDate(post.publishedAt)}
                  </p>
                </div>

                <button
                  onClick={() => addToFeatured(post)}
                  disabled={saving || featured.length >= 5}
                  className="px-2 py-1 text-[10px] text-white bg-orange-500 hover:bg-orange-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Tambah
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
