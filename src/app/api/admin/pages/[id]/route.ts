import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, pages, users, eq } from '@/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1)

    if (!page) {
      return NextResponse.json({ error: 'Halaman tidak ditemukan' }, { status: 404 })
    }

    // Get author
    const [author] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, page.authorId))
      .limit(1)

    return NextResponse.json({
      page: {
        ...page,
        author,
      },
    })
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil halaman' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can edit pages
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      status,
      metaTitle,
      metaDescription,
      sortOrder,
    } = body

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Judul, slug, dan konten wajib diisi' },
        { status: 400 }
      )
    }

    // Check if page exists
    const [existingPage] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1)

    if (!existingPage) {
      return NextResponse.json({ error: 'Halaman tidak ditemukan' }, { status: 404 })
    }

    // Check if slug is taken by another page
    const [slugPage] = await db
      .select()
      .from(pages)
      .where(eq(pages.slug, slug))
      .limit(1)

    if (slugPage && slugPage.id !== id) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan' },
        { status: 400 }
      )
    }

    // Determine publishedAt
    let publishedAt = existingPage.publishedAt
    if (status === 'PUBLISHED' && !existingPage.publishedAt) {
      publishedAt = new Date()
    } else if (status !== 'PUBLISHED') {
      publishedAt = null
    }

    // Update page
    const [page] = await db
      .update(pages)
      .set({
        title,
        slug,
        content,
        excerpt: excerpt || null,
        featuredImage: featuredImage || null,
        status,
        publishedAt,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        sortOrder: sortOrder ?? existingPage.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, id))
      .returning()

    return NextResponse.json({ success: true, page })
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate halaman' },
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

    // Only admin can delete pages
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if page exists
    const [existingPage] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1)

    if (!existingPage) {
      return NextResponse.json({ error: 'Halaman tidak ditemukan' }, { status: 404 })
    }

    // Delete page
    await db.delete(pages).where(eq(pages.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus halaman' },
      { status: 500 }
    )
  }
}
