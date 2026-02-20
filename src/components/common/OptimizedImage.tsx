'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string | null | undefined
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  className?: string
  containerClassName?: string
  sizes?: string
  quality?: number
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  containerClassName,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Placeholder for missing images
  if (!src || hasError) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center',
          containerClassName
        )}
        style={!fill ? { width, height } : undefined}
      >
        <svg
          className="w-12 h-12 text-gray-400"
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
    )
  }

  // Handle both absolute URLs (Supabase) and relative paths (local uploads)
  const imageSrc = src.startsWith('http://') || src.startsWith('https://')
    ? src
    : src.startsWith('/')
      ? src
      : `/${src}`

  if (fill) {
    return (
      <div className={cn('relative overflow-hidden', containerClassName)}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          priority={priority}
          quality={quality}
          sizes={sizes}
          className={cn(
            'object-cover transition-all duration-300',
            isLoading ? 'scale-105 blur-sm' : 'scale-100 blur-0',
            className
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      </div>
    )
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={quality}
      sizes={sizes}
      className={cn(
        'transition-all duration-300',
        isLoading ? 'scale-105 blur-sm' : 'scale-100 blur-0',
        className
      )}
      onLoad={() => setIsLoading(false)}
      onError={() => setHasError(true)}
    />
  )
}
