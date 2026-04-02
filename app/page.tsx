import Link from 'next/link';
import { ChevronRight, TrendingUp, Clock, Star } from 'lucide-react';
import { getGBMangaList } from '@/lib/golgebahcesi';
import { getCoverUrl, getMangaTitle, getMangaGenres } from '@/lib/golgebahcesi';
import LatestUpdates from '@/components/LatestUpdates';

export const revalidate = 300;

const STATUS_COLORS: Record<string, string> = {
  ongoing: 'text-green-400',
  completed: 'text-blue-400',
};

export default async function HomePage() {
  const { data: mangas, maintenance } = await getGBMangaList(1);
  const latestChapters = mangas.slice(0, 20);
  const popular = mangas.slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Maintenance Banner */}
      {maintenance && (
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-yellow-400 text-sm flex items-center gap-3">
          <span className="text-lg">🔧</span>
          <span><strong>Gölge Bahçesi şu an bakım modunda.</strong> Site tekrar açıldığında içerikler otomatik olarak yüklenecek.</span>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

        {/* LEFT — Son Yüklenen Bölümler */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold tracking-wide">Son Yüklenen Bölümler</h2>
            </div>
            <Link href="/manga" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
              Tümünü Gör <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <LatestUpdates mangas={latestChapters} />
        </div>

        {/* RIGHT — Popüler Manga Sıralaması */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold tracking-wide">Popüler Mangalar</h2>
            </div>
            <Link href="/manga" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
              Tümü <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {popular.map((manga, i) => {
              const title = getMangaTitle(manga);
              const coverUrl = getCoverUrl(manga, 128);
              const genres = getMangaGenres(manga).slice(0, 2);
              const stars = Math.max(3, 5 - Math.floor(i / 4));

              return (
                <Link
                  key={manga.id}
                  href={`/manga/${manga.id}`}
                  className="flex items-center gap-3 bg-surface-2 hover:bg-surface-3 rounded-xl p-2.5 transition-colors group border border-border/30 hover:border-accent/30"
                >
                  {/* Rank */}
                  <span className={`text-base font-extrabold w-6 text-center flex-shrink-0 ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-muted'
                  }`}>
                    {i + 1}
                  </span>

                  {/* Cover */}
                  <div className="w-10 h-14 flex-shrink-0 overflow-hidden rounded-md bg-surface-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors line-clamp-1 leading-tight">
                      {title}
                    </p>
                    {genres.length > 0 && (
                      <p className="text-[10px] text-muted mt-0.5 line-clamp-1">
                        {genres.join(' · ')}
                      </p>
                    )}
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          className={`w-2.5 h-2.5 ${si < stars ? 'text-yellow-400 fill-yellow-400' : 'text-border'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Status dot */}
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    manga.attributes.status === 'completed' ? 'bg-blue-400' : 'bg-green-400'
                  }`} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
