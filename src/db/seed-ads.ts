import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

const adPositions = [
  { position: 'header', name: 'Header Banner', width: 970, height: 250 },
  { position: 'sidebar-1', name: 'Sidebar Ad 1', width: 300, height: 250 },
  { position: 'sidebar-2', name: 'Sidebar Ad 2', width: 300, height: 250 },
  { position: 'side-left', name: 'Left Skyscraper', width: 160, height: 600 },
  { position: 'side-right', name: 'Right Skyscraper', width: 160, height: 600 },
  { position: 'content-top', name: 'Content Top', width: 728, height: 90 },
  { position: 'content-bottom', name: 'Content Bottom', width: 728, height: 90 },
]

async function main() {
  console.log('Initializing ad positions...')

  for (const ad of adPositions) {
    // Check if position already exists
    const existing = await db
      .select()
      .from(schema.ads)
      .where(eq(schema.ads.position, ad.position))
      .limit(1)

    if (existing.length > 0) {
      console.log(`  Position "${ad.position}" already exists, skipping...`)
      continue
    }

    await db.insert(schema.ads).values({
      position: ad.position,
      name: ad.name,
      width: ad.width,
      height: ad.height,
      enabled: true,
      type: 'placeholder',
    })
    console.log(`  Created: ${ad.name} (${ad.width}x${ad.height})`)
  }

  console.log('Ad positions initialized!')
}

main()
  .catch((e) => {
    console.error('Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
