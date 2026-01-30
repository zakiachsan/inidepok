'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  count: number
}

interface CategoryListProps {
  showCount?: boolean
  excludeSlug?: string
}

export default function CategoryList({
  showCount = true,
  excludeSlug,
}: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        let cats = data.categories || []
        if (excludeSlug) {
          cats = cats.filter((c: Category) => c.slug !== excludeSlug)
        }
        setCategories(cats)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [excludeSlug])

  if (loading) {
    return (
      <ul className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="animate-pulse">
            <div className="flex items-center justify-between py-2 px-3">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-5 bg-gray-100 rounded w-8"></div>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Tidak ada kategori.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            href={`/category/${category.slug}`}
            className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-700">{category.name}</span>
            {showCount && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {category.count}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
