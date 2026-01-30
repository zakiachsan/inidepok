import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eq } from 'drizzle-orm'
import * as schema from './schema'
import { createId } from './utils'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

// ============================================
// TYPES
// ============================================

interface WPPost {
  id: string
  postAuthor: string
  postDate: string
  postDateGmt: string
  postContent: string
  postTitle: string
  postExcerpt: string
  postStatus: string
  postName: string  // slug
  postModified: string
  postModifiedGmt: string
  postType: string
  guid: string
}

interface WPTerm {
  termId: string
  name: string
  slug: string
}

interface WPTermTaxonomy {
  termTaxonomyId: string
  termId: string
  taxonomy: string  // 'category' | 'post_tag'
}

interface WPTermRelationship {
  objectId: string  // post ID
  termTaxonomyId: string
}

interface WPPostMeta {
  postId: string
  metaKey: string
  metaValue: string
}

// ============================================
// SQL PARSING FUNCTIONS
// ============================================

function parseInsertValues(line: string): string[] | null {
  // Match VALUES ('...','...','...')
  const match = line.match(/VALUES\s*\((.+)\);?$/i)
  if (!match) return null

  const valuesStr = match[1]
  const values: string[] = []
  let current = ''
  let inQuote = false
  let escapeNext = false

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i]

    if (escapeNext) {
      current += char
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      current += char
      continue
    }

    if (char === "'" && !escapeNext) {
      inQuote = !inQuote
      continue
    }

    if (char === ',' && !inQuote) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  // Push the last value
  values.push(current.trim())

  return values
}

function unescapeSqlString(str: string): string {
  return str
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
}

function parseSqlDump(sqlContent: string) {
  const posts: WPPost[] = []
  const terms: WPTerm[] = []
  const termTaxonomies: WPTermTaxonomy[] = []
  const termRelationships: WPTermRelationship[] = []
  const postMetas: WPPostMeta[] = []

  const lines = sqlContent.split('\n')

  for (const line of lines) {
    // Parse posts
    if (line.includes('INSERT INTO `SERVMASK_PREFIX_posts`')) {
      const values = parseInsertValues(line)
      if (values && values.length >= 21) {
        const post: WPPost = {
          id: values[0],
          postAuthor: values[1],
          postDate: values[2],
          postDateGmt: values[3],
          postContent: unescapeSqlString(values[4]),
          postTitle: unescapeSqlString(values[5]),
          postExcerpt: unescapeSqlString(values[6]),
          postStatus: values[7],
          postName: values[11],  // slug
          postModified: values[14],
          postModifiedGmt: values[15],
          postType: values[20],
          guid: values[18],
        }
        posts.push(post)
      }
    }

    // Parse terms
    if (line.includes('INSERT INTO `SERVMASK_PREFIX_terms`')) {
      const values = parseInsertValues(line)
      if (values && values.length >= 3) {
        terms.push({
          termId: values[0],
          name: unescapeSqlString(values[1]),
          slug: values[2],
        })
      }
    }

    // Parse term_taxonomy
    if (line.includes('INSERT INTO `SERVMASK_PREFIX_term_taxonomy`')) {
      const values = parseInsertValues(line)
      if (values && values.length >= 3) {
        termTaxonomies.push({
          termTaxonomyId: values[0],
          termId: values[1],
          taxonomy: values[2],
        })
      }
    }

    // Parse term_relationships
    if (line.includes('INSERT INTO `SERVMASK_PREFIX_term_relationships`')) {
      const values = parseInsertValues(line)
      if (values && values.length >= 2) {
        termRelationships.push({
          objectId: values[0],
          termTaxonomyId: values[1],
        })
      }
    }

    // Parse postmeta (for featured images)
    if (line.includes('INSERT INTO `SERVMASK_PREFIX_postmeta`')) {
      const values = parseInsertValues(line)
      if (values && values.length >= 4) {
        postMetas.push({
          postId: values[1],
          metaKey: values[2],
          metaValue: values[3],
        })
      }
    }
  }

  return { posts, terms, termTaxonomies, termRelationships, postMetas }
}

// ============================================
// CATEGORY MAPPING
// ============================================

// Map WP categories to inidepok categories
const categoryMapping: Record<string, string> = {
  'nasional': 'berita-depok',
  'edukasi': 'pendidikan',
  'budaya': 'lifestyle',
  'olahraga': 'olahraga',
  'politik': 'pemerintahan',
  'teknologi': 'teknologi',
  'spiritual': 'lifestyle',
  'berita': 'berita-depok',
}

