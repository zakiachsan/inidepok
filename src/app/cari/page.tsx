import { Metadata } from "next"
import { Sidebar } from "@/components/layout"
import { PostCard } from "@/components/post"
import { Pagination, SearchBox } from "@/components/ui"

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

const POSTS_PER_PAGE = 10

// Mock data - TODO: Replace with Prisma queries
async function searchPosts(query: string, page: number) {
  if (!query) {
    return { posts: [], totalCount: 0, totalPages: 0 }
  }

  const mockPosts = Array.from({ length: Math.min(POSTS_PER_PAGE, 15 - (page - 1) * POSTS_PER_PAGE) }, (_, i) => ({
    id: (page - 1) * POSTS_PER_PAGE + i + 1,
    title: `Hasil pencarian "${query}" - Artikel ${(page - 1) * POSTS_PER_PAGE + i + 1}`,
    slug: `hasil-pencarian-${(page - 1) * POSTS_PER_PAGE + i + 1}`,
    excerpt: `Artikel ini berisi informasi tentang ${query}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    featuredImage: null,
    publishedAt: new Date(Date.now() - i * 7200000),
    author: { displayName: "Admin" },
    categories: [{ category: { name: "Berita", slug: "berita" } }],
  }))

  return {
    posts: mockPosts,
    totalCount: 15,
    totalPages: Math.ceil(15 / POSTS_PER_PAGE),
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams

  return {
    title: q ? `Hasil Pencarian: ${q}` : "Pencarian",
    description: q ? `Hasil pencarian untuk "${q}"` : "Cari artikel di IniDepok",
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams
  const page = Number(pageParam) || 1
  const query = q || ""

  const { posts, totalCount, totalPages } = await searchPosts(query, page)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Pencarian
        </h1>
        <div className="max-w-xl">
          <SearchBox defaultValue={query} />
        </div>
        {query && (
          <p className="text-gray-600 mt-4">
            {totalCount > 0 ? (
              <>
                Ditemukan <strong>{totalCount}</strong> hasil untuk{" "}
                <strong>&quot;{query}&quot;</strong>
              </>
            ) : (
              <>
                Tidak ada hasil untuk <strong>&quot;{query}&quot;</strong>
              </>
            )}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {!query ? (
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-gray-500">
                Masukkan kata kunci untuk mencari artikel
              </p>
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} variant="horizontal" />
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath={`/cari?q=${encodeURIComponent(query)}`}
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500 mb-4">
                Tidak ditemukan artikel yang sesuai
              </p>
              <p className="text-sm text-gray-400">
                Coba gunakan kata kunci yang berbeda
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
