import { NextRequest, NextResponse } from 'next/server'
import { db, posts, users, categories, tags, comments, postCategories, postTags, eq, and, desc, ne, sql, inArray, isNull } from '@/db'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    // Get post
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1)

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get author
    const [author] = await db
      .select({ id: users.id, name: users.name, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, post.authorId))
      .limit(1)

    // Get categories
    const postCats = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
      .where(eq(postCategories.postId, post.id))

    // Get tags
    const postTagsList = await db
      .select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(tags)
      .innerJoin(postTags, eq(tags.id, postTags.tagId))
      .where(eq(postTags.postId, post.id))

    // Get approved comments (top-level only)
    const approvedComments = await db
      .select({
        id: comments.id,
        authorName: comments.authorName,
        content: comments.content,
        createdAt: comments.createdAt,
        parentId: comments.parentId,
      })
      .from(comments)
      .where(and(eq(comments.postId, post.id), eq(comments.status, 'APPROVED'), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt))

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      approvedComments.map(async (comment) => {
        const replies = await db
          .select({
            id: comments.id,
            authorName: comments.authorName,
            content: comments.content,
            createdAt: comments.createdAt,
          })
          .from(comments)
          .where(and(eq(comments.parentId, comment.id), eq(comments.status, 'APPROVED')))
          .orderBy(desc(comments.createdAt))

        return { ...comment, replies }
      })
    )

    // Increment view count
    await db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, post.id))

    // Get related posts (same categories)
    const categoryIds = postCats.map(c => c.id)
    let relatedPosts: any[] = []

    if (categoryIds.length > 0) {
      const relatedPostIds = await db
        .select({ postId: postCategories.postId })
        .from(postCategories)
        .where(inArray(postCategories.categoryId, categoryIds))

      const uniqueRelatedIds = [...new Set(relatedPostIds.map(r => r.postId))].filter(id => id !== post.id)

      if (uniqueRelatedIds.length > 0) {
        relatedPosts = await db
          .select({
            id: posts.id,
            title: posts.title,
            slug: posts.slug,
            excerpt: posts.excerpt,
            featuredImage: posts.featuredImage,
            publishedAt: posts.publishedAt,
          })
          .from(posts)
          .where(and(
            inArray(posts.id, uniqueRelatedIds.slice(0, 10)),
            eq(posts.status, 'PUBLISHED')
          ))
          .orderBy(desc(posts.publishedAt))
          .limit(3)

        // Get first category for each related post
        relatedPosts = await Promise.all(
          relatedPosts.map(async (rp) => {
            const [cat] = await db
              .select({ id: categories.id, name: categories.name, slug: categories.slug })
              .from(categories)
              .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
              .where(eq(postCategories.postId, rp.id))
              .limit(1)
            return { ...rp, categories: cat ? [cat] : [] }
          })
        )
      }
    }

    return NextResponse.json({
      post: {
        ...post,
        author,
        categories: postCats,
        tags: postTagsList,
        comments: commentsWithReplies,
      },
      relatedPosts,
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}
