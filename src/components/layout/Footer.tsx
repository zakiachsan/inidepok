'use client'

import Link from 'next/link'
import Image from 'next/image'

interface FooterLink {
  title: string
  url: string
}

interface FooterProps {
  links?: FooterLink[]
}

const defaultLinks: FooterLink[] = [
  { title: 'Tentang Kami', url: '/tentang-kami' },
  { title: 'Kontak', url: '/kontak' },
  { title: 'Kebijakan Privasi', url: '/kebijakan-privasi' },
  { title: 'Syarat & Ketentuan', url: '/syarat-ketentuan' },
]

export default function Footer({ links = defaultLinks }: FooterProps) {
  const currentYear = new Date().getFullYear()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-gray-100 text-gray-600 border-t border-gray-200">

      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <Image
                src="https://res.cloudinary.com/dicwfbdgz/image/upload/v1769900335/WhatsApp_Image_2026-01-31_at_4.44.25_PM__1_-removebg-preview_tkvs3q.png"
                alt="Ini Depok"
                width={150}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-500 mb-6 max-w-md leading-relaxed">
              Ini Depok adalah portal berita yang menyajikan informasi terkini,
              akurat, dan terpercaya seputar Kota Depok dan sekitarnya.
            </p>

            {/* Connect With Us */}
            <p className="text-sm font-medium text-gray-700 mb-3">Connect With Us</p>
            {/* Social Links */}
            <div className="flex items-center gap-2">
              <a
                href="https://facebook.com/inidepok"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-full hover:opacity-80 transition-opacity"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/inidepok"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center bg-gray-900 text-white rounded-full hover:opacity-80 transition-opacity"
                aria-label="Twitter/X"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/inidepok"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white rounded-full hover:opacity-80 transition-opacity"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Kategori</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/category/berita-depok" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Berita Depok
                </Link>
              </li>
              <li>
                <Link href="/category/pemerintahan" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Pemerintahan
                </Link>
              </li>
              <li>
                <Link href="/category/pendidikan" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Pendidikan
                </Link>
              </li>
              <li>
                <Link href="/category/ekonomi-bisnis" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Ekonomi & Bisnis
                </Link>
              </li>
              <li>
                <Link href="/category/olahraga" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Olahraga
                </Link>
              </li>
              <li>
                <Link href="/category/lifestyle" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Lifestyle
                </Link>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Informasi</h3>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.url}>
                  <Link href={link.url} className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                redaksi@inidepok.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PT Info */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="container py-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-1">PT. Jagonya Media Nusantara</p>
            <p className="text-xs text-gray-500">
              Jl. Prof. DR. Soepomo SH No.23 (Lt. Dasar Hotel Sofyan Soepomo), Tebet Barat, Tebet, Jakarta Selatan, DKI Jakarta
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-200">
        <div className="container py-4">
          <div className="text-sm text-gray-500 text-center sm:text-left">
            <p>&copy; {currentYear} Ini Depok. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="back-to-top"
        aria-label="Kembali ke atas"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </footer>
  )
}
