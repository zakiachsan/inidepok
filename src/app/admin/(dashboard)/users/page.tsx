import { db, users, posts, eq, desc, count } from '@/db'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UsersManager from './components/UsersManager'

async function getUsers() {
  try {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))

    // Get post count for each user
    return Promise.all(allUsers.map(async (user) => {
      const [result] = await db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.authorId, user.id))
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        postCount: result?.count || 0,
      }
    }))
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return []
  }
}

export default async function UsersPage() {
  const session = await auth()

  // Only admin can access
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/admin')
  }

  const usersList = await getUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengguna</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola pengguna admin dan penulis
        </p>
      </div>

      <UsersManager initialUsers={usersList} currentUserId={session.user.id} />
    </div>
  )
}
