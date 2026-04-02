import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { unstable_cache } from 'next/cache';
import type { Manga, Chapter, ChapterPages, Tag, Relationship } from './types';

const BASE_URL = 'https://golgebahcesi.com';
const SOURCE_PREFIX = 'gb-';

// ─── Helpers ────────────────────────────────────────────────────────────────

function gbId(slug: string): string {
  return `${SOURCE_PREFIX}${slug}`;
}

function slugFromId(id: string): string {
  return id.replace(SOURCE_PREFIX, '');
}

function proxyImage(url: string): string {
  if (!url) return '/placeholder-cover.jpg';
  return `/api/image?url=${encodeURIComponent(url)}`;
}

function normalizeStatus(raw: string): Manga['attributes']['status'] {
  const s = raw.toLowerCase().trim();
  if (s.includes('devam') || s.includes('ongoing') || s.includes('sürüyor')) return 'ongoing';
  if (s.includes('tamamlan') || s.includes('completed') || s.includes('bitti')) return 'completed';
  if (s.includes('ara') || s.includes('hiatus')) return 'hiatus';
  if (s.includes('iptal') || s.includes('cancel')) return 'cancelled';
  return 'ongoing';
}

export class GBMaintenanceError extends Error {
  constructor() { super('Gölge Bahçesi şu an bakım modunda.'); this.name = 'GBMaintenanceError'; }
}

async function fetchHtml(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Referer': 'https://golgebahcesi.com/',
      },
      cache: 'no-store',
    });
  } catch (err) {
    console.error('[fetchHtml] network error:', err);
    throw new GBMaintenanceError();
  }
  console.log(`[fetchHtml] ${url} → ${res.status}`);
  if (!res.ok) throw new Error(`Gölge Bahçesi fetch error: ${res.status} — ${url}`);
  const html = await res.text();
  console.log(`[fetchHtml] HTML preview (500): ${html.slice(0, 500)}`);
  // Only treat as maintenance if redirected to login page, or it IS the login/maintenance page
  // (detail pages may contain wp-login.php links in theme nav — don't false-positive on those)
  if (
    html.includes('<form name="loginform"') ||
    html.includes('<body class="login') ||
    (html.includes('maintenance') && !html.includes('listupd') && !html.includes('entry-title'))
  ) {
    throw new GBMaintenanceError();
  }
  return html;
}

// ─── Raw fetchers ────────────────────────────────────────────────────────────

const _fetchMangaListPage = (page: number) =>
  fetchHtml(`${BASE_URL}/manga/${page > 1 ? `page/${page}/` : ''}`);

const _fetchMangaDetail = (slug: string) =>
  fetchHtml(`${BASE_URL}/manga/${slug}/`);

const _fetchChapterPage = (slug: string, chapterSlug: string) =>
  fetchHtml(`${BASE_URL}/manga/${slug}/${chapterSlug}/`);

// ─── Parsers ─────────────────────────────────────────────────────────────────

