import Link from 'next/link';
import { Manga } from '@/lib/types';
import { getCoverUrl, getMangaTitle, getMangaGenres } from '@/lib/golgebahcesi';

const FLAG_MAP: Record<string, string> = { kr: '🇰🇷', jp: '🇯🇵', cn: '🇨🇳' };

const STATUS_LABELS: Record<string, string> = {
  ongoing: 'Devam Ediyor',
  completed: 'Tamamlandı',
  hiatus: 'Ara Verildi',
  cancelled: 'İptal Edildi',
};

const STATUS_COLORS: Record<string, string> = {
  ongoing: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  hiatus: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

interface MangaCardProps {
  manga: Manga;
  className?: string;
}

export default function MangaCard({ manga, className = '' }: MangaCardProps) {
  const title = getMangaTitle(manga);
  const coverUrl = getCoverUrl(manga, 256);
  const genres = getMangaGenres(manga).slice(0, 2);
  const status = manga.attributes.status;
  const flag = FLAG_MAP[manga.attributes.country ?? ''] ?? '';

  return (
    <Link href={`/manga/${manga.id}`} className={`manga-card group relative block ${className}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
          loading="lazy"
        />
        {flag && (
          <span className="absolute top-1.5 left-1.5 text-sm leading-none z-10 drop-shadow">{flag}</span>
        )}
        {/* Overlay */}
        <div className="manga-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 transition-opacity duration-300 p-3 flex flex-col justify-end">
          <div className="flex flex-wrap gap-1 mb-2">
            {genres.map(g => (
              <span key={g} className="text-xs bg-accent/80 text-white px-2 py-0.5 rounded-full">{g}</span>
            ))}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border w-fit ${STATUS_COLORS[status] || STATUS_COLORS.ongoing}`}>
            {STATUS_LABELS[status] || status}
          </span>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-accent transition-colors leading-tight">
          {title}
        </h3>
        {manga.attributes.lastChapter && (
          <p className="text-xs text-muted mt-1">Bölüm {manga.attributes.lastChapter}</p>
        )}
      </div>
    </Link>
  );
}
