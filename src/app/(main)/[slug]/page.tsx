import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sidebar, SidebarWidget, SidebarAd } from '@/components/layout'
import { PostCard } from '@/components/posts'
import { ReadingTracker } from '../../../components/posts/ReadingTracker'
import { db, posts, users, categories, tags, comments, postCategories, postTags, eq, and, desc, sql, inArray, count, asc } from '@/db'
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
  calculateReadingTime,
  getCanonicalUrl,
} from '@/lib/seo'

// Force dynamic rendering to fetch data at runtime
export const dynamic = 'force-dynamic'

// Fetch post by slug
async function getPost(slug: string) {
  try {
    const [post] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1)
    if (!post) return null

    // Get author
    const [author] = await db
      .select({ name: users.name, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, post.authorId))
      .limit(1)

    // Get categories
    const postCats = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
      .where(eq(postCategories.postId, post.id))

    // Get tags
    const postTagsList = await db
      .select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(tags)
      .innerJoin(postTags, eq(tags.id, postTags.tagId))
      .where(eq(postTags.postId, post.id))

    // Get approved comments
    const approvedComments = await db
      .select()
      .from(comments)
      .where(and(eq(comments.postId, post.id), eq(comments.status, 'APPROVED')))
      .orderBy(desc(comments.createdAt))
      .limit(20)

    return {
      ...post,
      author: author || { name: 'Unknown', avatar: null },
      categories: postCats,
      tags: postTagsList,
      comments: approvedComments,
    }
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return null
  }
}

// Fetch related posts (same category)
async function getRelatedPosts(postId: string, categoryIds: string[]) {
  try {
    if (categoryIds.length === 0) return []

    const postIdsInCategories = await db
      .select({ postId: postCategories.postId })
      .from(postCategories)
      .where(inArray(postCategories.categoryId, categoryIds))

    const validPostIds = [...new Set(postIdsInCategories.map(p => p.postId))]
      .filter(id => id !== postId)

    if (validPostIds.length === 0) return []

    const relatedPosts = await db
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
        inArray(posts.id, validPostIds.slice(0, 10)),
        eq(posts.status, 'PUBLISHED')
      ))
      .orderBy(desc(posts.publishedAt))
      .limit(3)

    // Get first category for each post
    return Promise.all(
      relatedPosts.map(async (post) => {
        const [cat] = await db
          .select({ id: categories.id, name: categories.name, slug: categories.slug })
          .from(categories)
          .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
          .where(eq(postCategories.postId, post.id))
          .limit(1)
        return { ...post, categories: cat ? [cat] : [] }
      })
    )
  } catch (error) {
    console.error('Failed to fetch related posts:', error)
    return []
  }
}

// Fetch popular posts for sidebar
async function getPopularPosts() {
  try {
    return db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        viewCount: posts.viewCount,
      })
      .from(posts)
      .where(eq(posts.status, 'PUBLISHED'))
      .orderBy(desc(posts.viewCount))
      .limit(5)
  } catch (error) {
    console.error('Failed to fetch popular posts:', error)
    return []
  }
}

