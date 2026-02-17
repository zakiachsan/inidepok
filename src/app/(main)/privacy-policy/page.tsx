import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi - Ini Depok',
  description: 'Kebijakan Privasi dan penggunaan data di Ini Depok',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Kebijakan Privasi</h1>
      <p className="text-gray-600 mb-8">Terakhir diperbarui: 17 Februari 2026</p>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Pendahuluan</h2>
          <p className="text-gray-700 mb-4">
            Ini Depok (&quot;kami&quot;, &quot;website&quot;) berkomitmen untuk melindungi privasi pengunjung 
            website kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, 
            dan melindungi informasi Anda saat mengunjungi inidepok.com.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Informasi yang Kami Kumpulkan</h2>
          <p className="text-gray-700 mb-4">Kami dapat mengumpulkan informasi berikut:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Informasi teknis seperti alamat IP, jenis browser, dan perangkat yang digunakan</li>
            <li>Data penggunaan seperti halaman yang dikunjungi dan waktu kunjungan</li>
            <li>Cookies dan teknologi pelacakan serupa</li>
            <li>Informasi yang Anda berikan secara sukarela (seperti email untuk newsletter)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Penggunaan Cookies</h2>
          <p className="text-gray-700 mb-4">
            Website kami menggunakan cookies untuk meningkatkan pengalaman pengguna. 
            Cookies adalah file kecil yang disimpan di perangkat Anda. Kami menggunakan cookies untuk:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Menganalisis traffic website melalui Google Analytics</li>
            <li>Menampilkan iklan yang relevan melalui Google AdSense dan partner iklan lainnya</li>
            <li>Mengingat preferensi Anda</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Iklan Pihak Ketiga</h2>
          <p className="text-gray-700 mb-4">
            Kami menggunakan layanan iklan pihak ketiga seperti Google AdSense untuk menampilkan iklan 
            di website kami. Penyedia iklan ini dapat menggunakan cookies untuk menampilkan iklan 
            berdasarkan kunjungan Anda ke website kami dan situs lain di internet.
          </p>
          <p className="text-gray-700 mb-4">
            Anda dapat memilih untuk tidak menggunakan personalized advertising dengan mengunjungi 
            <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline mx-1" 
               target="_blank" rel="noopener noreferrer">
              Google Ads Settings
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Google Analytics</h2>
          <p className="text-gray-700 mb-4">
            Kami menggunakan Google Analytics untuk menganalisis penggunaan website. Google Analytics 
            menggunakan cookies untuk mengumpulkan informasi tentang penggunaan website secara anonim, 
            termasuk jumlah pengunjung, sumber traffic, dan halaman yang dikunjungi.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Keamanan Data</h2>
          <p className="text-gray-700 mb-4">
            Kami berkomitmen untuk memastikan bahwa informasi Anda aman. Kami telah menerapkan 
            langkah-langkah keamanan yang sesuai untuk mencegah akses tidak sah, pengungkapan, 
            atau penghancuran data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Hak Anda</h2>
          <p className="text-gray-700 mb-4">Anda memiliki hak untuk:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Mengakses data pribadi yang kami simpan tentang Anda</li>
            <li>Meminta penghapusan data pribadi Anda</li>
            <li>Menolak penggunaan cookies dengan mengatur browser Anda</li>
            <li>Memilih untuk tidak menerima iklan yang dipersonalisasi</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Perubahan Kebijakan</h2>
          <p className="text-gray-700 mb-4">
            Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan 
            dipublikasikan di halaman ini dengan tanggal pembaruan yang baru.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Hubungi Kami</h2>
          <p className="text-gray-700 mb-4">
            Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui 
            email di: <a href="mailto:redaksi@inidepok.com" className="text-blue-600 hover:underline">
              redaksi@inidepok.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
