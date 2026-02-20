'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Ad {
  id: string
  position: string
  name: string
  width: number
  height: number
  enabled: boolean
  type: 'placeholder' | 'custom' | 'programmatic'
  imageUrl: string | null
  redirectUrl: string | null
  altText: string | null
  adCode: string | null
  createdAt: Date
  updatedAt: Date
}

interface AdsManagerProps {
  initialAds: Ad[]
}

export default function AdsManager({ initialAds }: AdsManagerProps) {
  const router = useRouter()
  const [ads, setAds] = useState(initialAds)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [formData, setFormData] = useState({
    enabled: false,
    type: 'placeholder' as 'placeholder' | 'custom' | 'programmatic',
    imageUrl: '',
    redirectUrl: '',
    altText: '',
    adCode: '',
  })
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const openEditModal = (ad: Ad) => {
    setEditingAd(ad)
    setFormData({
      enabled: ad.enabled,
      type: ad.type,
      imageUrl: ad.imageUrl || '',
      redirectUrl: ad.redirectUrl || '',
      altText: ad.altText || '',
      adCode: ad.adCode || '',
    })
  }

  const closeModal = () => {
    setEditingAd(null)
    setFormData({
      enabled: false,
      type: 'placeholder',
      imageUrl: '',
      redirectUrl: '',
      altText: '',
      adCode: '',
    })
  }

  const handleToggle = async (ad: Ad) => {
    setTogglingId(ad.id)
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !ad.enabled,
          type: ad.type,
          imageUrl: ad.imageUrl,
          redirectUrl: ad.redirectUrl,
          altText: ad.altText,
          adCode: ad.adCode,
        }),
      })

      if (res.ok) {
        setAds(ads.map(a =>
          a.id === ad.id ? { ...a, enabled: !a.enabled } : a
        ))
      }
    } catch (error) {
      console.error('Error toggling ad:', error)
    } finally {
      setTogglingId(null)
    }
  }

  const handleSave = async () => {
    if (!editingAd) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/ads/${editingAd.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const { ad: updatedAd } = await res.json()
        setAds(ads.map(a => (a.id === editingAd.id ? updatedAd : a)))
        closeModal()
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving ad:', error)
    } finally {
      setSaving(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'placeholder':
        return 'Placeholder'
      case 'custom':
        return 'Custom'
      case 'programmatic':
        return 'Programmatic'
      default:
        return type
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'placeholder':
        return 'bg-gray-100 text-gray-700'
      case 'custom':
        return 'bg-blue-100 text-blue-700'
      case 'programmatic':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <>
      <div className="grid gap-4">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-gray-900">{ad.name}</h3>
                  <span className="text-xs text-gray-500">
                    {ad.width} x {ad.height}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${getTypeBadgeColor(
                      ad.type
                    )}`}
                  >
                    {getTypeLabel(ad.type)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Posisi: <code className="bg-gray-100 px-1 rounded">{ad.position}</code>
                  {ad.type === 'custom' && ad.imageUrl && (
                    <span className="ml-2">
                      • Gambar: {ad.imageUrl.split('/').pop()}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(ad)}
                  disabled={togglingId === ad.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    ad.enabled ? 'bg-green-500' : 'bg-gray-300'
                  } ${togglingId === ad.id ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      ad.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-500 w-12">
                  {ad.enabled ? 'Aktif' : 'Nonaktif'}
                </span>

                {/* Edit Button */}
                <button
                  onClick={() => openEditModal(ad)}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}

        {ads.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">
              Belum ada posisi iklan. Jalankan seed script untuk menginisialisasi.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit: {editingAd.name}
              </h2>
              <p className="text-xs text-gray-500">
                {editingAd.width} x {editingAd.height}
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Status Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setFormData({ ...formData, enabled: !formData.enabled })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">
                    {formData.enabled ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              {/* Ad Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Iklan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['placeholder', 'custom', 'programmatic'] as const).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, type })}
                        className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                          formData.type === type
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {getTypeLabel(type)}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Custom Ad Fields */}
              {formData.type === 'custom' && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Gambar Iklan
                    </label>
                    {formData.imageUrl ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.imageUrl}
                          alt="Ad preview"
                          className="w-full h-32 object-contain bg-gray-100 rounded-md border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <p className="text-xs text-gray-500 mt-1 truncate">{formData.imageUrl}</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            
                            const uploadFormData = new FormData()
                            uploadFormData.append('file', file)
                            
                            try {
                              const res = await fetch('/api/upload', {
                                method: 'POST',
                                body: uploadFormData,
                              })
                              
                              if (res.ok) {
                                const { url } = await res.json()
                                setFormData({ ...formData, imageUrl: url })
                              } else {
                                const error = await res.json()
                                alert(error.error || 'Upload gagal')
                              }
                            } catch (err) {
                              console.error('Upload error:', err)
                              alert('Upload gagal')
                            }
                          }}
                          className="hidden"
                          id="ad-image-upload"
                        />
                        <label
                          htmlFor="ad-image-upload"
                          className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-500 mt-1">Klik untuk upload gambar</span>
                          <span className="text-xs text-gray-400">JPG, PNG, WebP (max 5MB)</span>
                        </label>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      URL Redirect (opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.redirectUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, redirectUrl: e.target.value })
                      }
                      placeholder="https://example.com/landing-page"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Alt Text (opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.altText}
                      onChange={(e) =>
                        setFormData({ ...formData, altText: e.target.value })
                      }
                      placeholder="Deskripsi gambar"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}

              {/* Programmatic Ad Fields */}
              {formData.type === 'programmatic' && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Kode Iklan (HTML/JavaScript)
                    </label>
                    <textarea
                      value={formData.adCode}
                      onChange={(e) =>
                        setFormData({ ...formData, adCode: e.target.value })
                      }
                      placeholder="<script>...</script>"
                      rows={5}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste kode dari Google AdSense atau provider lainnya
                    </p>
                  </div>
                </div>
              )}

              {/* Placeholder Info */}
              {formData.type === 'placeholder' && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    Menampilkan placeholder &quot;IKLAN&quot; dengan ukuran{' '}
                    {editingAd.width} x {editingAd.height}
                  </p>
                </div>
              )}

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div
                  className="border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100"
                  style={{
                    height: Math.min(editingAd.height, 200),
                    maxWidth: '100%',
                  }}
                >
                  {formData.type === 'custom' && formData.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.imageUrl}
                      alt={formData.altText || 'Ad preview'}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <p className="text-xs">IKLAN</p>
                      <p className="text-xs">
                        {editingAd.width} x {editingAd.height}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
