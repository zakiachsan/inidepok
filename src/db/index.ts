import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
  db: ReturnType<typeof drizzle<typeof schema>> | undefined
}

function getPool() {
  if (!globalForDb.pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined')
    }
    globalForDb.pool = new Pool({
      connectionString,
      // Short connection timeout for build-time failures
      connectionTimeoutMillis: 5000,
    })
  }
  return globalForDb.pool
}

function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = drizzle(getPool(), { schema })
  }
  return globalForDb.db
}

// Lazy-loaded db instance
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle<typeof schema>>]
  }
})

export * from './schema'
export { eq, and, or, desc, asc, sql, like, ilike, inArray, isNull, isNotNull, count, ne, notInArray } from 'drizzle-orm'
