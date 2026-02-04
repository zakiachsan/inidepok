import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, categories, eq, and, ne } from '@/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, slug, description } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nama dan slug wajib diisi' },
        { status: 400 }
      )
    }

    // Check if slug is taken by another category
    const [slugCategory] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, slug), ne(categories.id, id)))
      .limit(1)

    if (slugCategory) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan' },
        { status: 400 }
      )
    }

    await db
      .update(categories)
      .set({
        name,
        slug,
        description: description || null,
      })
      .where(eq(categories.id, id))

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1)

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate kategori' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await db.delete(categories).where(eq(categories.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus kategori' },
      { status: 500 }
    )
  }
}
