import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kilasindonesia.com'

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
    // Get all published posts
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    })

    const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${BASE_URL}/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Get all categories
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
        createdAt: true,
      },
    })

    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${BASE_URL}/category/${category.slug}`,
      lastModified: category.createdAt,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    // Get all tags
    const tags = await prisma.tag.findMany({
      select: {
        slug: true,
        createdAt: true,
      },
    })

    const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
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