function parseMangaCard(el: Element, $: cheerio.CheerioAPI): Manga {
  // MangaReader theme: .listupd .bs .bsx
  const $el = $(el);
  const link = $el.find('a').first().attr('href') || '';
  const slug = link.replace(BASE_URL, '').replace(/\/manga\//, '').replace(/\//g, '');
  const title = $el.find('.tt, .bigor .tt, h3, .bsx .tt').first().text().trim()
    || $el.find('img').first().attr('alt') || 'Bilinmiyor';
  const coverRaw = $el.find('img.ts-post-image, .bsx img, .limit img').first().attr('data-src')
    || $el.find('img.ts-post-image, .bsx img, .limit img').first().attr('src')
    || $el.find('img').first().attr('data-src')
    || $el.find('img').first().attr('src') || '';

  // Recent chapters listed on the card (.adds a, .epxs a)
  const recentChapters: Array<{ number: string; date: string }> = [];
  $el.find('.adds a, .epxs a, .clnum a').each((i, chEl) => {
    if (i >= 3) return false;
    const text = $(chEl).text().trim();
    const num = text.replace(/[^0-9.]/g, '');
    if (num) recentChapters.push({ number: num, date: new Date().toISOString() });
  });

  return {
    id: gbId(slug),
    type: 'manga',
    attributes: {
      title: { tr: title },
      description: { tr: '' },
      status: 'ongoing',
      contentRating: 'safe',
      tags: [],
      availableTranslatedLanguages: ['tr'],
      updatedAt: new Date().toISOString(),
      country: 'kr',
      recentChapters,
    },
    relationships: [
      {
        id: gbId(slug) + '-cover',
        type: 'cover_art',
        attributes: { fileName: coverRaw },
      } as Relationship,
    ],
  };
}

function parseMangaDetail(html: string, slug: string): Manga {
  const $ = cheerio.load(html);

  const title = $('.entry-title, .seriestuheader h1, .infox h1').first().text().trim()
    || $('h1').first().text().trim();

  const coverRaw = $('.thumb img, .seriestucontent .thumb img, .imgseries img').first().attr('src')
    || $('.thumb img').first().attr('data-src') || '';

  const description = $('.entry-content p, .synops, .infox .desc, .wd-full .entry-content p')
    .first().text().trim();

  // Status
  const statusRaw = $('.tsinfo .imptdt:contains("Durum") i, .tsinfo .imptdt i, .infox .fmed b:contains("Durum")')
    .first().next().text().trim()
    || $('.imptdt').filter((_, el) => $(el).text().toLowerCase().includes('durum')).find('i').text().trim()
    || $('.infox .fmed').filter((_, el) => $(el).find('b').text().toLowerCase().includes('durum')).find('span, a').text().trim()
    || 'Devam Ediyor';

  // Genres/tags
  const tags: Tag[] = [];
  $('.mgen a, .genre-info a, .infox .genre a').each((i, el) => {
    const name = $(el).text().trim();
    if (name) {
      tags.push({
        id: gbId(`tag-${name.toLowerCase().replace(/\s+/g, '-')}`),
        type: 'tag',
        attributes: { name: { en: name }, group: 'genre' },
      });
    }
  });

  // Cover relationship
  const relationships: Relationship[] = [
    {
      id: gbId(slug) + '-cover',
      type: 'cover_art',
      attributes: { fileName: coverRaw },
    } as Relationship,
  ];

  return {
    id: gbId(slug),
    type: 'manga',
    attributes: {
      title: { tr: title },
      description: { tr: description },
      status: normalizeStatus(statusRaw),
      contentRating: 'safe',
      tags,
      availableTranslatedLanguages: ['tr'],
      updatedAt: new Date().toISOString(),
    },
    relationships,
  };
}

function parseChapterList(html: string, mangaSlug: string): Chapter[] {
  const $ = cheerio.load(html);
  const chapters: Chapter[] = [];

  // MangaReader theme: #chapterlist ul li
  $('#chapterlist ul li, .chapter-list li, .eplister ul li').each((_, el) => {
    const $el = $(el);
    const link = $el.find('a').first().attr('href') || '';
    // Extract chapter slug from URL
    const chapterSlug = link.replace(BASE_URL, '').replace(/\//g, '-').replace(/^-|-$/g, '')
      || link.split('/').filter(Boolean).pop() || '';

    const chapterNumRaw = $el.find('.chapternum, .epl-num').first().text().trim()
      || $el.find('a').first().text().trim();
    const chapterNum = chapterNumRaw.replace(/[^0-9.]/g, '') || '0';

    const dateRaw = $el.find('.chapterdate, .epl-date').first().text().trim() || '';

    // Build a stable ID: gb-{mangaSlug}-ch-{chapterNum}
    const chapterId = gbId(`${mangaSlug}-ch-${chapterNum}`);

    chapters.push({
      id: chapterId,
      type: 'chapter',
      attributes: {
        chapter: chapterNum,
        title: chapterNumRaw.includes('Bölüm') ? chapterNumRaw : `Bölüm ${chapterNum}`,
        translatedLanguage: 'tr',
        publishAt: parseTurkishDate(dateRaw),
        pages: 0,
        // Store the full URL in externalUrl for page fetching
        externalUrl: link,
      },
      relationships: [
        {
          id: gbId(mangaSlug),
          type: 'manga',
          attributes: {},
        } as Relationship,
      ],
    });
  });

  return chapters;
}

function parseChapterImages(html: string): string[] {
  const $ = cheerio.load(html);
  const images: string[] = [];

  // MangaReader theme: #readerarea img
  $('#readerarea img, .reader-area img, .rdminimal img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || '';
    if (src && !src.includes('placeholder') && !src.includes('loading')) {
      images.push(src);
    }
  });

  // Fallback: look for noscript or script-embedded image list
  if (images.length === 0) {
    const scriptContent = $('script').filter((_, el) => !!($(el).html()?.includes('ts_reader'))).html() || '';
    const match = scriptContent.match(/ts_reader\.run\(([\s\S]*?)\)\s*;/);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        const srcs: string[] = data?.sources?.[0]?.images || [];
        images.push(...srcs);
      } catch { /* ignore parse errors */ }
    }
  }

  return images;
}

function parseTurkishDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  // Try parsing directly
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString();
  // "X gün önce" etc. → approximate
  const agoMatch = raw.match(/(\d+)\s*(gün|saat|ay|yıl|hafta)/i);
  if (agoMatch) {
    const n = parseInt(agoMatch[1]);
    const unit = agoMatch[2].toLowerCase();
    const now = Date.now();
    const ms = unit.startsWith('saat') ? n * 3600000
      : unit.startsWith('gün') ? n * 86400000
      : unit.startsWith('hafta') ? n * 7 * 86400000
      : unit.startsWith('ay') ? n * 30 * 86400000
      : n * 365 * 86400000;
    return new Date(now - ms).toISOString();
  }
  return new Date().toISOString();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Fetch one page of the manga list. Returns manga array + whether more pages exist. */
async function _getGBMangaListImpl(page = 1): Promise<{ data: Manga[]; hasMore: boolean; maintenance?: boolean }> {
  try {
    const html = await _fetchMangaListPage(page);
    const $ = cheerio.load(html);
    const mangas: Manga[] = [];
    const seen = new Set<string>();

    $('.listupd .bs, .listupd .bsx, .manga-list .manga-item').each((_, el) => {
      const m = parseMangaCard(el, $);
      if (m.id !== gbId('') && !seen.has(m.id)) {
        seen.add(m.id);
        mangas.push(m);
      }
    });

    const hasMore = !!$('.hpage .r, .pagination .next, a.next').length;
    return { data: mangas, hasMore };
  } catch (err) {
    if (err instanceof GBMaintenanceError) return { data: [], hasMore: false, maintenance: true };
    console.error('[getGBMangaList]', err);
    return { data: [], hasMore: false };
  }
}

export const getGBMangaList = unstable_cache(
  _getGBMangaListImpl,
  ['gb-manga-list'],
  { revalidate: 1800 },
);

/** Fetch ALL manga across all pages. */
export async function getAllGBManga(): Promise<Manga[]> {
  const all: Manga[] = [];
  let page = 1;
  while (true) {
    const { data, hasMore, maintenance } = await getGBMangaList(page);
    if (maintenance) break;
    all.push(...data);
    if (!hasMore || data.length === 0) break;
    page++;
  }
  return all;
}

/** Fetch manga detail (title, cover, genres, status, description). */
export const getGBMangaById = unstable_cache(
  async (id: string): Promise<Manga> => {
    const slug = slugFromId(id);
    try {
      const html = await _fetchMangaDetail(slug);
      return parseMangaDetail(html, slug);
    } catch (err) {
      if (err instanceof GBMaintenanceError) throw err;
      console.error('[getGBMangaById]', err);
      throw err;
    }
  },
  ['gb-manga-by-id'],
  { revalidate: 1800 },
);

/** Fetch chapter list for a manga. */
export async function getGBMangaChapters(mangaId: string): Promise<{ data: Chapter[]; total: number }> {
  const slug = slugFromId(mangaId);
  try {
    const html = await _fetchMangaDetail(slug);
    const data = parseChapterList(html, slug);
    return { data, total: data.length };
  } catch (err) {
    console.error('[getGBMangaChapters]', err);
    return { data: [], total: 0 };
  }
}

/** Fetch page images for a chapter. chapterId format: gb-{mangaSlug}-ch-{num} */
export async function getGBChapterPages(chapterId: string): Promise<ChapterPages> {
  // chapterId: gb-{mangaSlug}-ch-{chapterNum}
  // We need the actual chapter URL — get it from the chapter list
  const withoutPrefix = slugFromId(chapterId); // {mangaSlug}-ch-{chapterNum}
  const chMatch = withoutPrefix.match(/^(.+)-ch-(.+)$/);
  if (!chMatch) throw new Error(`Invalid GB chapter id: ${chapterId}`);

  const mangaSlug = chMatch[1];
  const html = await _fetchMangaDetail(mangaSlug);
  const chapters = parseChapterList(html, mangaSlug);
  const chapter = chapters.find(c => c.id === chapterId);

  const chapterUrl = chapter?.attributes?.externalUrl;
  if (!chapterUrl) throw new Error(`Chapter URL not found for: ${chapterId}`);

  const chapterHtml = await _fetchChapterPage(mangaSlug, chapterUrl.split('/').filter(Boolean).pop() || '');
  const rawImages = parseChapterImages(chapterHtml);

  console.log(`[getGBChapterPages] chapterId=${chapterId}`);
  console.log(`[getGBChapterPages] chapterUrl=${chapterUrl}`);
  console.log(`[getGBChapterPages] rawImages (${rawImages.length}):`, rawImages);

  const proxied = rawImages.map(url => proxyImage(url));

  console.log(`[getGBChapterPages] proxied (${proxied.length}):`, proxied);

  return {
    baseUrl: '',
    chapter: {
      hash: chapterId,
      data: proxied,
      dataSaver: proxied,
    },
  };
}

