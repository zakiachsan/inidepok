import { TopBar, Header, MainNav, Footer } from '@/components/layout'
import { ScrollToTop } from '@/components/common'
import { BannerAd } from '@/components/ads'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Scroll to top on navigation */}
      <ScrollToTop />

      {/* Top Bar with Breaking News */}
      <TopBar />

      {/* Sticky Header + Nav Container */}
      <div className="sticky top-0 z-50">
        {/* Header with Logo and Search */}
        <Header />

        {/* Main Navigation */}
        <MainNav />
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Sticky Side Ads - Desktop Only (min-width 1400px) */}
      {/* Left Side Ad */}
      <div className="hidden min-[1400px]:block fixed left-4 min-[1600px]:left-6 min-[1800px]:left-8 top-[140px] z-30">
        <BannerAd slot="side-left" />
      </div>

      {/* Right Side Ad */}
      <div className="hidden min-[1400px]:block fixed right-4 min-[1600px]:right-6 min-[1800px]:right-8 top-[140px] z-30">
        <BannerAd slot="side-right" />
      </div>
    </div>
  )
}
