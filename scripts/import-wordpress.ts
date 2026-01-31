/**
 * WordPress to IniDepok Database Import Script
 *
 * Parses WordPress SQL backup and imports posts/categories to PostgreSQL
 *
 * Usage: npx tsx scripts/import-wordpress.ts
 */

import fs from 'fs'
import path from 'path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })

const SQL_FILE = path.join(__dirname, '..', 'inidepok content', 'softsql.sql')

interface WPPost {
  id: number
  post_date: string
  post_content: string
  post_title: string
  post_excerpt: string
  post_status: string
  post_name: string  // slug
  post_type: string
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
}

interface WPTermRelationship {
  object_id: number  // post ID
  term_taxonomy_id: number
}

// Parse a single INSERT statement's values
function parseInsertValues(sql: string, startPos: number): { rows: string[][], endPos: number } {
  const rows: string[][] = []
  let pos = startPos
  let depth = 0
  let inString = false
  let stringChar = ''
  let escaped = false
  let currentRow: string[] = []
  let currentValue = ''
  let rowStarted = false

  while (pos < sql.length) {
    const char = sql[pos]

    // Handle escape
    if (escaped) {
      currentValue += char
      escaped = false
      pos++
      continue
    }

    if (char === '\\') {
      escaped = true
      currentValue += char
      pos++
      continue
    }

    // Handle string boundaries
    if (!inString && (char === "'" || char === '"')) {
      inString = true
      stringChar = char
      pos++
      continue
    }

    if (inString && char === stringChar) {
      // Check for escaped quote (doubled)
      if (pos + 1 < sql.length && sql[pos + 1] === stringChar) {
        currentValue += stringChar
        pos += 2
        continue
      }
      inString = false
      pos++
      continue
    }

    // Inside string, just add character
    if (inString) {
      currentValue += char
      pos++
      continue
    }

    // Outside string
    if (char === '(') {
      if (depth === 0) {
        rowStarted = true
        currentRow = []
        currentValue = ''
      } else {
        currentValue += char
      }
      depth++
      pos++
      continue
    }

    if (char === ')') {
      depth--
      if (depth === 0 && rowStarted) {
        // End of row
        currentRow.push(currentValue.trim())
        rows.push(currentRow)
        rowStarted = false
        currentValue = ''

        // Check if next non-whitespace is comma (more rows) or semicolon (end)
        let nextPos = pos + 1
        while (nextPos < sql.length && /\s/.test(sql[nextPos])) nextPos++

        if (sql[nextPos] === ';') {
          return { rows, endPos: nextPos + 1 }
        }
      } else if (depth < 0) {
        return { rows, endPos: pos }
      } else {
        currentValue += char
      }
      pos++
      continue
    }

    if (char === ',' && depth === 1) {
      // Value separator within row
      currentRow.push(currentValue.trim())
      currentValue = ''
      pos++
      continue
    }

    if (rowStarted) {
      currentValue += char
    }
    pos++
  }

  return { rows, endPos: pos }
}

// Parse ALL INSERT statements for a table (handles multiple INSERTs)
function parseSQLValues(sql: string, tableName: string): string[][] {
  const allRows: string[][] = []
  const insertRegex = new RegExp(`INSERT INTO \\\`${tableName}\\\` VALUES\\s*`, 'gi')

  let match
  while ((match = insertRegex.exec(sql)) !== null) {
    const startPos = match.index + match[0].length
    const { rows } = parseInsertValues(sql, startPos)
    allRows.push(...rows)
  }

  return allRows
}

// Clean WordPress content - remove Gutenberg blocks, convert to HTML
function cleanContent(content: string): string {
  if (!content) return ''

  // Unescape SQL escapes
  content = content
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, '\t')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')

  // Remove WordPress Gutenberg block comments
  content = content.replace(/<!-- \/?wp:[^>]*-->/g, '')

  // Trim and clean up
  content = content.trim()

  // If content already has HTML tags, preserve them
  if (/<[^>]+>/.test(content)) {
    return content
  }

  // Convert double newlines to paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
  content = paragraphs.map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('\n')

  return content.trim()
}

