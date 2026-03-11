import { MetadataRoute } from 'next'
import { db, posts, categories, tags, postCategories, eq, desc } from '@/db'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inidepok.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
  ]

  try {
    // Get all published posts with their primary category
    const allPosts = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        updatedAt: posts.updatedAt,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, 'PUBLISHED'))
      .orderBy(desc(posts.publishedAt))

    // Get primary category for each post
    const postPages: MetadataRoute.Sitemap = await Promise.all(
      allPosts.map(async (post) => {
        // Get the first category for this post
        const [postCat] = await db
          .select({ slug: categories.slug })
          .from(categories)
          .innerJoin(postCategories, eq(categories.id, postCategories.categoryId))
          .where(eq(postCategories.postId, post.id))
          .limit(1)

        const categorySlug = postCat?.slug || 'berita'

        return {
          url: `${BASE_URL}/${categorySlug}/${post.slug}`,
          lastModified: post.updatedAt || post.publishedAt || new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }
      })
    )

    // Get all categories
    const allCategories = await db
      .select({
        slug: categories.slug,
        createdAt: categories.createdAt,
      })
      .from(categories)

    const categoryPages: MetadataRoute.Sitemap = allCategories.map((category) => ({
      url: `${BASE_URL}/category/${category.slug}`,
      lastModified: category.createdAt,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    // Get all tags
    const allTags = await db
      .select({
        slug: tags.slug,
        createdAt: tags.createdAt,
      })
      .from(tags)

    const tagPages: MetadataRoute.Sitemap = allTags.map((tag) => ({
      url: `${BASE_URL}/tag/${tag.slug}`,
      lastModified: tag.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

    return [...staticPages, ...postPages, ...categoryPages, ...tagPages]
  } catch (error) {
    // If database is not available, return only static pages
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}
