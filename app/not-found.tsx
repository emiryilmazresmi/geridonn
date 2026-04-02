import Link from 'next/link';
import { BookX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <BookX className="w-20 h-20 text-muted mb-6" />
      <h1 className="text-4xl font-bold mb-3">404</h1>
      <p className="text-muted text-lg mb-8">Aradığınız sayfa bulunamadı.</p>
      <Link href="/" className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-colors">
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
