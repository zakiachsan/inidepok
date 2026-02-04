'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Post {
  id: string
  title: string
  slug: string
  status: 'SCHEDULED'
  scheduledAt: Date | null
  viewCount: number
  createdAt: Date
  author: { name: string }
  authorId: string
  categories: Array<{ name: string; slug: string }>
}

interface CurrentUser {
  id: string
  role: string
}

interface ScheduledPostsTableProps {
  posts: Post[]
  currentUser: CurrentUser
}

function formatScheduledTime(date: Date | null): string {
  if (!date) return '-'

  const scheduledDate = new Date(date)
  const now = new Date()
  const diff = scheduledDate.getTime() - now.getTime()

  // If past the scheduled time
  if (diff < 0) {
    return 'Sudah waktunya'
  }

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (minutes < 60) {
    return `dalam ${minutes} menit`
  }
  if (hours < 24) {
    return `dalam ${hours} jam`
  }
  if (days === 1) {
    return `besok pukul ${scheduledDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (days < 7) {
    return `dalam ${days} hari`
  }

  return scheduledDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ScheduledPostsTable({ posts, currentUser }: ScheduledPostsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Check if current user can edit/delete a post
  function canModify(post: Post): boolean {
    return currentUser.role === 'ADMIN' || post.authorId === currentUser.id
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Yakin ingin menghapus jadwal artikel "${title}"?`)) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert('Gagal menghapus artikel')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Gagal menghapus artikel')
    } finally {
      setDeletingId(null)
    }
  }

  if (posts.length === 0) {
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm text-gray-500">Tidak ada artikel terjadwal</p>
        <Link
          href="/admin/scheduled/new"
          className="inline-block mt-3 text-xs text-red-600 hover:text-red-700 font-medium"
        >
          Jadwalkan artikel pertama →
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
              Kategori
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jadwal Tayang
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-gray-50">
              <td className="px-3 py-2.5">
                <div>
                  {canModify(post) ? (
                    <Link
                      href={`/admin/scheduled/${post.id}/edit`}
                      className="font-medium text-gray-900 hover:text-red-600 line-clamp-1 text-xs"
                    >
                      {post.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-900 line-clamp-1 text-xs">
                      {post.title}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    oleh {post.author.name}
                  </p>
                </div>
              </td>
              <td className="px-3 py-2.5">
                {post.categories[0] ? (
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded">
                    {post.categories[0].name}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-blue-600 font-medium">
                    {formatScheduledTime(post.scheduledAt)}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-1">
                  {canModify(post) && (
                    <>
                      <Link
                        href={`/admin/scheduled/${post.id}/edit`}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        disabled={deletingId === post.id}
                        className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                        title="Hapus"
                      >
                        {deletingId === post.id ? (
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
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
