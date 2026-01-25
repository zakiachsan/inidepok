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
async function getTag(slug: string) {
  const tags: Record<string, { id: number; name: string; slug: string }> = {
    depok: { id: 1, name: "Depok", slug: "depok" },
    "jawa-barat": { id: 2, name: "Jawa Barat", slug: "jawa-barat" },
    infrastruktur: { id: 3, name: "Infrastruktur", slug: "infrastruktur" },
    kesehatan: { id: 4, name: "Kesehatan", slug: "kesehatan" },
    pendidikan: { id: 5, name: "Pendidikan", slug: "pendidikan" },
  }
  return tags[slug] || null
}

async function getPostsByTag(tagSlug: string, page: number) {
  const mockPosts = Array.from({ length: POSTS_PER_PAGE }, (_, i) => ({
    id: (page - 1) * POSTS_PER_PAGE + i + 1,
    title: `Artikel dengan tag ${tagSlug} nomor ${(page - 1) * POSTS_PER_PAGE + i + 1}`,
    slug: `artikel-tag-${tagSlug}-${(page - 1) * POSTS_PER_PAGE + i + 1}`,
    excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
    featuredImage: null,
    publishedAt: new Date(Date.now() - i * 3600000),
    author: { displayName: "Admin" },
    categories: [{ category: { name: "Berita", slug: "berita" } }],
  }))

  return {
    posts: mockPosts,
    totalCount: 28,
    totalPages: Math.ceil(28 / POSTS_PER_PAGE),
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tag = await getTag(slug)

  if (!tag) {
    return { title: "Tag Tidak Ditemukan" }
  }

  return {
    title: `Tag: ${tag.name} - Artikel Terkait`,
    description: `Kumpulan artikel dengan tag ${tag.name}`,
  }
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1

  const tag = await getTag(slug)

  if (!tag) {
    notFound()
  }

  const { posts, totalCount, totalPages } = await getPostsByTag(slug, page)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="w-6 h-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <h1 className="text-3xl font-bold text-gray-900">
            {tag.name}
          </h1>
        </div>
        <p className="text-gray-600">
          Kumpulan artikel dengan tag &quot;{tag.name}&quot;
        </p>
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
                basePath={`/tag/${slug}`}
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
                Belum ada artikel dengan tag ini
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
