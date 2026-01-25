import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Sidebar } from "@/components/layout"
import { PostCard } from "@/components/post"
import { formatDate } from "@/lib/utils"

interface PageProps {
  params: Promise<{ slug: string }>
}

// Mock data - TODO: Replace with Prisma queries
async function getPost(slug: string) {
  const mockPost = {
    id: 1,
    title: "Pembangunan Infrastruktur di Depok Terus Berlanjut dengan Berbagai Proyek Strategis",
    slug: slug,
    content: `
      <p>Pemerintah Kota Depok terus menggenjot pembangunan infrastruktur untuk meningkatkan kualitas hidup warga. Berbagai proyek strategis sedang dan akan dilaksanakan dalam waktu dekat.</p>

      <h2>Proyek Jalan dan Jembatan</h2>
      <p>Beberapa ruas jalan utama sedang dalam tahap perbaikan dan pelebaran. Hal ini dilakukan untuk mengantisipasi peningkatan volume kendaraan yang terus bertambah setiap tahunnya.</p>

      <p>"Kami berkomitmen untuk terus meningkatkan kualitas infrastruktur di Kota Depok. Ini adalah prioritas utama kami," ujar Walikota Depok dalam konferensi pers.</p>

      <h2>Fasilitas Publik</h2>
      <p>Selain jalan, pembangunan fasilitas publik seperti taman kota dan ruang terbuka hijau juga menjadi fokus pemerintah. Hal ini bertujuan untuk meningkatkan kualitas lingkungan dan menyediakan ruang rekreasi bagi warga.</p>

      <p>Berbagai taman kota telah direvitalisasi dengan penambahan fasilitas seperti jogging track, area bermain anak, dan gazebo.</p>

      <h2>Dampak Positif</h2>
      <p>Pembangunan infrastruktur ini diharapkan dapat memberikan dampak positif bagi perekonomian lokal. Dengan akses yang lebih baik, aktivitas ekonomi diharapkan semakin meningkat.</p>
    `,
    excerpt: "Pemerintah Kota Depok terus menggenjot pembangunan infrastruktur untuk meningkatkan kualitas hidup warga.",
    featuredImage: null,
    publishedAt: new Date(),
    viewCount: 1250,
    author: {
      displayName: "Admin",
      avatar: null,
    },
    categories: [
      { category: { id: 1, name: "Berita", slug: "berita" } },
    ],
    tags: [
      { tag: { id: 1, name: "Depok", slug: "depok" } },
      { tag: { id: 2, name: "Infrastruktur", slug: "infrastruktur" } },
      { tag: { id: 3, name: "Pembangunan", slug: "pembangunan" } },
    ],
  }

  return mockPost
}

async function getRelatedPosts(categorySlug: string, currentPostId: number) {
  return [
    {
      id: 2,
      title: "Warga Depok Antusias Sambut Program Kesehatan Gratis",
      slug: "program-kesehatan-gratis-depok",
      excerpt: "Program kesehatan gratis yang diluncurkan mendapat sambutan positif.",
      featuredImage: null,
      publishedAt: new Date(Date.now() - 86400000),
      author: { displayName: "Editor" },
      categories: [{ category: { name: "Berita", slug: "berita" } }],
    },
    {
      id: 3,
      title: "Pemerintah Depok Luncurkan Aplikasi Layanan Publik",
      slug: "aplikasi-layanan-publik-depok",
      excerpt: "Aplikasi baru untuk memudahkan akses layanan publik bagi warga.",
      featuredImage: null,
      publishedAt: new Date(Date.now() - 172800000),
      author: { displayName: "Tech" },
      categories: [{ category: { name: "Berita", slug: "berita" } }],
    },
  ]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return { title: "Artikel Tidak Ditemukan" }
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.displayName],
    },
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(
    post.categories[0]?.category.slug || "",
    post.id
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <article className="lg:col-span-2">
          {/* Header */}
          <header className="mb-6">
            {/* Categories */}
            <div className="flex gap-2 mb-3">
              {post.categories.map(({ category }) => (
                <Link
                  key={category.id}
                  href={`/kategori/${category.slug}`}
                  className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>{post.author.displayName}</span>
              </div>
              <span>•</span>
              <time dateTime={post.publishedAt?.toISOString()}>
                {formatDate(post.publishedAt!)}
              </time>
              <span>•</span>
              <span>{post.viewCount.toLocaleString("id-ID")} views</span>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative aspect-video mb-6 rounded-lg overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="border-t border-b border-gray-200 py-4 mb-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-700">Tags:</span>
                {post.tags.map(({ tag }) => (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <p className="font-semibold text-gray-700 mb-3">Bagikan artikel ini:</p>
            <div className="flex gap-3">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://inidepok.com/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://inidepok.com/${post.slug}`)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(post.title + " " + `https://inidepok.com/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 border-l-4 border-red-600 pl-3">
                Berita Terkait
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
