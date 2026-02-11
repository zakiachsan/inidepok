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
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get filtered articles - show search results or recent 5
  const getFilteredArticles = () => {
    if (search.trim()) {
      // Search mode - search ALL articles
      return available.filter(post =>
        post.title.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 15)
    }
    // Default - show 5 most recent
    return available.slice(0, 5)
  }

  const filteredAvailable = getFilteredArticles()

  const handleAddClick = () => {
    setShowSearch(true)
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

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
    })
  }

  const isAlreadyFeatured = (postId: string) => featured.some(f => f.id === postId)

  return (
    <div className="space-y-4">
      {/* Featured Posts - Horizontal Cards */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">
            Berita Utama Terpilih
          </h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {featured.length}/5
          </span>
        </div>

        {featured.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-sm text-gray-500">Pilih artikel dari daftar di bawah</p>
          </div>
        ) : (
          <div className="space-y-2">
            {featured.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center gap-3 p-2 bg-orange-50 border border-orange-200 rounded-lg group"
              >
                {/* Order Number */}
                <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </span>

                {/* Thumbnail */}
                <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {post.featuredImage ? (
                    <Image
                      src={post.featuredImage}
                      alt=""
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{post.title}</h3>
                  <p className="text-xs text-gray-500">{formatDate(post.publishedAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0 || saving}
                    className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-100 rounded disabled:opacity-30"
                    title="Pindah ke atas"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === featured.length - 1 || saving}
                    className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-100 rounded disabled:opacity-30"
                    title="Pindah ke bawah"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeFromFeatured(post)}
                    disabled={saving}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {saving && (
          <p className="text-xs text-center text-gray-500 mt-2">Menyimpan...</p>
        )}
      </div>

      {/* Add Article Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header with Add Button */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Tambah Artikel</h2>
            {!showSearch && featured.length < 5 && (
              <button
                onClick={handleAddClick}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Cari & Tambah Artikel
              </button>
            )}
          </div>

          {/* Search Input */}
          {(showSearch || search) && (
            <div className="mt-3 relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ketik judul artikel yang ingin ditambahkan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  onClick={() => { setSearch(''); setShowSearch(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Article List */}
        {(showSearch || search || featured.length === 0) && (
          <div className="divide-y divide-gray-100">
            {!search && !showSearch && featured.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500 mb-3">Belum ada artikel terpilih</p>
                <button
                  onClick={handleAddClick}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                >
                  + Cari & Tambah Artikel
                </button>
              </div>
            )}

            {(search || showSearch) && filteredAvailable.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">
                {search ? 'Tidak ada artikel ditemukan' : 'Ketik untuk mencari artikel...'}
              </div>
            )}

            {(search || showSearch) && filteredAvailable.map((post) => {
              const alreadyAdded = isAlreadyFeatured(post.id)
              return (
                <div
                  key={post.id}
                  className={`flex items-center gap-3 p-3 hover:bg-gray-50 ${alreadyAdded ? 'opacity-50' : ''}`}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {post.featuredImage ? (
                      <Image
                        src={post.featuredImage}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{post.title}</h3>
                    <p className="text-xs text-gray-500">
                      {post.categories[0]?.name || 'Tanpa Kategori'} • {formatDate(post.publishedAt)}
                    </p>
                  </div>

                  {/* Add Button */}
                  {alreadyAdded ? (
                    <span className="px-3 py-1.5 text-xs text-green-600 bg-green-50 rounded-lg flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Terpilih
                    </span>
                  ) : (
                    <button
                      onClick={() => addToFeatured(post)}
                      disabled={saving || featured.length >= 5}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      + Pilih
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Quick suggestions when not searching */}
        {!search && showSearch && (
          <div className="p-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Ketik judul artikel untuk mencari dari semua {available.length} artikel
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
