'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Post {
  id: string
  title: string
  slug: string
  viewCount: number
  featuredImage?: string | null
}

interface PopularPostsProps {
  limit?: number
  showRank?: boolean
  showViewCount?: boolean
}

export default function PopularPosts({
  limit = 5,
  showRank = true,
  showViewCount = true,
}: PopularPostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        // For now, fetch posts and sort by viewCount on client
        // Later, add a dedicated API endpoint for popular posts
        const res = await fetch(`/api/posts?limit=${limit * 2}`)
        const data = await res.json()
        const sortedPosts = (data.posts || [])
          .sort((a: Post, b: Post) => b.viewCount - a.viewCount)
          .slice(0, limit)
        setPosts(sortedPosts)
      } catch (error) {
        console.error('Failed to fetch popular posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [limit])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Belum ada artikel.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <article key={post.id} className="flex gap-3 group">
          {showRank && (
            <span className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded flex items-center justify-center font-bold text-sm">
              {index + 1}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
              <Link href={`/${post.slug}`}>{post.title}</Link>
            </h4>
            {showViewCount && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                {post.viewCount.toLocaleString('id-ID')} views
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
