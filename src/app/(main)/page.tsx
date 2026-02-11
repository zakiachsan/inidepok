import Link from 'next/link'
import { BannerAd } from '@/components/ads'
import { PostCard, RecommendedPosts } from '@/components/posts'
import { db, posts, users, categories, postCategories, eq, and, desc, count, sql, asc } from '@/db'

// Force dynamic rendering to fetch data at runtime (not build time)
export const dynamic = 'force-dynamic'

// Fetch popular posts with rolling algorithm
async function getPopularPostsWithRolling() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Get popular posts from the last 7 days
  const recentPopular = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      featuredImage: posts.featuredImage,
      publishedAt: posts.publishedAt,
      viewCount: posts.viewCount,
    })
    .from(posts)
    .where(and(
      eq(posts.status, 'PUBLISHED'),
      sql`${posts.publishedAt} >= ${sevenDaysAgo}`
    ))
    .orderBy(desc(posts.viewCount))
    .limit(5)

  // Get first category for each post
  const recentWithCategories = await Promise.all(
    recentPopular.map(async (post) => {
      const [cat] = await db
        .select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(categories)
        .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
        .where(eq(postCategories.postId, post.id))
        .limit(1)
      return { ...post, categories: cat ? [cat] : [] }
    })
  )

  if (recentWithCategories.length >= 5) {
    return recentWithCategories
  }

  // Fill with all-time popular posts
  const existingIds = recentWithCategories.map(p => p.id)
  const remainingCount = 5 - recentWithCategories.length

  const allTimePopular = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      featuredImage: posts.featuredImage,
      publishedAt: posts.publishedAt,
      viewCount: posts.viewCount,
    })
    .from(posts)
    .where(and(
      eq(posts.status, 'PUBLISHED'),
      existingIds.length > 0 ? sql`${posts.id} NOT IN (${sql.join(existingIds.map(id => sql`${id}`), sql`, `)})` : sql`1=1`
    ))
    .orderBy(desc(posts.viewCount))
    .limit(remainingCount)

  const allTimeWithCategories = await Promise.all(
    allTimePopular.map(async (post) => {
      const [cat] = await db
        .select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(categories)
        .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
        .where(eq(postCategories.postId, post.id))
        .limit(1)
      return { ...post, categories: cat ? [cat] : [] }
    })
  )

  return [...recentWithCategories, ...allTimeWithCategories]
}

async function getHomeData() {
  try {
    // Get featured/pinned posts for "Berita Utama"
    const featuredPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        featuredImage: posts.featuredImage,
        publishedAt: posts.publishedAt,
        viewCount: posts.viewCount,
        pinnedOrder: posts.pinnedOrder,
      })
      .from(posts)
      .where(and(
        eq(posts.status, 'PUBLISHED'),
        eq(posts.isPinned, true)
      ))
      .orderBy(asc(posts.pinnedOrder))
      .limit(5)

    // Get first category for featured posts
    const featuredWithCategories = await Promise.all(
      featuredPosts.map(async (post) => {
        const [cat] = await db
          .select({ id: categories.id, name: categories.name, slug: categories.slug })
          .from(categories)
          .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
          .where(eq(postCategories.postId, post.id))
          .limit(1)
        return { ...post, categories: cat ? [cat] : [] }
      })
    )

    // Get recent posts
    const recentPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        featuredImage: posts.featuredImage,
        publishedAt: posts.publishedAt,
        viewCount: posts.viewCount,
        authorId: posts.authorId,
        authorName: users.name,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.status, 'PUBLISHED'))
      .orderBy(desc(posts.publishedAt))
      .limit(20)

    // Get first category for each post
    const postsWithCategories = await Promise.all(
      recentPosts.map(async (post) => {
        const [cat] = await db
          .select({ id: categories.id, name: categories.name, slug: categories.slug })
          .from(categories)
          .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
          .where(eq(postCategories.postId, post.id))
          .limit(1)
        return { ...post, categories: cat ? [cat] : [], author: { name: post.authorName } }
      })
    )

    // Get popular posts
    const popularPosts = await getPopularPostsWithRolling()

    // Get categories with post count
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name))

    const categoriesWithCount = await Promise.all(
      allCategories.map(async (cat) => {
        const [result] = await db
          .select({ count: count() })
          .from(postCategories)
          .innerJoin(posts, eq(postCategories.postId, posts.id))
          .where(and(
            eq(postCategories.categoryId, cat.id),
            eq(posts.status, 'PUBLISHED')
          ))
        return { ...cat, _count: { posts: result?.count || 0 } }
      })
    )

    return { posts: postsWithCategories, popularPosts, categories: categoriesWithCount, featuredPosts: featuredWithCategories }
  } catch (error) {
    console.error('Failed to fetch home data:', error)
    return { posts: [], popularPosts: [], categories: [], featuredPosts: [] }
  }
}

