import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

async function main() {
  console.log('🌱 Starting seed for Ini Depok...')

  // Clear existing data
  await db.delete(schema.menuItems)
  await db.delete(schema.menus)
  await db.delete(schema.comments)
  await db.delete(schema.postTags)
  await db.delete(schema.postCategories)
  await db.delete(schema.posts)
  await db.delete(schema.tags)
  await db.delete(schema.categories)
  await db.delete(schema.users)
  await db.delete(schema.settings)

  // ===========================================
  // CREATE ADMIN USER
  // ===========================================
  console.log('👤 Creating admin user...')
  // Pre-hashed password for 'admin123' using bcrypt with 10 rounds
  const hashedPassword = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

  const now = new Date()
  await db.insert(schema.users).values({
    email: 'admin@inidepok.com',
    password: hashedPassword,
    name: 'Admin Ini Depok',
    role: 'ADMIN',
    createdAt: now,
    updatedAt: now,
  }).returning()

  // ===========================================
  // CREATE CATEGORIES (for Depok news)
  // ===========================================
  console.log('📁 Creating categories...')

  const categoriesData = [
    { name: 'Berita Depok', slug: 'berita-depok', description: 'Berita terkini seputar Kota Depok' },
    { name: 'Pemerintahan', slug: 'pemerintahan', description: 'Berita pemerintahan dan kebijakan Kota Depok' },
    { name: 'Pendidikan', slug: 'pendidikan', description: 'Berita pendidikan di Kota Depok' },
    { name: 'Kesehatan', slug: 'kesehatan', description: 'Berita kesehatan dan fasilitas kesehatan Depok' },
    { name: 'Ekonomi & Bisnis', slug: 'ekonomi-bisnis', description: 'Berita ekonomi dan bisnis di Depok' },
    { name: 'Olahraga', slug: 'olahraga', description: 'Berita olahraga dan kegiatan olahraga di Depok' },
    { name: 'Lifestyle', slug: 'lifestyle', description: 'Gaya hidup dan hiburan di Depok' },
    { name: 'Teknologi', slug: 'teknologi', description: 'Berita teknologi dan inovasi' },
  ]

  const insertedCategories = await db.insert(schema.categories).values(categoriesData).returning()
  const categories: Record<string, typeof insertedCategories[0]> = {}
  for (const cat of insertedCategories) {
    categories[cat.slug] = cat
  }

  // ===========================================
  // CREATE TAGS (relevant to Depok)
  // ===========================================
  console.log('🏷️ Creating tags...')

  const tagsData = [
    { name: 'Depok', slug: 'depok' },
    { name: 'Pemkot Depok', slug: 'pemkot-depok' },
    { name: 'Wali Kota Depok', slug: 'wali-kota-depok' },
    { name: 'DPRD Depok', slug: 'dprd-depok' },
    { name: 'Jawa Barat', slug: 'jawa-barat' },
    { name: 'Universitas Indonesia', slug: 'universitas-indonesia' },
    { name: 'UI', slug: 'ui' },
    { name: 'Infrastruktur', slug: 'infrastruktur' },
    { name: 'Transportasi', slug: 'transportasi' },
    { name: 'LRT', slug: 'lrt' },
    { name: 'Margonda', slug: 'margonda' },
    { name: 'Sawangan', slug: 'sawangan' },
    { name: 'Cinere', slug: 'cinere' },
    { name: 'Beji', slug: 'beji' },
    { name: 'Cimanggis', slug: 'cimanggis' },
    { name: 'Cilodong', slug: 'cilodong' },
    { name: 'Tapos', slug: 'tapos' },
    { name: 'Sukmajaya', slug: 'sukmajaya' },
    { name: 'Pancoran Mas', slug: 'pancoran-mas' },
    { name: 'Bojongsari', slug: 'bojongsari' },
    { name: 'Limo', slug: 'limo' },
  ]

  const insertedTags = await db.insert(schema.tags).values(tagsData).returning()
  const tags: Record<string, typeof insertedTags[0]> = {}
  for (const tag of insertedTags) {
    tags[tag.slug] = tag
  }

  // ===========================================
  // NO SAMPLE POSTS - Articles will be imported from WordPress backup
  // ===========================================
  console.log('📝 Skipping sample posts (will be imported from WordPress backup)...')

  // ===========================================
  // CREATE MENUS
  // ===========================================
  console.log('📋 Creating menus...')

  const [primaryMenu] = await db.insert(schema.menus).values({
    name: 'Primary Menu',
    location: 'primary',
  }).returning()

  await db.insert(schema.menuItems).values([
    { menuId: primaryMenu.id, title: 'Beranda', url: '/', order: 0 },
    { menuId: primaryMenu.id, title: 'Berita Depok', url: '/category/berita-depok', order: 1 },
    { menuId: primaryMenu.id, title: 'Pemerintahan', url: '/category/pemerintahan', order: 2 },
    { menuId: primaryMenu.id, title: 'Pendidikan', url: '/category/pendidikan', order: 3 },
    { menuId: primaryMenu.id, title: 'Ekonomi & Bisnis', url: '/category/ekonomi-bisnis', order: 4 },
    { menuId: primaryMenu.id, title: 'Olahraga', url: '/category/olahraga', order: 5 },
    { menuId: primaryMenu.id, title: 'Lifestyle', url: '/category/lifestyle', order: 6 },
  ])

  const [footerMenu] = await db.insert(schema.menus).values({
    name: 'Footer Menu',
    location: 'footer',
  }).returning()

  await db.insert(schema.menuItems).values([
    { menuId: footerMenu.id, title: 'Tentang Kami', url: '/tentang-kami', order: 0 },
    { menuId: footerMenu.id, title: 'Kontak', url: '/kontak', order: 1 },
    { menuId: footerMenu.id, title: 'Kebijakan Privasi', url: '/kebijakan-privasi', order: 2 },
    { menuId: footerMenu.id, title: 'Syarat & Ketentuan', url: '/syarat-ketentuan', order: 3 },
  ])

  // ===========================================
  // CREATE SETTINGS
  // ===========================================
  console.log('⚙️ Creating settings...')

  await db.insert(schema.settings).values([
    { key: 'site_name', value: 'Ini Depok' },
    { key: 'site_description', value: 'Portal Berita Depok Terkini' },
    { key: 'site_logo', value: '/images/logo.png' },
    { key: 'posts_per_page', value: '10' },
    { key: 'allow_comments', value: 'true' },
    { key: 'moderate_comments', value: 'true' },
  ])

  console.log('✅ Seed completed!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   - Users: 1`)
  console.log(`   - Categories: ${Object.keys(categories).length}`)
  console.log(`   - Tags: ${Object.keys(tags).length}`)
  console.log(`   - Posts: 0 (import from WordPress backup)`)
  console.log(`   - Menus: 2`)
  console.log('')
  console.log('🔐 Admin credentials:')
  console.log('   Email: admin@inidepok.com')
  console.log('   Password: admin123')
  console.log('')
  console.log('📰 To import articles, run: tsx src/db/seed-wp.ts')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
