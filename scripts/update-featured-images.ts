/**
 * Update Featured Images from WordPress Backup
 *
 * Reads WordPress postmeta and updates posts with their featured images
 *
 * Usage: npx tsx scripts/update-featured-images.ts
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

    if (!inString && (char === "'" || char === '"')) {
      inString = true
      stringChar = char
      pos++
      continue
    }

    if (inString && char === stringChar) {
      if (pos + 1 < sql.length && sql[pos + 1] === stringChar) {
        currentValue += stringChar
        pos += 2
        continue
      }
      inString = false
      pos++
      continue
    }

    if (inString) {
      currentValue += char
      pos++
      continue
    }

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
        currentRow.push(currentValue.trim())
        rows.push(currentRow)
        rowStarted = false
        currentValue = ''

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

// Parse ALL INSERT statements for a table
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

async function main() {
  console.log('Updating featured images from WordPress backup...\n')

  if (!fs.existsSync(SQL_FILE)) {
    console.error('SQL file not found:', SQL_FILE)
    process.exit(1)
  }

  console.log('Reading SQL file...')
  const sql = fs.readFileSync(SQL_FILE, 'utf-8')

  // Connect to database
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const pool = new Pool({ connectionString })
  const db = drizzle(pool, { schema })

  try {
    await pool.query('SELECT 1')
    console.log('Database connected!\n')

    // Parse postmeta for _thumbnail_id
    console.log('Parsing WordPress postmeta...')
    const postmetaRows = parseSQLValues(sql, 'wps9_postmeta')

    // postmeta columns: meta_id, post_id, meta_key, meta_value
    const thumbnailMap = new Map<number, number>() // post_id -> attachment_id

    for (const row of postmetaRows) {
      const postId = parseInt(row[1]) || 0
      const metaKey = row[2] || ''
      const metaValue = row[3] || ''

      if (metaKey === '_thumbnail_id') {
        thumbnailMap.set(postId, parseInt(metaValue) || 0)
      }
    }
    console.log(`Found ${thumbnailMap.size} posts with thumbnails\n`)

    // Parse posts to get attachment URLs
    console.log('Parsing WordPress posts for attachment URLs...')
    const postsRows = parseSQLValues(sql, 'wps9_posts')

    // posts columns: ID(0), ..., guid(18), ..., post_type(20)
    const attachmentUrls = new Map<number, string>() // attachment_id -> url
    const postSlugs = new Map<number, string>() // post_id -> slug

    for (const row of postsRows) {
      const id = parseInt(row[0]) || 0
      const slug = row[11] || ''
      const guid = row[18] || ''
      const postType = row[20] || ''

      if (postType === 'attachment' && guid) {
        // Clean and fix the URL
        let url = guid
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, '\\')

        // Convert old demo URLs to production URLs
        if (url.includes('demo.idtheme.com')) {
          url = url.replace('http://demo.idtheme.com/bloggingpro', 'https://inidepok.com')
        }

        attachmentUrls.set(id, url)
      }

      if (postType === 'post' && slug) {
        postSlugs.set(id, slug)
      }
    }
    console.log(`Found ${attachmentUrls.size} attachment URLs\n`)

    // Update posts in database
    console.log('Updating posts with featured images...')
    let updatedCount = 0
    let skippedCount = 0
    let notFoundCount = 0

    for (const [wpPostId, attachmentId] of thumbnailMap) {
      const slug = postSlugs.get(wpPostId)
      const imageUrl = attachmentUrls.get(attachmentId)

      if (!slug) {
        continue // Not a post we care about
      }

      if (!imageUrl) {
        console.log(`  No image URL for attachment ${attachmentId}`)
        notFoundCount++
        continue
      }

      // Find the post in our database by slug
      const [post] = await db.select().from(schema.posts).where(eq(schema.posts.slug, slug)).limit(1)

      if (!post) {
        continue // Post not in our database
      }

      // Check if already has an image
      if (post.featuredImage && post.featuredImage.length > 0) {
        skippedCount++
        continue
      }

      // Update the post
      await db.update(schema.posts)
        .set({ featuredImage: imageUrl })
        .where(eq(schema.posts.id, post.id))

      console.log(`  Updated: ${post.title.substring(0, 50)}...`)
      updatedCount++
    }

    console.log('\n' + '='.repeat(50))
    console.log('Featured images update completed!')
    console.log(`  Updated: ${updatedCount}`)
    console.log(`  Skipped (already has image): ${skippedCount}`)
    console.log(`  Image not found: ${notFoundCount}`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('Update failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
