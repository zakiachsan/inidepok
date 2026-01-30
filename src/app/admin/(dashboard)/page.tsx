import Link from 'next/link'
import { db, posts, categories, comments, users, postCategories, eq, desc, count } from '@/db'

async function getStats() {
  try {
    const [
      totalPostsResult,
      publishedPostsResult,
      draftPostsResult,
      totalCategoriesResult,
      totalCommentsResult,
      pendingCommentsResult,
      pinnedPostsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(posts),
      db.select({ count: count() }).from(posts).where(eq(posts.status, 'PUBLISHED')),
      db.select({ count: count() }).from(posts).where(eq(posts.status, 'DRAFT')),
      db.select({ count: count() }).from(categories),
      db.select({ count: count() }).from(comments),
      db.select({ count: count() }).from(comments).where(eq(comments.status, 'PENDING')),
      db.select({ count: count() }).from(posts).where(eq(posts.isPinned, true)),
    ])

    return {
      totalPosts: totalPostsResult[0]?.count || 0,
      publishedPosts: publishedPostsResult[0]?.count || 0,
      draftPosts: draftPostsResult[0]?.count || 0,
      totalCategories: totalCategoriesResult[0]?.count || 0,
      totalComments: totalCommentsResult[0]?.count || 0,
      pendingComments: pendingCommentsResult[0]?.count || 0,
      pinnedPosts: pinnedPostsResult[0]?.count || 0,
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return {
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      totalCategories: 0,
      totalComments: 0,
      pendingComments: 0,
      pinnedPosts: 0,
    }
  }
}

async function getRecentPosts() {
  try {
    const recentPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(5)

    return Promise.all(recentPosts.map(async (post) => {
      const [author] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, post.authorId))
        .limit(1)

      const postCats = await db
        .select({ name: categories.name })
        .from(categories)
        .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
        .where(eq(postCategories.postId, post.id))
        .limit(1)

      return {
        ...post,
        author: author || { name: 'Unknown' },
        categories: postCats,
      }
    }))
  } catch (error) {
    console.error('Failed to fetch recent posts:', error)
    return []
  }
}

async function getRecentComments() {
  try {
    const recentComments = await db
      .select()
      .from(comments)
      .orderBy(desc(comments.createdAt))
      .limit(5)

    return Promise.all(recentComments.map(async (comment) => {
      const [post] = await db
        .select({ title: posts.title, slug: posts.slug })
        .from(posts)
        .where(eq(posts.id, comment.postId))
        .limit(1)

      return {
        ...comment,
        post: post || { title: 'Unknown', slug: '#' },
      }
    }))
  } catch (error) {
    console.error('Failed to fetch recent comments:', error)
    return []
  }
}

export default async function AdminDashboard() {
  const [stats, recentPosts, recentComments] = await Promise.all([
    getStats(),
    getRecentPosts(),
    getRecentComments(),
  ])

  const statCards = [
    {
      name: 'Total Artikel',
      value: stats.totalPosts,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      color: 'bg-blue-500',
      href: '/admin/posts',
    },
    {
      name: 'Dipublikasi',
      value: stats.publishedPosts,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500',
      href: '/admin/posts?status=published',
    },
    {
      name: 'Berita Utama',
      value: stats.pinnedPosts,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      color: 'bg-orange-500',
      href: '/admin/posts/featured',
    },
    {
      name: 'Komentar Pending',
      value: stats.pendingComments,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'bg-red-500',
      href: '/admin/comments?status=pending',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/admin/posts/new"
          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Artikel Baru
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-md shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`${stat.color} text-white p-2 rounded-md`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] text-gray-500">{stat.name}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Posts */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Artikel Terbaru</h2>
            <Link href="/admin/posts" className="text-xs text-red-600 hover:text-red-700">
              Lihat Semua →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentPosts.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                Belum ada artikel
              </div>
            ) : (
              recentPosts.map((post) => (
                <div key={post.id} className="px-3 py-2 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium text-gray-900 truncate">
                        {post.title}
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {post.author.name} •{' '}
                        {new Date(post.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded flex-shrink-0 ${
                        post.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700'
                          : post.status === 'DRAFT'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {post.status === 'PUBLISHED'
                        ? 'Publik'
                        : post.status === 'DRAFT'
                        ? 'Draft'
                        : 'Arsip'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Comments */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Komentar Terbaru</h2>
            <Link href="/admin/comments" className="text-xs text-red-600 hover:text-red-700">
              Lihat Semua →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentComments.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                Belum ada komentar
              </div>
            ) : (
              recentComments.map((comment) => (
                <div key={comment.id} className="px-3 py-2 hover:bg-gray-50">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-[10px] font-medium">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900 text-xs">
                          {comment.authorName}
                        </span>
                        <span
                          className={`px-1 py-0.5 text-[9px] rounded ${
                            comment.status === 'APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : comment.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {comment.status === 'APPROVED'
                            ? 'OK'
                            : comment.status === 'PENDING'
                            ? 'Pending'
                            : 'Ditolak'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600 line-clamp-1 mt-0.5">
                        {comment.content}
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5">
                        pada &quot;{comment.post.title.substring(0, 25)}...&quot;
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
