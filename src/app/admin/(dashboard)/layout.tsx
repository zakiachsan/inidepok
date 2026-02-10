import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AdminLayout from './components/AdminLayout'

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

  const user = {
    name: session.user.name || '',
    email: session.user.email || '',
    role: session.user.role || '',
  }

  return <AdminLayout user={user}>{children}</AdminLayout>
}
