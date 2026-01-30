'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Post {
  id: string
  title: string
  slug: string
  publishedAt: string
  featuredImage?: string | null
  categories?: Array<{ name: string; slug: string }>
}

interface RecentPostsProps {
  limit?: number
  showImage?: boolean
  showCategory?: boolean
}

export default function RecentPosts({
  limit = 5,
  showImage = false,
  showCategory = true,
}: RecentPostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`/api/posts?limit=${limit}`)
        const data = await res.json()
        setPosts(data.posts || [])
      } catch (error) {
        console.error('Failed to fetch recent posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [limit])

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
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
      {posts.map((post) => (
        <article key={post.id} className="group">
          <div className="flex gap-3">
            {showImage && (
              <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {showCategory && post.categories && post.categories[0] && (
                <Link
                  href={`/category/${post.categories[0].slug}`}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  {post.categories[0].name}
                </Link>
              )}
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                <Link href={`/${post.slug}`}>{post.title}</Link>
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(post.publishedAt)}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
