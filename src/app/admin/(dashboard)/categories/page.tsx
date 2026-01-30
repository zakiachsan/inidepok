import { db, categories, postCategories, eq, asc, count } from '@/db'
import CategoriesManager from './components/CategoriesManager'

async function getCategories() {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name))

    return Promise.all(allCategories.map(async (cat) => {
      const [result] = await db
        .select({ count: count() })
        .from(postCategories)
        .where(eq(postCategories.categoryId, cat.id))
      return {
        ...cat,
        postCount: result?.count || 0,
        _count: { posts: result?.count || 0 },
      }
    }))
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

export default async function CategoriesPage() {
  const categoriesList = await getCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kategori</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola kategori artikel
        </p>
      </div>

      <CategoriesManager initialCategories={categoriesList} />
    </div>
  )
}
