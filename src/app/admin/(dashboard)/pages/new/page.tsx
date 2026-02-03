import PageEditor from '../components/PageEditor'

export default async function NewPagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Halaman Baru</h1>
        <p className="text-sm text-gray-500 mt-1">
          Buat halaman statis baru untuk website
        </p>
      </div>

      <PageEditor />
    </div>
  )
}
