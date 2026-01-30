'use client'

import { BannerAd } from '@/components/ads'

export default function TopBar() {
  return (
    <div className="bg-gray-100 py-2">
      <div className="container">
        <div className="flex justify-center">
          <BannerAd slot="top" width={728} height={90} />
        </div>
      </div>
    </div>
  )
}
