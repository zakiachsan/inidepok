import { NextRequest, NextResponse } from 'next/server'
import { db, posts, users, categories, tags, postCategories, postTags, eq, desc, and, or, ilike, sql, count } from '@/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // Build conditions
    const conditions = [eq(posts.status, 'PUBLISHED')]

    if (search) {
      conditions.push(
        or(
          ilike(posts.title, `%${search}%`),
          ilike(posts.excerpt, `%${search}%`)
        )!
      )
    }

    // Base query for posts
    let postsQuery = db
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
      .where(and(...conditions))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset)

    // If filtering by category
    if (category) {
      const categoryResult = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, category))
        .limit(1)

      if (categoryResult.length > 0) {
        const postIdsInCategory = await db
          .select({ postId: postCategories.postId })
          .from(postCategories)
          .where(eq(postCategories.categoryId, categoryResult[0].id))

        if (postIdsInCategory.length > 0) {
          const postIds = postIdsInCategory.map(p => p.postId)
          conditions.push(sql`${posts.id} IN (${sql.join(postIds.map(id => sql`${id}`), sql`, `)})`)
        } else {
          return NextResponse.json({
            posts: [],
            pagination: { page, limit, total: 0, totalPages: 0, hasMore: false },
          })
        }
      }
    }

    // If filtering by tag
    if (tag) {
      const tagResult = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, tag))
        .limit(1)

      if (tagResult.length > 0) {
        const postIdsWithTag = await db
          .select({ postId: postTags.postId })
          .from(postTags)
          .where(eq(postTags.tagId, tagResult[0].id))

        if (postIdsWithTag.length > 0) {
          const postIds = postIdsWithTag.map(p => p.postId)
          conditions.push(sql`${posts.id} IN (${sql.join(postIds.map(id => sql`${id}`), sql`, `)})`)
        } else {
          return NextResponse.json({
            posts: [],
            pagination: { page, limit, total: 0, totalPages: 0, hasMore: false },
          })
        }
      }
    }

    // Re-run query with updated conditions
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
      .where(and(...conditions))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(...conditions))

    const total = countResult?.count || 0

    // Get categories and tags for each post
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

        const postTagsList = await db
          .select({
            id: tags.id,
            name: tags.name,
            slug: tags.slug,
          })
          .from(tags)
          .innerJoin(postTags, eq(tags.id, postTags.tagId))
          .where(eq(postTags.postId, post.id))

        return {
          ...post,
          author: {
            id: post.authorId,
            name: post.authorName,
            avatar: post.authorAvatar,
          },
          categories: postCats,
          tags: postTagsList,
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
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
