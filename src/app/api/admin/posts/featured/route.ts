import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, posts, users, categories, postCategories, eq, and, asc } from '@/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'AUTHOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, postId, order, posts: postsList } = body

    if (action === 'add') {
      // Add post to featured
      await db
        .update(posts)
        .set({ isPinned: true, pinnedOrder: order })
        .where(eq(posts.id, postId))

      return NextResponse.json({ success: true })
    }

    if (action === 'remove') {
      // Remove post from featured
      await db
        .update(posts)
        .set({ isPinned: false, pinnedOrder: 0 })
        .where(eq(posts.id, postId))

      return NextResponse.json({ success: true })
    }

    if (action === 'reorder') {
      // Reorder featured posts
      await Promise.all(
        postsList.map(({ id, order: newOrder }: { id: string; order: number }) =>
          db.update(posts).set({ pinnedOrder: newOrder }).where(eq(posts.id, id))
        )
      )

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Featured posts API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const results = await db
      .select()
      .from(posts)
      .where(and(eq(posts.isPinned, true), eq(posts.status, 'PUBLISHED')))
      .orderBy(asc(posts.pinnedOrder))

    const featuredPosts = await Promise.all(results.map(async (post) => {
      const [author] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, post.authorId))
        .limit(1)

      const cats = await db
        .select({ name: categories.name, slug: categories.slug })
        .from(categories)
        .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
        .where(eq(postCategories.postId, post.id))
        .limit(1)

      return {
        ...post,
        author: author || { name: 'Unknown' },
        categories: cats,
      }
    }))

    return NextResponse.json(featuredPosts)
  } catch (error) {
    console.error('Featured posts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
