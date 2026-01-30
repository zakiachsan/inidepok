import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/admin/login')
  }

  // Check if user has admin/author role
  if (session.user.role !== 'ADMIN' && session.user.role !== 'AUTHOR') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar user={session.user} />
      <div className="lg:pl-56">
        <AdminHeader user={session.user} />
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
