// Re-export everything from the new Drizzle db setup
export * from '@/db'

// Backward compatibility: Create a prisma-like object for files not yet migrated
import { db, posts, users, categories, tags, comments, postCategories, postTags, eq, and, desc, asc, count, sql } from '@/db'

// Simple query wrapper for Prisma-like API (limited functionality)
export const prisma = {
  post: {
    findMany: async (options: any = {}) => {
      let results = await db.select().from(posts).where(eq(posts.status, 'PUBLISHED')).orderBy(desc(posts.publishedAt)).limit(options.take || 100)
      return Promise.all(results.map(async (post: any) => {
        const cats = await db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).innerJoin(postCategories, eq(categories.id, postCategories.categoryId)).where(eq(postCategories.postId, post.id)).limit(1)
        const [author] = await db.select({ name: users.name }).from(users).where(eq(users.id, post.authorId)).limit(1)
        return { ...post, categories: cats, author: author || { name: 'Unknown' } }
      }))
    },
    findUnique: async (options: any) => {
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
        return post || null
      }
      return null
    },
    count: async (options: any = {}) => {
      const [result] = await db.select({ count: count() }).from(posts).where(options.where?.status ? eq(posts.status, options.where.status) : undefined)
      return result?.count || 0
    },
    update: async (options: any) => {
      if (options.where?.id && options.data?.viewCount?.increment) {
        await db.update(posts).set({ viewCount: sql`${posts.viewCount} + ${options.data.viewCount.increment}` }).where(eq(posts.id, options.where.id))
      }
      return {}
    },
    create: async (options: any) => {
      const [post] = await db.insert(posts).values(options.data).returning()
      return post
    },
    delete: async () => ({}),
  },
  category: {
    findMany: async (options: any = {}) => {
      const results = await db.select().from(categories).orderBy(asc(categories.name))
      return Promise.all(results.map(async (cat: any) => {
        const [result] = await db.select({ count: count() }).from(postCategories).where(eq(postCategories.categoryId, cat.id))
        return { ...cat, _count: { posts: result?.count || 0 } }
      }))
    },
    findUnique: async (options: any) => {
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
    create: async (options: any) => {
      const [cat] = await db.insert(categories).values(options.data).returning()
      return cat
    },
    update: async (options: any) => {
      if (options.where?.id) {
        await db.update(categories).set(options.data).where(eq(categories.id, options.where.id))
      }
      return {}
    },
    delete: async (options: any) => {
      if (options.where?.id) {
        await db.delete(categories).where(eq(categories.id, options.where.id))
      }
      return {}
    },
    count: async (options: any = {}) => {
      const [result] = await db.select({ count: count() }).from(categories)
      return result?.count || 0
    },
  },
  tag: {
    findMany: async (options: any = {}) => {
      const results = await db.select().from(tags).orderBy(asc(tags.name))
      return Promise.all(results.map(async (tag: any) => {
        const [result] = await db.select({ count: count() }).from(postTags).where(eq(postTags.tagId, tag.id))
        return { ...tag, _count: { posts: result?.count || 0 } }
      }))
    },
    findUnique: async (options: any) => {
      if (options.where?.slug) {
        const [tag] = await db.select().from(tags).where(eq(tags.slug, options.where.slug)).limit(1)
        return tag || null
      }
      return null
    },
    count: async (options: any = {}) => {
      const [result] = await db.select({ count: count() }).from(tags)
      return result?.count || 0
    },
  },
  user: {
    findUnique: async (options: any) => {
      if (options.where?.email) {
        const [user] = await db.select().from(users).where(eq(users.email, options.where.email)).limit(1)
        return user || null
      }
      return null
    },
    count: async () => {
      const [result] = await db.select({ count: count() }).from(users)
      return result?.count || 0
    },
  },
  comment: {
    findMany: async (options: any = {}) => {
      if (options.where?.postId) {
        return db.select().from(comments).where(and(eq(comments.postId, options.where.postId), eq(comments.status, 'APPROVED'))).orderBy(desc(comments.createdAt))
      }
      return db.select().from(comments).orderBy(desc(comments.createdAt)).limit(options.take || 100)
    },
    create: async (options: any) => {
      const [comment] = await db.insert(comments).values(options.data).returning()
      return comment
    },
    count: async (options: any = {}) => {
      const [result] = await db.select({ count: count() }).from(comments).where(options.where?.status ? eq(comments.status, options.where.status) : undefined)
      return result?.count || 0
    },
    update: async (options: any) => {
      if (options.where?.id) {
        await db.update(comments).set(options.data).where(eq(comments.id, options.where.id))
      }
      return {}
    },
    delete: async (options: any) => {
      if (options.where?.id) {
        await db.delete(comments).where(eq(comments.id, options.where.id))
      }
      return {}
    },
  },
  $transaction: async (operations: any[]) => {
    // Simple implementation - just run operations sequentially
    const results = []
    for (const op of operations) {
      results.push(await op)
    }
    return results
  },
}

// Default export for backward compatibility with `import prisma from '@/lib/db'`
export default prisma
