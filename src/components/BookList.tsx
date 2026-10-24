import React from 'react';
import type { BookMeta } from '../types';
import { BOOK_PRIORITY } from '../utils/searchUtils';
import { BookOpen, ChevronRight, Search, BookmarkCheck } from 'lucide-react';

export interface LastReadInfo {
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
}

interface BookListProps {
  books: BookMeta[];
  selectedBook: BookMeta | null;
  lastRead?: LastReadInfo | null;
  onSelectBook: (book: BookMeta) => void;
  onSelectChapter: (chapterId: string) => void;
  onResumeLastRead?: (info: LastReadInfo) => void;
  onOpenSearch: () => void;
}

export const BookList: React.FC<BookListProps> = ({
  books,
  selectedBook,
  lastRead,
  onSelectBook,
  onSelectChapter,
  onResumeLastRead,
  onOpenSearch,
}) => {
  const visibleBooks = books
    .filter((b) => b.id !== 'kucuk-kitaplar')
    .sort((a, b) => (BOOK_PRIORITY[a.id] || 99) - (BOOK_PRIORITY[b.id] || 99));

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-2xl mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
          Risale-i Nur Külliyatı
        </h1>
        <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto text-sm sm:text-base mb-6">
          Diyanet nüshası esas alınarak hazırlanmış sade, hızlı ve huzurlu okuma programı.
        </p>

        {/* Global Search Trigger Bar */}
        <div className="max-w-md mx-auto space-y-3">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-amber-600 dark:hover:border-amber-500 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 shadow-xs transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-serif">Külliyat'ta kelime, terkip veya cümle ara...</span>
            </div>
            <kbd className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              Ara
            </kbd>
          </button>

          {lastRead && onResumeLastRead && (
            <button
              onClick={() => onResumeLastRead(lastRead)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border border-amber-500/40 bg-amber-50/90 dark:bg-amber-950/30 hover:bg-amber-100/90 dark:hover:bg-amber-900/40 text-amber-950 dark:text-amber-200 shadow-xs transition-all text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <BookmarkCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <div className="truncate text-xs sm:text-sm font-serif">
                  <span className="font-bold">Kaldığın Yer:</span> {lastRead.bookTitle} • {lastRead.chapterTitle}
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                Devam Et →
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleBooks.map((book) => {
          const isSelected = selectedBook?.id === book.id;
          const visibleChapters = book.chapters.filter(
            (ch) => !/fihrist|içindekiler/i.test(ch.title || '')
          );

          return (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${
                isSelected
                  ? 'border-amber-600 bg-[#fbf0d9] dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-md ring-2 ring-amber-500/30'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  {book.title}
                </span>
              </div>

              {isSelected && (
                <div className="mt-4 pt-3 border-t border-amber-900/20 dark:border-stone-700 space-y-1.5">
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider mb-2">
                    Bölümler / Bahisler:
                  </div>
                  <div className="max-h-64 overflow-y-auto pr-1 space-y-1">
                    {visibleChapters.map((ch, idx) => (
                      <button
                        key={ch.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectChapter(ch.id);
                        }}
                        className="w-full text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 bg-white/70 dark:bg-stone-950/60 hover:bg-amber-600 dark:hover:bg-amber-600 hover:text-white flex items-center justify-between group transition-colors shadow-2xs"
                      >
                        <span className="truncate">
                          {idx + 1}. {ch.title}
                        </span>
                        <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
