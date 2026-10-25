import React, { useState, useEffect } from 'react';
import type { BookMeta } from '../types';
import { BOOK_PRIORITY } from '../utils/searchUtils';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Search,
  BookmarkCheck,
  RefreshCw,
  Download,
  CheckCircle2,
  Smartphone,
  X,
  ListTree
} from 'lucide-react';

export interface LastReadInfo {
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  progressPercent?: number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
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
    quote: 'Acizlik vezaif-i ubudiyetin en mühim bir esasıdır; insanı dergâh-ı İlâhîye bağlar.',
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
  onSelectChapter: (chapterId: string, passageId?: string) => void;
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

  // Hangi bahsin alt başlıklarının (1. Makam, 2. Makam, Hâtime vb.) açık olduğu
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  // Çevrimdışı (İnternetsiz) Tüm Külliyatı İndirme Durumu
  const [offlineReady, setOfflineReady] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nur_offline_ready_v3') === 'true';
    } catch {
      return false;
    }
  });
  const [downloadingOffline, setDownloadingOffline] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState(0);

  // Telefona Uygulama Olarak Kurma (PWA) Rehberi
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallAppClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleDownloadAllForOffline = async () => {
    if (downloadingOffline) return;
    setDownloadingOffline(true);
    setOfflineProgress(1);

    try {
      const cache = await caches.open('nur-okuma-v3');
      const assetUrls: string[] = [];
      document
        .querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
          'script[src], link[rel="stylesheet"][href]'
        )
        .forEach((el) => {
          const rawUrl =
            el instanceof HTMLScriptElement ? el.src : el.href;
          if (rawUrl) assetUrls.push(rawUrl);
        });

      const urlsToCache: string[] = [
        './',
        './index.html',
        './manifest.json',
        './favicon.svg',
        './kulliyat/books-index.json',
        './kulliyat/search-index.json',
        ...assetUrls,
      ];

      for (const b of books) {
        if (b.id === 'kucuk-kitaplar') continue;
        for (const ch of b.chapters) {
          urlsToCache.push(`./kulliyat/${b.id}/${ch.id}.json`);
        }
      }

      let completed = 0;
      const total = urlsToCache.length;
      const batchSize = 8;

      for (let i = 0; i < total; i += batchSize) {
        const batch = urlsToCache.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (url) => {
            try {
              const res = await fetch(url);
              if (res.ok) {
                await cache.put(url, res.clone());
              }
            } catch {
              // ignore individual error
            } finally {
              completed++;
            }
          })
        );
        setOfflineProgress(Math.min(99, Math.round((completed / total) * 100)));
      }

      setOfflineProgress(100);
      setOfflineReady(true);
      try {
        localStorage.setItem('nur_offline_ready_v3', 'true');
      } catch {
        // ignore
      }
    } catch {
      // ignore cache error
    } finally {
      setDownloadingOffline(false);
    }
  };

  const currentVecize = DAILY_VECIZELER[vecizeIndex] || DAILY_VECIZELER[0];

  const visibleBooks = books
    .filter((b) => b.id !== 'kucuk-kitaplar')
    .sort((a, b) => (BOOK_PRIORITY[a.id] || 99) - (BOOK_PRIORITY[b.id] || 99));

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col min-h-screen">
      {/* Telefona Uygulama Olarak Kurma Rehberi Modalı */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fbf0d9] dark:bg-stone-900 border border-amber-700/30 rounded-2xl max-w-md w-full p-5 text-stone-900 dark:text-stone-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-900/15 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2 font-serif font-bold text-base">
                <Smartphone className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span>Telefona Uygulama Olarak Ekle</span>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs sm:text-sm font-serif leading-relaxed">
              <p>
                Mağazaya veya üyeliğe ihtiyaç duymadan programı telefonunuzun ana ekranına gerçek uygulama olarak ekleyebilirsiniz:
              </p>
              <div className="p-3 rounded-xl bg-white/70 dark:bg-stone-800/80 space-y-1.5">
                <div className="font-bold text-amber-900 dark:text-amber-300">
                  iPhone / iPad (Safari):
                </div>
                <p>
                  1. Ekranın altındaki <strong>Paylaş</strong> (yukarı oklu kare) düğmesine dokunun.<br />
                  2. Listede aşağı inip <strong>“Ana Ekrana Ekle”</strong> seçeneğine basın.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/70 dark:bg-stone-800/80 space-y-1.5">
                <div className="font-bold text-amber-900 dark:text-amber-300">
                  Android (Chrome):
                </div>
                <p>
                  1. Sağ üstteki <strong>üç nokta (⋮)</strong> menüsüne dokunun.<br />
                  2. <strong>“Ana ekrana ekle”</strong> veya <strong>“Uygulamayı yükle”</strong> seçeneğine basın.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs sm:text-sm"
            >
              Anlaşıldı
            </button>
          </div>
        </div>
      )}

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

          {/* Uygulama Kurulum ve %100 Çevrimdışı İndirme Düğmeleri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleInstallAppClick}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-amber-600 text-stone-800 dark:text-stone-200 text-xs font-serif font-semibold transition-colors"
            >
              <Smartphone className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>Telefona Uygulama Olarak Ekle</span>
            </button>

            <button
              onClick={handleDownloadAllForOffline}
              disabled={downloadingOffline}
              className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-serif font-semibold transition-colors ${
                offlineReady
                  ? 'border-emerald-600/40 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300'
                  : 'border-amber-600/40 bg-amber-50/80 dark:bg-stone-900 hover:bg-amber-100/80 text-amber-950 dark:text-amber-300'
              }`}
              title="Tüm kitapları ve Çapraz İzah dizinini internetsiz kullanım için cihaza kaydeder"
            >
              {offlineReady ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Çevrimdışı Hazır (Tüm Külliyat İndirildi)</span>
                </>
              ) : downloadingOffline ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-700 dark:text-amber-400 shrink-0" />
                  <span>Cihaza Kaydediliyor... %{offlineProgress}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span>Tüm Külliyatı Cihaza Kaydet (İnternetsiz)</span>
                </>
              )}
            </button>
          </div>

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

          {/* Günün Vecizesi Kartı (Yıldız/Gemini ikonu olmadan sade klasik başlık) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-700/20 dark:border-amber-500/20 bg-[#fbf0d9]/75 dark:bg-stone-900/90 text-left shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 font-serif">
                Günün Vecizesi
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
              onClick={() => {
                setExpandedChapterId(null);
                onSelectBook(book);
              }}
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
                  <div className="max-h-80 overflow-y-auto pr-1 space-y-1.5">
                    {visibleChapters.map((ch, idx) => {
                      const hasSubs = Boolean(ch.subHeadings && ch.subHeadings.length > 0);
                      const isSubOpen = expandedChapterId === ch.id;

                      return (
                        <div key={ch.id} className="space-y-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectChapter(ch.id);
                              }}
                              className="flex-1 min-w-0 text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 bg-white/70 dark:bg-stone-950/60 hover:bg-amber-600 dark:hover:bg-amber-600 hover:text-white flex items-center justify-between group transition-colors shadow-2xs"
                            >
                              <span className="truncate">
                                {idx + 1}. {ch.title}
                              </span>
                              <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                            </button>

                            {hasSubs && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedChapterId((prev) =>
                                    prev === ch.id ? null : ch.id
                                  );
                                }}
                                className={`px-2.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 ${
                                  isSubOpen
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-white/70 dark:bg-stone-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-600 hover:text-white'
                                }`}
                                title="Alt başlıkları (Makam, Nokta, Hâtime vb.) göster"
                              >
                                <ListTree className="w-3.5 h-3.5" />
                                <span className="text-[11px]">{ch.subHeadings?.length}</span>
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform ${
                                    isSubOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Alt Başlıklar Listesi (Örn: 20. Söz -> 1. Makam, 2. Makam, Hâtime vb.) */}
                          {hasSubs && isSubOpen && ch.subHeadings && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="ml-3 pl-2.5 border-l-2 border-amber-600/40 space-y-1 py-1"
                            >
                              {ch.subHeadings.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => onSelectChapter(ch.id, sub.id)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-serif text-stone-800 dark:text-stone-200 bg-white/50 dark:bg-stone-900/80 hover:bg-amber-600 hover:text-white transition-colors flex items-center justify-between"
                                >
                                  <span className="truncate">• {sub.title}</span>
                                  <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ana Sayfa Altı Hâtime / Dua Satırı (Gemini ikonu olmadan sade çizgi ile) */}
      <footer className="mt-14 pt-6 border-t border-stone-200/80 dark:border-stone-800/80 text-center">
        <div className="text-amber-700/50 dark:text-amber-400/40 text-xs mb-2 select-none font-serif tracking-widest">
          — • —
        </div>
        <p className="font-serif italic text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
          İman ve Kur'ân hizmetine küçük bir vesile olması niyetiyle hazırlanmıştır. Emeği geçenleri hayır duanızda unutmayınız.
        </p>
      </footer>
    </div>
  );
};
