'use client'

import { useEffect, useState } from 'react'
import PostCard from './PostCard'
import { getReadCategories, getReadPostIds } from '@/lib/recommendations'

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  featuredImage?: string | null
  publishedAt?: Date | null
  categories: { name: string; slug: string }[]
}

interface RecommendedPostsProps {
  currentPostIds?: string[]
}

export function RecommendedPosts({ currentPostIds = [] }: RecommendedPostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [hasHistory, setHasHistory] = useState(false)

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const categories = getReadCategories()
        const readIds = getReadPostIds()
        const excludeIds = [...currentPostIds, ...readIds.slice(0, 10)]

        setHasHistory(categories.length > 0)

        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories, excludeIds })
        })

        const data = await response.json()
        setPosts(data.recommendations || [])
      } catch (error) {
        console.error('Failed to fetch recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [currentPostIds])

  if (loading) {
    return (
      <div className="py-6 px-4 bg-gray-100 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" />
          <div className="h-6 w-48 bg-gray-300 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl px-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 flex flex-col justify-center space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return null
  }

  return (
    <section className="py-6 px-4 bg-gray-100 rounded-xl">
      <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {hasHistory ? 'Rekomendasi untuk Anda' : 'Mungkin Anda Suka'}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {hasHistory
          ? 'Berdasarkan artikel yang pernah Anda baca'
          : 'Artikel populer yang mungkin menarik untuk Anda'}
      </p>
      <div className="bg-white rounded-xl shadow-sm px-4">
        {posts.slice(0, 5).map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            slug={post.slug}
            featuredImage={post.featuredImage}
            category={post.categories[0]}
            publishedAt={post.publishedAt}
            variant="list"
          />
        ))}
      </div>
    </section>
  )
}
