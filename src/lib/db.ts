// Re-export everything from the new Drizzle db setup
export * from '@/db'

// Backward compatibility: Create a prisma-like object for files not yet migrated
import { db, posts, users, categories, tags, comments, postCategories, postTags, eq, and, desc, asc, count, sql } from '@/db'
import type { Post, Category, Tag, User, Comment } from '@/db'

// Types for Prisma-like API options
interface FindManyOptions {
  take?: number
  where?: { status?: string }
}

interface PostFindUniqueOptions {
  where: { slug?: string; id?: string }
}

interface PostUpdateOptions {
  where: { id: string }
  data: { viewCount?: { increment: number } }
}

interface PostCreateOptions {
  data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>
}

interface CategoryFindUniqueOptions {
  where: { slug?: string; id?: string }
}

interface CategoryUpdateOptions {
  where: { id: string }
  data: Partial<Category>
}

interface CategoryCreateOptions {
  data: Omit<Category, 'id' | 'createdAt'>
}

interface CategoryDeleteOptions {
  where: { id: string }
}

interface TagFindUniqueOptions {
  where: { slug?: string }
}

interface UserFindUniqueOptions {
  where: { email?: string }
}

interface CommentFindManyOptions {
  where?: { postId?: string; status?: string }
  take?: number
}

interface CommentCreateOptions {
  data: Omit<Comment, 'id' | 'createdAt'>
}

interface CommentCountOptions {
  where?: { status?: string }
}

interface CommentUpdateOptions {
  where: { id: string }
  data: Partial<Comment>
}

interface CommentDeleteOptions {
  where: { id: string }
}

// Extended types with relations
type PostWithRelations = Post & {
  categories: { id: string; name: string; slug: string }[]
  author: { name: string; avatar?: string | null }
  tags?: { id: string; name: string; slug: string }[]
  comments?: Comment[]
}

type CategoryWithCount = Category & {
  _count: { posts: number }
}

type TagWithCount = Tag & {
  _count: { posts: number }
}

