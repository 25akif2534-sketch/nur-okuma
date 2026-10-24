import React, { useState } from 'react';
import type { BookMeta } from '../types';
import { BOOK_PRIORITY } from '../utils/searchUtils';
import { BookOpen, ChevronRight, Search, BookmarkCheck, RefreshCw } from 'lucide-react';

export interface LastReadInfo {
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  progressPercent?: number;
}

interface VecizeItem {
  quote: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
}

const DAILY_VECIZELER: VecizeItem[] = [
  {
    quote: 'Bismillah her hayrın başıdır. Biz dahi başta ona başlarız.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-1',
    chapterTitle: 'Birinci Söz',
  },
  {
    quote: 'İman hem nurdur hem kuvvettir. Evet, hakiki imanı elde eden adam, kâinata meydan okuyabilir.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-23',
    chapterTitle: 'Yirmi Üçüncü Söz',
  },
  {
    quote: 'Güzel gören güzel düşünür. Güzel düşünen, hayatından lezzet alır.',
    bookId: 'mektubat',
    bookTitle: 'Mektubat',
    chapterId: 'ch-34',
    chapterTitle: 'Hakikat Çekirdekleri',
  },
  {
    quote: 'Bütün mevcudat, lisan-ı hâl ile Bismillah der.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-1',
    chapterTitle: 'Birinci Söz',
  },
  {
    quote: 'Her şey kader ile takdir edilmiştir. Kısmetine razı ol ki rahat edesin.',
    bookId: 'mesnevi-i-nuriye',
    bookTitle: 'Mesnevî-i Nuriye',
    chapterId: 'ch-7',
    chapterTitle: 'Hubab',
  },
  {
    quote: 'İnsan bir yolcudur. Sabavet, gençlik, ihtiyarlık, kabir, berzah, haşir, sırat onun menzilleridir.',
    bookId: 'mesnevi-i-nuriye',
    bookTitle: 'Mesnevî-i Nuriye',
    chapterId: 'ch-11',
    chapterTitle: 'Şule',
  },
  {
    quote: 'Acizlik vezaif-i عبودiyetin en mühim bir esasıdır; insanı dergâh-ı İlâhîye bağlar.'.replace('عبودiyetin', 'ubudiyetin'),
    bookId: 'lem-alar',
    bookTitle: "Lem'alar",
    chapterId: 'ch-2',
    chapterTitle: "İkinci Lem'a",
  },
  {
    quote: 'Amelinizde rıza-yı İlâhî olmalı. Eğer O razı olsa, bütün dünya küsse ehemmiyeti yok.',
    bookId: 'lem-alar',
    bookTitle: "Lem'alar",
    chapterId: 'ch-21',
    chapterTitle: "Yirmi Birinci Lem'a",
  },
  {
    quote: 'Karıncayı emirsiz, arıları ya’subsuz bırakmayan kudret-i ezeliye, elbette beşeri de nebîsiz bırakmaz.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-10',
    chapterTitle: 'Onuncu Söz',
  },
  {
    quote: 'Hakiki zevk ve elemsiz lezzet ve kedersiz sevinç ve hayattaki saadet yalnız imandadır.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-13',
    chapterTitle: 'On Üçüncü Söz',
  },
];

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
  const [vecizeIndex, setVecizeIndex] = useState<number>(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    return dayOfYear % DAILY_VECIZELER.length;
  });

  const currentVecize = DAILY_VECIZELER[vecizeIndex] || DAILY_VECIZELER[0];

  const visibleBooks = books
    .filter((b) => b.id !== 'kucuk-kitaplar')
    .sort((a, b) => (BOOK_PRIORITY[a.id] || 99) - (BOOK_PRIORITY[b.id] || 99));

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col min-h-screen">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-2xl mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
          Risale-i Nur Külliyatı
        </h1>
        <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto text-sm sm:text-base mb-6 font-serif">
          Diyanet nüshası esas alınarak hazırlanmış sade, hızlı ve huzurlu okuma programı.
        </p>

        {/* Global Search Trigger Bar */}
        <div className="max-w-xl mx-auto space-y-3">
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
                  {typeof lastRead.progressPercent === 'number' && lastRead.progressPercent > 0 ? (
                    <span className="ml-1.5 font-mono text-[11px] text-amber-800 dark:text-amber-400">
                      (%{lastRead.progressPercent})
                    </span>
                  ) : null}
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                Devam Et →
              </span>
            </button>
          )}

          {/* Günün Vecizesi Kartı */}
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-700/20 dark:border-amber-500/20 bg-[#fbf0d9]/75 dark:bg-stone-900/90 text-left shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 font-serif">
                ✦ Günün Vecizesi
              </span>
              <button
                onClick={() =>
                  setVecizeIndex((prev) => (prev + 1) % DAILY_VECIZELER.length)
                }
                className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-300 transition-colors"
                title="Başka bir vecize göster"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Değiştir</span>
              </button>
            </div>
            <p className="font-serif italic text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed mb-2.5">
              “{currentVecize.quote}”
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="font-serif font-semibold text-amber-900 dark:text-amber-300">
                — {currentVecize.bookTitle} • {currentVecize.chapterTitle}
              </span>
              {onResumeLastRead && (
                <button
                  onClick={() =>
                    onResumeLastRead({
                      bookId: currentVecize.bookId,
                      bookTitle: currentVecize.bookTitle,
                      chapterId: currentVecize.chapterId,
                      chapterTitle: currentVecize.chapterTitle,
                    })
                  }
                  className="font-bold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  Bahse Git →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 content-start">
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

      {/* Ana Sayfa Altı Hâtime / Dua Satırı */}
      <footer className="mt-14 pt-6 border-t border-stone-200/80 dark:border-stone-800/80 text-center">
        <div className="text-amber-700/60 dark:text-amber-400/50 text-xs mb-2 select-none">
          ✦
        </div>
        <p className="font-serif italic text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
          İman ve Kur'ân hizmetine küçük bir vesile olması niyetiyle hazırlanmıştır. Emeği geçenleri hayır duanızda unutmayınız.
        </p>
      </footer>
    </div>
  );
};
