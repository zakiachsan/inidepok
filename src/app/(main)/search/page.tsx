import Link from 'next/link'
import { Sidebar, SidebarWidget, SidebarAd } from '@/components/layout'
import { PostCard } from '@/components/posts'
import prisma from '@/lib/db'
import { getCanonicalUrl } from '@/lib/seo'

// Search posts by query
async function searchPosts(query: string) {
  if (!query) return []

  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        categories: { take: 1 },
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    })
    return posts
  } catch (error) {
    console.error('Failed to search posts:', error)
    return []
  }
}

// Fetch popular posts for sidebar
async function getPopularPosts() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { viewCount: 'desc' },
      take: 5,
    })
    return posts
  } catch (error) {
    console.error('Failed to fetch popular posts:', error)
    return []
  }
}

// Fetch categories for sidebar
async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: { name: 'asc' },
    })
    return categories
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

// Fetch popular tags
async function getPopularTags() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: 10,
    })
    return tags
  } catch (error) {
    console.error('Failed to fetch popular tags:', error)
    return []
  }
}

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams
  const canonicalUrl = getCanonicalUrl('/search')

  if (q) {
    return {
      title: `Hasil Pencarian: ${q}`,
      description: `Hasil pencarian untuk "${q}" di Kilas Indonesia`,
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: false,
        follow: true,
      },
    }
  }

  return {
    title: 'Pencarian',
    description: 'Cari berita dan artikel di Kilas Indonesia',
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = q?.trim() || ''

  // Fetch search results, popular posts, categories, and tags in parallel
  const [searchResults, popularPosts, categories, popularTags] = await Promise.all([
    searchPosts(query),
    getPopularPosts(),
    getCategories(),
    getPopularTags(),
  ])

  return (
    <div className="container py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-gray-500">
              <li>
                <Link href="/" className="hover:text-primary-600 transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li className="text-gray-900 font-medium">Pencarian</li>
            </ol>
          </nav>

          {/* Search Form */}
          <div className="mb-8">
            <form action="/search" method="GET">
              <div className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Ketik kata kunci pencarian..."
                  className="w-full px-5 py-4 pl-14 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg bg-white shadow-sm transition-all"
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary"
                >
                  Cari
                </button>
              </div>
            </form>
          </div>

          {/* Popular Tags for Suggestions */}
          {!query && popularTags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Pencarian Populer:</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/search?q=${encodeURIComponent(tag.name)}`}
                    className="tag-badge hover:bg-primary-600 hover:text-white hover:border-primary-600"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {query ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Hasil untuk &quot;{query}&quot;
                </h2>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((post) => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      slug={post.slug}
                      excerpt={post.excerpt}
                      featuredImage={post.featuredImage}
                      category={post.categories[0] || { name: 'Berita', slug: 'berita' }}
                      author={post.author}
                      publishedAt={post.publishedAt}
                      viewCount={post.viewCount}
                      variant="horizontal"
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <svg
                    className="w-20 h-20 mx-auto text-gray-300 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Tidak Ada Hasil
                  </h3>
                  <p className="text-gray-500 mb-2">
                    Tidak ada artikel yang cocok dengan &quot;{query}&quot;
                  </p>
                  <p className="text-sm text-gray-400 mb-6">
                    Coba gunakan kata kunci yang berbeda atau lebih umum.
                  </p>

                  {popularTags.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-3">Coba cari:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {popularTags.slice(0, 5).map((tag) => (
                          <Link
                            key={tag.slug}
                            href={`/search?q=${encodeURIComponent(tag.name)}`}
                            className="tag-badge"
                          >
                            {tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Cari Berita
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Masukkan kata kunci untuk mencari berita dan artikel. Anda dapat mencari berdasarkan judul, konten, atau topik.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar>
          {/* Popular Posts Widget */}
          <SidebarWidget title="Berita Populer">
            <div className="space-y-4">
              {popularPosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  slug={post.slug}
                  featuredImage={post.featuredImage}
                  publishedAt={post.publishedAt}
                  viewCount={post.viewCount}
                  variant="compact"
                  index={index}
                />
              ))}
            </div>
          </SidebarWidget>

          {/* Ad Placeholder */}
          <SidebarAd height={250} />

          {/* Categories Widget */}
          <SidebarWidget title="Kategori">
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors group"
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-xs bg-gray-100 group-hover:bg-primary-100 text-gray-600 group-hover:text-primary-700 px-2 py-1 rounded-full transition-colors">
                      {category._count.posts}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SidebarWidget>

          {/* Another Ad */}
          <SidebarAd height={300} />
        </Sidebar>
      </div>
    </div>
  )
}