export default async function HomePage() {
  const { posts: allPosts, popularPosts, categories: allCategories, featuredPosts } = await getHomeData()

  const featuredPost = allPosts[0]
  // Berita Utama: Use admin-curated featured posts from CMS
  const topPosts = featuredPosts.slice(0, 4)
  // Berita Terbaru: Start from position #2 (skip featured)
  const firstBatchPosts = allPosts.slice(1, 6)
  const secondBatchPosts = allPosts.slice(6, 11)

  const currentPostIds = allPosts.map(p => p.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Banner Ad */}
      <div className="container py-4">
        <div className="flex justify-center">
          <BannerAd slot="header" width={970} height={250} />
        </div>
      </div>

      {/* Main Layout with Sidebar */}
      <div className="container pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
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

            {/* Berita Terpopuler - Mobile Only */}
            {popularPosts.length > 0 && (
              <section className="mb-6 lg:hidden">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" />
                  </svg>
                  Berita Terpopuler
                </h2>
                <div className="bg-white rounded-xl shadow-sm px-4">
                  {popularPosts.slice(0, 5).map((post) => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      slug={post.slug}
                      featuredImage={post.featuredImage}
                      publishedAt={post.publishedAt}
                      variant="list"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Berita Utama */}
            {topPosts.length > 0 && (
              <section className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                  </svg>
                  Berita Utama
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {topPosts.map((post, index) => (
                    <div key={post.id} className={index === 3 ? 'lg:hidden' : ''}>
                      <PostCard
                        id={post.id}
                        title={post.title}
                        slug={post.slug}
                        featuredImage={post.featuredImage}
                        variant="small"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Berita Terbaru Section */}
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Berita Terbaru
              </h2>

              {firstBatchPosts.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm px-4">
                  {firstBatchPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      slug={post.slug}
                      featuredImage={post.featuredImage}
                      category={post.categories[0]}
                      publishedAt={post.publishedAt}
                      variant="list"
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-white rounded-xl border border-gray-200">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <p className="text-gray-500">Belum ada artikel</p>
                </div>
              )}
            </section>

            {/* Rekomendasi untuk Anda */}
            <RecommendedPosts currentPostIds={currentPostIds} />

            {/* More News */}
            {secondBatchPosts.length > 0 && (
              <section className="mt-6">
                <div className="bg-white rounded-xl shadow-sm px-4">
                  {secondBatchPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      slug={post.slug}
                      featuredImage={post.featuredImage}
                      category={post.categories[0]}
                      publishedAt={post.publishedAt}
                      variant="list"
                    />
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <Link href="/berita" className="btn btn-primary">
                    Lihat Semua Berita
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - Desktop Only */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-32 space-y-6">
              {/* Popular Posts Widget */}
              <div className="widget-card">
                <div className="widget-header">
                  <h3>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" />
                    </svg>
                    Berita Terpopuler
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin">
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
                    {popularPosts.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">Belum ada data</p>
                    )}
                  </div>
                </div>
              </div>

              <BannerAd slot="sidebar" width={300} height={250} />

              {/* Categories Widget */}
              <div className="widget-card">
                <div className="widget-header">
                  <h3>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Kategori
                  </h3>
                </div>
                <div className="p-4">
                  <ul className="space-y-1">
                    {allCategories.map((category) => (
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
                </div>
              </div>

              <BannerAd slot="sidebar" width={300} height={250} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
