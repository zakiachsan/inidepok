/**
 * WordPress to Next.js Migration Script
 *
 * Migrates content from WordPress SQL dump to PostgreSQL via Prisma.
 *
 * Usage:
 *   npx ts-node --esm scripts/migrate-wp.ts
 */

import { PrismaClient, PostStatus, UserRole } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

// WordPress table prefix placeholder
const PREFIX = "SERVMASK_PREFIX_"

interface WPPost {
  ID: number
  post_author: number
  post_date: string
  post_content: string
  post_title: string
  post_excerpt: string
  post_status: string
  post_name: string
  post_type: string
  guid: string
}

interface WPTerm {
  term_id: number
  name: string
  slug: string
}

interface WPTermTaxonomy {
  term_taxonomy_id: number
  term_id: number
  taxonomy: string
  description: string
  count: number
}

interface WPTermRelationship {
  object_id: number
  term_taxonomy_id: number
}

interface WPUser {
  ID: number
  user_login: string
  user_email: string
  display_name: string
}

// Parse INSERT statements
function parseInserts(sql: string, tableName: string): string[][] {
  const regex = new RegExp(
    `INSERT INTO \\\`${PREFIX}${tableName}\\\` VALUES \\((.+?)\\);`,
    "g"
  )
  const results: string[][] = []

  let match
  while ((match = regex.exec(sql)) !== null) {
    const valuesStr = match[1]
    const values = parseValues(valuesStr)
    results.push(values)
  }

  return results
}

// Parse SQL values - handles quoted strings with commas
function parseValues(valuesStr: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuote = false
  let escapeNext = false

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i]

    if (escapeNext) {
      current += char
      escapeNext = false
      continue
    }

    if (char === "\\") {
      escapeNext = true
      current += char
      continue
    }

    if (char === "'" && !inQuote) {
      inQuote = true
      continue
    }

    if (char === "'" && inQuote) {
      // Check for escaped quote ''
      if (valuesStr[i + 1] === "'") {
        current += "'"
        i++
        continue
      }
      inQuote = false
      continue
    }

    if (char === "," && !inQuote) {
      values.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  if (current) {
    values.push(current.trim())
  }

  return values
}

// Clean WordPress content (remove Gutenberg blocks)
function cleanContent(content: string): string {
  return content
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/<!-- wp:[^>]+-->/g, "")
    .replace(/<!-- \/wp:[^>]+-->/g, "")
    .replace(/<p class="[^"]*">/g, "<p>")
    .replace(/<h(\d) class="[^"]*">/g, "<h$1>")
    .trim()
}

// Map WordPress post status to Prisma enum
function mapPostStatus(wpStatus: string): PostStatus {
  switch (wpStatus) {
    case "publish":
      return PostStatus.PUBLISHED
    case "draft":
    case "pending":
    case "auto-draft":
      return PostStatus.DRAFT
    case "future":
      return PostStatus.SCHEDULED
    case "trash":
      return PostStatus.TRASH
    default:
      return PostStatus.DRAFT
  }
}

