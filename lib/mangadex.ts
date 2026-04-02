import { unstable_cache } from 'next/cache';
import { Manga, Chapter, ChapterPages, MangaDexResponse, Relationship, CoverArt, Author } from './types';

const BASE_URL = 'https://api.mangadex.org';
const UPLOADS_URL = 'https://uploads.mangadex.org';

// Cached raw fetchers with different TTLs — works in dev and prod
const _fetchRaw = async (url: string): Promise<unknown> => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`MangaDex API error: ${res.status} — ${url}`);
  return res.json();
};
const _cache5m  = unstable_cache(_fetchRaw, ['mdx-5m'],  { revalidate: 300 });
const _cache1h  = unstable_cache(_fetchRaw, ['mdx-1h'],  { revalidate: 3600 });
const _cache24h = unstable_cache(_fetchRaw, ['mdx-24h'], { revalidate: 86400 });

export function getCoverUrl(manga: Manga, size: 256 | 512 | null = 256): string {
  const coverRel = manga.relationships?.find((r): r is CoverArt => r.type === 'cover_art') as CoverArt | undefined;
  if (!coverRel) return '/placeholder-cover.jpg';
  const suffix = size ? `.${size}.jpg` : '';
  const direct = `${UPLOADS_URL}/covers/${manga.id}/${coverRel.attributes.fileName}${suffix}`;
  return `/api/image?url=${encodeURIComponent(direct)}`;
}

export function getMangaTitle(manga: Manga): string {
  return manga.attributes.title.tr || manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Bilinmiyor';
}

export function getMangaDescription(manga: Manga): string {
  return manga.attributes.description.tr || manga.attributes.description.en || '';
}

export function getAuthorName(manga: Manga): string {
  const author = manga.relationships?.find((r): r is Author => r.type === 'author') as Author | undefined;
  return author?.attributes?.name || '';
}

export function getMangaGenres(manga: Manga): string[] {
  return manga.attributes.tags
    .filter(t => t.attributes.group === 'genre')
    .map(t => t.attributes.name.en);
}

