'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  BookOpen,
  AlignJustify,
  LayoutGrid,
  ArrowUp,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ChapterPages } from '@/lib/types';

interface ChapterReaderProps {
  pages: ChapterPages;
  chapterId: string;
  mangaId: string;
  mangaTitle: string;
  chapterNum?: string;
  prevChapterId?: string;
  nextChapterId?: string;
}

type ReadMode = 'paginated' | 'longstrip';

export default function ChapterReader({
  pages,
  mangaId,
  mangaTitle,
  chapterNum,
  prevChapterId,
  nextChapterId,
}: ChapterReaderProps) {
  const [mode, setMode] = useState<ReadMode>('longstrip');
  const [currentPage, setCurrentPage] = useState(0);
  const [dataSaver, setDataSaver] = useState(false);
  const [zoom, setZoom] = useState(100);

  const imageUrls = pages.chapter[dataSaver ? 'dataSaver' : 'data'].map(filename => {
    // GB source: URLs are already proxied — use directly
    if (filename.startsWith('/api/image') || filename.startsWith('http')) {
      return filename;
    }
    const direct = `${pages.baseUrl}/${dataSaver ? 'data-saver' : 'data'}/${pages.chapter.hash}/${filename}`;
    return `/api/image?url=${encodeURIComponent(direct)}`;
  });

  const totalPages = imageUrls.length;

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
  }, [currentPage, totalPages]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  }, [currentPage]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (mode !== 'paginated') return;
      if (e.key === 'ArrowRight' || e.key === 'd') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'a') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, goNext, goPrev]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-16 z-40 bg-surface border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          {/* Nav */}
          <div className="flex items-center gap-2">
            <Link href={`/manga/${mangaId}`} className="text-muted hover:text-accent transition-colors">
              <Home className="w-5 h-5" />
            </Link>
            <ChevronRight className="w-4 h-4 text-border" />
            <span className="text-sm text-muted line-clamp-1 max-w-[120px] sm:max-w-xs">{mangaTitle}</span>
            {chapterNum && (
              <>
                <ChevronRight className="w-4 h-4 text-border" />
                <span className="text-sm text-accent font-medium">Bölüm {chapterNum}</span>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex items-center bg-surface-2 rounded-lg p-1 border border-border">
              <button
                onClick={() => setMode('longstrip')}
                className={`p-1.5 rounded-md transition-colors ${mode === 'longstrip' ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
                title="Uzun Şerit"
              >
                <AlignJustify className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setMode('paginated'); setCurrentPage(0); }}
                className={`p-1.5 rounded-md transition-colors ${mode === 'paginated' ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
                title="Sayfalı"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Data Saver */}
            <button
              onClick={() => setDataSaver(d => !d)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                dataSaver ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted hover:border-accent hover:text-accent'
              }`}
            >
              Tasarruf
            </button>

            {/* Zoom (longstrip only) */}
            {mode === 'longstrip' && (
              <div className="flex items-center gap-1">
                <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="text-muted hover:text-white p-1">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted w-10 text-center">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="text-muted hover:text-white p-1">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Nav */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href={prevChapterId ? `/manga/${mangaId}/chapter/${prevChapterId}` : '#'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            prevChapterId ? 'bg-surface-2 hover:bg-surface-3 text-white' : 'bg-surface-2/50 text-muted cursor-not-allowed'
          }`}
          aria-disabled={!prevChapterId}
        >
          <ChevronLeft className="w-4 h-4" /> Önceki
        </Link>
        <span className="text-sm text-muted">
          {mode === 'paginated' ? `${currentPage + 1} / ${totalPages}` : `${totalPages} sayfa`}
        </span>
        <Link
          href={nextChapterId ? `/manga/${mangaId}/chapter/${nextChapterId}` : '#'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            nextChapterId ? 'bg-surface-2 hover:bg-surface-3 text-white' : 'bg-surface-2/50 text-muted cursor-not-allowed'
          }`}
          aria-disabled={!nextChapterId}
        >
          Sonraki <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Pages */}
      <div className="max-w-4xl mx-auto">
        {mode === 'longstrip' ? (
          <div className="flex flex-col items-center gap-1" style={{ width: `${zoom}%`, margin: '0 auto' }}>
            {imageUrls.map((url, idx) => (
              <div key={idx} className="reader-page w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Sayfa ${idx + 1}`} className="w-full h-auto block" loading={idx < 3 ? 'eager' : 'lazy'} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center px-4">
            <div className="reader-page w-full max-w-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrls[currentPage]}
                alt={`Sayfa ${currentPage + 1}`}
                className="w-full h-auto block mx-auto"
              />
            </div>
            {/* Page Navigation */}
            <div className="flex items-center gap-4 mt-6 mb-8">
              <button
                onClick={goPrev}
                disabled={currentPage === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface-2 hover:bg-surface-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Önceki Sayfa
              </button>
              <span className="text-sm text-muted">{currentPage + 1} / {totalPages}</span>
              <button
                onClick={goNext}
                disabled={currentPage === totalPages - 1}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface-2 hover:bg-surface-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sonraki Sayfa <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between border-t border-border mt-4">
        <Link
          href={prevChapterId ? `/manga/${mangaId}/chapter/${prevChapterId}` : '#'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            prevChapterId ? 'bg-surface-2 hover:bg-surface-3 text-white' : 'bg-surface-2/50 text-muted cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Önceki Bölüm
        </Link>
        <button onClick={scrollToTop} className="flex items-center gap-2 text-muted hover:text-accent transition-colors text-sm">
          <ArrowUp className="w-4 h-4" /> Yukarı
        </button>
        <Link
          href={nextChapterId ? `/manga/${mangaId}/chapter/${nextChapterId}` : '#'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            nextChapterId ? 'bg-surface-2 hover:bg-surface-3 text-white' : 'bg-surface-2/50 text-muted cursor-not-allowed'
          }`}
        >
          Sonraki Bölüm <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
