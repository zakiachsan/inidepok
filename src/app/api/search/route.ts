import { NextRequest, NextResponse } from 'next/server'
import { db, posts, users, categories, postCategories, eq, and, or, ilike, desc, count } from '@/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ posts: [], pagination: { total: 0 } })
    }

    const offset = (page - 1) * limit
    const searchTerm = query.trim()

    const conditions = and(
      eq(posts.status, 'PUBLISHED'),
      or(
        ilike(posts.title, `%${searchTerm}%`),
        ilike(posts.excerpt, `%${searchTerm}%`),
        ilike(posts.content, `%${searchTerm}%`)
      )
    )

    // Get posts
    const postsResult = await db
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
        authorAvatar: users.avatar,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(conditions)
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(conditions)

    const total = countResult?.count || 0

    // Get categories for each post
    const postsWithRelations = await Promise.all(
      postsResult.map(async (post) => {
        const postCats = await db
          .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          })
          .from(categories)
          .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
          .where(eq(postCategories.postId, post.id))
          .limit(1)

        return {
          ...post,
          author: {
            id: post.authorId,
            name: post.authorName,
            avatar: post.authorAvatar,
          },
          categories: postCats,
        }
      })
    )

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      posts: postsWithRelations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error('Error searching posts:', error)
    return NextResponse.json(
      { error: 'Failed to search posts' },
      { status: 500 }
    )
  }
}
