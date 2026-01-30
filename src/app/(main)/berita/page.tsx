import Link from 'next/link'
import { Sidebar, SidebarWidget, SidebarAd } from '@/components/layout'
import { PostCard } from '@/components/posts'
import { db, posts, categories, postCategories, users, eq, and, desc, count, sql, asc } from '@/db'
import {
  generateCollectionSchema,
  generateBreadcrumbSchema,
  getCanonicalUrl,
} from '@/lib/seo'

// Force dynamic rendering to fetch data at runtime
export const dynamic = 'force-dynamic'

// Fetch all published posts
async function getAllPosts() {
  try {
    const allPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'PUBLISHED'))
      .orderBy(desc(posts.publishedAt))
      .limit(11)

    return Promise.all(allPosts.map(async (post) => {
      const cats = await db
        .select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(categories)
        .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
        .where(eq(postCategories.postId, post.id))
        .limit(1)

      const [author] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, post.authorId))
        .limit(1)

      return { ...post, categories: cats, author: author || { name: 'Unknown' } }
    }))
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return []
  }
}

// Fetch popular posts with rolling algorithm
async function getPopularPosts(excludeIds: string[] = [], limit: number = 5) {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // First, try to get popular posts from the last 7 days
    const recentPopular = await db
      .select()
      .from(posts)
      .where(and(
        eq(posts.status, 'PUBLISHED'),
        sql`${posts.publishedAt} >= ${sevenDaysAgo}`
      ))
      .orderBy(desc(posts.viewCount))
      .limit(limit)

    const filteredRecent = recentPopular.filter(p => !excludeIds.includes(p.id))

    // Add categories
    const recentWithCats = await Promise.all(filteredRecent.map(async (post) => {
      const cats = await db
        .select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(categories)
        .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
        .where(eq(postCategories.postId, post.id))
        .limit(1)
      return { ...post, categories: cats }
    }))

    if (recentWithCats.length >= limit) {
      return recentWithCats.slice(0, limit)
    }

    // Otherwise, fill with all-time popular posts
    const existingIds = [...excludeIds, ...recentPopular.map(p => p.id)]
    const allTimePopular = await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'PUBLISHED'))
      .orderBy(desc(posts.viewCount))
      .limit(limit * 2)

    const filteredAllTime = allTimePopular.filter(p => !existingIds.includes(p.id)).slice(0, limit - recentWithCats.length)

    const allTimeWithCats = await Promise.all(filteredAllTime.map(async (post) => {
      const cats = await db
        .select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(categories)
        .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
        .where(eq(postCategories.postId, post.id))
        .limit(1)
      return { ...post, categories: cats }
    }))

    return [...recentWithCats, ...allTimeWithCats]
  } catch (error) {
    console.error('Failed to fetch popular posts:', error)
    return []
  }
}

// Fetch all categories for sidebar
async function getAllCategories() {
  try {
    const allCats = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name))

    return Promise.all(allCats.map(async (cat) => {
      const [result] = await db
        .select({ count: count() })
        .from(postCategories)
        .where(eq(postCategories.categoryId, cat.id))
      return { ...cat, _count: { posts: result?.count || 0 } }
    }))
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

// Get total post count
async function getTotalPostCount() {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.status, 'PUBLISHED'))
    return result?.count || 0
  } catch (error) {
    console.error('Failed to count posts:', error)
    return 0
  }
}

export async function generateMetadata() {
  const title = 'Semua Berita - Kilas Indonesia'
  const description = 'Kumpulan berita terbaru dari berbagai kategori di Kilas Indonesia. Dapatkan informasi terkini seputar nasional, politik, ekonomi, olahraga, dan lainnya.'
  const canonicalUrl = getCanonicalUrl('/berita')

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'Kilas Indonesia',
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@kilasindonesia',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function BeritaPage() {
  // Fetch posts first
  const allPosts = await getAllPosts()

  // Featured post is the newest one
  const featuredPost = allPosts[0]
  const remainingPosts = allPosts.slice(1)

  // Exclude featured from popular
  const excludeIds = featuredPost ? [featuredPost.id] : []

  // Fetch other data in parallel
  const [sidebarPopularPosts, allCategories, totalCount] = await Promise.all([
    getPopularPosts(excludeIds, 5),
    getAllCategories(),
    getTotalPostCount(),
  ])

  // Generate JSON-LD schemas
  const collectionSchema = generateCollectionSchema(
    'archive',
    'Semua Berita',
    'berita',
    'Kumpulan berita terbaru dari berbagai kategori',
    totalCount,
    allPosts.slice(0, 10).map((p) => ({ slug: p.slug, title: p.title }))
  )

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: getCanonicalUrl('/') },
    { name: 'Semua Berita', url: getCanonicalUrl('/berita') },
  ])

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

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
                <li className="text-gray-900 font-medium">Semua Berita</li>
              </ol>
            </nav>

            {allPosts.length > 0 ? (
              <>
                {/* Featured Article */}
                {featuredPost && (
                  <section className="mb-6">
                    <PostCard
                      id={featuredPost.id}
                      title={featuredPost.title}
                      slug={featuredPost.slug}
                      excerpt={featuredPost.excerpt}
                      featuredImage={featuredPost.featuredImage}
                      category={featuredPost.categories[0]}
                      publishedAt={featuredPost.publishedAt}
                      variant="featured"
                    />
                  </section>
                )}

                {/* Remaining Posts List */}
                {remainingPosts.length > 0 && (
                  <div className="space-y-4">
                    {remainingPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        slug={post.slug}
                        excerpt={post.excerpt}
                        featuredImage={post.featuredImage}
                        category={post.categories[0]}
                        author={post.author}
                        publishedAt={post.publishedAt}
                        viewCount={post.viewCount}
                        variant="horizontal"
                      />
                    ))}

                    {/* Load More Button */}
                    {allPosts.length >= 11 && (
                      <div className="mt-8 text-center">
                        <button className="btn btn-primary">
                          Muat Lebih Banyak
                          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
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
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Belum Ada Artikel
                </h3>
                <p className="text-gray-500 mb-6">
                  Belum ada artikel yang dipublikasikan. Silakan cek kembali nanti.
                </p>
                <Link href="/" className="btn btn-outline">
                  Kembali ke Beranda
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar>
            {/* Popular Posts Widget */}
            <SidebarWidget title="Berita Populer">
              <div className="space-y-4">
                {sidebarPopularPosts.map((post, index) => (
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
                {allCategories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors group"
                    >
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-xs bg-gray-100 group-hover:bg-primary-100 text-gray-600 group-hover:text-primary-700 px-2 py-1 rounded-full transition-colors">
                        {cat._count.posts}
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
    </>
  )
}
