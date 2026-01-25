import { Sidebar } from "@/components/layout"
import { PostCard } from "@/components/post"
import prisma from "@/lib/prisma"

// Mock data for development
const mockPosts = [
  {
    id: 1,
    title: "Pembangunan Infrastruktur di Depok Terus Berlanjut",
    slug: "pembangunan-infrastruktur-depok",
    excerpt: "Pemerintah Kota Depok terus melanjutkan pembangunan infrastruktur untuk meningkatkan kualitas hidup warga.",
    featuredImage: null,
    publishedAt: new Date(),
    author: { displayName: "Admin" },
    categories: [{ category: { name: "Berita", slug: "berita" } }],
  },
  {
    id: 2,
    title: "Warga Depok Antusias Sambut Program Kesehatan Gratis",
    slug: "program-kesehatan-gratis-depok",
    excerpt: "Program kesehatan gratis yang diluncurkan mendapat sambutan positif dari masyarakat.",
    featuredImage: null,
    publishedAt: new Date(Date.now() - 3600000),
    author: { displayName: "Editor" },
    categories: [{ category: { name: "Kesehatan", slug: "kesehatan" } }],
  },
  {
    id: 3,
    title: "Tim Sepak Bola Depok Raih Kemenangan di Liga Regional",
    slug: "tim-sepakbola-depok-menang",
    excerpt: "Kemenangan gemilang diraih tim sepak bola Depok dalam pertandingan liga regional.",
    featuredImage: null,
    publishedAt: new Date(Date.now() - 7200000),
    author: { displayName: "Sports" },
    categories: [{ category: { name: "Olahraga", slug: "olahraga" } }],
  },
]

const mockCategories = [
  { id: 1, name: "Berita", slug: "berita", count: 150 },
  { id: 2, name: "Politik", slug: "politik", count: 45 },
  { id: 3, name: "Ekonomi", slug: "ekonomi", count: 38 },
  { id: 4, name: "Olahraga", slug: "olahraga", count: 52 },
  { id: 5, name: "Lifestyle", slug: "lifestyle", count: 29 },
]

const mockPopularPosts = [
  { id: 1, title: "Berita Populer 1", slug: "berita-populer-1", viewCount: 5420, publishedAt: new Date().toISOString() },
  { id: 2, title: "Berita Populer 2", slug: "berita-populer-2", viewCount: 4180, publishedAt: new Date().toISOString() },
  { id: 3, title: "Berita Populer 3", slug: "berita-populer-3", viewCount: 3920, publishedAt: new Date().toISOString() },
  { id: 4, title: "Berita Populer 4", slug: "berita-populer-4", viewCount: 2850, publishedAt: new Date().toISOString() },
  { id: 5, title: "Berita Populer 5", slug: "berita-populer-5", viewCount: 2340, publishedAt: new Date().toISOString() },
]

const mockTags = [
  { id: 1, name: "Depok", slug: "depok" },
  { id: 2, name: "Jawa Barat", slug: "jawa-barat" },
  { id: 3, name: "Infrastruktur", slug: "infrastruktur" },
  { id: 4, name: "Kesehatan", slug: "kesehatan" },
  { id: 5, name: "Pendidikan", slug: "pendidikan" },
]

export default async function Home() {
  // TODO: Replace with real data from database
  const featuredPost = mockPosts[0]
  const latestPosts = mockPosts.slice(1)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Featured Post */}
          <section>
            <PostCard post={featuredPost} variant="featured" />
          </section>

          {/* Latest Posts */}
          <section>
            <h2 className="text-xl font-bold mb-4 border-l-4 border-red-600 pl-3">
              Berita Terbaru
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>

          {/* Category Section: Berita */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold border-l-4 border-red-600 pl-3">
                Berita
              </h2>
              <a href="/kategori/berita" className="text-red-600 hover:underline text-sm font-medium">
                Lihat Semua
              </a>
            </div>
            <div className="space-y-4">
              {mockPosts.map((post) => (
                <PostCard key={post.id} post={post} variant="horizontal" />
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Sidebar
            categories={mockCategories}
            popularPosts={mockPopularPosts}
            tags={mockTags}
          />
        </div>
      </div>
    </div>
  )
}
