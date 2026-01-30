// SEO Utility Module - JSON-LD Schema Generators
// For Ini Depok News Portal

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inidepok.com'
const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Ini Depok'

// Types
interface Author {
  name: string
  avatar?: string | null
}

interface Category {
  name: string
  slug: string
}

interface Tag {
  name: string
  slug: string
}

interface Post {
  title: string
  slug: string
  excerpt?: string | null
  content: string
  featuredImage?: string | null
  publishedAt?: Date | null
  updatedAt: Date
  author: Author
  categories: Category[]
  tags: Tag[]
}

interface BreadcrumbItem {
  name: string
  url: string
}

// Organization Schema - NewsMediaOrganization
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': `${BASE_URL}/#organization`,
    name: SITE_NAME,
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/logo.png`,
      width: 600,
      height: 60,
    },
    image: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/og-image.jpg`,
      width: 1200,
      height: 630,
    },
    description: 'Portal berita terkini seputar Kota Depok dan sekitarnya.',
    sameAs: [
      'https://facebook.com/inidepok',
      'https://twitter.com/inidepok',
      'https://instagram.com/inidepok',
      'https://youtube.com/@inidepok',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'redaksi@inidepok.com',
    },
  }
}

// WebSite Schema with SearchAction
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: SITE_NAME,
    url: BASE_URL,
    description: 'Portal berita terkini seputar Kota Depok dan sekitarnya.',
    publisher: {
      '@id': `${BASE_URL}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'id-ID',
  }
}

// NewsArticle Schema
export function generateArticleSchema(post: Post) {
  const articleUrl = `${BASE_URL}/${post.slug}`
  const imageUrl = post.featuredImage
    ? post.featuredImage.startsWith('http')
      ? post.featuredImage
      : `${BASE_URL}${post.featuredImage}`
    : `${BASE_URL}/og-image.jpg`

  // Calculate word count and reading time
  const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200) // 200 words per minute

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${articleUrl}/#article`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    headline: post.title,
    description: post.excerpt || post.content.replace(/<[^>]*>/g, '').substring(0, 160),
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: `${BASE_URL}/author/${post.author.name.toLowerCase().replace(/\s+/g, '-')}`,
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      '@id': `${BASE_URL}/#organization`,
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
        width: 600,
        height: 60,
      },
    },
    articleSection: post.categories[0]?.name || 'Berita',
    keywords: post.tags.map(tag => tag.name).join(', '),
    wordCount: wordCount,
    timeRequired: `PT${readingTime}M`,
    inLanguage: 'id-ID',
    isAccessibleForFree: true,
  }
}

// BreadcrumbList Schema
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// CollectionPage Schema for Category/Tag pages
export function generateCollectionSchema(
  type: 'category' | 'tag' | 'archive',
  name: string,
  slug: string,
  description: string | null | undefined,
  postCount: number,
  posts: Array<{ slug: string; title: string }>
) {
  const pageUrl = type === 'archive' ? `${BASE_URL}/${slug}` : `${BASE_URL}/${type}/${slug}`

  const typeLabel = type === 'category' ? 'Kategori' : type === 'tag' ? 'Tag' : ''

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${pageUrl}/#collection`,
    name: typeLabel ? `${typeLabel}: ${name}` : name,
    description: description || `Kumpulan berita tentang ${name} di ${SITE_NAME}`,
    url: pageUrl,
    isPartOf: {
      '@id': `${BASE_URL}/#website`,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: postCount,
      itemListElement: posts.slice(0, 10).map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: post.title,
        url: `${BASE_URL}/${post.slug}`,
      })),
    },
    inLanguage: 'id-ID',
  }
}

// FAQ Schema (for future use)
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// Helper function to calculate reading time
export function calculateReadingTime(content: string): number {
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length
  return Math.ceil(wordCount / 200)
}

// Helper function to get canonical URL
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${BASE_URL}${cleanPath}`
}

// Export types for use in other files
export type { Post, Author, Category, Tag, BreadcrumbItem }
