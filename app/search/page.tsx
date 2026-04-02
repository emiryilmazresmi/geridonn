import { searchGBManga } from '@/lib/golgebahcesi';
import MangaCard from '@/components/MangaCard';
import { Search } from 'lucide-react';
import Link from 'next/link';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() || '';
  const results = query ? await searchGBManga(query, 24) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold">
            {query ? `"${query}" için sonuçlar` : 'Manga Ara'}
          </h1>
        </div>
        {query && (
          <p className="text-muted">{results.length} sonuç bulundu</p>
        )}
      </div>

      {!query && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-muted mx-auto mb-4" />
          <p className="text-muted text-lg">Aramak istediğiniz mangayı yukarıdaki arama kutusuna yazın.</p>
        </div>
      )}

      {query && results.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted text-lg">"{query}" için sonuç bulunamadı.</p>
          <Link href="/manga" className="text-accent hover:text-accent-hover mt-4 inline-block">
            Tüm mangaları görüntüle
          </Link>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map(manga => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      )}
    </div>
  );
}
