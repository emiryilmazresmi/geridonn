export interface MangaTitle {
  en?: string;
  tr?: string;
  [key: string]: string | undefined;
}

export interface MangaDescription {
  en?: string;
  tr?: string;
  [key: string]: string | undefined;
}

export interface Tag {
  id: string;
  type: 'tag';
  attributes: {
    name: { en: string };
    group: string;
  };
}

export interface CoverArt {
  id: string;
  type: 'cover_art';
  attributes: {
    fileName: string;
    volume?: string;
  };
}

export interface Author {
  id: string;
  type: 'author' | 'artist';
  attributes: {
    name: string;
  };
}

export type Relationship = CoverArt | Author | { id: string; type: string; attributes?: Record<string, unknown> };

export interface Manga {
  id: string;
  type: 'manga';
  attributes: {
    title: MangaTitle;
    description: MangaDescription;
    status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
    year?: number;
    contentRating: string;
    tags: Tag[];
    availableTranslatedLanguages: string[];
    lastVolume?: string;
    lastChapter?: string;
    updatedAt: string;
    country?: string;
    recentChapters?: Array<{ number: string; date: string }>;
  };
  relationships: Relationship[];
}

export interface Chapter {
  id: string;
  type: 'chapter';
  attributes: {
    title?: string;
    volume?: string;
    chapter?: string;
    translatedLanguage: string;
    publishAt: string;
    pages: number;
    externalUrl?: string;
  };
  relationships: Relationship[];
}

export interface ChapterPages {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

export interface MangaDexResponse<T> {
  result: string;
  response: string;
  data: T;
  limit?: number;
  offset?: number;
  total?: number;
}

export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled';

export interface FilterState {
  status: MangaStatus | '';
  genres: string[];
  order: 'latestUploadedChapter' | 'followedCount' | 'relevance' | 'title';
}
