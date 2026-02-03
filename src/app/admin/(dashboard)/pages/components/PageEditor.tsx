'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(
  () => import('@/components/admin/RichTextEditor'),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg" /> }
)

interface PageData {
  id?: string
  title: string
  slug: string
  content: string
  excerpt: string
  featuredImage: string
  status: 'DRAFT' | 'PUBLISHED'
  metaTitle: string
  metaDescription: string
  sortOrder: number
}

interface PageEditorProps {
  page?: PageData
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

function extractFirstSentence(html: string): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const match = text.match(/^[^.!?]*[.!?]/)
  return match ? match[0].trim() : text.slice(0, 160)
}

export default function PageEditor({
  page,
  isEdit = false,
}: PageEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<PageData>({
    title: page?.title || '',
    slug: page?.slug || '',
    content: page?.content || '',
    excerpt: page?.excerpt || '',
    featuredImage: page?.featuredImage || '',
    status: page?.status || 'DRAFT',
    metaTitle: page?.metaTitle || '',
    metaDescription: page?.metaDescription || '',
    sortOrder: page?.sortOrder ?? 0,
  })

  const [autoSlug, setAutoSlug] = useState(!isEdit)
  const [autoMetaTitle, setAutoMetaTitle] = useState(!isEdit)
  const [autoMetaDesc, setAutoMetaDesc] = useState(!isEdit)

  // Featured image upload state
  const featuredImageInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false)

  function handleTitleChange(title: string) {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: autoSlug ? slugify(title) : prev.slug,
      metaTitle: autoMetaTitle ? title : prev.metaTitle,
    }))
  }

  function handleSlugChange(slug: string) {
    setAutoSlug(false)
    setFormData((prev) => ({ ...prev, slug: slugify(slug) }))
  }

  function handleContentChange(content: string) {
    setFormData((prev) => ({
      ...prev,
      content,
      metaDescription: autoMetaDesc ? extractFirstSentence(content) : prev.metaDescription,
    }))
  }

  function handleMetaTitleChange(metaTitle: string) {
    setAutoMetaTitle(false)
    setFormData((prev) => ({ ...prev, metaTitle }))
  }

  function handleMetaDescriptionChange(metaDescription: string) {
    setAutoMetaDesc(false)
    setFormData((prev) => ({ ...prev, metaDescription }))
  }

  async function handleFeaturedImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB')
      return
    }

    setUploadingFeaturedImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal upload gambar')
      }

      setFormData((prev) => ({ ...prev, featuredImage: data.url }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal upload gambar')
    } finally {
      setUploadingFeaturedImage(false)
      if (e.target) e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = isEdit ? `/api/admin/pages/${page?.id}` : '/api/admin/pages'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan halaman')
      }

      router.push('/admin/pages')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan halaman')
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
                  Judul Halaman
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Masukkan judul halaman"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-xs font-medium text-gray-700 mb-1">
                  Slug (URL)
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 text-xs mr-2">inidepok.com/</span>
                  <input
                    type="text"
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    required
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content - Rich Text Editor */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Konten Halaman
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={handleContentChange}
              placeholder="Tulis konten halaman..."
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="Ringkasan singkat halaman (opsional)"
            />
          </div>

          {/* SEO */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 text-sm mb-3">SEO Settings</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="metaTitle" className="block text-xs font-medium text-gray-700 mb-1">
                  Meta Title
                  {autoMetaTitle && <span className="text-gray-400 ml-1">(auto)</span>}
                </label>
                <input
                  type="text"
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => handleMetaTitleChange(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Judul untuk mesin pencari (opsional)"
                />
              </div>
              <div>
                <label htmlFor="metaDescription" className="block text-xs font-medium text-gray-700 mb-1">
                  Meta Description
                  {autoMetaDesc && <span className="text-gray-400 ml-1">(auto)</span>}
                </label>
                <textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => handleMetaDescriptionChange(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as PageData['status'] }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Dipublikasi</option>
                </select>
              </div>

              <div>
                <label htmlFor="sortOrder" className="block text-xs font-medium text-gray-700 mb-1">
                  Urutan
                </label>
                <input
                  type="number"
                  id="sortOrder"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="0"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Angka kecil ditampilkan lebih dulu</p>
              </div>

              <div className="pt-3 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:bg-primary-400"
                >
                  {loading ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
                </button>
                <Link
                  href="/admin/pages"
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
            <div className="space-y-2">
              {/* Upload button */}
              <div>
                <input
                  ref={featuredImageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFeaturedImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => featuredImageInputRef.current?.click()}
                  disabled={uploadingFeaturedImage}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingFeaturedImage ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upload Gambar
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-400 mt-1 text-center">JPG, PNG, WebP. Maks 5MB</p>
              </div>

              {/* URL input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-[10px]">URL:</span>
                </div>
                <input
                  type="text"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                  className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
                  placeholder="atau masukkan URL gambar"
                />
              </div>

              {/* Preview */}
              {formData.featuredImage && (
                <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={formData.featuredImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, featuredImage: '' }))}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Hapus gambar"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
