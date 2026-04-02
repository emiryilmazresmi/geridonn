import Link from 'next/link';
import { Manga } from '@/lib/types';
import { getMangaTitle, getCoverUrl } from '@/lib/golgebahcesi';

const FLAG_MAP: Record<string, string> = {
  kr: '🇰🇷',
  jp: '🇯🇵',
  cn: '🇨🇳',
};

const STATUS_LABELS: Record<string, string> = {
  ongoing: 'Devam',
  completed: 'Bitti',
  hiatus: 'Ara',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<string, string> = {
  ongoing: 'bg-green-500/20 text-green-400',
  completed: 'bg-blue-500/20 text-blue-400',
  hiatus: 'bg-yellow-500/20 text-yellow-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}g önce`;
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

export default function LatestUpdates({ mangas }: { mangas: Manga[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {mangas.map(manga => {
        const title = getMangaTitle(manga);
        const coverUrl = getCoverUrl(manga, 256);
        const status = manga.attributes.status;
        const chapters = manga.attributes.recentChapters ?? [];
        const flag = FLAG_MAP[manga.attributes.country ?? ''] ?? '';

        return (
          <Link
            key={manga.id}
            href={`/manga/${manga.id}`}
            className="flex gap-3 bg-surface-2 hover:bg-surface-3 rounded-xl p-3 transition-colors group border border-border/40 hover:border-accent/30"
          >
            {/* Cover */}
            <div className="relative w-14 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
              {flag && (
                <span className="absolute bottom-0.5 right-0.5 text-[10px] leading-none">{flag}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <div className="flex items-start justify-between gap-1 mb-1">
                  <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors line-clamp-2 leading-tight">
                    {title}
                  </p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[status] || STATUS_COLORS.ongoing}`}>
                    {STATUS_LABELS[status] || 'Devam'}
                  </span>
                </div>
              </div>

              {/* Chapters */}
              <div className="space-y-0.5">
                {chapters.length > 0 ? (
                  chapters.map((ch, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-accent font-medium">Bölüm {ch.number}</span>
                      <span className="text-[10px] text-muted">{timeAgo(ch.date)}</span>
                    </div>
                  ))
                ) : manga.attributes.lastChapter ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-accent font-medium">Bölüm {manga.attributes.lastChapter}</span>
                    <span className="text-[10px] text-muted">{timeAgo(manga.attributes.updatedAt)}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted">{timeAgo(manga.attributes.updatedAt)}</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
