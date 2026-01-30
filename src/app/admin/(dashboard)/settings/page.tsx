'use client'

import { useState } from 'react'

interface SiteSettings {
  siteName: string
  siteDescription: string
  siteUrl: string
  postsPerPage: number
  allowComments: boolean
  moderateComments: boolean
  socialFacebook: string
  socialTwitter: string
  socialInstagram: string
  socialYoutube: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Kilas Indonesia',
    siteDescription: 'Portal Berita Terkini Indonesia',
    siteUrl: 'https://kilasindonesia.com',
    postsPerPage: 10,
    allowComments: true,
    moderateComments: true,
    socialFacebook: '',
    socialTwitter: '',
    socialInstagram: '',
    socialYoutube: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 500))

    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Pengaturan</h1>
          <p className="text-xs text-gray-500">Kelola pengaturan website</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
            Pengaturan berhasil disimpan!
          </div>
        )}

        {/* General Settings */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Pengaturan Umum</h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="siteName" className="block text-xs font-medium text-gray-700 mb-1">
                Nama Website
              </label>
              <input
                type="text"
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="siteDescription" className="block text-xs font-medium text-gray-700 mb-1">
                Deskripsi Website
              </label>
              <textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                rows={2}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="siteUrl" className="block text-xs font-medium text-gray-700 mb-1">
                URL Website
              </label>
              <input
                type="url"
                id="siteUrl"
                value={settings.siteUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="postsPerPage" className="block text-xs font-medium text-gray-700 mb-1">
                Artikel per Halaman
              </label>
              <input
                type="number"
                id="postsPerPage"
                value={settings.postsPerPage}
                onChange={(e) => setSettings(prev => ({ ...prev, postsPerPage: parseInt(e.target.value) || 10 }))}
                min={1}
                max={50}
                className="w-32 px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Comment Settings */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Pengaturan Komentar</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowComments}
                onChange={(e) => setSettings(prev => ({ ...prev, allowComments: e.target.checked }))}
                className="w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Aktifkan komentar di artikel</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.moderateComments}
                onChange={(e) => setSettings(prev => ({ ...prev, moderateComments: e.target.checked }))}
                className="w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Moderasi komentar sebelum ditampilkan</span>
            </label>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Media Sosial</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="socialFacebook" className="block text-xs font-medium text-gray-700 mb-1">
                Facebook URL
              </label>
              <input
                type="url"
                id="socialFacebook"
                value={settings.socialFacebook}
                onChange={(e) => setSettings(prev => ({ ...prev, socialFacebook: e.target.value }))}
                placeholder="https://facebook.com/..."
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="socialTwitter" className="block text-xs font-medium text-gray-700 mb-1">
                Twitter/X URL
              </label>
              <input
                type="url"
                id="socialTwitter"
                value={settings.socialTwitter}
                onChange={(e) => setSettings(prev => ({ ...prev, socialTwitter: e.target.value }))}
                placeholder="https://x.com/..."
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="socialInstagram" className="block text-xs font-medium text-gray-700 mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                id="socialInstagram"
                value={settings.socialInstagram}
                onChange={(e) => setSettings(prev => ({ ...prev, socialInstagram: e.target.value }))}
                placeholder="https://instagram.com/..."
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="socialYoutube" className="block text-xs font-medium text-gray-700 mb-1">
                YouTube URL
              </label>
              <input
                type="url"
                id="socialYoutube"
                value={settings.socialYoutube}
                onChange={(e) => setSettings(prev => ({ ...prev, socialYoutube: e.target.value }))}
                placeholder="https://youtube.com/..."
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
          >
            {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  )
}
