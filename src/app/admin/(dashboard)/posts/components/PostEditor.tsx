'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ImageCropper from '@/components/admin/ImageCropper'

const RichTextEditor = dynamic(
  () => import('@/components/admin/RichTextEditor'),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg" /> }
)

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
  featuredImageCaption: string
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED'
  scheduledAt: string
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
  defaultStatus?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED'
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

export default function PostEditor({
  post,
  categories,
  tags: initialTags,
  isEdit = false,
  defaultStatus = 'DRAFT',
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
    featuredImageCaption: post?.featuredImageCaption || '',
    status: post?.status || defaultStatus,
    scheduledAt: post?.scheduledAt || '',
    categoryIds: post?.categoryIds || [],
    tagIds: post?.tagIds || [],
    metaTitle: post?.metaTitle || '',
    metaDescription: post?.metaDescription || '',
  })

  const [autoSlug, setAutoSlug] = useState(!isEdit)
  const [autoMetaTitle, setAutoMetaTitle] = useState(!isEdit)
  const [autoMetaDesc, setAutoMetaDesc] = useState(!isEdit)

  // Tags state
  const [availableTags, setAvailableTags] = useState<Tag[]>(initialTags)
  const [newTagName, setNewTagName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)

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

  async function handleCreateTag() {
    if (!newTagName.trim() || creatingTag) return

    setCreatingTag(true)
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat tag')
      }

      // Add new tag to available tags and select it
      setAvailableTags((prev) => [...prev, data.tag])
      setFormData((prev) => ({
        ...prev,
        tagIds: [...prev.tagIds, data.tag.id],
      }))
      setNewTagName('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal membuat tag')
    } finally {
      setCreatingTag(false)
    }
  }

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

  function handleFeaturedImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setCropImageSrc(objectUrl)
    if (e.target) e.target.value = ''
  }

  async function handleCroppedUpload(blob: Blob) {
    setCropImageSrc(null)
    setUploadingFeaturedImage(true)
    try {
      const formData = new FormData()
      formData.append('file', new File([blob], 'cropped.jpg', { type: 'image/jpeg' }))

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
    }
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

      const redirectUrl = formData.status === 'SCHEDULED' ? '/admin/scheduled' : '/admin/posts'
      router.push(redirectUrl)
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Masukkan judul artikel"
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
              Konten Artikel
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={handleContentChange}
              placeholder="Tulis konten artikel..."
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
              placeholder="Ringkasan singkat artikel (opsional)"
            />
          </div>

          {/* Tags - Moved to main content */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 text-sm mb-3">Tag</h3>

            {/* Create new tag */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
                placeholder="Buat tag baru..."
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={creatingTag || !newTagName.trim()}
                className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {creatingTag ? '...' : '+'}
              </button>
            </div>

            {/* Selected tags */}
            {formData.tagIds.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1.5">Tag terpilih:</p>
                <div className="flex flex-wrap gap-1.5">
                  {formData.tagIds.map((tagId) => {
                    const tag = availableTags.find((t) => t.id === tagId)
                    if (!tag) return null
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className="px-2 py-0.5 text-xs rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors flex items-center gap-1"
                      >
                        #{tag.name}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Available tags */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Tag tersedia:</p>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {availableTags
                  .filter((tag) => !formData.tagIds.includes(tag.id))
                  .map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      #{tag.name}
                    </button>
                  ))}
                {availableTags.filter((tag) => !formData.tagIds.includes(tag.id)).length === 0 && (
                  <p className="text-xs text-gray-400">Semua tag sudah dipilih</p>
                )}
              </div>
            </div>
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as PostData['status'] }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Dipublikasi</option>
                  <option value="SCHEDULED">Terjadwal</option>
                  <option value="ARCHIVED">Arsip</option>
                </select>
              </div>

              {formData.status === 'SCHEDULED' && (
                <div>
                  <label htmlFor="scheduledAt" className="block text-xs font-medium text-gray-700 mb-1">
                    Jadwal Publikasi
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledAt"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:bg-primary-400"
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
            <div className="space-y-2">
              {/* Upload button */}
              <div>
                <input
                  ref={featuredImageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFeaturedImageSelect}
                  className="hidden"
                />
                {cropImageSrc && (
                  <ImageCropper
                    imageSrc={cropImageSrc}
                    onCropComplete={handleCroppedUpload}
                    onCancel={() => {
                      URL.revokeObjectURL(cropImageSrc)
                      setCropImageSrc(null)
                    }}
                  />
                )}
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
                <p className="text-[10px] text-gray-400 mt-1 text-center">JPG, PNG, WebP. Maks 5MB. Output: 1200x675 (16:9)</p>
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
                    onClick={() => setFormData((prev) => ({ ...prev, featuredImage: '', featuredImageCaption: '' }))}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Hapus gambar"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Caption */}
              {formData.featuredImage && (
                <div className="mt-2">
                  <label className="block text-[10px] text-gray-500 mb-1">Caption Gambar</label>
                  <input
                    type="text"
                    value={formData.featuredImageCaption}
                    onChange={(e) => setFormData((prev) => ({ ...prev, featuredImageCaption: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
                    placeholder="Contoh: Suasana Rakor di Depok, Selasa (10/2/2026)"
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
                    className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-700">{category.name}</span>
                </label>
              ))}
              {categories.length === 0 && (
                <p className="text-xs text-gray-500">Belum ada kategori</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
