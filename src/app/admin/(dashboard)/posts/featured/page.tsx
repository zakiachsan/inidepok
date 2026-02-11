import Link from 'next/link'
import { prisma } from '@/lib/db'
import FeaturedPostsManager from './components/FeaturedPostsManager'

// Disable caching to always get fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getFeaturedPosts() {
  try {
    return await prisma.post.findMany({
      where: {
        isPinned: true,
        status: 'PUBLISHED',
      },
      orderBy: { pinnedOrder: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
        publishedAt: true,
        pinnedOrder: true,
        viewCount: true,
        author: { select: { name: true } },
        categories: { select: { name: true, slug: true }, take: 1 },
      },
    })
  } catch (error) {
    console.error('Failed to fetch featured posts:', error)
    return []
  }
}

async function getAvailablePosts() {
  try {
    return await prisma.post.findMany({
      where: {
        isPinned: false,
        status: 'PUBLISHED',
      },
      orderBy: { publishedAt: 'desc' },
      take: 100, // Get more for filtering
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
        publishedAt: true,
        pinnedOrder: true,
        viewCount: true,
        author: { select: { name: true } },
        categories: { select: { name: true, slug: true }, take: 1 },
      },
    })
  } catch (error) {
    console.error('Failed to fetch available posts:', error)
    return []
  }
}

export default async function FeaturedPostsPage() {
  const [featuredPosts, availablePosts] = await Promise.all([
    getFeaturedPosts(),
    getAvailablePosts(),
  ])

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Berita Utama</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Pilih maksimal 5 artikel untuk ditampilkan di homepage
          </p>
        </div>
        <Link
          href="/admin/posts"
          className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Kembali
        </Link>
      </div>

      {/* Manager Component */}
      <FeaturedPostsManager
        initialFeatured={featuredPosts}
        initialAvailable={availablePosts}
      />
    </div>
  )
}
