import Link from 'next/link'
import { prisma } from '@/lib/db'
import FeaturedPostsManager from './components/FeaturedPostsManager'

async function getFeaturedPosts() {
  try {
    return await prisma.post.findMany({
      where: {
        isPinned: true,
        status: 'PUBLISHED',
      },
      orderBy: { pinnedOrder: 'asc' },
      include: {
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
      take: 50,
      include: {
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
            Kelola artikel yang ditampilkan sebagai berita utama di homepage
          </p>
        </div>
        <Link
          href="/admin/posts"
          className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Kembali ke Artikel
        </Link>
      </div>

      {/* Info Card */}
      <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
        <div className="flex gap-2">
          <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-xs text-orange-800">
            <p className="font-medium">Cara Penggunaan:</p>
            <ul className="mt-1 space-y-0.5 list-disc list-inside text-orange-700">
              <li>Pilih artikel dari daftar &quot;Artikel Tersedia&quot; untuk dijadikan berita utama</li>
              <li>Drag & drop untuk mengubah urutan tampilan di homepage</li>
              <li>Maksimal 5 artikel berita utama yang ditampilkan</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Manager Component */}
      <FeaturedPostsManager
        initialFeatured={featuredPosts}
        initialAvailable={availablePosts}
      />
    </div>
  )
}
