import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'AUTHOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, postId, order, posts } = body

    if (action === 'add') {
      // Add post to featured
      await prisma.post.update({
        where: { id: postId },
        data: {
          isPinned: true,
          pinnedOrder: order,
        },
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'remove') {
      // Remove post from featured
      console.log('[Featured API] Removing post from featured:', postId)
      const result = await prisma.post.update({
        where: { id: postId },
        data: {
          isPinned: false,
          pinnedOrder: 0,
        },
      })
      console.log('[Featured API] Remove result:', result)

      return NextResponse.json({ success: true, result })
    }

    if (action === 'reorder') {
      // Reorder featured posts
      await Promise.all(
        posts.map(({ id, order }: { id: string; order: number }) =>
          prisma.post.update({
            where: { id },
            data: { pinnedOrder: order },
          })
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
    const featuredPosts = await prisma.post.findMany({
      where: {
        isPinned: true,
        status: 'PUBLISHED',
      },
      orderBy: { pinnedOrder: 'asc' },
      include: {
        author: { select: { name: true } },
        categories: { select: { name: true, slug: true }, take: 1 },
      },
    })

    return NextResponse.json(featuredPosts)
  } catch (error) {
    console.error('Featured posts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
