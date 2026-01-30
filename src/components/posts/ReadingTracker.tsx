'use client'

import { useEffect } from 'react'
import { addToReadingHistory } from '@/lib/recommendations'

interface ReadingTrackerProps {
  postId: string
  slug: string
  categorySlug?: string
}

export function ReadingTracker({ postId, slug, categorySlug }: ReadingTrackerProps) {
  useEffect(() => {
    // Track reading after a short delay to ensure user is actually reading
    const timer = setTimeout(() => {
      addToReadingHistory({ postId, slug, categorySlug })
    }, 3000) // 3 seconds

    return () => clearTimeout(timer)
  }, [postId, slug, categorySlug])

  return null // This component doesn't render anything
}
