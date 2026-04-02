import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGBMangaById, getGBMangaChapters, getCoverUrl, getMangaTitle, getMangaDescription, getAuthorName, getMangaGenres } from '@/lib/golgebahcesi';
import { BookOpen, Star, Calendar, User, Tag, ChevronRight, BookMarked } from 'lucide-react';

export const revalidate = 300;

const STATUS_LABELS: Record<string, string> = {
  ongoing: 'Devam Ediyor',
  completed: 'Tamamlandı',
  hiatus: 'Ara Verildi',
  cancelled: 'İptal Edildi',
};

const STATUS_COLORS: Record<string, string> = {
  ongoing: 'text-green-400',
  completed: 'text-blue-400',
  hiatus: 'text-yellow-400',
  cancelled: 'text-red-400',
};

export default async function MangaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [manga, { data: chapters, total: totalChapters }] = await Promise.all([
      getGBMangaById(id),
      getGBMangaChapters(id),
    ]);

    const title = getMangaTitle(manga);
    const description = getMangaDescription(manga);
    const coverUrl = getCoverUrl(manga, 512);
    const author = getAuthorName(manga);
    const genres = getMangaGenres(manga);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div className="relative w-48 md:w-56 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-black/50 mx-auto md:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h1>

            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              {author && (
                <div className="flex items-center gap-1.5 text-muted">
                  <User className="w-4 h-4" />
                  <span>{author}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-muted" />
                <span className={STATUS_COLORS[manga.attributes.status] || 'text-muted'}>
                  {STATUS_LABELS[manga.attributes.status] || manga.attributes.status}
                </span>
              </div>
              {manga.attributes.year && (
                <div className="flex items-center gap-1.5 text-muted">
                  <Calendar className="w-4 h-4" />
                  <span>{manga.attributes.year}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted">
                <BookOpen className="w-4 h-4" />
                <span>{totalChapters} Bölüm</span>
              </div>
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {genres.map(genre => (
                  <span key={genre} className="px-3 py-1 bg-accent/15 text-accent border border-accent/30 rounded-full text-xs font-medium">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="bg-surface-2 rounded-xl p-4 border border-border">
                <p className="text-sm text-muted leading-relaxed line-clamp-3">{description}</p>
              </div>
            )}

            {/* Start Reading */}
            {chapters.length > 0 ? (
              <div className="mt-5">
                <Link
                  href={`/manga/${id}/chapter/${chapters[chapters.length - 1].id}`}
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  İlk Bölümü Oku
                </Link>
                {chapters.length > 1 && (
                  <Link
                    href={`/manga/${id}/chapter/${chapters[0].id}`}
                    className="inline-flex items-center gap-2 ml-3 bg-surface-2 hover:bg-surface-3 text-white font-semibold px-6 py-3 rounded-lg transition-colors border border-border"
                  >
                    Son Bölümü Oku
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-2 text-muted text-sm bg-surface-2 border border-border rounded-lg px-4 py-3">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                Bu manga henüz Türkçe çevirisi yok.
              </div>
            )}
          </div>
        </div>

        {/* Chapter List */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-accent" />
            Türkçe Bölümler
            <span className="text-muted text-sm font-normal">({totalChapters})</span>
          </h2>
          {chapters.length === 0 ? (
            <div className="bg-surface-2 rounded-xl border border-border px-6 py-10 text-center text-muted">
              Bu manga henüz Türkçe çevirisi yok.
            </div>
          ) : (
            <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {chapters.map((chapter) => (
                  <Link
                    key={chapter.id}
                    href={`/manga/${id}/chapter/${chapter.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-accent font-semibold text-sm w-20 flex-shrink-0">
                        {chapter.attributes.chapter ? `Bölüm ${chapter.attributes.chapter}` : 'Oneshot'}
                      </span>
                      {chapter.attributes.title && (
                        <span className="text-muted text-sm line-clamp-1">{chapter.attributes.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted hidden sm:block">
                        {new Date(chapter.attributes.publishAt).toLocaleDateString('tr-TR')}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    const { GBMaintenanceError } = await import('@/lib/golgebahcesi');
    if (err instanceof GBMaintenanceError) {
      return (
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-4xl mb-4">🔧</p>
          <h1 className="text-xl font-bold text-white mb-2">Gölge Bahçesi Bakım Modunda</h1>
          <p className="text-muted">Site tekrar açıldığında manga bilgileri yüklenecek.</p>
        </div>
      );
    }
    console.error('[MangaDetailPage] fetch error:', err);
    notFound();
  }
}
