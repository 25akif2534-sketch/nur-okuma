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
  const visibleBooks = books.filter((b) => b.id !== 'kucuk-kitaplar');

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 text-amber-800 rounded-2xl mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mb-2">
          Risale-i Nur Külliyatı
        </h1>
        <p className="text-stone-600 max-w-xl mx-auto text-sm sm:text-base mb-6">
          Diyanet nüshası esas alınarak hazırlanmış sade, hızlı ve huzurlu okuma programı.
        </p>

        {/* Global Search Trigger Bar */}
        <div className="max-w-md mx-auto">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-stone-300 bg-white hover:border-amber-600 text-stone-600 hover:text-stone-900 shadow-xs transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-serif">Külliyat'ta kelime, kavram veya bahis ara...</span>
            </div>
            <kbd className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
              Ara
            </kbd>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleBooks.map((book) => {
          const isSelected = selectedBook?.id === book.id;
          const visibleChapters = book.chapters.filter(
            (ch) => !/fihrist/i.test(ch.title || '')
          );

          return (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${
                isSelected
                  ? 'border-amber-600 bg-[#fbf0d9] text-stone-900 shadow-md ring-2 ring-amber-500/30'
                  : 'border-stone-200 bg-white text-stone-900 hover:border-amber-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif font-bold text-lg text-stone-900">
                  {book.title}
                </span>
              </div>

              {isSelected && (
                <div className="mt-4 pt-3 border-t border-amber-900/20 space-y-1.5">
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
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
                        className="w-full text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 bg-white/70 hover:bg-amber-600 hover:text-white flex items-center justify-between group transition-colors shadow-2xs"
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
