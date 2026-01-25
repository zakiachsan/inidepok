/**
 * Database Seed Script
 *
 * Creates initial data for the application:
 * - Admin user
 * - Default categories
 * - Sample tags
 * - Sample posts
 *
 * Usage:
 *   npx ts-node scripts/seed.ts
 */

import { PrismaClient, UserRole, PostStatus } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create admin user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@inidepok.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@inidepok.com",
      username: "admin",
      password: hashedPassword,
      displayName: "Administrator",
      role: UserRole.ADMIN,
    },
  })

  console.log(`Created admin user: ${admin.email}`)

  // Create categories
  const categories = [
    { name: "Berita", slug: "berita", description: "Berita umum seputar Depok" },
    { name: "Politik", slug: "politik", description: "Berita politik dan pemerintahan" },
    { name: "Ekonomi", slug: "ekonomi", description: "Berita ekonomi dan bisnis" },
    { name: "Olahraga", slug: "olahraga", description: "Berita olahraga dan pertandingan" },
    { name: "Lifestyle", slug: "lifestyle", description: "Gaya hidup dan tren" },
    { name: "Pendidikan", slug: "pendidikan", description: "Berita pendidikan" },
    { name: "Kesehatan", slug: "kesehatan", description: "Berita kesehatan" },
    { name: "Teknologi", slug: "teknologi", description: "Berita teknologi dan inovasi" },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }

  console.log(`Created ${categories.length} categories`)

  // Create tags
  const tags = [
    { name: "Depok", slug: "depok" },
    { name: "Jawa Barat", slug: "jawa-barat" },
    { name: "Infrastruktur", slug: "infrastruktur" },
    { name: "Pendidikan", slug: "pendidikan" },
    { name: "Kesehatan", slug: "kesehatan" },
    { name: "UMKM", slug: "umkm" },
    { name: "Transportasi", slug: "transportasi" },
    { name: "Pariwisata", slug: "pariwisata" },
  ]

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    })
  }

  console.log(`Created ${tags.length} tags`)

  // Create sample posts
  const beritaCategory = await prisma.category.findUnique({ where: { slug: "berita" } })
  const depokTag = await prisma.tag.findUnique({ where: { slug: "depok" } })

  if (beritaCategory && depokTag) {
    const samplePost = await prisma.post.upsert({
      where: { slug: "selamat-datang-di-inidepok" },
      update: {},
      create: {
        title: "Selamat Datang di IniDepok",
        slug: "selamat-datang-di-inidepok",
        content: `
          <p>Selamat datang di IniDepok, portal berita dan informasi terkini seputar Kota Depok dan sekitarnya.</p>
          <p>Kami berkomitmen untuk menyajikan berita yang akurat, cepat, dan terpercaya untuk warga Depok.</p>
          <h2>Tentang Kami</h2>
          <p>IniDepok adalah media online yang fokus pada pemberitaan lokal Kota Depok. Kami menyajikan berbagai kategori berita mulai dari politik, ekonomi, olahraga, hingga lifestyle.</p>
          <h2>Hubungi Kami</h2>
          <p>Untuk informasi lebih lanjut atau kerjasama, silakan hubungi redaksi kami melalui email: redaksi@inidepok.com</p>
        `,
        excerpt: "Selamat datang di IniDepok, portal berita dan informasi terkini seputar Kota Depok.",
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: admin.id,
        categories: {
          create: { categoryId: beritaCategory.id },
        },
        tags: {
          create: { tagId: depokTag.id },
        },
      },
    })

    console.log(`Created sample post: ${samplePost.title}`)
  }

  // Create site settings
  const settings = [
    { key: "site_title", value: "IniDepok" },
    { key: "site_description", value: "Portal Berita Depok Terkini" },
    { key: "site_email", value: "redaksi@inidepok.com" },
    { key: "posts_per_page", value: "10" },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  console.log(`Created ${settings.length} settings`)

  // Create main menu
  const mainMenu = await prisma.menu.upsert({
    where: { location: "main" },
    update: {},
    create: {
      name: "Main Menu",
      location: "main",
      items: {
        create: [
          { label: "Home", url: "/", order: 0 },
          { label: "Berita", url: "/kategori/berita", order: 1 },
          { label: "Politik", url: "/kategori/politik", order: 2 },
          { label: "Ekonomi", url: "/kategori/ekonomi", order: 3 },
          { label: "Olahraga", url: "/kategori/olahraga", order: 4 },
          { label: "Lifestyle", url: "/kategori/lifestyle", order: 5 },
        ],
      },
    },
  })

  console.log(`Created main menu with ${mainMenu.id} items`)

  console.log("Seeding completed!")
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
