import { notFound } from 'next/navigation'
import { db, posts, categories, tags, postCategories, postTags, eq, asc } from '@/db'
import PostEditor from '../../components/PostEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getData(id: string) {
  try {
    // Get post
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1)

    if (!post) {
      return { post: null, categories: [], tags: [] }
    }

    // Get post categories
    const postCats = await db
      .select({ id: categories.id })
      .from(categories)
      .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
      .where(eq(postCategories.postId, id))

    // Get post tags
    const postTagsList = await db
      .select({ id: tags.id })
      .from(tags)
      .innerJoin(postTags, eq(tags.id, postTags.tagId))
      .where(eq(postTags.postId, id))

    // Get all categories and tags
    const [allCategories, allTags] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.name)),
      db.select().from(tags).orderBy(asc(tags.name)),
    ])

    return {
      post: { ...post, categories: postCats, tags: postTagsList },
      categories: allCategories,
      tags: allTags,
    }
  } catch (error) {
    console.error('Failed to fetch data:', error)
    return { post: null, categories: [], tags: [] }
  }
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params
  const { post, categories: allCategories, tags: allTags } = await getData(id)

  if (!post) {
    notFound()
  }

  const postData = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt || '',
    featuredImage: post.featuredImage || '',
    status: post.status,
    categoryIds: post.categories.map((c) => c.id),
    tagIds: post.tags.map((t) => t.id),
    metaTitle: post.metaTitle || '',
    metaDescription: post.metaDescription || '',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Artikel</h1>
        <p className="text-sm text-gray-500 mt-1">
          {post.title}
        </p>
      </div>

      <PostEditor post={postData} categories={allCategories} tags={allTags} isEdit />
    </div>
  )
}
