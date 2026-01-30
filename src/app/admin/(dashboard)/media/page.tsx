'use client'

import { useState } from 'react'

interface MediaItem {
  id: string
  filename: string
  url: string
  mimeType: string
  size: number
  createdAt: string
}

// Mock data for demo
const mockMedia: MediaItem[] = [
  {
    id: '1',
    filename: 'hero-image.jpg',
    url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
    mimeType: 'image/jpeg',
    size: 245000,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    filename: 'news-thumbnail.jpg',
    url: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400',
    mimeType: 'image/jpeg',
    size: 180000,
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    filename: 'article-banner.png',
    url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400',
    mimeType: 'image/png',
    size: 320000,
    createdAt: '2024-01-13',
  },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function MediaPage() {
  const [media] = useState<MediaItem[]>(mockMedia)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  function toggleSelect(id: string) {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    alert('URL disalin ke clipboard!')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Media</h1>
          <p className="text-xs text-gray-500">Kelola file media website</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
          <button className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload
          </button>
        </div>
      </div>

      {/* Selected Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 flex items-center justify-between">
          <span className="text-sm text-blue-700">{selectedItems.length} item dipilih</span>
          <button
            onClick={() => setSelectedItems([])}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Batalkan
          </button>
        </div>
      )}

      {/* Media Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {media.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              className={`relative bg-white rounded-md border overflow-hidden cursor-pointer transition-all ${
                selectedItems.includes(item.id)
                  ? 'border-red-500 ring-2 ring-red-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Image */}
              <div className="aspect-square bg-gray-100">
                <img
                  src={item.url}
                  alt={item.filename}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs font-medium text-gray-900 truncate">{item.filename}</p>
                <p className="text-[10px] text-gray-500">{formatFileSize(item.size)}</p>
              </div>

              {/* Actions */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyUrl(item.url)
                  }}
                  className="p-1 bg-white/90 rounded hover:bg-white"
                  title="Copy URL"
                >
                  <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-sm border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase w-8">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                  File
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                  Tipe
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                  Ukuran
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                  Tanggal
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {media.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-3.5 h-3.5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="w-8 h-8 object-cover rounded"
                      />
                      <span className="text-sm text-gray-900">{item.filename}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{item.mimeType}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{formatFileSize(item.size)}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{item.createdAt}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => copyUrl(item.url)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Copy URL"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600" title="Delete">
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
        </div>
      )}

      {media.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Belum ada media</p>
          <p className="text-xs text-gray-400 mt-1">Upload file untuk memulai</p>
        </div>
      )}
    </div>
  )
}
