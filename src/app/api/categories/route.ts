import { NextResponse } from 'next/server'
import { db, categories, postCategories, posts, eq, and, count, asc } from '@/db'

export async function GET() {
  try {
    // Get all categories
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name))

    // Get post counts for each category
    const categoriesWithCount = await Promise.all(
      allCategories.map(async (cat) => {
        const [result] = await db
          .select({ count: count() })
          .from(postCategories)
          .innerJoin(posts, eq(postCategories.postId, posts.id))
          .where(and(
            eq(postCategories.categoryId, cat.id),
            eq(posts.status, 'PUBLISHED')
          ))

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          count: result?.count || 0,
        }
      })
    )

    return NextResponse.json({ categories: categoriesWithCount })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
