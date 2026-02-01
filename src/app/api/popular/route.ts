import { NextRequest, NextResponse } from 'next/server'
import { db, posts, categories, postCategories, eq, desc, and, inArray, sql } from '@/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '5')

    const threeMonthsAgo = sql`NOW() - INTERVAL '3 months'`

    const postsResult = await db
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
        sql`${posts.publishedAt} >= ${threeMonthsAgo}`
      ))
      .orderBy(desc(posts.viewCount), desc(posts.publishedAt))
      .limit(limit)

    const postsWithCategories = await Promise.all(
      postsResult.map(async (post) => {
        const [cat] = await db
          .select({ id: categories.id, name: categories.name, slug: categories.slug })
          .from(categories)
          .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
          .where(eq(postCategories.postId, post.id))
          .limit(1)
        return { ...post, categories: cat ? [cat] : [] }
      })
    )

    return NextResponse.json({ posts: postsWithCategories })
  } catch (error) {
    console.error('Failed to fetch popular posts:', error)
    return NextResponse.json({ posts: [] })
  }
}