// Generate excerpt from content
function generateExcerpt(content: string, maxLength = 160): string {
  // Strip HTML tags
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  if (text.length <= maxLength) return text

  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...'
}

// Create URL-friendly slug
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function main() {
  console.log('Starting WordPress import...\n')

  // Check if SQL file exists
  if (!fs.existsSync(SQL_FILE)) {
    console.error('SQL file not found:', SQL_FILE)
    process.exit(1)
  }

  // Read SQL file
  console.log('Reading SQL file...')
  const sql = fs.readFileSync(SQL_FILE, 'utf-8')
  console.log(`SQL file size: ${(sql.length / 1024 / 1024).toFixed(2)} MB\n`)

  // Connect to database
  console.log('Connecting to database...')
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not set in environment')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })
  const db = drizzle(pool, { schema })

  try {
    // Test connection
    await pool.query('SELECT 1')
    console.log('Database connected!\n')

    // Get admin user for author assignment
    const [adminUser] = await db.select().from(schema.users).where(eq(schema.users.role, 'ADMIN')).limit(1)
    if (!adminUser) {
      console.error('No admin user found. Please create one first.')
      process.exit(1)
    }
    console.log(`Using author: ${adminUser.name} (${adminUser.email})\n`)

    // Parse WordPress terms (categories)
    console.log('Parsing WordPress categories...')
    const termsRows = parseSQLValues(sql, 'wps9_terms')
    const terms: WPTerm[] = termsRows.map(row => ({
      term_id: parseInt(row[0]) || 0,
      name: row[1] || '',
      slug: row[2] || '',
    }))
    console.log(`Found ${terms.length} terms`)

    // Parse term taxonomy to identify categories
    const taxonomyRows = parseSQLValues(sql, 'wps9_term_taxonomy')
    const taxonomies: WPTermTaxonomy[] = taxonomyRows.map(row => ({
      term_taxonomy_id: parseInt(row[0]) || 0,
      term_id: parseInt(row[1]) || 0,
      taxonomy: row[2] || '',
    }))

    // Filter only categories
    const categoryTaxonomies = taxonomies.filter(t => t.taxonomy === 'category')
    const categoryTermIds = new Set(categoryTaxonomies.map(t => t.term_id))
    const wpCategories = terms.filter(t => categoryTermIds.has(t.term_id))
    console.log(`Found ${wpCategories.length} categories\n`)

    // Create taxonomy ID to term ID mapping
    const taxonomyToTermId = new Map<number, number>()
    categoryTaxonomies.forEach(t => taxonomyToTermId.set(t.term_taxonomy_id, t.term_id))

    // Parse term relationships
    console.log('Parsing post-category relationships...')
    const relationRows = parseSQLValues(sql, 'wps9_term_relationships')
    const relationships: WPTermRelationship[] = relationRows.map(row => ({
      object_id: parseInt(row[0]) || 0,
      term_taxonomy_id: parseInt(row[1]) || 0,
    }))
    console.log(`Found ${relationships.length} relationships\n`)

    // Parse posts
    console.log('Parsing WordPress posts...')
    const postsRows = parseSQLValues(sql, 'wps9_posts')
    console.log(`Total post rows parsed: ${postsRows.length}`)

    // Debug: show first few rows structure
    if (postsRows.length > 0) {
      console.log(`First row has ${postsRows[0].length} columns`)
    }

    const wpPosts: WPPost[] = postsRows.map(row => ({
      id: parseInt(row[0]) || 0,
      post_date: row[2] || '',
      post_content: row[4] || '',
      post_title: row[5] || '',
      post_excerpt: row[6] || '',
      post_status: row[7] || '',
      post_name: row[11] || '',
      post_type: row[20] || '',
    }))

    // Filter only published posts (not pages, attachments, etc.)
    const publishedPosts = wpPosts.filter(p =>
      p.post_type === 'post' &&
      p.post_status === 'publish' &&
      p.post_title.trim() !== ''
    )
    console.log(`Found ${publishedPosts.length} published posts\n`)

    // Debug: show some post types
    const postTypes = new Map<string, number>()
    wpPosts.forEach(p => {
      postTypes.set(p.post_type, (postTypes.get(p.post_type) || 0) + 1)
    })
    console.log('Post types found:')
    postTypes.forEach((count, type) => console.log(`  ${type || '(empty)'}: ${count}`))
    console.log('')

    // Import categories
    console.log('Importing categories to database...')
    const categoryIdMap = new Map<number, string>() // WP term_id -> DB id

    for (const wpCat of wpCategories) {
      // Check if category already exists
      const [existing] = await db.select().from(schema.categories).where(eq(schema.categories.slug, wpCat.slug)).limit(1)

      if (existing) {
        categoryIdMap.set(wpCat.term_id, existing.id)
        console.log(`  Category exists: ${wpCat.name}`)
      } else {
        const [newCat] = await db.insert(schema.categories).values({
          name: wpCat.name,
          slug: wpCat.slug,
        }).returning()

        categoryIdMap.set(wpCat.term_id, newCat.id)
        console.log(`  Created category: ${wpCat.name}`)
      }
    }
    console.log(`\nImported ${categoryIdMap.size} categories\n`)

    // Import posts
    console.log('Importing posts to database...')
    let importedCount = 0
    let skippedCount = 0
    const postIdMap = new Map<number, string>() // WP post_id -> DB id

    for (const wpPost of publishedPosts) {
      // Check if post already exists by slug
      const [existing] = await db.select().from(schema.posts).where(eq(schema.posts.slug, wpPost.post_name)).limit(1)

      if (existing) {
        postIdMap.set(wpPost.id, existing.id)
        console.log(`  Skipped (exists): ${wpPost.post_title.substring(0, 50)}...`)
        skippedCount++
        continue
      }

      // Clean content
      const cleanedContent = cleanContent(wpPost.post_content)
      const excerpt = wpPost.post_excerpt ? cleanContent(wpPost.post_excerpt) : generateExcerpt(cleanedContent)

      // Parse date
      const publishedAt = new Date(wpPost.post_date)

      // Insert post
      try {
        const [newPost] = await db.insert(schema.posts).values({
          title: wpPost.post_title,
          slug: wpPost.post_name || createSlug(wpPost.post_title),
          content: cleanedContent,
          excerpt: excerpt,
          authorId: adminUser.id,
          status: 'PUBLISHED',
          publishedAt: publishedAt,
          createdAt: publishedAt,
        }).returning()

        postIdMap.set(wpPost.id, newPost.id)
        importedCount++
        console.log(`  Imported: ${wpPost.post_title.substring(0, 50)}...`)
      } catch (err) {
        console.error(`  Failed to import: ${wpPost.post_title}`, err)
      }
    }

    console.log(`\nImported ${importedCount} posts, skipped ${skippedCount} existing\n`)

    // Import post-category relationships
    console.log('Importing post-category relationships...')
    let relCount = 0

    for (const rel of relationships) {
      const postId = postIdMap.get(rel.object_id)
      const termId = taxonomyToTermId.get(rel.term_taxonomy_id)
      const categoryId = termId ? categoryIdMap.get(termId) : undefined

      if (postId && categoryId) {
        try {
          await db.insert(schema.postCategories).values({
            postId,
            categoryId,
          }).onConflictDoNothing()
          relCount++
        } catch (err) {
          // Ignore duplicates
        }
      }
    }

    console.log(`Created ${relCount} post-category relationships\n`)

    console.log('='.repeat(50))
    console.log('Import completed!')
    console.log(`  Categories: ${categoryIdMap.size}`)
    console.log(`  Posts imported: ${importedCount}`)
    console.log(`  Posts skipped: ${skippedCount}`)
    console.log(`  Relationships: ${relCount}`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('Import failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
