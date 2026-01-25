import Link from "next/link"
import Image from "next/image"
import { formatRelativeTime } from "@/lib/utils"

interface PostCardProps {
  post: {
    id: number
    title: string
    slug: string
    excerpt?: string | null
    featuredImage?: string | null
    publishedAt?: Date | null
    author?: {
      displayName: string
    }
    categories?: {
      category: {
        name: string
        slug: string
      }
    }[]
  }
  variant?: "default" | "horizontal" | "featured"
}

export default function PostCard({ post, variant = "default" }: PostCardProps) {
  const category = post.categories?.[0]?.category
  const authorName = post.author?.displayName || "Admin"
  const publishedDate = post.publishedAt
    ? formatRelativeTime(post.publishedAt)
    : ""

  if (variant === "horizontal") {
    return (
      <article className="flex gap-4 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative w-32 h-24 md:w-48 md:h-32 flex-shrink-0">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 p-4">
          {category && (
            <Link
              href={`/kategori/${category.slug}`}
              className="text-xs text-red-600 font-semibold uppercase hover:underline"
            >
              {category.name}
            </Link>
          )}
          <h3 className="font-bold mt-1 line-clamp-2">
            <Link
              href={`/${post.slug}`}
              className="hover:text-red-600 transition-colors"
            >
              {post.title}
            </Link>
          </h3>
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <span>{authorName}</span>
            {publishedDate && (
              <>
                <span className="mx-2">•</span>
                <span>{publishedDate}</span>
              </>
            )}
          </div>
        </div>
      </article>
    )
  }

  if (variant === "featured") {
    return (
      <article className="relative rounded-lg overflow-hidden group">
        <div className="relative aspect-[16/9]">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          {category && (
            <Link
              href={`/kategori/${category.slug}`}
              className="inline-block bg-red-600 text-xs font-semibold uppercase px-3 py-1 rounded mb-3 hover:bg-red-700 transition-colors"
            >
              {category.name}
            </Link>
          )}
          <h2 className="text-xl md:text-2xl font-bold line-clamp-2">
            <Link href={`/${post.slug}`} className="hover:underline">
              {post.title}
            </Link>
          </h2>
          <div className="flex items-center text-sm text-gray-300 mt-3">
            <span>{authorName}</span>
            {publishedDate && (
              <>
                <span className="mx-2">•</span>
                <span>{publishedDate}</span>
              </>
            )}
          </div>
        </div>
      </article>
    )
  }

  // Default card
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative aspect-video">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        {category && (
          <Link
            href={`/kategori/${category.slug}`}
            className="text-xs text-red-600 font-semibold uppercase hover:underline"
          >
            {category.name}
          </Link>
        )}
        <h3 className="font-bold mt-1 line-clamp-2">
          <Link
            href={`/${post.slug}`}
            className="hover:text-red-600 transition-colors"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="text-gray-600 text-sm mt-2 line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center text-xs text-gray-500 mt-3">
          <span>{authorName}</span>
          {publishedDate && (
            <>
              <span className="mx-2">•</span>
              <span>{publishedDate}</span>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
