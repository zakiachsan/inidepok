import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, comments, eq } from '@/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    await db
      .update(comments)
      .set({ status: status as 'APPROVED' | 'REJECTED' | 'PENDING' })
      .where(eq(comments.id, id))

    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1)

    return NextResponse.json({ success: true, comment })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate komentar' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await db.delete(comments).where(eq(comments.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus komentar' },
      { status: 500 }
    )
  }
}
