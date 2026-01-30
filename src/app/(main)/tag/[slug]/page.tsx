import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sidebar, SidebarWidget, SidebarAd } from '@/components/layout'
import { PostCard } from '@/components/posts'
import { db, tags, posts, postTags, categories, postCategories, users, eq, and, desc, count, inArray, asc } from '@/db'
import {
  generateCollectionSchema,
  generateBreadcrumbSchema,
  getCanonicalUrl,
} from '@/lib/seo'

// Force dynamic rendering to fetch data at runtime
export const dynamic = 'force-dynamic'

// Fetch tag by slug
async function getTag(slug: string) {
  try {
    const [tag] = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1)

    if (!tag) return null

    // Get post count
    const [result] = await db
      .select({ count: count() })
      .from(postTags)
      .where(eq(postTags.tagId, tag.id))

    return { ...tag, _count: { posts: result?.count || 0 } }
  } catch (error) {
    console.error('Failed to fetch tag:', error)
    return null
  }
}

// Fetch posts by tag
async function getTagPosts(tagId: string) {
  try {
    // Get post IDs for this tag
    const postIds = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(eq(postTags.tagId, tagId))

    if (postIds.length === 0) return []

    const ids = postIds.map(p => p.postId)

    // Get published posts
    const tagPosts = await db
      .select()
      .from(posts)
      .where(and(
        inArray(posts.id, ids),
        eq(posts.status, 'PUBLISHED')
      ))
      .orderBy(desc(posts.publishedAt))
      .limit(20)

    // Get categories and author for each post
    return Promise.all(tagPosts.map(async (post) => {
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
    console.error('Failed to fetch tag posts:', error)
    return []
  }
}

// Fetch popular posts for sidebar
async function getPopularPosts() {
  try {
    return db
      .select()
      .from(posts)
      .where(eq(posts.status, 'PUBLISHED'))
      .orderBy(desc(posts.viewCount))
      .limit(5)
  } catch (error) {
    console.error('Failed to fetch popular posts:', error)
    return []
  }
}

// Fetch all tags for sidebar
async function getAllTags() {
  try {
    const allTags = await db
      .select()
      .from(tags)
      .orderBy(asc(tags.name))

    return Promise.all(allTags.map(async (tag) => {
      const [result] = await db
        .select({ count: count() })
        .from(postTags)
        .where(eq(postTags.tagId, tag.id))
      return { ...tag, _count: { posts: result?.count || 0 } }
    }))
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    return []
  }
}

// Fetch categories for sidebar
async function getCategories() {
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

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const tag = await getTag(slug)

  if (!tag) {
    return {
      title: 'Tag Tidak Ditemukan',
    }
  }

  const title = `#${tag.name} - Berita dan Artikel Terbaru`
  const description = `Kumpulan berita dan artikel dengan tag ${tag.name} di Kilas Indonesia`
  const canonicalUrl = getCanonicalUrl(`/tag/${slug}`)

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `#${tag.name} | Kilas Indonesia`,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'Kilas Indonesia',
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title: `#${tag.name} | Kilas Indonesia`,
      description,
      site: '@kilasindonesia',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params
  const tag = await getTag(slug)

  if (!tag) {
    notFound()
  }

  // Fetch posts, popular posts, tags, and categories in parallel
  const [tagPosts, popularPosts, allTags, categoriesList] = await Promise.all([
    getTagPosts(tag.id),
    getPopularPosts(),
    getAllTags(),
    getCategories(),
  ])

  // Generate JSON-LD schemas
  const collectionSchema = generateCollectionSchema(
    'tag',
    tag.name,
    tag.slug,
    `Kumpulan artikel dengan tag ${tag.name}`,
    tag._count.posts,
    tagPosts.map((p) => ({ slug: p.slug, title: p.title }))
  )

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: getCanonicalUrl('/') },
    { name: 'Tag', url: getCanonicalUrl('/tag') },
    { name: tag.name, url: getCanonicalUrl(`/tag/${tag.slug}`) },
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
                <li className="text-gray-500">Tag</li>
                <li>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </li>
                <li className="text-gray-900 font-medium">{tag.name}</li>
              </ol>
            </nav>

            {/* Tag Header */}
            <header className="mb-8">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-8 text-white relative overflow-hidden">
                {/* Decorative hash symbols */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-9xl font-bold text-white/5">
                  #
                </div>

                <div className="relative">
                  <span className="inline-block px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm font-medium mb-3">
                    Tag
                  </span>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl text-primary-400">#</span>
                    <h1 className="text-3xl md:text-4xl font-bold">
                      {tag.name}
                    </h1>
                  </div>
                  <p className="text-gray-300 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    {tag._count.posts} artikel dengan tag ini
                  </p>
                </div>
              </div>
            </header>

            {/* Posts List */}
            {tagPosts.length > 0 ? (
              <div className="space-y-4">
                {tagPosts.map((post) => (
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

                {/* Load More Button */}
                {tagPosts.length >= 20 && (
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
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Belum Ada Artikel
                </h3>
                <p className="text-gray-500 mb-6">
                  Belum ada artikel dengan tag ini. Silakan cek kembali nanti.
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

            {/* Tag Cloud Widget */}
            <SidebarWidget title="Tag Populer">
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 20).map((t) => (
                  <Link
                    key={t.slug}
                    href={`/tag/${t.slug}`}
                    className={`tag-badge ${
                      t.slug === slug
                        ? 'bg-primary-600 text-white border-primary-600'
                        : ''
                    }`}
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            </SidebarWidget>

            {/* Categories Widget */}
            <SidebarWidget title="Kategori">
              <ul className="space-y-1">
                {categoriesList.map((category) => (
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
    </>
  )
}
