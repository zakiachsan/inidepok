'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Post {
  id: string
  title: string
  slug: string
  featuredImage: string | null
  publishedAt: Date | null
  pinnedOrder: number
  viewCount?: number
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
  const [available] = useState(initialAvailable)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get filtered articles based on search
  const getFilteredArticles = () => {
    if (search.trim()) {
      return available.filter(post =>
        post.title.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 20)
    }
    // Show recent 10 when no search
    return available.slice(0, 10)
  }

  const filteredAvailable = getFilteredArticles()
  const isAlreadyFeatured = (postId: string) => featured.some(f => f.id === postId)

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

      const data = await res.json()
      
      if (res.ok && data.success) {
        setFeatured([...featured, { ...post, pinnedOrder: featured.length }])
        router.refresh()
      } else {
        alert('Gagal menambahkan artikel: ' + (data.error || 'Unknown error'))
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

      const data = await res.json()

      if (res.ok && data.success) {
        setFeatured(featured.filter(p => p.id !== post.id))
        router.refresh()
      } else {
        alert('Gagal menghapus artikel: ' + (data.error || 'Unknown error'))
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
    })
  }

  return (
    <div className="space-y-4">
      {/* Featured Posts Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">
            Berita Utama Terpilih
          </h2>
          <span className={`text-xs px-2 py-1 rounded-full ${featured.length >= 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
            {featured.length}/5
          </span>
        </div>

        {featured.length === 0 ? (
          <div className="py-6 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">Belum ada artikel terpilih</p>
            <p className="text-xs text-gray-400 mt-1">Pilih dari daftar di bawah</p>
          </div>
        ) : (
          <div className="space-y-2">
            {featured.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center gap-3 p-2 bg-orange-50 border border-orange-200 rounded-lg group"
              >
                <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </span>

                <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {post.featuredImage ? (
                    <Image src={post.featuredImage} alt="" width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{post.title}</h3>
                  <p className="text-xs text-gray-500">{formatDate(post.publishedAt)}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0 || saving}
                    className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded disabled:opacity-30"
                    title="Pindah ke atas"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === featured.length - 1 || saving}
                    className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded disabled:opacity-30"
                    title="Pindah ke bawah"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeFromFeatured(post)}
                    disabled={saving}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {saving && <p className="text-xs text-center text-orange-500 mt-2">Menyimpan...</p>}
      </div>

      {/* Add Article Section */}
      {featured.length < 5 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Tambah Artikel</h2>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari judul artikel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {filteredAvailable.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                {search ? 'Tidak ada artikel ditemukan' : 'Tidak ada artikel tersedia'}
              </div>
            ) : (
              filteredAvailable.map((post) => {
                const alreadyAdded = isAlreadyFeatured(post.id)
                return (
                  <div
                    key={post.id}
                    className={`flex items-center gap-3 p-3 hover:bg-gray-50 ${alreadyAdded ? 'bg-green-50' : ''}`}
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {post.featuredImage ? (
                        <Image src={post.featuredImage} alt="" width={48} height={48} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{post.title}</h3>
                      <p className="text-xs text-gray-500">
                        {post.categories[0]?.name || 'Tanpa Kategori'} • {formatDate(post.publishedAt)}
                      </p>
                    </div>

                    {alreadyAdded ? (
                      <span className="px-3 py-1.5 text-xs text-green-600 bg-green-100 rounded-lg flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Terpilih
                      </span>
                    ) : (
                      <button
                        onClick={() => addToFeatured(post)}
                        disabled={saving}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        + Pilih
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              {search ? `Hasil pencarian "${search}"` : `Menampilkan 10 artikel terbaru dari ${available.length} total`}
            </p>
          </div>
        </div>
      )}

      {featured.length >= 5 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <p className="text-sm text-orange-700">
            Maksimal 5 artikel berita utama tercapai. Hapus salah satu untuk menambah yang baru.
          </p>
        </div>
      )}
    </div>
  )
}