// Fetch categories for sidebar
async function getCategories() {
  try {
    const allCategories = await db.select().from(categories).orderBy(asc(categories.name))

    return Promise.all(
      allCategories.map(async (cat) => {
        const [result] = await db
          .select({ count: count() })
          .from(postCategories)
          .innerJoin(posts, eq(postCategories.postId, posts.id))
          .where(and(eq(postCategories.categoryId, cat.id), eq(posts.status, 'PUBLISHED')))
        return { ...cat, _count: { posts: result?.count || 0 } }
      })
    )
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

// Increment view count
async function incrementViewCount(postId: string) {
  try {
    await db.update(posts).set({ viewCount: sql`${posts.viewCount} + 1` }).where(eq(posts.id, postId))
  } catch (error) {
    console.error('Failed to increment view count:', error)
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} menit yang lalu`
  if (diffHours < 24) return `${diffHours} jam yang lalu`
  if (diffDays < 7) return `${diffDays} hari yang lalu`
  return formatDate(date)
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) return { title: 'Artikel Tidak Ditemukan' }

  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 160)
  const canonicalUrl = getCanonicalUrl(`/${slug}`)
  const imageUrl = post.featuredImage || '/og-image.jpg'

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'Kilas Indonesia',
      locale: 'id_ID',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: [post.author.name],
      section: post.categories[0]?.name || 'Berita',
      tags: post.tags?.map((tag) => tag.name) || [],
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@kilasindonesia',
      site: '@kilasindonesia',
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post || post.status !== 'PUBLISHED') notFound()

  await incrementViewCount(post.id)

  const categoryIds = post.categories.map((c) => c.id)
  const [relatedPosts, popularPosts, allCategories] = await Promise.all([
    getRelatedPosts(post.id, categoryIds),
    getPopularPosts(),
    getCategories(),
  ])

  const primaryCategory = post.categories[0] || { name: 'Berita', slug: 'berita' }
  const readingTime = calculateReadingTime(post.content)

  const articleSchema = generateArticleSchema(post)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: getCanonicalUrl('/') },
    { name: primaryCategory.name, url: getCanonicalUrl(`/category/${primaryCategory.slug}`) },
    { name: post.title, url: getCanonicalUrl(`/${post.slug}`) },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ReadingTracker postId={post.id} slug={post.slug} categorySlug={primaryCategory.slug} />

      <div className="container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <article className="flex-1">
            {/* Breadcrumb */}
            <nav className="mb-4 text-sm">
              <ol className="flex items-center gap-2 text-gray-500">
                <li><Link href="/" className="hover:text-primary-600">Beranda</Link></li>
                <li>/</li>
                <li><Link href={`/category/${primaryCategory.slug}`} className="hover:text-primary-600">{primaryCategory.name}</Link></li>
                <li>/</li>
                <li className="text-gray-700 truncate max-w-[200px]">{post.title}</li>
              </ol>
            </nav>

            {/* Article Header */}
            <header className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Link href={`/category/${primaryCategory.slug}`} className="category-badge">{primaryCategory.name}</Link>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span>{post.author.name}</span>
                </div>
                <span>•</span>
                <time dateTime={post.publishedAt?.toISOString()}>{post.publishedAt ? formatDateTime(post.publishedAt) : '-'}</time>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {readingTime} menit baca
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.viewCount.toLocaleString('id-ID')} views
                </span>
              </div>
            </header>

            {/* Featured Image */}
            {post.featuredImage ? (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img src={post.featuredImage} alt={post.title} className="w-full h-auto" />
              </div>
            ) : (
              <div className="mb-6 aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-lg max-w-none mb-8" dangerouslySetInnerHTML={{ __html: post.content }} />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-500 font-medium">Tags:</span>
                  {post.tags.map((tag) => (
                    <Link key={tag.slug} href={`/tag/${tag.slug}`} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors">
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Share Buttons */}
            <div className="mb-8 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 font-medium">Bagikan:</span>
                <div className="flex gap-2">
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://kilasindonesia.com/${post.slug}`)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </a>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://kilasindonesia.com/${post.slug}`)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                  </a>
                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' - https://kilasindonesia.com/' + post.slug)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Author Box */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                  {post.author.avatar ? (
                    <img src={post.author.avatar} alt={post.author.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{post.author.name}</h3>
                  <p className="text-sm text-gray-600">Penulis di Kilas Indonesia. Menghadirkan berita terkini dan terpercaya untuk pembaca setia.</p>
                </div>
              </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary-600 rounded"></span>
                  Berita Terkait
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedPosts.map((relatedPost) => (
                    <PostCard
                      key={relatedPost.id}
                      id={relatedPost.id}
                      title={relatedPost.title}
                      slug={relatedPost.slug}
                      excerpt={relatedPost.excerpt}
                      featuredImage={relatedPost.featuredImage}
                      category={relatedPost.categories[0] || { name: 'Berita', slug: 'berita' }}
                      publishedAt={relatedPost.publishedAt}
                      viewCount={relatedPost.viewCount}
                      variant="compact"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Comments Section */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary-600 rounded"></span>
                Komentar ({post.comments.length})
              </h2>

              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Tinggalkan Komentar</h3>
                <form action={`/api/comments`} method="POST" className="space-y-4">
                  <input type="hidden" name="postId" value={post.id} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                      <input type="text" id="name" name="authorName" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" id="email" name="authorEmail" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Komentar *</label>
                    <textarea id="comment" name="content" rows={4} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">Kirim Komentar</button>
                </form>
              </div>

              {post.comments.length > 0 ? (
                <div className="space-y-4">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                          <span className="text-gray-500 font-medium">{comment.authorName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{comment.authorName}</span>
                            <span className="text-xs text-gray-500">{formatRelativeTime(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-gray-500">Belum ada komentar. Jadilah yang pertama berkomentar!</p>
                </div>
              )}
            </section>
          </article>

          {/* Sidebar */}
          <Sidebar>
            <SidebarWidget title="Berita Populer">
              <div className="space-y-4">
                {popularPosts.map((sidebarPost, index) => (
                  <div key={sidebarPost.id} className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded flex items-center justify-center font-bold text-sm">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">
                        <Link href={`/${sidebarPost.slug}`}>{sidebarPost.title}</Link>
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{sidebarPost.viewCount.toLocaleString('id-ID')} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </SidebarWidget>

            <SidebarAd height={250} />

            <SidebarWidget title="Kategori">
              <ul className="space-y-2">
                {allCategories.map((category) => (
                  <li key={category.slug}>
                    <Link href={`/category/${category.slug}`} className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 transition-colors">
                      <span className="text-sm text-gray-700">{category.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{category._count.posts}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SidebarWidget>

            <SidebarAd height={300} />
          </Sidebar>
        </div>
      </div>
    </>
  )
}