// Simple query wrapper for Prisma-like API (limited functionality)
export const prisma = {
  post: {
    findMany: async (options: FindManyOptions = {}): Promise<PostWithRelations[]> => {
      const results = await db.select().from(posts).where(eq(posts.status, 'PUBLISHED')).orderBy(desc(posts.publishedAt)).limit(options.take || 100)
      return Promise.all(results.map(async (post) => {
        const cats = await db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).innerJoin(postCategories, eq(categories.id, postCategories.categoryId)).where(eq(postCategories.postId, post.id)).limit(1)
        const [author] = await db.select({ name: users.name }).from(users).where(eq(users.id, post.authorId)).limit(1)
        return { ...post, categories: cats, author: author || { name: 'Unknown' } }
      }))
    },
    findUnique: async (options: PostFindUniqueOptions): Promise<PostWithRelations | null> => {
      if (options.where?.slug) {
        const [post] = await db.select().from(posts).where(eq(posts.slug, options.where.slug)).limit(1)
        if (!post) return null
        const cats = await db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).innerJoin(postCategories, eq(categories.id, postCategories.categoryId)).where(eq(postCategories.postId, post.id))
        const tagsList = await db.select({ id: tags.id, name: tags.name, slug: tags.slug }).from(tags).innerJoin(postTags, eq(tags.id, postTags.tagId)).where(eq(postTags.postId, post.id))
        const [author] = await db.select({ name: users.name, avatar: users.avatar }).from(users).where(eq(users.id, post.authorId)).limit(1)
        return { ...post, categories: cats, tags: tagsList, author: author || { name: 'Unknown', avatar: null }, comments: [] }
      }
      if (options.where?.id) {
        const [post] = await db.select().from(posts).where(eq(posts.id, options.where.id)).limit(1)
        if (!post) return null
        return { ...post, categories: [], author: { name: 'Unknown' } }
      }
      return null
    },
    count: async (options: FindManyOptions = {}): Promise<number> => {
      const statusValue = options.where?.status as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' | undefined
      const [result] = await db.select({ count: count() }).from(posts).where(statusValue ? eq(posts.status, statusValue) : undefined)
      return result?.count || 0
    },
    update: async (options: any): Promise<object> => {
      if (options.where?.id) {
        const updateData: any = {}
        
        // Handle viewCount increment
        if (options.data?.viewCount?.increment) {
          await db.update(posts).set({ viewCount: sql`${posts.viewCount} + ${options.data.viewCount.increment}` }).where(eq(posts.id, options.where.id))
          return {}
        }
        
        // Handle direct field updates
        if (options.data?.isPinned !== undefined) updateData.isPinned = options.data.isPinned
        if (options.data?.pinnedOrder !== undefined) updateData.pinnedOrder = options.data.pinnedOrder
        if (options.data?.title !== undefined) updateData.title = options.data.title
        if (options.data?.content !== undefined) updateData.content = options.data.content
        if (options.data?.excerpt !== undefined) updateData.excerpt = options.data.excerpt
        if (options.data?.status !== undefined) updateData.status = options.data.status
        if (options.data?.featuredImage !== undefined) updateData.featuredImage = options.data.featuredImage
        
        if (Object.keys(updateData).length > 0) {
          await db.update(posts).set(updateData).where(eq(posts.id, options.where.id))
        }
      }
      return {}
    },
    create: async (options: PostCreateOptions): Promise<Post> => {
      const [post] = await db.insert(posts).values(options.data).returning()
      return post
    },
    delete: async (): Promise<object> => ({}),
  },
  category: {
    findMany: async (_options: FindManyOptions = {}): Promise<CategoryWithCount[]> => {
      const results = await db.select().from(categories).orderBy(asc(categories.name))
      return Promise.all(results.map(async (cat) => {
        const [result] = await db.select({ count: count() }).from(postCategories).where(eq(postCategories.categoryId, cat.id))
        return { ...cat, _count: { posts: result?.count || 0 } }
      }))
    },
    findUnique: async (options: CategoryFindUniqueOptions): Promise<CategoryWithCount | null> => {
      if (options.where?.slug) {
        const [cat] = await db.select().from(categories).where(eq(categories.slug, options.where.slug)).limit(1)
        if (!cat) return null
        const [result] = await db.select({ count: count() }).from(postCategories).where(eq(postCategories.categoryId, cat.id))
        return { ...cat, _count: { posts: result?.count || 0 } }
      }
      if (options.where?.id) {
        const [cat] = await db.select().from(categories).where(eq(categories.id, options.where.id)).limit(1)
        if (!cat) return null
        const [result] = await db.select({ count: count() }).from(postCategories).where(eq(postCategories.categoryId, cat.id))
        return { ...cat, _count: { posts: result?.count || 0 } }
      }
      return null
    },
    create: async (options: CategoryCreateOptions): Promise<Category> => {
      const [cat] = await db.insert(categories).values(options.data).returning()
      return cat
    },
    update: async (options: CategoryUpdateOptions): Promise<object> => {
      if (options.where?.id) {
        await db.update(categories).set(options.data).where(eq(categories.id, options.where.id))
      }
      return {}
    },
    delete: async (options: CategoryDeleteOptions): Promise<object> => {
      if (options.where?.id) {
        await db.delete(categories).where(eq(categories.id, options.where.id))
      }
      return {}
    },
    count: async (_options: FindManyOptions = {}): Promise<number> => {
      const [result] = await db.select({ count: count() }).from(categories)
      return result?.count || 0
    },
  },
  tag: {
    findMany: async (_options: FindManyOptions = {}): Promise<TagWithCount[]> => {
      const results = await db.select().from(tags).orderBy(asc(tags.name))
      return Promise.all(results.map(async (tag) => {
        const [result] = await db.select({ count: count() }).from(postTags).where(eq(postTags.tagId, tag.id))
        return { ...tag, _count: { posts: result?.count || 0 } }
      }))
    },
    findUnique: async (options: TagFindUniqueOptions): Promise<Tag | null> => {
      if (options.where?.slug) {
        const [tag] = await db.select().from(tags).where(eq(tags.slug, options.where.slug)).limit(1)
        return tag || null
      }
      return null
    },
    count: async (_options: FindManyOptions = {}): Promise<number> => {
      const [result] = await db.select({ count: count() }).from(tags)
      return result?.count || 0
    },
  },
  user: {
    findUnique: async (options: UserFindUniqueOptions): Promise<User | null> => {
      if (options.where?.email) {
        const [user] = await db.select().from(users).where(eq(users.email, options.where.email)).limit(1)
        return user || null
      }
      return null
    },
    count: async (): Promise<number> => {
      const [result] = await db.select({ count: count() }).from(users)
      return result?.count || 0
    },
  },
  comment: {
    findMany: async (options: CommentFindManyOptions = {}): Promise<Comment[]> => {
      if (options.where?.postId) {
        return db.select().from(comments).where(and(eq(comments.postId, options.where.postId), eq(comments.status, 'APPROVED'))).orderBy(desc(comments.createdAt))
      }
      return db.select().from(comments).orderBy(desc(comments.createdAt)).limit(options.take || 100)
    },
    create: async (options: CommentCreateOptions): Promise<Comment> => {
      const [comment] = await db.insert(comments).values(options.data).returning()
      return comment
    },
    count: async (options: CommentCountOptions = {}): Promise<number> => {
      const statusValue = options.where?.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined
      const [result] = await db.select({ count: count() }).from(comments).where(statusValue ? eq(comments.status, statusValue) : undefined)
      return result?.count || 0
    },
    update: async (options: CommentUpdateOptions): Promise<object> => {
      if (options.where?.id) {
        await db.update(comments).set(options.data).where(eq(comments.id, options.where.id))
      }
      return {}
    },
    delete: async (options: CommentDeleteOptions): Promise<object> => {
      if (options.where?.id) {
        await db.delete(comments).where(eq(comments.id, options.where.id))
      }
      return {}
    },
  },
  $transaction: async <T>(operations: Promise<T>[]): Promise<T[]> => {
    // Simple implementation - just run operations sequentially
    const results: T[] = []
    for (const op of operations) {
      results.push(await op)
    }
    return results
  },
}

// Default export for backward compatibility with `import prisma from '@/lib/db'`
export default prisma
