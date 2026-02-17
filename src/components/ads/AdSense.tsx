'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

interface AdSenseProps {
  adSlot: string
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal'
  fullWidth?: boolean
  className?: string
}

// AdSense component for displaying ads
export function AdSense({ 
  adSlot, 
  adFormat = 'auto', 
  fullWidth = true,
  className = ''
}: AdSenseProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  // Only render in production with valid client ID
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  if (!clientId) {
    return null
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidth ? 'true' : 'false'}
      />
    </div>
  )
}

// In-article ad component
export function InArticleAd({ className = '' }: { className?: string }) {
  const adSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE
  if (!adSlot) return null

  return (
    <div className={`my-6 ${className}`}>
      <AdSense adSlot={adSlot} adFormat="fluid" />
    </div>
  )
}

// Sidebar ad component
export function SidebarAd({ className = '' }: { className?: string }) {
  const adSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR
  if (!adSlot) return null

  return (
    <div className={`mb-4 ${className}`}>
      <AdSense adSlot={adSlot} adFormat="vertical" />
    </div>
  )
}

// Header/Banner ad component
export function BannerAd({ className = '' }: { className?: string }) {
  const adSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER
  if (!adSlot) return null

  return (
    <div className={`w-full ${className}`}>
      <AdSense adSlot={adSlot} adFormat="horizontal" />
    </div>
  )
}
