import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-red-500">Ini</span>
              <span className="text-2xl font-bold">Depok</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Portal berita dan informasi terkini seputar Kota Depok dan
              sekitarnya. Menyajikan berita akurat, cepat, dan terpercaya.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-lg mb-4">Kategori</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/kategori/berita"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Berita
                </Link>
              </li>
              <li>
                <Link
                  href="/kategori/politik"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Politik
                </Link>
              </li>
              <li>
                <Link
                  href="/kategori/ekonomi"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Ekonomi
                </Link>
              </li>
              <li>
                <Link
                  href="/kategori/olahraga"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Olahraga
                </Link>
              </li>
              <li>
                <Link
                  href="/kategori/lifestyle"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Lifestyle
                </Link>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Tautan</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/tentang"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/kontak"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/redaksi"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Redaksi
                </Link>
              </li>
              <li>
                <Link
                  href="/kebijakan-privasi"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Kontak</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Depok, Jawa Barat, Indonesia</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>redaksi@inidepok.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {currentYear} IniDepok. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
