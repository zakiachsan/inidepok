'use client'

import { useState } from 'react'
import CommentForm from './CommentForm'
import CommentList from './CommentList'

interface CommentSectionProps {
  postId: string
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  function handleCommentSuccess() {
    // Refresh comment list after new comment
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <span className="w-1 h-6 bg-red-600 rounded"></span>
        Komentar
      </h2>

      {/* Comment Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Tinggalkan Komentar</h3>
        <CommentForm postId={postId} onSuccess={handleCommentSuccess} />
      </div>

      {/* Comment List */}
      <CommentList key={refreshKey} postId={postId} />
    </section>
  )
}
