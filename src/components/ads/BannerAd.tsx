'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Ad {
  id: string
  position: string
  name: string
  width: number
  height: number
  enabled: boolean
  type: 'placeholder' | 'custom' | 'programmatic'
  imageUrl: string | null
  redirectUrl: string | null
  altText: string | null
  adCode: string | null
}

interface BannerAdProps {
  slot: string
  width?: number
  height?: number
  className?: string
}

// Cache for ads data
let adsCache: Ad[] | null = null
let adsCacheTime = 0
const CACHE_DURATION = 60000 // 1 minute

async function fetchAds(): Promise<Ad[]> {
  const now = Date.now()
  if (adsCache && now - adsCacheTime < CACHE_DURATION) {
    return adsCache
  }

  try {
    const res = await fetch('/api/ads')
    if (res.ok) {
      const data = await res.json()
      const ads: Ad[] = data.ads || []
      adsCache = ads
      adsCacheTime = now
      return ads
    }
  } catch (error) {
    console.error('Error fetching ads:', error)
  }
  return adsCache || []
}

function AdPlaceholder({
  width = 300,
  height = 250,
  className = '',
}: {
  width?: number
  height?: number
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-center bg-gray-100 border border-gray-200 overflow-hidden ${className}`}
      style={{ minHeight: height }}
    >
      <div className="text-center text-gray-400">
        <p className="text-xs">IKLAN</p>
        <p className="text-xs">
          {width} x {height}
        </p>
      </div>
    </div>
  )
}

export default function BannerAd({
  slot,
  width,
  height,
  className = '',
}: BannerAdProps) {
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)

  // Define default sizes based on slot
  const sizes: Record<string, { width: number; height: number }> = {
    top: { width: 728, height: 90 },
    header: { width: 970, height: 250 },
    content: { width: 728, height: 90 },
    sidebar: { width: 300, height: 250 },
    'sidebar-1': { width: 300, height: 250 },
    'sidebar-2': { width: 300, height: 250 },
    'side-left': { width: 160, height: 600 },
    'side-right': { width: 160, height: 600 },
    'content-top': { width: 728, height: 90 },
    'content-bottom': { width: 728, height: 90 },
  }

  const defaultSize = sizes[slot] || sizes.sidebar
  const w = width || defaultSize.width
  const h = height || defaultSize.height

  useEffect(() => {
    let mounted = true

    fetchAds().then((ads) => {
      if (mounted) {
        const foundAd = ads.find((a) => a.position === slot && a.enabled)
        setAd(foundAd || null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
    }
  }, [slot])

  // Loading state - show nothing while loading
  if (loading) {
    return null
  }

  // No ad found or disabled - hide completely
  if (!ad) {
    return null
  }

  // Custom ad with image
  if (ad.type === 'custom' && ad.imageUrl) {
    const imageElement = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ad.imageUrl}
        alt={ad.altText || 'Advertisement'}
        className="w-full h-auto"
        style={{ maxHeight: h }}
      />
    )

    return (
      <div className={className} style={{ minHeight: h }}>
        {ad.redirectUrl ? (
          <Link
            href={ad.redirectUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            {imageElement}
          </Link>
        ) : (
          imageElement
        )}
      </div>
    )
  }

  // Programmatic ad with code
  if (ad.type === 'programmatic' && ad.adCode) {
    return (
      <div
        className={className}
        style={{ minHeight: h }}
        dangerouslySetInnerHTML={{ __html: ad.adCode }}
      />
    )
  }

  // Default: placeholder
  return <AdPlaceholder width={ad.width} height={ad.height} className={className} />
}
