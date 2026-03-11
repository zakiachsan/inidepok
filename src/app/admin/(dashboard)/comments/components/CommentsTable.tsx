'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Comment {
  id: string
  authorName: string
  authorEmail: string
  content: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: Date
  post: { title: string; slug: string }
}

interface CommentsTableProps {
  comments: Comment[]
}

export default function CommentsTable({ comments }: CommentsTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function handleUpdateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert('Gagal mengupdate status')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Gagal mengupdate status')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus komentar ini?')) {
      return
    }

    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert('Gagal menghapus komentar')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Gagal menghapus komentar')
    } finally {
      setLoadingId(null)
    }
  }

  if (comments.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg
          className="w-12 h-12 mx-auto text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-gray-500">Tidak ada komentar</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {comments.map((comment) => (
        <div key={comment.id} className="p-4 hover:bg-gray-50">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {comment.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {comment.authorName}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        comment.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : comment.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {comment.status === 'APPROVED'
                        ? 'Disetujui'
                        : comment.status === 'PENDING'
                        ? 'Pending'
                        : 'Ditolak'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {comment.authorEmail} • {formatDate(comment.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {comment.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(comment.id, 'APPROVED')}
                      disabled={loadingId === comment.id}
                      className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                      title="Setujui"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  {comment.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleUpdateStatus(comment.id, 'REJECTED')}
                      disabled={loadingId === comment.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Tolak"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={loadingId === comment.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Hapus"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-700">{comment.content}</p>
              <p className="mt-2 text-xs text-gray-500">
                pada{' '}
                <Link
                  href={`/${comment.post.slug}`}
                  target="_blank"
                  className="text-red-600 hover:underline"
                >
                  {comment.post.title}
                </Link>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