async function fetchMangaDex<T>(
  endpoint: string,
  params: Record<string, string | string[] | number | boolean> = {},
  ttl: 300 | 3600 | 86400 = 300
): Promise<T> {
  // Build query string manually to preserve literal [] brackets (URLSearchParams encodes them as %5B%5D)
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach(v => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  // Decode [] back so MangaDex receives them as literal brackets
  const qs = parts.join('&').replace(/%5B/gi, '[').replace(/%5D/gi, ']');
  const url = `${BASE_URL}${endpoint}${qs ? `?${qs}` : ''}`;

  const cached = ttl === 86400 ? _cache24h : ttl === 3600 ? _cache1h : _cache5m;
  return (await cached(url)) as T;
}

export async function getLatestUpdates(limit = 20): Promise<Chapter[]> {
  const data = await fetchMangaDex<MangaDexResponse<Chapter[]>>('/chapter', {
    'translatedLanguage[]': 'tr',
    'order[publishAt]': 'desc',
    limit,
    'includes[]': ['manga', 'scanlation_group'],
    'contentRating[]': ['safe', 'suggestive', 'erotica'],
  });
  return data.data || [];
}

export async function getPopularManga(limit = 18): Promise<Manga[]> {
  const data = await fetchMangaDex<MangaDexResponse<Manga[]>>('/manga', {
    'availableTranslatedLanguage[]': 'tr',
    'order[followedCount]': 'desc',
    limit: limit * 2,
    'includes[]': ['cover_art', 'author'],
    'contentRating[]': ['safe', 'suggestive'],
    hasAvailableChapters: true,
  }, 3600);
  const filtered = await filterTurkishManga(data.data || []);
  return filtered.slice(0, limit);
}

export async function getMangaList(params: {
  limit?: number;
  offset?: number;
  status?: string;
  genres?: string[];
  order?: string;
  title?: string;
} = {}): Promise<{ data: Manga[]; total: number }> {
  const wantedLimit = params.limit || 20;
  const queryParams: Record<string, string | string[] | number | boolean> = {
    'availableTranslatedLanguage[]': 'tr',
    limit: wantedLimit * 2,
    offset: params.offset || 0,
    'includes[]': ['cover_art', 'author'],
    'contentRating[]': ['safe', 'suggestive'],
    hasAvailableChapters: true,
  };

  if (params.status) queryParams['status[]'] = params.status;
  if (params.genres?.length) queryParams['includedTags[]'] = params.genres;
  if (params.order) queryParams[`order[${params.order}]`] = 'desc';
  if (params.title) queryParams['title'] = params.title;
  const data = await fetchMangaDex<MangaDexResponse<Manga[]>>('/manga', queryParams);
  const filtered = await filterTurkishManga(data.data || []);
  return { data: filtered.slice(0, wantedLimit), total: data.total || 0 };
}

export async function getMangaById(id: string): Promise<Manga> {
  const data = await fetchMangaDex<MangaDexResponse<Manga>>(`/manga/${id}`, {
    'includes[]': ['cover_art', 'author', 'artist'],
  }, 3600);
  return data.data;
}

async function hasTurkishChapters(mangaId: string): Promise<boolean> {
  const data = await fetchMangaDex<MangaDexResponse<Chapter[]>>(`/manga/${mangaId}/feed`, {
    'translatedLanguage[]': 'tr',
    limit: 1,
    'contentRating[]': ['safe', 'suggestive', 'erotica'],
  }, 3600);
  return (data.total || 0) > 0;
}

async function filterTurkishManga(mangas: Manga[]): Promise<Manga[]> {
  const checks = await Promise.all(mangas.map(m => hasTurkishChapters(m.id)));
  return mangas.filter((_, i) => checks[i]);
}

export async function getMangaChapters(mangaId: string, limit = 96, offset = 0): Promise<{ data: Chapter[]; total: number }> {
  const data = await fetchMangaDex<MangaDexResponse<Chapter[]>>(`/manga/${mangaId}/feed`, {
    'translatedLanguage[]': 'tr',
    'order[chapter]': 'desc',
    limit,
    offset,
    'includes[]': ['scanlation_group'],
    'contentRating[]': ['safe', 'suggestive', 'erotica'],
  });
  return { data: data.data || [], total: data.total || 0 };
}

export async function getChapterPages(chapterId: string): Promise<ChapterPages> {
  const data = await fetchMangaDex<{ baseUrl: string; chapter: ChapterPages['chapter'] }>(`/at-home/server/${chapterId}`, {}, 86400);
  return { baseUrl: data.baseUrl, chapter: data.chapter };
}

export async function getChapterById(chapterId: string): Promise<Chapter> {
  const data = await fetchMangaDex<MangaDexResponse<Chapter>>(`/chapter/${chapterId}`, {
    'includes[]': ['manga', 'scanlation_group'],
  }, 3600);
  return data.data;
}

export async function searchManga(query: string, limit = 20): Promise<Manga[]> {
  const data = await fetchMangaDex<MangaDexResponse<Manga[]>>('/manga', {
    title: query,
    'availableTranslatedLanguage[]': 'tr',
    limit: limit * 2,
    'includes[]': ['cover_art', 'author'],
    'contentRating[]': ['safe', 'suggestive'],
    hasAvailableChapters: true,
  });
  const filtered = await filterTurkishManga(data.data || []);
  return filtered.slice(0, limit);
}

export async function getTags(): Promise<Array<{ id: string; name: string; group: string }>> {
  const data = await fetchMangaDex<MangaDexResponse<Array<{ id: string; attributes: { name: { en: string }; group: string } }>>>('/manga/tag', {}, 86400);
  return (data.data || [])
    .filter(t => t.attributes.group === 'genre')
    .map(t => ({ id: t.id, name: t.attributes.name.en, group: t.attributes.group }));
}
