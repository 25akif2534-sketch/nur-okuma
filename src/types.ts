export interface Passage {
  id: string;
  title: string;
  shortTitle: string;
  text: string;
}

export interface ChapterMeta {
  id: string;
  title: string;
  passageCount?: number;
  snippet: string;
}

export interface BookMeta {
  id: string;
  title: string;
  chapterCount: number;
  chapters: ChapterMeta[];
}

export interface ChapterContent {
  id: string;
  bookId: string;
  bookTitle: string;
  title: string;
  rawContent: string;
  passages: Passage[];
}

export type ThemeMode = 'sepia' | 'light' | 'dark' | 'night';
