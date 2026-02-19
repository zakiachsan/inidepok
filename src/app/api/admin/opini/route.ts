import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/db'
import { posts, users, categories, postCategories } from '@/db/schema'
import { eq, desc, and, inArray } from 'drizzle-orm'

// GET - Fetch all opini posts
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First find the Opini category
    const opiniCategory = await db.query.categories.findFirst({
      where: eq(categories.slug, 'opini'),
    })

    if (!opiniCategory) {
      return NextResponse.json([])
    }

    // Get all post IDs that belong to Opini category
    const opiniPostIds = await db
      .select({ postId: postCategories.postId })
      .from(postCategories)
      .where(eq(postCategories.categoryId, opiniCategory.id))

    if (opiniPostIds.length === 0) {
      return NextResponse.json([])
    }

    // Fetch posts with those IDs
    const opiniPosts = await db.query.posts.findMany({
      where: inArray(posts.id, opiniPostIds.map(p => p.postId)),
      orderBy: [desc(posts.createdAt)],
      with: {
        author: {
          columns: {
            name: true,
          },
        },
      },
      columns: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(opiniPosts)
  } catch (error) {
    console.error('Error fetching opini posts:', error)
    return NextResponse.json({ error: 'Failed to fetch opini posts' }, { status: 500 })
  }
}
