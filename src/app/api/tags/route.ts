import { NextResponse } from 'next/server'
import { db, tags, postTags, posts, eq, and, count, asc } from '@/db'

export async function GET() {
  try {
    // Get all tags
    const allTags = await db
      .select()
      .from(tags)
      .orderBy(asc(tags.name))

    // Get post counts for each tag
    const tagsWithCount = await Promise.all(
      allTags.map(async (tag) => {
        const [result] = await db
          .select({ count: count() })
          .from(postTags)
          .innerJoin(posts, eq(postTags.postId, posts.id))
          .where(and(
            eq(postTags.tagId, tag.id),
            eq(posts.status, 'PUBLISHED')
          ))

        return {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          count: result?.count || 0,
        }
      })
    )

    return NextResponse.json({ tags: tagsWithCount })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}
