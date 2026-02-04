import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, categories, eq } from '@/db'
import { createId } from '@/db/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nama dan slug wajib diisi' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan' },
        { status: 400 }
      )
    }

    const [category] = await db
      .insert(categories)
      .values({
        id: createId(),
        name,
        slug,
        description: description || null,
      })
      .returning()

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Gagal membuat kategori' },
      { status: 500 }
    )
  }
}
