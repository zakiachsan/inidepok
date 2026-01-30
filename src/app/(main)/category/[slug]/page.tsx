import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sidebar, SidebarWidget, SidebarAd } from '@/components/layout'
import { PostCard } from '@/components/posts'
import { db, categories, posts, postCategories, users, eq, and, desc, count, inArray, sql } from '@/db'
import {
  generateCollectionSchema,
  generateBreadcrumbSchema,
  getCanonicalUrl,
} from '@/lib/seo'

// Force dynamic rendering to fetch data at runtime
export const dynamic = 'force-dynamic'

// Fetch category by slug
async function getCategory(slug: string) {
  try {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1)

    if (!category) return null

    // Get post count
    const [result] = await db
      .select({ count: count() })
      .from(postCategories)
      .where(eq(postCategories.categoryId, category.id))

    return { ...category, _count: { posts: result?.count || 0 } }
  } catch (error) {
    console.error('Failed to fetch category:', error)
    return null
  }
}

// Fetch posts by category
async function getCategoryPosts(categoryId: string) {
  try {
    // Get post IDs for this category
    const postIds = await db
      .select({ postId: postCategories.postId })
      .from(postCategories)
      .where(eq(postCategories.categoryId, categoryId))

    if (postIds.length === 0) return []

    const ids = postIds.map(p => p.postId)

    // Get published posts
    const categoryPosts = await db
      .select()
      .from(posts)
      .where(and(
        inArray(posts.id, ids),
        eq(posts.status, 'PUBLISHED')
      ))
      .orderBy(desc(posts.publishedAt))
      .limit(11)

    // Get categories and author for each post
    return Promise.all(categoryPosts.map(async (post) => {
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
    console.error('Failed to fetch category posts:', error)
    return []
  }
}

// Fetch popular posts in category with rolling algorithm
async function getPopularInCategory(categoryId: string, excludeIds: string[] = []) {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get post IDs for this category
    const postIds = await db
      .select({ postId: postCategories.postId })
      .from(postCategories)
      .where(eq(postCategories.categoryId, categoryId))

    if (postIds.length === 0) return []

    const ids = postIds.map(p => p.postId).filter(id => !excludeIds.includes(id))
    if (ids.length === 0) return []

    // First, try to get popular posts from the last 7 days
    const recentPopular = await db
      .select()
      .from(posts)
      .where(and(
        inArray(posts.id, ids),
        eq(posts.status, 'PUBLISHED'),
        sql`${posts.publishedAt} >= ${sevenDaysAgo}`
      ))
      .orderBy(desc(posts.viewCount))
      .limit(3)

    // Add categories to each post
    const recentWithCats = await Promise.all(recentPopular.map(async (post) => {
      const cats = await db
        .select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(categories)
        .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
        .where(eq(postCategories.postId, post.id))
        .limit(1)
      return { ...post, categories: cats }
    }))

    if (recentWithCats.length >= 3) {
      return recentWithCats
    }

    // Otherwise, fill with all-time popular posts
    const existingIds = [...excludeIds, ...recentPopular.map(p => p.id)]
    const remainingIds = ids.filter(id => !existingIds.includes(id))

    if (remainingIds.length === 0) return recentWithCats

    const allTimePopular = await db
      .select()
      .from(posts)
      .where(and(
        inArray(posts.id, remainingIds),
        eq(posts.status, 'PUBLISHED')
      ))
      .orderBy(desc(posts.viewCount))
      .limit(3 - recentWithCats.length)

    const allTimeWithCats = await Promise.all(allTimePopular.map(async (post) => {
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
    console.error('Failed to fetch popular posts in category:', error)
    return []
  }
}

// Fetch popular posts for sidebar with rolling algorithm
async function getPopularPosts() {
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
      .limit(5)

    if (recentPopular.length >= 5) {
      return recentPopular
    }

    // Otherwise, fill with all-time popular posts
    const existingIds = recentPopular.map(p => p.id)

    let allTimePopular: typeof recentPopular = []
    if (existingIds.length > 0) {
      allTimePopular = await db
        .select()
        .from(posts)
        .where(and(
          eq(posts.status, 'PUBLISHED'),
          sql`${posts.id} NOT IN (${existingIds.map(id => `'${id}'`).join(',')})`
        ))
        .orderBy(desc(posts.viewCount))
        .limit(5 - recentPopular.length)
    } else {
      allTimePopular = await db
        .select()
        .from(posts)
        .where(eq(posts.status, 'PUBLISHED'))
        .orderBy(desc(posts.viewCount))
        .limit(5)
    }

    return [...recentPopular, ...allTimePopular]
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
      .orderBy(categories.name)

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

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const category = await getCategory(slug)

  if (!category) {
    return {
      title: 'Kategori Tidak Ditemukan',
    }
  }

  const title = `${category.name} - Berita Terbaru`
  const description = category.description || `Kumpulan berita terbaru tentang ${category.name} di Kilas Indonesia`
  const canonicalUrl = getCanonicalUrl(`/category/${slug}`)

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${category.name} | Kilas Indonesia`,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'Kilas Indonesia',
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | Kilas Indonesia`,
      description,
      site: '@kilasindonesia',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const category = await getCategory(slug)

  if (!category) {
    notFound()
  }

  // Fetch posts first to get featured post ID
  const categoryPosts = await getCategoryPosts(category.id)

  // Featured post is the newest one
  const featuredPost = categoryPosts[0]
  const remainingPosts = categoryPosts.slice(1)

  // Fetch popular posts in category (excluding featured)
  const excludeIds = featuredPost ? [featuredPost.id] : []

  // Fetch popular posts and categories in parallel
  const [popularInCategory, popularPosts, allCategories] = await Promise.all([
    getPopularInCategory(category.id, excludeIds),
    getPopularPosts(),
    getAllCategories(),
  ])

  // Generate JSON-LD schemas
  const collectionSchema = generateCollectionSchema(
    'category',
    category.name,
    category.slug,
    category.description,
    category._count.posts,
    categoryPosts.map((p) => ({ slug: p.slug, title: p.title }))
  )

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: getCanonicalUrl('/') },
    { name: category.name, url: getCanonicalUrl(`/category/${category.slug}`) },
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
                <li className="text-gray-900 font-medium">{category.name}</li>
              </ol>
            </nav>

            {categoryPosts.length > 0 ? (
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
                      category={featuredPost.categories[0] || { name: category.name, slug: category.slug }}
                      publishedAt={featuredPost.publishedAt}
                      variant="featured"
                    />
                  </section>
                )}

                {/* Terpopuler di Category */}
                {popularInCategory.length > 0 && (
                  <section className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" />
                      </svg>
                      Terpopuler di {category.name}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {popularInCategory.map((post) => (
                        <PostCard
                          key={post.id}
                          id={post.id}
                          title={post.title}
                          slug={post.slug}
                          featuredImage={post.featuredImage}
                          publishedAt={post.publishedAt}
                          variant="small"
                        />
                      ))}
                    </div>
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
                        category={post.categories[0] || { name: category.name, slug: category.slug }}
                        author={post.author}
                        publishedAt={post.publishedAt}
                        viewCount={post.viewCount}
                        variant="horizontal"
                      />
                    ))}

                    {/* Load More Button */}
                    {categoryPosts.length >= 11 && (
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
                  Belum ada artikel dalam kategori ini. Silakan cek kembali nanti.
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
            <SidebarWidget title="Kategori Lainnya">
              <ul className="space-y-1">
                {allCategories
                  .filter((c) => c.slug !== slug)
                  .map((cat) => (
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
