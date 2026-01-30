import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import { eq } from 'drizzle-orm'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

// New articles from December 2025 and January 2026
const newArticles = [
  {
    title: 'Dukung Aktivitas Pariwisata Bali, Pengiriman KAI Logistik Terus Bertumbuh',
    slug: 'dukung-aktivitas-pariwisata-bali-pengiriman-kai-logistik-terus-bertumbuh',
    content: `<p><strong>KILASINDONESIA.COM</strong> – PT Kereta Api Logistik (KAI Logistik) melaporkan pertumbuhan signifikan dalam distribusi logistik ritel ke Bali sepanjang 2025.</p>

<p>Menurut Manager Marketing & Sales Courier Ayi Suryandi, "pengiriman retail menuju Pulau Bali tumbuh sebesar 33%, dari 221 ton pada tahun 2024 menjadi 294 ton."</p>

<p>Pengiriman keluar dari Bali juga meningkat substansial, naik 42% dari 95 ton menjadi 135 ton. Pertumbuhan ini mencerminkan meningkatnya kebutuhan logistik yang didorong oleh pariwisata, perdagangan, dan sektor ekonomi kreatif.</p>

<p>Layanan KALOG Express dari KAI Logistik telah mengoptimalkan rute KA Blambangan Express antara Jakarta-Banyuwangi, memungkinkan pengiriman ke Bali dalam 1-2 hari. Kargo utama mencakup paket ritel dan sepeda motor yang mendukung operasi bisnis dan mobilitas wisatawan.</p>`,
    excerpt: 'PT KAI Logistik melaporkan pertumbuhan 33% pengiriman retail ke Bali, dari 221 ton di 2024 menjadi 294 ton di 2025.',
    featuredImage: 'https://imagedelivery.net/H6_s_Eb_ylTWnSEV3HlmYQ/prd/e8f6ba4a-e56e-4869-828c-6e7e1a3677a1/public',
    categorySlug: 'nasional',
    publishedAt: new Date('2026-01-30T10:00:00Z'),
    viewCount: 450,
  },
  {
    title: 'Ajukan Anggaran Tambahan, Kemenag Pastikan Bayar Tunjangan Profesi Guru dan Dosen',
    slug: 'ajukan-anggaran-tambahan-kemenag-pastikan-bayar-tunjangan-profesi-guru-dan-dosen',
    content: `<p><strong>KILASINDONESIA.COM</strong> – Kementerian Agama (Kemenag) telah mengajukan alokasi anggaran tambahan sebesar Rp 5,872 triliun untuk tahun anggaran 2026 guna memastikan pembayaran Tunjangan Profesi Guru (TPG) dan Tunjangan Dosen (TPD) bagi guru dan dosen yang menyelesaikan Pendidikan Profesi Guru (PPG) dan Sertifikasi Dosen pada tahun 2025.</p>

<p>Sekretaris Jenderal Kamaruddin Amin menjelaskan bahwa permintaan anggaran ini mengatasi masalah waktu, karena penyelesaian PPG terjadi pada Desember 2025 setelah batas waktu pengajuan anggaran Oktober 2025.</p>

<p>Tunjangan akan mencakup pendidik PNS, PPPK, dan non-PNS. Pejabat bertujuan memproses pembayaran sekitar Maret 2026, dengan kompensasi retroaktif dimulai Januari 2026.</p>

<p>Kementerian telah menyerahkan perhitungan rinci untuk memastikan pencairan yang akurat dan tepat sasaran. Usulan tersebut mendapat persetujuan dari Komisi VIII DPR RI.</p>`,
    excerpt: 'Kemenag mengajukan anggaran tambahan Rp 5,872 triliun untuk membayar tunjangan profesi guru dan dosen yang lulus PPG 2025.',
    featuredImage: 'https://kilasindonesia.com/wp-content/uploads/2026/01/kemenag-tunjangan.jpeg',
    categorySlug: 'madrasah',
    publishedAt: new Date('2026-01-28T08:00:00Z'),
    viewCount: 890,
  },
  {
    title: 'Peringati Hari Gizi Nasional, KAI Logistik Distribusikan 300 Paket Gizi Untuk Masyarakat Di Marunda',
    slug: 'peringati-hari-gizi-nasional-kai-logistik-distribusikan-300-paket-gizi-untuk-masyarakat-di-marunda',
    content: `<p><strong>KILASINDONESIA.COM</strong> – KAI Logistik berkolaborasi dengan Rumah Zakat untuk mendistribusikan 300 paket gizi kepada warga di Marunda, Jakarta Utara, dalam rangka memperingati Hari Gizi Nasional. Inisiatif ini mencerminkan komitmen perusahaan terhadap tanggung jawab sosial dan lingkungan (TJSL).</p>

<p>"Momentum Hari Gizi Nasional kami maknai sebagai pengingat bahwa pembangunan tidak hanya berorientasi pada pertumbuhan ekonomi, tetapi juga pada kualitas hidup masyarakat," ujar Manager Public Relations KAI Logistik Adjeng Putri Adhatu.</p>

<p>Paket gizi ditargetkan untuk populasi rentan termasuk anak-anak, lansia, dan ibu hamil, sejalan dengan Tujuan Pembangunan Berkelanjutan (SDGs) Indonesia terkait ketahanan pangan, kesehatan, dan kemitraan.</p>`,
    excerpt: 'KAI Logistik bersama Rumah Zakat distribusikan 300 paket gizi untuk warga Marunda dalam peringatan Hari Gizi Nasional.',
    featuredImage: 'https://imagedelivery.net/H6_s_Eb_ylTWnSEV3HlmYQ/prd/8dc2017d-a18f-49b2-b78a-fdd134ad6421/public',
    categorySlug: 'nasional',
    publishedAt: new Date('2026-01-28T07:00:00Z'),
    viewCount: 320,
  },
  {
    title: 'Kemenag Pastikan KBM Madrasah di Sumatera Barat Berjalan Pascabanjir',
    slug: 'kemenag-pastikan-kbm-madrasah-di-sumatera-barat-berjalan-pascabanjir',
    content: `<p><strong>KILASINDONESIA.COM</strong> – Kementerian Agama (Kemenag) memastikan kegiatan pendidikan di madrasah yang terdampak banjir di Sumatera Barat berjalan normal. Direktur Jenderal Amien Suyitno mengunjungi dua institusi terdampak—MTs Selasar Air dan MTs Tarbiyah Islamiyah di Kabupaten Agam—di mana satu sekolah mengalami kerusakan parah.</p>

<p>Pemerintah mengalokasikan dana bantuan bencana Rp 6,4 miliar untuk 64 madrasah dan TK Islam di provinsi tersebut. Rincian bantuan meliputi: 22 madrasah negeri (Rp 2,2 miliar), 29 madrasah swasta (Rp 2,9 miliar), dan 13 TK (Rp 1,3 miliar). Setiap institusi menerima Rp 100 juta untuk rehabilitasi fasilitas dan dukungan pembelajaran.</p>

<p>Suyitno menekankan bahwa "kelangsungan proses pembelajaran tetap menjadi prioritas pemerintah," khususnya untuk institusi pendidikan terdampak bencana.</p>`,
    excerpt: 'Kemenag alokasikan Rp 6,4 miliar untuk 64 madrasah dan TK Islam terdampak banjir di Sumatera Barat.',
    featuredImage: 'https://kilasindonesia.com/wp-content/uploads/2026/01/6-e1767792785831.jpeg',
    categorySlug: 'madrasah',
    publishedAt: new Date('2026-01-07T09:00:00Z'),
    viewCount: 670,
  },
  {
    title: 'Kajari Depok Kunjungi MUI Jalin Sinergitas Perkuat Kerjasama',
    slug: 'kajari-depok-kunjungi-mui-jalin-sinergitas-perkuat-kerjasama',
    content: `<p><strong>KILASINDONESIA.COM</strong> – Kepala Kejaksaan Negeri Depok, Dr. Arif Budiman, mengunjungi kantor Majelis Ulama Indonesia (MUI) di Pancoran Mas pada 5 Januari 2026.</p>

<p>Kunjungan ini bertujuan membangun hubungan dan memperkenalkan pimpinan kejaksaan baru kepada pimpinan MUI yang dipimpin oleh KH. Syihabuddin Ahmad.</p>

<p>"Kami ucapkan terima kasih kepada MUI Kota Depok semoga ke depan bisa saling bersinergi," ujar Dr. Budiman.</p>

<p>Kantor kejaksaan mencari kolaborasi dalam penegakan hukum dan inisiatif pemantauan keagamaan. Ketua MUI menyambut baik inisiatif tersebut, menyatakan: "Selamat bertugas dan mengabdi semoga bisa menjalankan amanah dengan baik."</p>

<p>Pertemuan tersebut menghasilkan rencana kegiatan bersama antara kedua institusi untuk memperkuat kesadaran masyarakat tentang hukum dan ketertiban di Depok.</p>`,
    excerpt: 'Kajari Depok Dr. Arif Budiman kunjungi MUI untuk menjalin sinergitas dan kerjasama penegakan hukum.',
    featuredImage: 'https://kilasindonesia.com/wp-content/uploads/2026/01/5.jpeg',
    categorySlug: 'nasional',
    publishedAt: new Date('2026-01-06T10:00:00Z'),
    viewCount: 420,
  },
  {
    title: 'Kemenag Perkuat Literasi Al-Qur\'an di Sekolah, Asesmen Nasional Jadi Fondasi Kebijakan Pendidikan Agama',
    slug: 'kemenag-perkuat-literasi-al-quran-di-sekolah-asesmen-nasional-jadi-fondasi-kebijakan-pendidikan-agama',
    content: `<p><strong>KILASINDONESIA.COM</strong> – Kementerian Agama meluncurkan program asesmen digital nasional untuk memperkuat literasi Al-Qur'an di sekolah-sekolah Indonesia. Inisiatif yang diumumkan pada acara eksposisi di Jakarta ini bertujuan menstandarkan kemampuan membaca Al-Qur'an di kalangan guru pendidikan Islam.</p>

<p>Program ini melibatkan lebih dari 120.000 peserta di seluruh Jawa selama 2025. Hasil asesmen menunjukkan: 13-15% mencapai status "Mahir", 28-30% "Menengah", dan 55-60% "Pratama".</p>

<p>Platform digital bernama CintaQu memfasilitasi evaluasi komprehensif akurasi pelafalan, kelancaran, dan tajwid. Empat komponen evaluasi menilai artikulasi huruf, karakteristik huruf, dan aturan perpanjangan yang tepat.</p>

<p>Hasil akan memandu program pelatihan guru yang ditargetkan dan pengembangan kebijakan di seluruh wilayah Indonesia.</p>`,
    excerpt: 'Kemenag luncurkan asesmen digital literasi Al-Qur\'an dengan platform CintaQu, libatkan 120.000 peserta di Jawa.',
    featuredImage: 'https://kilasindonesia.com/wp-content/uploads/2026/01/asasmen-2.jpeg',
    categorySlug: 'madrasah',
    publishedAt: new Date('2026-01-05T08:00:00Z'),
    viewCount: 780,
  },
  {
    title: 'Program TBQ Guru Madrasah Resmi Dibuka, Kemenag Catat 403 Ribu Guru Masuk Basis Data',
    slug: 'program-tbq-guru-madrasah-resmi-dibuka-kemenag-catat-403-ribu-guru-masuk-basis-data',
    content: `<p><strong>KILASINDONESIA.COM</strong> – Kementerian Agama resmi membuka Program Tunjangan Baca Qur'an (TBQ) untuk guru madrasah. Program ini mencatat 403 ribu guru madrasah yang masuk ke dalam basis data.</p>

<p>Program TBQ merupakan upaya pemerintah untuk meningkatkan kompetensi guru madrasah dalam membaca Al-Qur'an dengan baik dan benar sesuai kaidah tajwid.</p>

<p>Para guru yang terdaftar dalam basis data akan mengikuti serangkaian asesmen untuk mengukur kemampuan membaca Al-Qur'an mereka. Hasil asesmen akan menentukan program pelatihan yang sesuai untuk masing-masing guru.</p>`,
    excerpt: 'Kemenag buka Program TBQ untuk 403 ribu guru madrasah yang terdaftar dalam basis data.',
    featuredImage: 'https://kilasindonesia.com/wp-content/uploads/2026/01/TBQ-Guru-Madrasah-250x190.jpeg',
    categorySlug: 'madrasah',
    publishedAt: new Date('2026-01-05T07:00:00Z'),
    viewCount: 560,
  },
  {
    title: 'Direktorat PAI Teguhkan Pendidikan Agama Islam sebagai Investasi Peradaban Bangsa Sepanjang 2025',
    slug: 'direktorat-pai-teguhkan-pendidikan-agama-islam-sebagai-investasi-peradaban-bangsa-sepanjang-2025',
    content: `<p><strong>KILASINDONESIA.COM</strong> – Direktorat Pendidikan Agama Islam (PAI) sepanjang 2025 berupaya memperkuat pendidikan Islam sebagai investasi peradaban. Statistik kunci mencakup:</p>

<p>262.971 guru pendidikan Islam melayani 41,88 juta siswa Muslim di 317.520 sekolah secara nasional. 90,2% guru PAI telah mendapatkan sertifikasi pendidik.</p>

<p>Direktorat mengimplementasikan asesmen literasi Al-Qur'an dan meluncurkan platform digital "Smart PAI" yang menampilkan 40 buku pendidikan Islam terintegrasi AI.</p>

<p>Direktur Jenderal Amin Suyitno menyatakan: "Pendidikan Islam harus menghasilkan religiusitas yang matang, moderasi yang mengakar, dan pluralisme" yang mengatasi tantangan masyarakat—menekankan bahwa guru mewakili agen strategis pembangunan peradaban.</p>`,
    excerpt: 'Direktorat PAI layani 41,88 juta siswa Muslim dengan 262.971 guru di 317.520 sekolah nasional.',
    featuredImage: 'https://kilasindonesia.com/wp-content/uploads/2026/01/direktorat-pai-e1767621667977.jpeg',
    categorySlug: 'madrasah',
    publishedAt: new Date('2025-12-30T10:00:00Z'),
    viewCount: 920,
  },
  {
    title: 'Kinerja Komunikasi Direktorat PAI Menguat, Publik Apresiasi Program Pendidikan Agama Islam',
    slug: 'kinerja-komunikasi-direktorat-pai-menguat-publik-apresiasi-program-pendidikan-agama-islam',
    content: `<p><strong>KILASINDONESIA.COM</strong> – Direktorat Pendidikan Agama Islam (PAI) di Kementerian Agama menunjukkan kinerja komunikasi publik yang menguat antara 23 Desember 2024 hingga 23 Desember 2025.</p>

<p>Menurut data pemantauan media, direktorat menerima 229 penyebutan di seluruh kanal digital, dengan jangkauan media sosial sekitar 2,2 juta akun unik dan sekitar 9.000 interaksi engagement.</p>

<p>Direktur Jenderal Amien Suyitno menyatakan bahwa "data menunjukkan peningkatan kesadaran dan perhatian publik terhadap kebijakan dan program pendidikan Islam," memandang ini sebagai validasi upaya komunikasi yang efektif.</p>

<p>Lebih dari 80% diskusi publik mencerminkan sentimen positif, dengan komentar negatif minimal. Analisis menyoroti apresiasi untuk inisiatif strategis termasuk Program Profesi Guru PAI (PPG PAI), PAI Fair 2025, dan asesmen literasi keagamaan yang ditingkatkan.</p>`,
    excerpt: 'Direktorat PAI raih 229 penyebutan media dengan sentimen positif 80%, jangkau 2,2 juta akun di media sosial.',
    featuredImage: 'https://kilasindonesia.com/wp-content/uploads/2026/01/kinerja-kemenag-scaled.jpeg',
    categorySlug: 'madrasah',
    publishedAt: new Date('2025-12-30T09:00:00Z'),
    viewCount: 650,
  },
  {
    title: '75 Peserta LAPP Siap Berangkat Studi S2 dan S3 ke Luar Negeri',
    slug: '75-peserta-lapp-siap-berangkat-studi-s2-dan-s3-ke-luar-negeri',
    content: `<p><strong>KILASINDONESIA.COM</strong> – Pusat Pembiayaan Pendidikan Keagamaan (Puspenma) di Kementerian Agama berhasil menyelesaikan Program Persiapan Bahasa dan Akademik (LAPP) selama dua bulan di lima universitas Islam negeri.</p>

<p>Inisiatif ini bertujuan membekali 75 penerima beasiswa dengan kemampuan bahasa Inggris dan persiapan akademik sebelum menempuh studi magister dan doktoral di luar negeri.</p>

<p>Ruchman Basori, kepala Puspenma, menekankan bahwa peserta memperkuat kemampuan bahasa Inggris mereka sambil mempersiapkan penyesuaian akademik dan budaya di negara tujuan seperti Australia, Inggris, Amerika Serikat, Belanda, dan Jerman.</p>

<p>Putaran beasiswa 2025 memilih 1.029 penerima di universitas dalam dan luar negeri di tingkat sarjana, magister, dan doktoral. Peserta yang menerima Letter of Acceptance (LOA) akan memulai kelas pada Januari 2026.</p>`,
    excerpt: '75 penerima beasiswa Kemenag siap berangkat studi S2 dan S3 ke Australia, Inggris, AS, Belanda, dan Jerman.',
    featuredImage: 'https://kilasindonesia.com/wp-content/uploads/2025/12/77c219fa-d6a2-4cc8-b5eb-f877fecf0514.jpeg',
    categorySlug: 'perguruan-tinggi',
    publishedAt: new Date('2025-12-17T08:00:00Z'),
    viewCount: 1230,
  },
  {
    title: 'Kemenag Raih Dua Penghargaan dari KPK di Hari Antikorupsi Sedunia 2025',
    slug: 'kemenag-raih-dua-penghargaan-dari-kpk-di-hari-antikorupsi-sedunia-2025',
    content: `<p><strong>KILASINDONESIA.COM</strong> – Pada peringatan Hari Antikorupsi Sedunia (HAKORDIA) 2025 yang digelar di Kantor Gubernur DIY pada 9 Desember, Kementerian Agama Indonesia meraih dua pengakuan signifikan.</p>

<p>Kementerian menerima penghargaan atas kolaborasinya dengan Komisi Pemberantasan Korupsi (KPK) dalam mengembangkan serangkaian buku antikorupsi berbasis keimanan. Inisiatif ini merupakan terobosan dalam mempromosikan pendidikan integritas di berbagai komunitas keagamaan.</p>

<p>Selain itu, Forum Advokat Anti Korupsi (PAKSI) di kalangan guru dan staf pendidikan Kemenag meraih penghargaan nasional kedua dalam kategori kementerian dan lembaga pemerintah.</p>

<p>Selama upacara, Kemenag dan KPK bersama-sama meluncurkan enam buku antikorupsi yang mencerminkan ajaran dari agama Buddha, Hindu, Islam, Katolik, Kristen, dan Konghucu.</p>`,
    excerpt: 'Kemenag raih dua penghargaan dari KPK di Hari Antikorupsi Sedunia, luncurkan 6 buku antikorupsi berbasis agama.',
    featuredImage: 'https://kilasindonesia.com/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-09-at-22.27.581.jpeg',
    categorySlug: 'nasional',
    publishedAt: new Date('2025-12-09T15:00:00Z'),
    viewCount: 1450,
  },
  {
    title: 'Sukses Optimalkan Unit Bisnis, Kemenag Dorong Kampus BLU Contoh Kemandirian Finansial UIN Jakarta',
    slug: 'sukses-optimalkan-unit-bisnis-kemenag-dorong-kampus-blu-contoh-kemandirian-finansial-uin-jakarta',
    content: `<p><strong>KILASINDONESIA.COM</strong> – Kementerian Agama mendorong kampus Badan Layanan Umum (BLU) untuk mencontoh kemandirian finansial UIN Syarif Hidayatullah Jakarta.</p>

<p>UIN Jakarta berhasil mengoptimalkan unit-unit bisnisnya untuk meningkatkan pendapatan dan kemandirian finansial kampus. Model ini diharapkan dapat diadopsi oleh kampus-kampus BLU lainnya di lingkungan Kementerian Agama.</p>

<p>Kemandirian finansial kampus menjadi penting untuk mendukung pengembangan program akademik, penelitian, dan pengabdian masyarakat yang berkualitas.</p>`,
    excerpt: 'Kemenag dorong kampus BLU contoh kemandirian finansial UIN Jakarta yang sukses optimalkan unit bisnis.',
    featuredImage: 'https://kilasindonesia.com/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-12-at-16.53.41-e1765533472186.jpeg',
    categorySlug: 'perguruan-tinggi',
    publishedAt: new Date('2025-12-12T10:00:00Z'),
    viewCount: 780,
  },
]

