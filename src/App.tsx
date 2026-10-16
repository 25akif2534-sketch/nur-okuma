import { useState, useEffect, useRef, useCallback } from 'react';
import type { BookMeta, ChapterContent, ThemeMode, Passage } from './types';
import { BookList } from './components/BookList';
import { Reader } from './components/Reader';
import { SpeedReaderModal } from './components/SpeedReaderModal';
import { SearchModal } from './components/SearchModal';
import { preloadSearchIndex } from './utils/searchUtils';
import { MutalaaDrawer } from './components/MutalaaDrawer';
import { Loader2, AlertCircle, RotateCcw } from 'lucide-react';

export function App() {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookMeta | null>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterContent | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('sepia');
  const [fontSize, setFontSize] = useState<number>(19);
  const [speedReaderOpen, setSpeedReaderOpen] = useState(false);
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

  // Tarayıcı / Telefon "Geri" (Back) tuşuna basıldığında Çapraz İzah listesinden gelindiyse aynı listeyi tekrar aç
  useEffect(() => {
    const handlePopState = () => {
      if (mutalaaState.passage && !mutalaaState.isOpen) {
        setMutalaaState((prev) => ({
          ...prev,
          isOpen: true,
        }));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mutalaaState.passage, mutalaaState.isOpen]);

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
          const sozler = data.find((b) => b.id.includes('sozler')) || data[0];
          setSelectedBook(sozler);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Kulliyat yüklenemedi:', err);
        setErrorMsg('Külliyat listesi yüklenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
        setLoading(false);
      });
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

      // Kullanıcı bir bölüm açtığında veri tasarrufu kapalıysa arama dizinini arka planda hazırla
      const navConn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
      if (!navConn?.saveData) {
        preloadSearchIndex().catch(() => {});
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-800">
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
            <span>Kapat</span>
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
            book={selectedBook}
            chapter={currentChapter}
            theme={theme}
            fontSize={fontSize}
            highlightQuery={highlightQuery}
            targetPassageId={targetPassageId}
            hasActiveMutalaaSession={Boolean(mutalaaState.passage)}
            activeMutalaaConcept={mutalaaState.activeConcept}
            onBack={() => {
              setCurrentChapter(null);
              setHighlightQuery('');
              setTargetPassageId(undefined);
              setMutalaaState({ isOpen: false, passage: null });
            }}
            onThemeChange={setTheme}
            onFontSizeChange={(delta) => setFontSize((prev) => Math.max(14, Math.min(32, prev + delta)))}
            onNextChapter={handleNextChapter}
            onPrevChapter={handlePrevChapter}
            onOpenSpeedReader={() => setSpeedReaderOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenMutalaa={(passage, snippet) =>
              setMutalaaState({
                isOpen: true,
                passage,
                snippet,
                originBook: selectedBook,
                originChapter: currentChapter,
                originScrollY: window.scrollY,
              })
            }
            onReopenMutalaa={() =>
              setMutalaaState((prev) => ({
                ...prev,
                isOpen: true,
              }))
            }
            onNavigateToBookChapter={handleNavigateToBookChapter}
            hasNext={currentChapterIndex < selectedBook.chapters.length - 1}
            hasPrev={currentChapterIndex > 0}
          />

          <SpeedReaderModal
            isOpen={speedReaderOpen}
            onClose={() => setSpeedReaderOpen(false)}
            title={currentChapter.title}
            bookTitle={selectedBook.title}
            content={currentChapter.rawContent}
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
        <div className="min-h-screen bg-stone-50 text-stone-900 transition-colors">
          <BookList
            books={books}
            selectedBook={selectedBook}
            onSelectBook={handleSelectBook}
            onSelectChapter={handleSelectChapter}
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
