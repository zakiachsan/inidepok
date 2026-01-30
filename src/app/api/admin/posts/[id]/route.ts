import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, posts, users, categories, tags, postCategories, postTags, eq } from '@/db'

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

    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1)

    if (!post) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    // Get author
    const [author] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, post.authorId))
      .limit(1)

    // Get categories
    const postCats = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
      .where(eq(postCategories.postId, id))

    // Get tags
    const postTagsList = await db
      .select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(tags)
      .innerJoin(postTags, eq(tags.id, postTags.tagId))
      .where(eq(postTags.postId, id))

    return NextResponse.json({
      post: {
        ...post,
        author,
        categories: postCats,
        tags: postTagsList,
      },
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil artikel' },
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

    const { id } = await params
    const body = await request.json()
    const {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      status,
      categoryIds,
      tagIds,
      metaTitle,
      metaDescription,
    } = body

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Judul, slug, dan konten wajib diisi' },
        { status: 400 }
      )
    }

    // Check if post exists
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1)

    if (!existingPost) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    // Check if slug is taken by another post
    const [slugPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1)

    if (slugPost && slugPost.id !== id) {
      return NextResponse.json(
        { error: 'Slug sudah digunakan' },
        { status: 400 }
      )
    }

    // Determine publishedAt
    let publishedAt = existingPost.publishedAt
    if (status === 'PUBLISHED' && !existingPost.publishedAt) {
      publishedAt = new Date()
    } else if (status !== 'PUBLISHED') {
      publishedAt = null
    }

    // Update post
    const [post] = await db
      .update(posts)
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
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning()

    // Update categories - delete all and re-insert
    await db.delete(postCategories).where(eq(postCategories.postId, id))
    if (categoryIds && categoryIds.length > 0) {
      await db.insert(postCategories).values(
        categoryIds.map((catId: string) => ({
          postId: id,
          categoryId: catId,
        }))
      )
    }

    // Update tags - delete all and re-insert
    await db.delete(postTags).where(eq(postTags.postId, id))
    if (tagIds && tagIds.length > 0) {
      await db.insert(postTags).values(
        tagIds.map((tagId: string) => ({
          postId: id,
          tagId: tagId,
        }))
      )
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate artikel' },
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

    // Check if post exists
    const [existingPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1)

    if (!existingPost) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 })
    }

    // Delete post categories and tags first
    await db.delete(postCategories).where(eq(postCategories.postId, id))
    await db.delete(postTags).where(eq(postTags.postId, id))

    // Delete post
    await db.delete(posts).where(eq(posts.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus artikel' },
      { status: 500 }
    )
  }
}
