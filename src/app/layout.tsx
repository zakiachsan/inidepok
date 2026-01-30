import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: {
    default: 'Ini Depok - Portal Berita Depok Terkini',
    template: '%s | Ini Depok',
  },
  description: 'Portal berita Depok yang menyajikan informasi terkini, akurat, dan terpercaya seputar Kota Depok dan sekitarnya.',
  keywords: ['berita', 'depok', 'berita depok', 'portal berita', 'inidepok', 'kota depok', 'jawa barat'],
  authors: [{ name: 'Ini Depok' }],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://inidepok.com',
    siteName: 'Ini Depok',
    title: 'Ini Depok - Portal Berita Depok Terkini',
    description: 'Portal berita Depok yang menyajikan informasi terkini, akurat, dan terpercaya seputar Kota Depok.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ini Depok - Portal Berita Depok Terkini',
    description: 'Portal berita Depok yang menyajikan informasi terkini, akurat, dan terpercaya seputar Kota Depok.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Generate JSON-LD schemas for the entire site
  const organizationSchema = generateOrganizationSchema()
  const webSiteSchema = generateWebSiteSchema()

  return (
    <html lang="id">
      <head>
        {/* JSON-LD Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* JSON-LD Structured Data - WebSite with Search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50`}>
        {children}
      </body>
    </html>
  )
}
