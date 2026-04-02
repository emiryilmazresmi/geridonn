import { notFound } from 'next/navigation';
import { getGBChapterById, getGBChapterPages, getGBMangaById, getGBMangaChapters, getMangaTitle } from '@/lib/golgebahcesi';
import ChapterReader from '@/components/ChapterReader';

export const revalidate = 300;

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  try {
    const { id, chapterId } = await params;
    const [chapter, pages, manga, { data: allChapters }] = await Promise.all([
      getGBChapterById(chapterId),
      getGBChapterPages(chapterId),
      getGBMangaById(id),
      getGBMangaChapters(id),
    ]);

    const currentIdx = allChapters.findIndex(c => c.id === chapterId);
    const prevChapter = currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;
    const nextChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null;

    return (
      <ChapterReader
        pages={pages}
        chapterId={chapterId}
        mangaId={id}
        mangaTitle={getMangaTitle(manga)}
        chapterNum={chapter.attributes.chapter}
        prevChapterId={prevChapter?.id}
        nextChapterId={nextChapter?.id}
      />
    );
  } catch (err) {
    const { GBMaintenanceError } = await import('@/lib/golgebahcesi');
    if (err instanceof GBMaintenanceError) {
      return (
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-4xl mb-4">🔧</p>
          <h1 className="text-xl font-bold text-white mb-2">Gölge Bahçesi Bakım Modunda</h1>
          <p className="text-muted">Site tekrar açıldığında bölüm okunabilecek.</p>
        </div>
      );
    }
    console.error('[ChapterPage] fetch error:', err);
    notFound();
  }
}
