import { db, categories, tags, asc } from '@/db'
import PostEditor from '../../posts/components/PostEditor'

async function getData() {
  try {
    const [allCategories, allTags] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.name)),
      db.select().from(tags).orderBy(asc(tags.name)),
    ])
    return { categories: allCategories, tags: allTags }
  } catch (error) {
    console.error('Failed to fetch data:', error)
    return { categories: [], tags: [] }
  }
}

export default async function NewScheduledPostPage() {
  const { categories: allCategories, tags: allTags } = await getData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Jadwalkan Artikel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Buat artikel baru dan jadwalkan untuk dipublikasi
        </p>
      </div>

      <PostEditor
        categories={allCategories}
        tags={allTags}
        defaultStatus="SCHEDULED"
      />
    </div>
  )
}
