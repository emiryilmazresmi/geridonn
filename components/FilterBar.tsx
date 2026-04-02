'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tüm Durumlar' },
  { value: 'ongoing', label: 'Devam Ediyor' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'hiatus', label: 'Ara Verildi' },
  { value: 'cancelled', label: 'İptal Edildi' },
];

const ORDER_OPTIONS = [
  { value: 'followedCount', label: 'Popüler' },
  { value: 'latestUploadedChapter', label: 'Son Güncelleme' },
  { value: 'title', label: 'İsim (A-Z)' },
  { value: 'relevance', label: 'İlgililik' },
];

export default function FilterBar({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      router.push(`/manga?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleGenre = useCallback(
    (tagId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const genres = params.getAll('genre');
      if (genres.includes(tagId)) {
        params.delete('genre');
        genres.filter(g => g !== tagId).forEach(g => params.append('genre', g));
      } else {
        params.append('genre', tagId);
      }
      params.delete('page');
      router.push(`/manga?${params.toString()}`);
    },
    [router, searchParams]
  );

  const currentStatus = searchParams.get('status') || '';
  const currentOrder = searchParams.get('order') || 'followedCount';
  const currentGenres = searchParams.getAll('genre');

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-5 space-y-5">
      <div className="flex items-center gap-2 font-semibold text-white">
        <SlidersHorizontal className="w-4 h-4 text-accent" />
        Filtreler
      </div>

      {/* Status Filter */}
      <div>
        <p className="text-xs text-muted mb-2 font-medium uppercase tracking-wider">Durum</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter('status', opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentStatus === opt.value
                  ? 'bg-accent text-white'
                  : 'bg-surface-3 text-muted hover:text-white hover:bg-surface-3'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order Filter */}
      <div>
        <p className="text-xs text-muted mb-2 font-medium uppercase tracking-wider">Sıralama</p>
        <div className="flex flex-wrap gap-2">
          {ORDER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter('order', opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentOrder === opt.value
                  ? 'bg-accent text-white'
                  : 'bg-surface-3 text-muted hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genre Filter */}
      <div>
        <p className="text-xs text-muted mb-2 font-medium uppercase tracking-wider">Türler</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => toggleGenre(tag.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                currentGenres.includes(tag.id)
                  ? 'bg-accent text-white'
                  : 'bg-surface-3 text-muted hover:text-white'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