async function main() {
  console.log('🌱 Adding new articles from Dec 2025 - Jan 2026...')

  // Get admin user
  const [admin] = await db.select().from(schema.users).where(eq(schema.users.role, 'ADMIN')).limit(1)
  if (!admin) {
    throw new Error('Admin user not found. Please run seed-wp.ts first.')
  }

  // Get categories
  const allCategories = await db.select().from(schema.categories)
  const categories: Record<string, typeof allCategories[0]> = {}
  for (const cat of allCategories) {
    categories[cat.slug] = cat
  }

  let added = 0
  let skipped = 0

  for (const article of newArticles) {
    // Check if article already exists
    const [existing] = await db.select().from(schema.posts).where(eq(schema.posts.slug, article.slug)).limit(1)

    if (existing) {
      console.log(`   ⏭️  Skipped (exists): ${article.title.substring(0, 50)}...`)
      skipped++
      continue
    }

    // Insert new article
    const [post] = await db.insert(schema.posts).values({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      featuredImage: article.featuredImage,
      authorId: admin.id,
      status: 'PUBLISHED',
      publishedAt: article.publishedAt,
      viewCount: article.viewCount,
      createdAt: article.publishedAt,
      updatedAt: article.publishedAt,
    }).returning()

    // Add category relation
    if (categories[article.categorySlug]) {
      await db.insert(schema.postCategories).values({
        postId: post.id,
        categoryId: categories[article.categorySlug].id,
      })
    }

    console.log(`   ✅ Added: ${article.title.substring(0, 50)}...`)
    added++
  }

  console.log('')
  console.log('📊 Summary:')
  console.log(`   - Added: ${added} articles`)
  console.log(`   - Skipped: ${skipped} articles (already exist)`)
  console.log('')
  console.log('✅ Done!')
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
