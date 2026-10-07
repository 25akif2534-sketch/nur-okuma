import React from 'react';
import type { BookMeta } from '../types';
import { BookOpen, ChevronRight, Search } from 'lucide-react';

interface BookListProps {
  books: BookMeta[];
  selectedBook: BookMeta | null;
  onSelectBook: (book: BookMeta) => void;
  onSelectChapter: (chapterId: string) => void;
  onOpenSearch: () => void;
}

export const BookList: React.FC<BookListProps> = ({
  books,
  selectedBook,
  onSelectBook,
  onSelectChapter,
  onOpenSearch,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 rounded-2xl mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
          Risale-i Nur Külliyatı
        </h1>
        <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto text-sm sm:text-base mb-6">
          Diyanet nüshası esas alınarak hazırlanmış sade, hızlı ve huzurlu okuma programı.
        </p>

        {/* Global Search Trigger Bar */}
        <div className="max-w-md mx-auto">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-500 dark:hover:border-amber-600 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 shadow-xs transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span className="text-sm font-serif">Külliyat'ta kelime, kavram veya bahis ara...</span>
            </div>
            <kbd className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
              Ara
            </kbd>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((book) => {
          const isSelected = selectedBook?.id === book.id;
          return (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${
                isSelected
                  ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-500/20'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  {book.title}
                </span>
              </div>

              {isSelected && (
                <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-900/60 space-y-1.5">
                  <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">
                    Bölümler / Bahisler:
                  </div>
                  <div className="max-h-64 overflow-y-auto pr-1 space-y-1">
                    {book.chapters.map((ch, idx) => (
                      <button
                        key={ch.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectChapter(ch.id);
                        }}
                        className="w-full text-left p-2 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-900 dark:hover:text-amber-100 flex items-center justify-between group transition-colors"
                      >
                        <span className="truncate">
                          {idx + 1}. {ch.title}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
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
