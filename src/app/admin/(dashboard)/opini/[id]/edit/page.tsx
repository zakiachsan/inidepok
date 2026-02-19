import { redirect } from 'next/navigation'

// Redirect to posts editor
export default function EditOpiniPage({ params }: { params: { id: string } }) {
  redirect(`/admin/posts/${params.id}/edit`)
}
