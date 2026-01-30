import { NextRequest, NextResponse } from 'next/server'
import { db, posts, comments, eq, and, isNull, desc, asc } from '@/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, authorName, authorEmail, content, parentId } = body

    // Validate required fields
    if (!postId || !authorName || !authorEmail || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(authorEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if post exists
    const [post] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1)

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const [parentComment] = await db
        .select({ id: comments.id })
        .from(comments)
        .where(eq(comments.id, parentId))
        .limit(1)

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Create comment
    const [comment] = await db
      .insert(comments)
      .values({
        postId,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim().toLowerCase(),
        content: content.trim(),
        parentId: parentId || null,
        status: 'PENDING',
      })
      .returning()

    return NextResponse.json({
      success: true,
      message: 'Komentar berhasil dikirim dan menunggu moderasi.',
      comment: {
        id: comment.id,
        authorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Get top-level comments
    const topLevelComments = await db
      .select()
      .from(comments)
      .where(and(
        eq(comments.postId, postId),
        eq(comments.status, 'APPROVED'),
        isNull(comments.parentId)
      ))
      .orderBy(desc(comments.createdAt))

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await db
          .select()
          .from(comments)
          .where(and(
            eq(comments.parentId, comment.id),
            eq(comments.status, 'APPROVED')
          ))
          .orderBy(asc(comments.createdAt))

        return { ...comment, replies }
      })
    )

    return NextResponse.json({ comments: commentsWithReplies })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}
