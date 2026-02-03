import { notFound } from 'next/navigation'
import { db, pages, eq } from '@/db'
import PageEditor from '../../components/PageEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getData(id: string) {
  try {
    // Get page
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1)

    if (!page) {
      return { page: null }
    }

    return { page }
  } catch (error) {
    console.error('Failed to fetch data:', error)
    return { page: null }
  }
}

export default async function EditPagePage({ params }: PageProps) {
  const { id } = await params
  const { page } = await getData(id)

  if (!page) {
    notFound()
  }

  const pageData = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    content: page.content,
    excerpt: page.excerpt || '',
    featuredImage: page.featuredImage || '',
    status: page.status,
    metaTitle: page.metaTitle || '',
    metaDescription: page.metaDescription || '',
    sortOrder: page.sortOrder,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Halaman</h1>
        <p className="text-sm text-gray-500 mt-1">
          {page.title}
        </p>
      </div>

      <PageEditor page={pageData} isEdit />
    </div>
  )
}
