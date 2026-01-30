'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface PostCardProps {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: string
  featuredImage?: string | null
  category?: {
    name: string
    slug: string
  }
  author?: {
    name: string
  }
  publishedAt?: Date | string | null
  viewCount?: number
  variant?: 'default' | 'horizontal' | 'compact' | 'featured' | 'small' | 'list'
  index?: number // For numbered display in compact variant
  isTrending?: boolean
  isBreaking?: boolean
}

// Calculate reading time from content
function calculateReadingTime(content?: string): number {
  if (!content) return 2
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

export default function PostCard({
  title,
  slug,
  excerpt,
  content,
  featuredImage,
  category,
  author,
  publishedAt,
  viewCount = 0,
  variant = 'default',
  index,
  isTrending = false,
  isBreaking = false,
}: PostCardProps) {
  const readingTime = calculateReadingTime(content || excerpt || '')

  // Featured variant - CNN style with text left, image right
  if (variant === 'featured') {
    return (
      <article className="post-card group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col sm:flex-row">
          {/* Content - Left side */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center order-2 sm:order-1">
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-300 leading-snug">
              <Link href={`/${slug}`}>{title}</Link>
            </h2>
            {category && (
              <Link href={`/category/${category.slug}`} className="text-accent-500 text-xs font-semibold hover:text-accent-600 mb-2">
                {category.name}
              </Link>
            )}
            {excerpt && (
              <p className="text-gray-500 text-sm line-clamp-2 mb-2">
                {excerpt}
              </p>
            )}
            {publishedAt && (
              <p className="text-xs text-gray-400">
                {formatDate(new Date(publishedAt))}
              </p>
            )}
          </div>

          {/* Image - Right side */}
          <Link href={`/${slug}`} className="sm:w-1/2 lg:w-3/5 aspect-[4/3] sm:aspect-auto relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden order-1 sm:order-2">
            {featuredImage ? (
              <Image
                src={featuredImage}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </Link>
        </div>
      </article>
    )
  }

  // Horizontal variant - Side by side layout
  if (variant === 'horizontal') {
    return (
      <article className="post-card group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300">
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          <Link
            href={`/${slug}`}
            className="sm:w-48 h-36 sm:h-auto flex-shrink-0 relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden"
          >
            {featuredImage ? (
              <Image
                src={featuredImage}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </Link>

          {/* Content */}
          <div className="flex-1 p-4">
            {category && (
              <Link href={`/category/${category.slug}`} className="text-primary-600 text-sm font-medium hover:text-primary-700">
                {category.name}
              </Link>
            )}

            <h3 className="font-bold text-gray-900 mt-1 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
              <Link href={`/${slug}`}>{title}</Link>
            </h3>

            {excerpt && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {excerpt}
              </p>
            )}

            {publishedAt && (
              <span className="text-xs text-gray-500">
                {formatRelativeTime(new Date(publishedAt))}
              </span>
            )}
          </div>
        </div>
      </article>
    )
  }

  // Compact variant - Small card for sidebar/lists with 1:1 image
  if (variant === 'compact') {
    return (
      <article className="group flex gap-3 py-2">
        {/* Number indicator if index is provided */}
        {typeof index === 'number' && (
          <div className="flex-shrink-0 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xs group-hover:bg-primary-700 transition-colors">
            {index + 1}
          </div>
        )}

        {/* Square Thumbnail - Always 1:1 */}
        <Link
          href={`/${slug}`}
          className="flex-shrink-0 w-16 h-16 relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden"
        >
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200 leading-snug">
            <Link href={`/${slug}`}>{title}</Link>
          </h4>
          {publishedAt && (
            <p className="text-xs text-gray-400 mt-1">
              {formatRelativeTime(new Date(publishedAt))}
            </p>
          )}
        </div>
      </article>
    )
  }

  // Small variant - Compact grid cards with 1:1 image
  if (variant === 'small') {
    return (
      <article className="post-card group">
        {/* Thumbnail - Square 1:1 */}
        <Link href={`/${slug}`} className="block aspect-square relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-2 shadow-sm">
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>

        {/* Content - Minimal */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200 leading-snug">
            <Link href={`/${slug}`}>{title}</Link>
          </h3>
          {publishedAt && (
            <p className="text-xs text-gray-400 mt-1">
              {formatRelativeTime(new Date(publishedAt))}
            </p>
          )}
        </div>
      </article>
    )
  }

  // List variant - Modern media style with 1:1 image left, title right
  if (variant === 'list') {
    return (
      <article className="group flex gap-4 py-4 border-b border-gray-100 last:border-b-0">
        {/* Square Thumbnail - Larger on desktop */}
        <Link
          href={`/${slug}`}
          className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-sm"
        >
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
          {category && (
            <Link href={`/category/${category.slug}`} className="inline-block w-fit text-primary-600 text-xs font-semibold hover:text-primary-700 mb-1.5 uppercase tracking-wide">
              {category.name}
            </Link>
          )}
          <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200 leading-snug mb-2">
            <Link href={`/${slug}`}>{title}</Link>
          </h3>
          {publishedAt && (
            <p className="text-xs text-gray-400">
              {formatRelativeTime(new Date(publishedAt))}
            </p>
          )}
        </div>
      </article>
    )
  }

  // Default card (vertical) - Square 1:1 image for consistency
  return (
    <article className="post-card group">
      {/* Thumbnail - Square 1:1 */}
      <Link href={`/${slug}`} className="block aspect-square relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-2 shadow-sm">
        {featuredImage ? (
          <Image
            src={featuredImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 sm:w-14 sm:h-14 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Content */}
      <div>
        {category && (
          <Link href={`/category/${category.slug}`} className="text-primary-600 text-xs sm:text-sm font-medium hover:text-primary-700">
            {category.name}
          </Link>
        )}

        <h3 className="text-sm sm:text-base font-bold text-gray-900 mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-3 group-hover:text-primary-600 transition-colors duration-200">
          <Link href={`/${slug}`}>{title}</Link>
        </h3>
      </div>
    </article>
  )
}
