import { redirect } from 'next/navigation'

// Redirect to posts editor
export default async function EditOpiniPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/admin/posts/${id}/edit`)
}
