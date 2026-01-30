import Link from 'next/link'
import { db, posts, users, categories, postCategories, eq, desc, count, ilike, or, and } from '@/db'
import PostsTable from './components/PostsTable'

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string; search?: string }>
}

async function getPosts(status?: string, page = 1, search?: string) {
  const limit = 10
  const skip = (page - 1) * limit

  try {
    // Build conditions
    const conditions = []

    if (status && ['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(status.toUpperCase())) {
      conditions.push(eq(posts.status, status.toUpperCase() as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'))
    }

    if (search) {
      conditions.push(or(
        ilike(posts.title, `%${search}%`),
        ilike(posts.excerpt, `%${search}%`)
      ))
    }

    const whereClause = conditions.length > 0
      ? conditions.length === 1
        ? conditions[0]
        : and(...conditions)
      : undefined

    // Get posts
    const postsQuery = db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(skip)

    const allPosts = whereClause
      ? await postsQuery.where(whereClause)
      : await postsQuery

    // Add author and categories to each post
    const postsWithRelations = await Promise.all(
      allPosts.map(async (post) => {
        const [author] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, post.authorId))
          .limit(1)

        const postCats = await db
          .select({ name: categories.name, slug: categories.slug })
          .from(categories)
          .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
          .where(eq(postCategories.postId, post.id))
          .limit(1)

        return {
          ...post,
          author: author || { name: 'Unknown' },
          categories: postCats,
        }
      })
    )

    // Get total count
    const [totalResult] = whereClause
      ? await db.select({ count: count() }).from(posts).where(whereClause)
      : await db.select({ count: count() }).from(posts)
    const total = totalResult?.count || 0

    return {
      posts: postsWithRelations,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    }
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return { posts: [], total: 0, totalPages: 0, currentPage: 1 }
  }
}

export default async function PostsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status
  const page = parseInt(params.page || '1')
  const search = params.search

  const { posts: postsList, total, totalPages, currentPage } = await getPosts(status, page, search)

  const statusTabs = [
    { name: 'Semua', value: '', count: null },
    { name: 'Dipublikasi', value: 'published', count: null },
    { name: 'Draft', value: 'draft', count: null },
    { name: 'Arsip', value: 'archived', count: null },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artikel</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola semua artikel di website
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Artikel Baru
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Status Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {statusTabs.map((tab) => {
              const isActive = (status || '') === tab.value
              const href = tab.value
                ? `/admin/posts?status=${tab.value}`
                : '/admin/posts'

              return (
                <Link
                  key={tab.value}
                  href={href}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Search & Actions */}
        <div className="p-4 flex items-center justify-between gap-4">
          <form action="/admin/posts" method="GET" className="flex-1 max-w-md">
            {status && <input type="hidden" name="status" value={status} />}
            <div className="relative">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Cari artikel..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          <div className="text-sm text-gray-500">
            {total} artikel ditemukan
          </div>
        </div>

        {/* Posts Table */}
        <PostsTable posts={postsList} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/admin/posts?page=${currentPage - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Sebelumnya
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/admin/posts?page=${currentPage + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Selanjutnya
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
