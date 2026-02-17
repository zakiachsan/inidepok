import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Syarat dan Ketentuan - Ini Depok',
  description: 'Syarat dan Ketentuan penggunaan website Ini Depok',
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Syarat dan Ketentuan</h1>
      <p className="text-gray-600 mb-8">Terakhir diperbarui: 17 Februari 2026</p>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Penerimaan Syarat</h2>
          <p className="text-gray-700 mb-4">
            Dengan mengakses dan menggunakan website Ini Depok (inidepok.com), Anda 
            menyetujui untuk terikat dengan syarat dan ketentuan ini. Jika Anda tidak setuju dengan 
            syarat ini, mohon untuk tidak menggunakan website kami.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Konten Website</h2>
          <p className="text-gray-700 mb-4">
            Seluruh konten yang dipublikasikan di Ini Depok termasuk artikel, gambar, video, 
            dan materi lainnya dilindungi oleh hak cipta. Konten ini disediakan untuk tujuan informasi 
            dan tidak boleh direproduksi tanpa izin tertulis.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Penggunaan yang Diizinkan</h2>
          <p className="text-gray-700 mb-4">Anda diizinkan untuk:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Membaca dan membagikan artikel melalui fitur share yang disediakan</li>
            <li>Mengutip sebagian kecil konten dengan mencantumkan sumber dan link ke artikel asli</li>
            <li>Menggunakan website untuk keperluan pribadi non-komersial</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Larangan</h2>
          <p className="text-gray-700 mb-4">Anda dilarang untuk:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Menyalin, mendistribusikan, atau mempublikasikan ulang konten tanpa izin</li>
            <li>Menggunakan konten untuk tujuan komersial tanpa persetujuan tertulis</li>
            <li>Mengakses website dengan cara yang dapat merusak atau mengganggu server</li>
            <li>Menyebarkan malware atau kode berbahaya melalui website</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Disclaimer</h2>
          <p className="text-gray-700 mb-4">
            Informasi yang disajikan di website ini disediakan &quot;sebagaimana adanya&quot;. Kami berusaha 
            untuk menjaga akurasi informasi, namun tidak memberikan jaminan atas kelengkapan atau 
            keakuratan konten. Kami tidak bertanggung jawab atas keputusan yang diambil berdasarkan 
            informasi di website ini.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Tautan Eksternal</h2>
          <p className="text-gray-700 mb-4">
            Website kami mungkin berisi tautan ke website pihak ketiga. Kami tidak bertanggung jawab 
            atas konten atau kebijakan privasi website tersebut. Penggunaan tautan eksternal adalah 
            risiko Anda sendiri.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Iklan</h2>
          <p className="text-gray-700 mb-4">
            Website ini menampilkan iklan dari pihak ketiga. Kami tidak bertanggung jawab atas 
            konten iklan atau produk/layanan yang diiklankan. Interaksi Anda dengan pengiklan 
            adalah antara Anda dan pengiklan tersebut.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Perubahan Syarat</h2>
          <p className="text-gray-700 mb-4">
            Kami berhak untuk mengubah syarat dan ketentuan ini kapan saja. Perubahan akan berlaku 
            segera setelah dipublikasikan di halaman ini. Penggunaan berkelanjutan atas website 
            setelah perubahan berarti Anda menerima syarat yang diperbarui.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Hukum yang Berlaku</h2>
          <p className="text-gray-700 mb-4">
            Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. Setiap perselisihan 
            yang timbul akan diselesaikan melalui jalur hukum yang berlaku di Indonesia.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">10. Hubungi Kami</h2>
          <p className="text-gray-700 mb-4">
            Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami di: 
            <a href="mailto:redaksi@inidepok.com" className="text-blue-600 hover:underline ml-1">
              redaksi@inidepok.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
