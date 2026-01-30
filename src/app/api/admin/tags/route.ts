import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, tags, eq } from '@/db'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nama tag wajib diisi' },
        { status: 400 }
      )
    }

    const slug = slugify(name.trim())

    // Check if slug already exists
    const [existing] = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'Tag sudah ada' },
        { status: 400 }
      )
    }

    // Create new tag
    const [tag] = await db
      .insert(tags)
      .values({
        name: name.trim(),
        slug,
      })
      .returning()

    return NextResponse.json({
      success: true,
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      },
    })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Gagal membuat tag' },
      { status: 500 }
    )
  }
}