// ============================================
// MAIN MIGRATION
// ============================================

async function main() {
  console.log('📰 WordPress to Ini Depok Migration')
  console.log('====================================\n')

  // Read SQL dump
  const sqlPath = path.join(process.cwd(), 'wp-backup', 'database.sql')

  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL dump not found at:', sqlPath)
    console.log('   Please ensure wp-backup/database.sql exists')
    process.exit(1)
  }

  console.log('📂 Reading SQL dump...')
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

  console.log('🔍 Parsing WordPress data...')
  const { posts, terms, termTaxonomies, termRelationships, postMetas } = parseSqlDump(sqlContent)

  // Filter only published posts (not pages, not attachments, not nav_menu_items)
  const publishedPosts = posts.filter(
    p => p.postType === 'post' && p.postStatus === 'publish' && p.postTitle.trim() !== ''
  )

  // Get attachment posts (images)
  const attachments = posts.filter(p => p.postType === 'attachment')

  console.log(`\n📊 Found:`)
  console.log(`   - ${posts.length} total post entries`)
  console.log(`   - ${publishedPosts.length} published articles`)
  console.log(`   - ${attachments.length} attachments (images)`)
  console.log(`   - ${terms.length} terms`)
  console.log(`   - ${termTaxonomies.length} term taxonomies`)
  console.log(`   - ${termRelationships.length} term relationships`)
  console.log(`   - ${postMetas.length} post meta entries\n`)

  // Build attachment lookup (ID -> URL)
  const attachmentById = new Map<string, string>()
  for (const att of attachments) {
    // guid contains the full URL to the attachment
    attachmentById.set(att.id, att.guid)
  }

  // Build thumbnail lookup (post ID -> attachment ID)
  const thumbnailByPostId = new Map<string, string>()
  for (const meta of postMetas) {
    if (meta.metaKey === '_thumbnail_id') {
      thumbnailByPostId.set(meta.postId, meta.metaValue)
    }
  }

  // Build term lookup maps
  const termById = new Map<string, WPTerm>()
  for (const term of terms) {
    termById.set(term.termId, term)
  }

  const taxonomyById = new Map<string, WPTermTaxonomy>()
  const termIdToTaxonomy = new Map<string, WPTermTaxonomy>()
  for (const tax of termTaxonomies) {
    taxonomyById.set(tax.termTaxonomyId, tax)
    termIdToTaxonomy.set(tax.termId, tax)
  }

  // Get existing categories and tags from database
  const existingCategories = await db.select().from(schema.categories)
  const existingTags = await db.select().from(schema.tags)

  const categoryBySlug = new Map<string, typeof existingCategories[0]>()
  for (const cat of existingCategories) {
    categoryBySlug.set(cat.slug, cat)
  }

  const tagBySlug = new Map<string, typeof existingTags[0]>()
  for (const tag of existingTags) {
    tagBySlug.set(tag.slug, tag)
  }

  // Get admin user
  const [adminUser] = await db.select().from(schema.users).where(eq(schema.users.role, 'ADMIN')).limit(1)

  if (!adminUser) {
    console.error('❌ No admin user found. Please run npm run db:seed first')
    process.exit(1)
  }

  console.log(`✅ Using admin user: ${adminUser.email}`)

  // Create missing tags from WP
  console.log('\n🏷️ Creating tags from WordPress...')
  const wpTagTerms = terms.filter(t => {
    const tax = termIdToTaxonomy.get(t.termId)
    return tax && tax.taxonomy === 'post_tag'
  })

  let tagsCreated = 0
  for (const wpTag of wpTagTerms) {
    if (!tagBySlug.has(wpTag.slug)) {
      const newTag = {
        id: createId(),
        name: wpTag.name,
        slug: wpTag.slug,
        createdAt: new Date(),
      }
      await db.insert(schema.tags).values(newTag).onConflictDoNothing()
      tagBySlug.set(wpTag.slug, newTag as typeof existingTags[0])
      tagsCreated++
    }
  }
  console.log(`   Created ${tagsCreated} new tags`)

  // Reload tags after creation
  const allTags = await db.select().from(schema.tags)
  for (const tag of allTags) {
    tagBySlug.set(tag.slug, tag)
  }

  // Import posts
  console.log('\n📝 Importing articles...')
  let postsImported = 0
  let postsWithImages = 0
  let postsSkipped = 0

  for (const wpPost of publishedPosts) {
    // Check if post already exists by slug
    const existingPost = await db.select().from(schema.posts).where(eq(schema.posts.slug, wpPost.postName)).limit(1)

    if (existingPost.length > 0) {
      console.log(`   ⏭️ Skipping (exists): ${wpPost.postTitle.substring(0, 50)}...`)
      postsSkipped++
      continue
    }

    // Clean content - remove WordPress block comments
    let content = wpPost.postContent
      .replace(/<!--\s*wp:[^>]+\s*-->/g, '')  // Remove opening block comments
      .replace(/<!--\s*\/wp:[^>]+\s*-->/g, '')  // Remove closing block comments
      .replace(/<!--nextpage-->/g, '<hr/>')  // Replace page breaks with hr
      .trim()

    // Generate excerpt if not provided
    let excerpt = wpPost.postExcerpt
    if (!excerpt || excerpt.trim() === '') {
      // Strip HTML and get first 160 characters
      excerpt = content.replace(/<[^>]+>/g, '').substring(0, 160).trim()
      if (excerpt.length >= 160) {
        excerpt = excerpt.substring(0, excerpt.lastIndexOf(' ')) + '...'
      }
    }

    // Parse date
    const publishedAt = new Date(wpPost.postDate.replace(' ', 'T') + 'Z')
    const updatedAt = new Date(wpPost.postModified.replace(' ', 'T') + 'Z')

    // Get featured image
    let featuredImage: string | null = null
    const thumbnailId = thumbnailByPostId.get(wpPost.id)
    if (thumbnailId) {
      const imageUrl = attachmentById.get(thumbnailId)
      if (imageUrl) {
        featuredImage = imageUrl
      }
    }

    // Create post
    const postId = createId()
    const newPost = {
      id: postId,
      title: wpPost.postTitle,
      slug: wpPost.postName,
      content: content,
      excerpt: excerpt,
      featuredImage: featuredImage,
      authorId: adminUser.id,
      status: 'PUBLISHED' as const,
      viewCount: 0,
      publishedAt: publishedAt,
      isPinned: false,
      pinnedOrder: 0,
      createdAt: publishedAt,
      updatedAt: updatedAt,
    }

    await db.insert(schema.posts).values(newPost)

    // Find related categories and tags
    const postTermRels = termRelationships.filter(r => r.objectId === wpPost.id)

    const postCategories: string[] = []
    const postTagSlugs: string[] = []

    for (const rel of postTermRels) {
      const tax = taxonomyById.get(rel.termTaxonomyId)
      if (!tax) continue

      const term = termById.get(tax.termId)
      if (!term) continue

      if (tax.taxonomy === 'category') {
        // Map WP category to inidepok category
        const mappedSlug = categoryMapping[term.slug] || 'berita-depok'
        const category = categoryBySlug.get(mappedSlug)
        if (category && !postCategories.includes(category.id)) {
          postCategories.push(category.id)
        }
      } else if (tax.taxonomy === 'post_tag') {
        if (!postTagSlugs.includes(term.slug)) {
          postTagSlugs.push(term.slug)
        }
      }
    }

    // If no category was assigned, default to berita-depok
    if (postCategories.length === 0) {
      const defaultCat = categoryBySlug.get('berita-depok')
      if (defaultCat) {
        postCategories.push(defaultCat.id)
      }
    }

    // Insert post-category relationships
    for (const catId of postCategories) {
      await db.insert(schema.postCategories).values({
        categoryId: catId,
        postId: postId,
      }).onConflictDoNothing()
    }

    // Insert post-tag relationships
    for (const tagSlug of postTagSlugs) {
      const tag = tagBySlug.get(tagSlug)
      if (tag) {
        await db.insert(schema.postTags).values({
          postId: postId,
          tagId: tag.id,
        }).onConflictDoNothing()
      }
    }

    const imageStatus = featuredImage ? '🖼️' : '📄'
    console.log(`   ${imageStatus} ✅ Imported: ${wpPost.postTitle.substring(0, 55)}${wpPost.postTitle.length > 55 ? '...' : ''}`)
    postsImported++
    if (featuredImage) postsWithImages++
  }

  console.log('\n====================================')
  console.log('✅ Migration completed!')
  console.log(`   - Posts imported: ${postsImported}`)
  console.log(`   - Posts with images: ${postsWithImages}`)
  console.log(`   - Posts skipped (already exist): ${postsSkipped}`)
  console.log(`   - Tags created: ${tagsCreated}`)
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