/** Check if an id belongs to Gölge Bahçesi. */
export function isGBSource(id: string): boolean {
  return id.startsWith(SOURCE_PREFIX);
}

/** Get cover URL for a GB manga (proxied). */
export function getGBCoverUrl(manga: Manga): string {
  const coverRel = manga.relationships?.find(r => r.type === 'cover_art');
  if (!coverRel) return '/placeholder-cover.jpg';
  const fileName = (coverRel as { id: string; type: string; attributes: { fileName: string } }).attributes?.fileName || '';
  if (!fileName) return '/placeholder-cover.jpg';
  if (fileName.startsWith('http')) return proxyImage(fileName);
  return '/placeholder-cover.jpg';
}

// ─── Shared helpers (work on any Manga type) ─────────────────────────────────

export function getMangaTitle(manga: Manga): string {
  return manga.attributes.title.tr || manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Bilinmiyor';
}

export function getMangaDescription(manga: Manga): string {
  return manga.attributes.description.tr || manga.attributes.description.en || '';
}

export function getMangaGenres(manga: Manga): string[] {
  return manga.attributes.tags
    .filter(t => t.attributes.group === 'genre')
    .map(t => t.attributes.name.en);
}

export function getAuthorName(manga: Manga): string {
  const author = manga.relationships?.find(r => r.type === 'author');
  if (!author || !('attributes' in author)) return '';
  return (author as { id: string; type: string; attributes: { name: string } }).attributes?.name || '';
}

/** Alias for MangaCard compat — size param ignored (GB covers are direct URLs). */
export function getCoverUrl(manga: Manga, _size?: number | null): string {
  return getGBCoverUrl(manga);
}

// ─── Extra fetchers ───────────────────────────────────────────────────────────

/** Find a single chapter by its ID (searches manga's chapter list). */
export async function getGBChapterById(chapterId: string): Promise<Chapter> {
  const withoutPrefix = slugFromId(chapterId);
  const chMatch = withoutPrefix.match(/^(.+)-ch-(.+)$/);
  if (!chMatch) throw new Error(`Invalid GB chapter id: ${chapterId}`);
  const mangaSlug = chMatch[1];
  const { data: chapters } = await getGBMangaChapters(gbId(mangaSlug));
  const chapter = chapters.find(c => c.id === chapterId);
  if (!chapter) throw new Error(`Chapter not found: ${chapterId}`);
  return chapter;
}

/** Search manga by title (case-insensitive, searches all pages). */
export async function searchGBManga(query: string, limit = 24): Promise<Manga[]> {
  const all = await getAllGBManga();
  const q = query.toLowerCase();
  return all
    .filter(m => getMangaTitle(m).toLowerCase().includes(q))
    .slice(0, limit);
}

/** Fetch manga list with optional status/genre/order filtering (client-side). */
export async function getGBMangaListFiltered(params: {
  page?: number;
  limit?: number;
  status?: string;
  genres?: string[];
  order?: string;
  title?: string;
} = {}): Promise<{ data: Manga[]; total: number }> {
  const limit = params.limit || 24;
  const page  = params.page  || 1;

  let all = await getAllGBManga();

  // Filter by status
  if (params.status) {
    all = all.filter(m => m.attributes.status === params.status);
  }

  // Filter by genre names
  if (params.genres?.length) {
    all = all.filter(m => {
      const genres = getMangaGenres(m).map(g => g.toLowerCase());
      return params.genres!.every(g => genres.includes(g.toLowerCase()));
    });
  }

  // Filter by title
  if (params.title) {
    const q = params.title.toLowerCase();
    all = all.filter(m => getMangaTitle(m).toLowerCase().includes(q));
  }

  // Sort
  if (params.order === 'title') {
    all = [...all].sort((a, b) => getMangaTitle(a).localeCompare(getMangaTitle(b), 'tr'));
  }

  const total = all.length;
  const offset = (page - 1) * limit;
  return { data: all.slice(offset, offset + limit), total };
}

/** Collect all unique genre tags from a manga list. */
export function extractTagsFromManga(mangas: Manga[]): Array<{ id: string; name: string; group: string }> {
  const seen = new Set<string>();
  const tags: Array<{ id: string; name: string; group: string }> = [];
  for (const m of mangas) {
    for (const t of m.attributes.tags) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        tags.push({ id: t.id, name: t.attributes.name.en, group: t.attributes.group });
      }
    }
  }
  return tags.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}
