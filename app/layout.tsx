import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'Geri Dönen Scans - Türkçe Manga Oku',
    template: '%s | Geri Dönen Scans',
  },
  description: 'Türkçe manga okuma sitesi. En popüler ve en son güncellenen mangaları Türkçe olarak okuyun.',
  keywords: ['manga', 'türkçe manga', 'manga oku', 'scanlation'],
  openGraph: {
    title: 'Geri Dönen Scans',
    description: 'Türkçe manga okuma sitesi',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen flex flex-col bg-background text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
