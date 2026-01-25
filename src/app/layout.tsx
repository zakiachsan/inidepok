import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "IniDepok - Portal Berita Depok Terkini",
    template: "%s | IniDepok",
  },
  description: "Portal berita dan informasi terkini seputar Kota Depok dan sekitarnya",
  keywords: ["depok", "berita depok", "news depok", "portal berita", "inidepok"],
  authors: [{ name: "IniDepok" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "IniDepok",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-gray-100">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
