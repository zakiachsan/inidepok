import Link from 'next/link'
import { db, posts, users, categories, postCategories, eq, asc, count, ilike, or, and } from '@/db'
import { auth } from '@/lib/auth'
import ScheduledPostsTable from './components/ScheduledPostsTable'

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

async function getScheduledPosts(page = 1, search?: string) {
  const limit = 10
  const skip = (page - 1) * limit

  try {
    // Build conditions - only SCHEDULED posts
    const conditions = [eq(posts.status, 'SCHEDULED')]

    if (search) {
      conditions.push(or(
        ilike(posts.title, `%${search}%`),
        ilike(posts.excerpt, `%${search}%`)
      )!)
    }

    const whereClause = and(...conditions)

    // Get posts ordered by scheduledAt ASC (nearest first)
    const allPosts = await db
      .select()
      .from(posts)
      .where(whereClause)
      .orderBy(asc(posts.scheduledAt))
      .limit(limit)
      .offset(skip)

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
          authorId: post.authorId,
          categories: postCats,
        }
      })
    )

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(whereClause)
    const total = totalResult?.count || 0

    return {
      posts: postsWithRelations,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    }
  } catch (error) {
    console.error('Failed to fetch scheduled posts:', error)
    return { posts: [], total: 0, totalPages: 0, currentPage: 1 }
  }
}

export default async function ScheduledPostsPage({ searchParams }: PageProps) {
  const session = await auth()
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const search = params.search

  const { posts: postsList, total, totalPages, currentPage } = await getScheduledPosts(page, search)

  const currentUser = {
    id: session?.user?.id || '',
    role: session?.user?.role || 'AUTHOR',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artikel Terjadwal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola artikel yang dijadwalkan untuk dipublikasi
          </p>
        </div>
        <Link
          href="/admin/scheduled/new"
          className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Jadwalkan Artikel
        </Link>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Search */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
          <form action="/admin/scheduled" method="GET" className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Cari artikel terjadwal..."
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
            {total} artikel terjadwal
          </div>
        </div>

        {/* Table */}
        <ScheduledPostsTable posts={postsList} currentUser={currentUser} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/admin/scheduled?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Sebelumnya
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/admin/scheduled?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}
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
