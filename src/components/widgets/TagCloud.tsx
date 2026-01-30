'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Tag {
  id: string
  name: string
  slug: string
  count: number
}

interface TagCloudProps {
  limit?: number
  activeSlug?: string
}

export default function TagCloud({ limit = 20, activeSlug }: TagCloudProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch('/api/tags')
        const data = await res.json()
        // Sort by count and limit
        const sortedTags = (data.tags || [])
          .sort((a: Tag, b: Tag) => b.count - a.count)
          .slice(0, limit)
        setTags(sortedTags)
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [limit])

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-7 bg-gray-200 rounded-full animate-pulse"
            style={{ width: `${60 + Math.random() * 40}px` }}
          ></div>
        ))}
      </div>
    )
  }

  if (tags.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">Tidak ada tag.</p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/tag/${tag.slug}`}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            tag.slug === activeSlug
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          #{tag.name}
        </Link>
      ))}
    </div>
  )
}
