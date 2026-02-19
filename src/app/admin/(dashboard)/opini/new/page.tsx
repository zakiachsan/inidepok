import { redirect } from 'next/navigation'

// Redirect to posts/new with opini category pre-selected
export default function NewOpiniPage() {
  redirect('/admin/posts/new?category=opini')
}
