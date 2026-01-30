import { NextRequest, NextResponse } from 'next/server'
import { db, posts, categories, postCategories, eq, and, desc, inArray, sql } from '@/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categories: categorySlugs = [], excludeIds = [] } = body as {
      categories: string[]
      excludeIds: string[]
    }

    let recommendations: any[] = []

    if (categorySlugs.length > 0) {
      // Get category IDs
      const categoryResults = await db
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.slug, categorySlugs.slice(0, 3)))

      if (categoryResults.length > 0) {
        const categoryIds = categoryResults.map(c => c.id)

        // Get post IDs in those categories
        const postIdsInCategories = await db
          .select({ postId: postCategories.postId })
          .from(postCategories)
          .where(inArray(postCategories.categoryId, categoryIds))

        const validPostIds = [...new Set(postIdsInCategories.map(p => p.postId))]
          .filter(id => !excludeIds.includes(id))

        if (validPostIds.length > 0) {
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
              inArray(posts.id, validPostIds.slice(0, 20)),
              eq(posts.status, 'PUBLISHED')
            ))
            .orderBy(desc(posts.viewCount), desc(posts.publishedAt))
            .limit(3)

          // Get first category for each post
          recommendations = await Promise.all(
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
        }
      }
    }

    // If not enough recommendations, fill with popular posts
    if (recommendations.length < 3) {
      const existingIds = [...excludeIds, ...recommendations.map(r => r.id)]

      const additionalPosts = await db
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
        .limit(3 - recommendations.length)

      // Get first category for each post
      const additionalWithCategories = await Promise.all(
        additionalPosts.map(async (post) => {
          const [cat] = await db
            .select({ id: categories.id, name: categories.name, slug: categories.slug })
            .from(categories)
            .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
            .where(eq(postCategories.postId, post.id))
            .limit(1)
          return { ...post, categories: cat ? [cat] : [] }
        })
      )

      recommendations = [...recommendations, ...additionalWithCategories]
    }

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Failed to fetch recommendations:', error)
    return NextResponse.json({ recommendations: [] })
  }
}
