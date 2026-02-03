'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Page {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: Date | null
  createdAt: Date
  author: { name: string }
  authorId: string
  sortOrder: number
}

interface PagesTableProps {
  pages: Page[]
}

export default function PagesTable({ pages }: PagesTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function formatDate(date: Date | null): string {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Yakin ingin menghapus halaman "${title}"?`)) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert('Gagal menghapus halaman')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Gagal menghapus halaman')
    } finally {
      setDeletingId(null)
    }
  }

  if (pages.length === 0) {
    return (
      <div className="p-6 text-center">
        <svg
          className="w-10 h-10 mx-auto text-gray-300 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm text-gray-500">Tidak ada halaman ditemukan</p>
        <Link
          href="/admin/pages/new"
          className="inline-block mt-3 text-xs text-red-600 hover:text-red-700 font-medium"
        >
          Buat halaman pertama →
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-y border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Judul
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Slug
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Urutan
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanggal
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pages.map((page) => (
            <tr key={page.id} className="hover:bg-gray-50">
              <td className="px-3 py-2.5">
                <div>
                  <Link
                    href={`/admin/pages/${page.id}/edit`}
                    className="font-medium text-gray-900 hover:text-red-600 line-clamp-1 text-xs"
                  >
                    {page.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    oleh {page.author.name}
                  </p>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <span className="text-xs text-gray-500">/{page.slug}</span>
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded ${
                    page.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {page.status === 'PUBLISHED' ? 'Dipublikasi' : 'Draft'}
                </span>
              </td>
              <td className="px-3 py-2.5 text-xs text-gray-500">
                {page.sortOrder}
              </td>
              <td className="px-3 py-2.5 text-xs text-gray-500">
                {formatDate(page.publishedAt || page.createdAt)}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/${page.slug}`}
                    target="_blank"
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Lihat"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                  <Link
                    href={`/admin/pages/${page.id}/edit`}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(page.id, page.title)}
                    disabled={deletingId === page.id}
                    className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                    title="Hapus"
                  >
                    {deletingId === page.id ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
