'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface PostData {
  id?: string
  title: string
  slug: string
  content: string
  excerpt: string
  featuredImage: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  categoryIds: string[]
  tagIds: string[]
  metaTitle: string
  metaDescription: string
}

interface PostEditorProps {
  post?: PostData
  categories: Category[]
  tags: Tag[]
  isEdit?: boolean
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function PostEditor({
  post,
  categories,
  tags,
  isEdit = false,
}: PostEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<PostData>({
    title: post?.title || '',
    slug: post?.slug || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    featuredImage: post?.featuredImage || '',
    status: post?.status || 'DRAFT',
    categoryIds: post?.categoryIds || [],
    tagIds: post?.tagIds || [],
    metaTitle: post?.metaTitle || '',
    metaDescription: post?.metaDescription || '',
  })

  const [autoSlug, setAutoSlug] = useState(!isEdit)

  function handleTitleChange(title: string) {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: autoSlug ? slugify(title) : prev.slug,
    }))
  }

  function handleSlugChange(slug: string) {
    setAutoSlug(false)
    setFormData((prev) => ({ ...prev, slug: slugify(slug) }))
  }

  function handleCategoryToggle(categoryId: string) {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }))
  }

  function handleTagToggle(tagId: string) {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = isEdit ? `/api/admin/posts/${post?.id}` : '/api/admin/posts'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan artikel')
      }

      router.push('/admin/posts')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan artikel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Title */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <div className="space-y-3">
              <div>
                <label htmlFor="title" className="block text-xs font-medium text-gray-700 mb-1">
                  Judul Artikel
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Masukkan judul artikel"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-xs font-medium text-gray-700 mb-1">
                  Slug (URL)
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 text-xs mr-2">kilasindonesia.com/</span>
                  <input
                    type="text"
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    required
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <label htmlFor="content" className="block text-xs font-medium text-gray-700 mb-1.5">
              Konten Artikel
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              rows={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-xs"
              placeholder="Tulis konten artikel... (HTML didukung)"
            />
            <p className="text-[10px] text-gray-500 mt-1.5">
              Mendukung HTML. Gunakan tag seperti &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;blockquote&gt;, dll.
            </p>
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <label htmlFor="excerpt" className="block text-xs font-medium text-gray-700 mb-1.5">
              Ringkasan
            </label>
            <textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              placeholder="Ringkasan singkat artikel (opsional)"
            />
          </div>

          {/* SEO */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 text-sm mb-3">SEO Settings</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="metaTitle" className="block text-xs font-medium text-gray-700 mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Judul untuk mesin pencari (opsional)"
                />
              </div>
              <div>
                <label htmlFor="metaDescription" className="block text-xs font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Deskripsi untuk mesin pencari (opsional)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 space-y-4">
          {/* Publish Box */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 text-sm mb-3">Publikasi</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as PostData['status'] }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Dipublikasi</option>
                  <option value="ARCHIVED">Arsip</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
                >
                  {loading ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
                </button>
                <Link
                  href="/admin/posts"
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                >
                  Batal
                </Link>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 text-sm mb-3">Gambar Utama</h3>
            <div>
              <input
                type="text"
                value={formData.featuredImage}
                onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs"
                placeholder="URL gambar"
              />
              {formData.featuredImage && (
                <div className="mt-2 aspect-video bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={formData.featuredImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 text-sm mb-3">Kategori</h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.categoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-xs text-gray-700">{category.name}</span>
                </label>
              ))}
              {categories.length === 0 && (
                <p className="text-xs text-gray-500">Belum ada kategori</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 text-sm mb-3">Tag</h3>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                    formData.tagIds.includes(tag.id)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  #{tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-xs text-gray-500">Belum ada tag</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
