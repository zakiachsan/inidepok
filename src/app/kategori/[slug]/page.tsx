import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Sidebar } from "@/components/layout"
import { PostCard } from "@/components/post"
import { Pagination } from "@/components/ui"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const POSTS_PER_PAGE = 10

// Mock data - TODO: Replace with Prisma queries
async function getCategory(slug: string) {
  const categories: Record<string, { id: number; name: string; slug: string; description: string }> = {
    berita: { id: 1, name: "Berita", slug: "berita", description: "Berita terkini seputar Kota Depok" },
    politik: { id: 2, name: "Politik", slug: "politik", description: "Berita politik dan pemerintahan" },
    ekonomi: { id: 3, name: "Ekonomi", slug: "ekonomi", description: "Berita ekonomi dan bisnis" },
    olahraga: { id: 4, name: "Olahraga", slug: "olahraga", description: "Berita olahraga dan pertandingan" },
    lifestyle: { id: 5, name: "Lifestyle", slug: "lifestyle", description: "Gaya hidup dan tren terkini" },
  }
  return categories[slug] || null
}

async function getPostsByCategory(categorySlug: string, page: number) {
  const mockPosts = Array.from({ length: POSTS_PER_PAGE }, (_, i) => ({
    id: (page - 1) * POSTS_PER_PAGE + i + 1,
    title: `Berita ${categorySlug} nomor ${(page - 1) * POSTS_PER_PAGE + i + 1}`,
    slug: `berita-${categorySlug}-${(page - 1) * POSTS_PER_PAGE + i + 1}`,
    excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
    featuredImage: null,
    publishedAt: new Date(Date.now() - i * 3600000),
    author: { displayName: "Admin" },
    categories: [{ category: { name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1), slug: categorySlug } }],
  }))

  return {
    posts: mockPosts,
    totalCount: 45,
    totalPages: Math.ceil(45 / POSTS_PER_PAGE),
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)

  if (!category) {
    return { title: "Kategori Tidak Ditemukan" }
  }

  return {
    title: `${category.name} - Berita ${category.name} Terbaru`,
    description: category.description,
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1

  const category = await getCategory(slug)

  if (!category) {
    notFound()
  }

  const { posts, totalCount, totalPages } = await getPostsByCategory(slug, page)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {category.name}
        </h1>
        <p className="text-gray-600">{category.description}</p>
        <p className="text-sm text-gray-500 mt-2">
          {totalCount} artikel ditemukan
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath={`/kategori/${slug}`}
              />
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500">
                Belum ada artikel dalam kategori ini
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
