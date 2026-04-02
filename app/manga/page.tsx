import { Suspense } from 'react';
import { getGBMangaListFiltered, extractTagsFromManga, getAllGBManga } from '@/lib/golgebahcesi';
import MangaCard from '@/components/MangaCard';
import FilterBar from '@/components/FilterBar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 3600;

interface SearchParams {
  status?: string;
  order?: string;
  genre?: string | string[];
  page?: string;
  q?: string;
}

export default async function MangaListPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const limit = 24;
  const genres = Array.isArray(sp.genre) ? sp.genre : sp.genre ? [sp.genre] : [];

  const [{ data: mangas, total }, allMangas] = await Promise.all([
    getGBMangaListFiltered({
      page,
      limit,
      status: sp.status,
      genres,
      order: sp.order,
      title: sp.q,
    }),
    getAllGBManga(),
  ]);
  const tags = extractTagsFromManga(allMangas);

  const totalPages = Math.ceil(total / limit);

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (sp.status) params.set('status', sp.status);
    if (sp.order) params.set('order', sp.order);
    genres.forEach(g => params.append('genre', g));
    if (sp.q) params.set('q', sp.q);
    params.set('page', String(p));
    return `/manga?${params.toString()}`;
  };

  const isMaintenance = total === 0 && !sp.q && !sp.status;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isMaintenance && (
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-yellow-400 text-sm flex items-center gap-3">
          <span className="text-lg">🔧</span>
          <span><strong>Gölge Bahçesi şu an bakım modunda.</strong> Site tekrar açıldığında liste otomatik yüklenecek.</span>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Manga Listesi</h1>
        <p className="text-muted mt-1">{total.toLocaleString('tr-TR')} manga bulundu</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1">
          <Suspense>
            <FilterBar tags={tags} />
          </Suspense>
        </aside>

        {/* Manga Grid */}
        <div className="lg:col-span-3">
          {mangas.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted text-lg">Sonuç bulunamadı.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {mangas.map(manga => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {page > 1 && (
                    <Link
                      href={buildPageUrl(page - 1)}
                      className="flex items-center gap-1 px-4 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Önceki
                    </Link>
                  )}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return (
                        <Link
                          key={p}
                          href={buildPageUrl(p)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
                            p === page ? 'bg-accent text-white' : 'bg-surface-2 hover:bg-surface-3 text-muted'
                          }`}
                        >
                          {p}
                        </Link>
                      );
                    })}
                  </div>
                  {page < totalPages && (
                    <Link
                      href={buildPageUrl(page + 1)}
                      className="flex items-center gap-1 px-4 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm transition-colors"
                    >
                      Sonraki <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