async function migrate() {
  const sqlPath = process.env.WP_SQL_PATH || path.join(__dirname, "..", "wp-backup", "database.sql")

  console.log("=== WordPress Migration ===")
  console.log(`Reading: ${sqlPath}`)

  if (!fs.existsSync(sqlPath)) {
    console.error("SQL file not found!")
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, "utf-8")

  // Parse WordPress data
  console.log("\nParsing WordPress data...")

  const usersRaw = parseInserts(sql, "users")
  const postsRaw = parseInserts(sql, "posts")
  const termsRaw = parseInserts(sql, "terms")
  const termTaxonomyRaw = parseInserts(sql, "term_taxonomy")
  const termRelationshipsRaw = parseInserts(sql, "term_relationships")

  console.log(`- Users: ${usersRaw.length}`)
  console.log(`- Posts: ${postsRaw.length}`)
  console.log(`- Terms: ${termsRaw.length}`)
  console.log(`- Term Taxonomies: ${termTaxonomyRaw.length}`)
  console.log(`- Term Relationships: ${termRelationshipsRaw.length}`)

  // Convert to typed objects
  const wpUsers: WPUser[] = usersRaw.map((row) => ({
    ID: parseInt(row[0]),
    user_login: row[1],
    user_email: row[4],
    display_name: row[9] || row[1],
  }))

  const wpPosts: WPPost[] = postsRaw
    .map((row) => ({
      ID: parseInt(row[0]),
      post_author: parseInt(row[1]),
      post_date: row[2],
      post_content: row[4],
      post_title: row[5],
      post_excerpt: row[6],
      post_status: row[7],
      post_name: row[12],
      post_type: row[20],
      guid: row[18],
    }))
    .filter((p) => p.post_type === "post" && p.post_status !== "auto-draft")

  const wpTerms: WPTerm[] = termsRaw.map((row) => ({
    term_id: parseInt(row[0]),
    name: row[1],
    slug: row[2],
  }))

  const wpTermTaxonomies: WPTermTaxonomy[] = termTaxonomyRaw.map((row) => ({
    term_taxonomy_id: parseInt(row[0]),
    term_id: parseInt(row[1]),
    taxonomy: row[2],
    description: row[3],
    count: parseInt(row[5]),
  }))

  const wpTermRelationships: WPTermRelationship[] = termRelationshipsRaw.map((row) => ({
    object_id: parseInt(row[0]),
    term_taxonomy_id: parseInt(row[1]),
  }))

  console.log(`\nFiltered posts (type=post): ${wpPosts.length}`)

  // Migrate Users
  console.log("\n--- Migrating Users ---")
  const userIdMap = new Map<number, number>()

  for (const wpUser of wpUsers) {
    try {
      const user = await prisma.user.upsert({
        where: { email: wpUser.user_email },
        update: {},
        create: {
          email: wpUser.user_email,
          username: wpUser.user_login.toLowerCase(),
          password: "changeme123", // Users must reset password
          displayName: wpUser.display_name || wpUser.user_login,
          role: UserRole.AUTHOR,
        },
      })
      userIdMap.set(wpUser.ID, user.id)
      console.log(`  User: ${wpUser.user_login} -> ID ${user.id}`)
    } catch (err: any) {
      console.error(`  Error migrating user ${wpUser.user_login}:`, err.message)
    }
  }

  // Migrate Categories
  console.log("\n--- Migrating Categories ---")
  const categoryIdMap = new Map<number, number>()

  const categories = wpTermTaxonomies.filter((t) => t.taxonomy === "category")
  for (const cat of categories) {
    const term = wpTerms.find((t) => t.term_id === cat.term_id)
    if (!term) continue

    try {
      const category = await prisma.category.upsert({
        where: { slug: term.slug },
        update: {},
        create: {
          name: term.name,
          slug: term.slug,
          description: cat.description || null,
        },
      })
      categoryIdMap.set(cat.term_taxonomy_id, category.id)
      console.log(`  Category: ${term.name} -> ID ${category.id}`)
    } catch (err: any) {
      console.error(`  Error migrating category ${term.name}:`, err.message)
    }
  }

  // Migrate Tags
  console.log("\n--- Migrating Tags ---")
  const tagIdMap = new Map<number, number>()

  const tags = wpTermTaxonomies.filter((t) => t.taxonomy === "post_tag")
  for (const tagTax of tags) {
    const term = wpTerms.find((t) => t.term_id === tagTax.term_id)
    if (!term) continue

    try {
      const tag = await prisma.tag.upsert({
        where: { slug: term.slug },
        update: {},
        create: {
          name: term.name,
          slug: term.slug,
        },
      })
      tagIdMap.set(tagTax.term_taxonomy_id, tag.id)
      console.log(`  Tag: ${term.name} -> ID ${tag.id}`)
    } catch (err: any) {
      console.error(`  Error migrating tag ${term.name}:`, err.message)
    }
  }

  // Migrate Posts
  console.log("\n--- Migrating Posts ---")
  let successCount = 0
  let errorCount = 0

  for (const wpPost of wpPosts) {
    try {
      // Skip if no title or slug
      if (!wpPost.post_title || !wpPost.post_name) {
        continue
      }

      // Get author
      const authorId = userIdMap.get(wpPost.post_author)
      if (!authorId) {
        console.log(`  Skipping post ${wpPost.ID}: No author found`)
        continue
      }

      // Get categories and tags for this post
      const postTermRelations = wpTermRelationships.filter(
        (r) => r.object_id === wpPost.ID
      )

      const postCategoryIds = postTermRelations
        .map((r) => categoryIdMap.get(r.term_taxonomy_id))
        .filter((id): id is number => id !== undefined)

      const postTagIds = postTermRelations
        .map((r) => tagIdMap.get(r.term_taxonomy_id))
        .filter((id): id is number => id !== undefined)

      // Clean content
      const cleanedContent = cleanContent(wpPost.post_content)
      const cleanedExcerpt = wpPost.post_excerpt
        ? cleanContent(wpPost.post_excerpt)
        : null

      // Create or update post
      const existingPost = await prisma.post.findUnique({
        where: { slug: wpPost.post_name },
      })

      if (!existingPost) {
        await prisma.post.create({
          data: {
            title: wpPost.post_title.replace(/\\'/g, "'"),
            slug: wpPost.post_name,
            content: cleanedContent,
            excerpt: cleanedExcerpt,
            status: mapPostStatus(wpPost.post_status),
            publishedAt:
              wpPost.post_status === "publish"
                ? new Date(wpPost.post_date)
                : null,
            authorId: authorId,
            categories: {
              create: postCategoryIds.map((catId) => ({ categoryId: catId })),
            },
            tags: {
              create: postTagIds.map((tagId) => ({ tagId: tagId })),
            },
          },
        })
        successCount++
        console.log(`  Post: "${wpPost.post_title.slice(0, 50)}..." -> OK`)
      } else {
        console.log(`  Post: "${wpPost.post_title.slice(0, 50)}..." -> Exists`)
      }
    } catch (err: any) {
      errorCount++
      console.error(`  Error migrating post ${wpPost.ID}:`, err.message)
    }
  }

  console.log("\n=== Migration Complete ===")
  console.log(`Posts migrated: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Categories: ${categoryIdMap.size}`)
  console.log(`Tags: ${tagIdMap.size}`)
  console.log(`Users: ${userIdMap.size}`)
}

migrate()
  .catch((e) => {
    console.error("Migration failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
