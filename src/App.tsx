import { useState, useEffect, useRef, useCallback } from 'react';
import type { BookMeta, ChapterContent, ThemeMode, Passage, TrackedBookInfo } from './types';
import { BookList, type LastReadInfo } from './components/BookList';
import { Reader } from './components/Reader';
import { SpeedReaderModal } from './components/SpeedReaderModal';
import { SearchModal } from './components/SearchModal';
import { MutalaaDrawer } from './components/MutalaaDrawer';
import { Loader2, AlertCircle, RotateCcw } from 'lucide-react';

export function App() {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookMeta | null>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterContent | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('nur_theme') as ThemeMode | null;
      if (saved === 'light' || saved === 'sepia' || saved === 'dark' || saved === 'night') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'sepia';
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('nur_font_size'));
      if (!Number.isNaN(saved) && saved >= 14 && saved <= 32) {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 19;
  });

  const [lastRead, setLastRead] = useState<LastReadInfo | null>(() => {
    try {
      const raw = localStorage.getItem('nur_last_read');
      if (raw) {
        const parsed = JSON.parse(raw) as LastReadInfo;
        if (parsed?.bookId && parsed?.chapterId) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return null;
  });

  // Esas Okuma / Hatim Takibi (Takip Edilen Kitap)
  const [trackedBook, setTrackedBook] = useState<TrackedBookInfo | null>(() => {
    try {
      const raw = localStorage.getItem('nur_tracked_book');
      if (raw) {
        const parsed = JSON.parse(raw) as TrackedBookInfo;
        if (parsed?.bookId && parsed?.chapterId) return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const handleSetTrackedBook = (info: TrackedBookInfo) => {
    setTrackedBook(info);
    try {
      localStorage.setItem('nur_tracked_book', JSON.stringify(info));
    } catch {
      // ignore
    }
  };

  const [speedReaderOpen, setSpeedReaderOpen] = useState(false);
  const [speedReaderInitialText, setSpeedReaderInitialText] = useState<string | undefined>(undefined);
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightQuery, setHighlightQuery] = useState<string>('');
  const [targetPassageId, setTargetPassageId] = useState<string | undefined>(undefined);

  // Hızlı bölüm geçişlerinde önceki isteği iptal etmek için AbortController
  const chapterAbortRef = useRef<AbortController | null>(null);

  // Çapraz İzah Çekmecesi ve Geri Dönüş Hafızası
  const [mutalaaState, setMutalaaState] = useState<{
    isOpen: boolean;
    passage: Passage | null;
    snippet?: string;
    activeConcept?: string;
    originBook?: BookMeta | null;
    originChapter?: ChapterContent | null;
    originScrollY?: number;
  }>({
    isOpen: false,
    passage: null,
  });

  useEffect(() => {
    try {
      localStorage.setItem('nur_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('nur_font_size', String(fontSize));
    } catch {
      // ignore
    }
  }, [fontSize]);

  // Tarayıcı / Telefon "Geri" (Back) tuşuna basıldığında: Çapraz İzah açıksa kapat, değilse URL hash durumuna göre dön
  useEffect(() => {
    const handlePopState = () => {
      // Eğer Çapraz İzah çekmecesi açıksa sadece çekmeceyi kapat ve sayfada kal
      if (mutalaaState.isOpen) {
        setMutalaaState((prev) => ({
          ...prev,
          isOpen: false,
        }));
        return;
      }

      if (mutalaaState.passage && !mutalaaState.isOpen) {
        setMutalaaState((prev) => ({
          ...prev,
          isOpen: true,
        }));
        return;
      }

      const rawHash = window.location.hash.replace(/^#/, '');
      if (!rawHash) {
        setCurrentChapter(null);
        setHighlightQuery('');
        setTargetPassageId(undefined);
        return;
      }

      const [bookId, chapterId] = rawHash.split('/');
      if (bookId && chapterId && books.length > 0) {
        const targetBook = books.find((b) => b.id === bookId);
        if (targetBook && (currentChapter?.id !== chapterId || selectedBook?.id !== bookId)) {
          void fetchChapterContent(targetBook, chapterId, { skipHistoryPush: true });
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutalaaState.passage, mutalaaState.isOpen, books, currentChapter?.id, selectedBook?.id]);

  const loadBooksIndex = useCallback(() => {
    fetch('./kulliyat/books-index.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Kitap listesi alınamadı (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((data: BookMeta[]) => {
        setBooks(data);
        setErrorMsg(null);
        if (data.length > 0) {
          const rawHash = window.location.hash.replace(/^#/, '');
          const [hashBookId, hashChapterId] = rawHash.split('/');
          const hashBook = hashBookId ? data.find((b) => b.id === hashBookId) : undefined;
          if (hashBook && hashChapterId) {
            setSelectedBook(hashBook);
            void fetchChapterContent(hashBook, hashChapterId, { skipHistoryPush: true });
          } else {
            const sozler = data.find((b) => b.id.includes('sozler')) || data[0];
            setSelectedBook(sozler);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Kulliyat yüklenemedi:', err);
        setErrorMsg('Külliyat listesi yüklenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBooksIndex();
  }, [loadBooksIndex]);

  const handleSelectBook = (book: BookMeta) => {
    if (selectedBook?.id === book.id) {
      setSelectedBook(null);
    } else {
      setSelectedBook(book);
    }
  };

  const fetchChapterContent = async (
    book: BookMeta,
    chapterId: string,
    options?: {
      passageId?: string;
      searchQuery?: string;
      keepMutalaa?: boolean;
      skipHistoryPush?: boolean;
    }
  ) => {
    if (chapterAbortRef.current) {
      chapterAbortRef.current.abort();
    }
    const controller = new AbortController();
    chapterAbortRef.current = controller;

    setSelectedBook(book);
    setLoadingChapter(true);
    setErrorMsg(null);
    setHighlightQuery(options?.searchQuery || '');
    setTargetPassageId(options?.passageId);
    if (!options?.keepMutalaa) {
      setMutalaaState({ isOpen: false, passage: null });
    }

    try {
      const res = await fetch(`./kulliyat/${book.id}/${chapterId}.json`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Bölüm yüklenemedi (HTTP ${res.status})`);
      }
      const data: ChapterContent = await res.json();
      if (controller.signal.aborted) return;

      setCurrentChapter(data);

      // Son okunan yeri kaydet ve URL hash güncelle
      let savedPct = 0;
      try {
        const rawPct = Number(localStorage.getItem(`nur_scroll_${book.id}_${data.id}`));
        if (!Number.isNaN(rawPct) && rawPct > 0) savedPct = rawPct;
      } catch {
        // ignore
      }
      const info: LastReadInfo = {
        bookId: book.id,
        bookTitle: book.title,
        chapterId: data.id,
        chapterTitle: data.title,
        progressPercent: savedPct,
      };
      setLastRead(info);
      try {
        localStorage.setItem('nur_last_read', JSON.stringify(info));
      } catch {
        // ignore storage errors
      }

      // Takip edilen kitap henüz yoksa veya açılan kitap takip edilen kitapsa güncelle
      setTrackedBook((prev) => {
        const chapterIdx = book.chapters.findIndex((c) => c.id === data.id);
        const total = book.chapters.length;
        if (!prev) {
          const newTracked: TrackedBookInfo = {
            bookId: book.id,
            bookTitle: book.title,
            chapterId: data.id,
            chapterTitle: data.title,
            chapterIndex: chapterIdx >= 0 ? chapterIdx + 1 : 1,
            totalChapters: total,
            progressPercent: savedPct,
          };
          try {
            localStorage.setItem('nur_tracked_book', JSON.stringify(newTracked));
          } catch {
            // ignore
          }
          return newTracked;
        }
        if (prev.bookId === book.id) {
          const updated: TrackedBookInfo = {
            ...prev,
            chapterId: data.id,
            chapterTitle: data.title,
            chapterIndex: chapterIdx >= 0 ? chapterIdx + 1 : prev.chapterIndex,
            progressPercent: savedPct,
          };
          try {
            localStorage.setItem('nur_tracked_book', JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        }
        return prev;
      });

      if (!options?.skipHistoryPush) {
        try {
          const targetHash = `#${book.id}/${data.id}`;
          if (window.location.hash !== targetHash) {
            window.history.pushState({ bookId: book.id, chapterId: data.id }, '', targetHash);
          }
        } catch {
          // ignore history errors
        }
      }

      if (options?.passageId) {
        const pid = options.passageId;
        setTimeout(() => {
          const passageEl = document.getElementById(pid);
          const markEl = passageEl?.querySelector('[data-search-highlight="true"]') as HTMLElement | null;
          if (markEl) {
            markEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (passageEl) {
            passageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 200);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return;
      }
      console.error('Bahis yüklenemedi:', e);
      setErrorMsg('Seçilen bahis yüklenirken bir bağlantı hatası oluştu. Lütfen tekrar deneyin.');
    } finally {
      if (chapterAbortRef.current === controller) {
        setLoadingChapter(false);
      }
    }
  };

  const handleSelectChapter = async (chapterId: string, passageId?: string) => {
    if (!selectedBook) return;
    await fetchChapterContent(selectedBook, chapterId, { passageId });
  };

  const handleNavigateToBookChapter = async (bookId: string, chapterId: string) => {
    const targetBook = books.find((b) => b.id === bookId);
    if (!targetBook) return;
    await fetchChapterContent(targetBook, chapterId);
  };

  const handleSelectSearchResult = async (
    bookId: string,
    chapterId: string,
    passageId: string,
    searchQuery?: string,
    keepMutalaa = false
  ) => {
    const targetBook = books.find((b) => b.id === bookId);
    if (!targetBook) return;
    await fetchChapterContent(targetBook, chapterId, {
      passageId,
      searchQuery,
      keepMutalaa,
    });
  };

  // Çapraz İzah listesinden bir sonuca tıklandığında hem o cümleye git hem de geri dönüş için geçmişe kaydet
  const handleNavigateFromMutalaa = async (
    bookId: string,
    chapterId: string,
    passageId: string,
    searchQuery?: string
  ) => {
    try {
      window.history.pushState({ fromMutalaa: true }, '');
    } catch {
      // ignore history errors
    }
    await handleSelectSearchResult(bookId, chapterId, passageId, searchQuery, true);
  };

  const handleNextChapter = () => {
    if (!selectedBook || !currentChapter) return;
    const currentIndex = selectedBook.chapters.findIndex((c) => c.id === currentChapter.id);
    if (currentIndex >= 0 && currentIndex < selectedBook.chapters.length - 1) {
      handleSelectChapter(selectedBook.chapters[currentIndex + 1].id);
    }
  };

  const handlePrevChapter = () => {
    if (!selectedBook || !currentChapter) return;
    const currentIndex = selectedBook.chapters.findIndex((c) => c.id === currentChapter.id);
    if (currentIndex > 0) {
      handleSelectChapter(selectedBook.chapters[currentIndex - 1].id);
    }
  };

  const currentChapterIndex = selectedBook && currentChapter
    ? selectedBook.chapters.findIndex((c) => c.id === currentChapter.id)
    : -1;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-200">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-3" />
        <p className="font-serif text-lg">Külliyat yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={theme === 'dark' || theme === 'night' ? 'dark' : ''}>
      {/* Bağlantı veya Yükleme Hatası Bildirimi */}
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92vw] p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-serif">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => {
              setErrorMsg(null);
              if (books.length === 0) {
                loadBooksIndex();
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{books.length === 0 ? 'Tekrar Dene' : 'Kapat'}</span>
          </button>
        </div>
      )}

      {loadingChapter && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-xs flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      )}

      {currentChapter && selectedBook ? (
        <>
          <Reader
            key={`${selectedBook.id}-${currentChapter.id}`}
            book={selectedBook}
            chapter={currentChapter}
            theme={theme}
            fontSize={fontSize}
            highlightQuery={highlightQuery}
            targetPassageId={targetPassageId}
            hasActiveMutalaaSession={Boolean(mutalaaState.passage)}
            activeMutalaaConcept={mutalaaState.activeConcept}
            originBookTitle={
              mutalaaState.originBook &&
              mutalaaState.originChapter &&
              (mutalaaState.originBook.id !== selectedBook.id || mutalaaState.originChapter.id !== currentChapter.id)
                ? mutalaaState.originBook.title
                : undefined
            }
            originChapterTitle={
              mutalaaState.originBook &&
              mutalaaState.originChapter &&
              (mutalaaState.originBook.id !== selectedBook.id || mutalaaState.originChapter.id !== currentChapter.id)
                ? mutalaaState.originChapter.title
                : undefined
            }
            onReturnToOrigin={() => {
              if (mutalaaState.originBook && mutalaaState.originChapter) {
                const origBook = mutalaaState.originBook;
                const origChapterId = mutalaaState.originChapter.id;
                const origScroll = mutalaaState.originScrollY || 0;
                void fetchChapterContent(origBook, origChapterId, { keepMutalaa: true }).then(() => {
                  setTimeout(() => {
                    window.scrollTo({ top: origScroll, behavior: 'smooth' });
                  }, 120);
                });
              }
            }}
            onBack={() => {
              setCurrentChapter(null);
              setHighlightQuery('');
              setTargetPassageId(undefined);
              setMutalaaState({ isOpen: false, passage: null });
              try {
                if (window.location.hash) {
                  window.history.pushState(null, '', window.location.pathname + window.location.search);
                }
              } catch {
                // ignore history errors
              }
            }}
            onThemeChange={setTheme}
            onFontSizeChange={(delta) => setFontSize((prev) => Math.max(14, Math.min(32, prev + delta)))}
            onNextChapter={handleNextChapter}
            onPrevChapter={handlePrevChapter}
            onOpenSpeedReader={(startText) => {
              setSpeedReaderInitialText(startText);
              setSpeedReaderOpen(true);
            }}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenMutalaa={(passage, snippet) => {
              try {
                window.history.pushState({ mutalaaDrawerOpen: true }, '');
              } catch {
                // ignore
              }
              setMutalaaState({
                isOpen: true,
                passage,
                snippet,
                originBook: selectedBook,
                originChapter: currentChapter,
                originScrollY: window.scrollY,
              });
            }}
            onReopenMutalaa={() => {
              try {
                window.history.pushState({ mutalaaDrawerOpen: true }, '');
              } catch {
                // ignore
              }
              setMutalaaState((prev) => ({
                ...prev,
                isOpen: true,
              }));
            }}
            onNavigateToBookChapter={handleNavigateToBookChapter}
            onProgressChange={(pct) => {
              setLastRead((prev) => {
                if (!prev || prev.progressPercent === pct) return prev;
                const updated = { ...prev, progressPercent: pct };
                try {
                  localStorage.setItem('nur_last_read', JSON.stringify(updated));
                } catch {
                  // ignore
                }
                return updated;
              });
            }}
            hasNext={currentChapterIndex < selectedBook.chapters.length - 1}
            hasPrev={currentChapterIndex > 0}
          />

          <SpeedReaderModal
            key={`${selectedBook.id}-${currentChapter.id}-${speedReaderInitialText || ''}`}
            isOpen={speedReaderOpen}
            onClose={() => {
              setSpeedReaderOpen(false);
              setSpeedReaderInitialText(undefined);
            }}
            title={currentChapter.title}
            bookTitle={selectedBook.title}
            content={
              currentChapter.rawContent ||
              currentChapter.passages.map((p) => p.text).join('\n\n')
            }
            initialTextSnippet={speedReaderInitialText}
            theme={theme}
          />

          <SearchModal
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelectResult={(bId, cId, pId, q) => handleSelectSearchResult(bId, cId, pId, q, false)}
          />

          <MutalaaDrawer
            isOpen={mutalaaState.isOpen}
            onClose={() => setMutalaaState((prev) => ({ ...prev, isOpen: false }))}
            passage={mutalaaState.passage}
            selectedTextSnippet={mutalaaState.snippet}
            theme={theme}
            currentBookId={selectedBook.id}
            currentChapterId={currentChapter.id}
            currentPassageId={targetPassageId}
            originBookTitle={mutalaaState.originBook?.title}
            originChapterTitle={mutalaaState.originChapter?.title}
            onReturnToOrigin={() => {
              if (mutalaaState.originBook && mutalaaState.originChapter) {
                const origBook = mutalaaState.originBook;
                const origChapterId = mutalaaState.originChapter.id;
                const origScroll = mutalaaState.originScrollY || 0;
                void fetchChapterContent(origBook, origChapterId, { keepMutalaa: true }).then(() => {
                  setTimeout(() => {
                    window.scrollTo({ top: origScroll, behavior: 'smooth' });
                  }, 120);
                });
              }
            }}
            currentChapterFirstPassage={
              currentChapter.passages && currentChapter.passages.length > 0
                ? currentChapter.passages[0]
                : {
                    id: 'p-1',
                    title: `${selectedBook.title} • ${currentChapter.title}`,
                    shortTitle: currentChapter.title,
                    text: currentChapter.rawContent || '',
                  }
            }
            onSwitchPassage={(newPassage) =>
              setMutalaaState({
                isOpen: true,
                passage: newPassage,
                snippet: undefined,
                originBook: selectedBook,
                originChapter: currentChapter,
                originScrollY: window.scrollY,
              })
            }
            onActiveConceptChange={(concept) =>
              setMutalaaState((prev) =>
                prev.activeConcept === concept ? prev : { ...prev, activeConcept: concept }
              )
            }
            onNavigateToPassage={handleNavigateFromMutalaa}
          />
        </>
      ) : (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
          <BookList
            books={books}
            selectedBook={selectedBook}
            lastRead={lastRead}
            trackedBook={trackedBook}
            onSelectBook={handleSelectBook}
            onSelectChapter={handleSelectChapter}
            onResumeLastRead={(info) => handleNavigateToBookChapter(info.bookId, info.chapterId)}
            onSetTrackedBook={handleSetTrackedBook}
            onOpenSearch={() => setSearchOpen(true)}
          />

          <SearchModal
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSelectResult={(bId, cId, pId, q) => handleSelectSearchResult(bId, cId, pId, q, false)}
          />
        </div>
      )}
    </div>
  );
}

export default App;
