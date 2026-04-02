import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            <span className="font-bold">
              <span className="text-accent">Geri Dönen</span>
              <span className="text-white"> Scans</span>
            </span>
          </div>
          <p className="text-muted text-sm text-center">
            Tüm manga hakları ilgili yayıncılara aittir.
          </p>
          <div className="flex gap-4 text-sm text-muted">
            <Link href="/manga" className="hover:text-accent transition-colors">Manga Listesi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
