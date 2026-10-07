import { useState, useEffect } from 'react';
import type { BookMeta, ChapterContent, ThemeMode, Passage } from './types';
import { BookList } from './components/BookList';
import { Reader } from './components/Reader';
import { SpeedReaderModal } from './components/SpeedReaderModal';
import { SearchModal } from './components/SearchModal';
import { MutalaaDrawer } from './components/MutalaaDrawer';
import { Loader2 } from 'lucide-react';

export function App() {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<BookMeta | null>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterContent | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('sepia');
  const [fontSize, setFontSize] = useState<number>(19);
  const [speedReaderOpen, setSpeedReaderOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Mütalaa Çekmecesi Durumu
  const [mutalaaState, setMutalaaState] = useState<{
    isOpen: boolean;
    passage: Passage | null;
    snippet?: string;
    tab?: 'sirri-temsil' | 'meclis';
  }>({
    isOpen: false,
    passage: null,
  });

  // Load books index on start
  useEffect(() => {
    fetch('./kulliyat/books-index.json')
      .then((res) => res.json())
      .then((data: BookMeta[]) => {
        setBooks(data);
        if (data.length > 0) {
          // Default selection to Sozler if available
          const sozler = data.find((b) => b.id.includes('sozler')) || data[0];
          setSelectedBook(sozler);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Kulliyat yüklenemedi:', err);
        setLoading(false);
      });
  }, []);

  const handleSelectBook = (book: BookMeta) => {
    if (selectedBook?.id === book.id) {
      // Toggle accordion if clicked again
      setSelectedBook(null);
    } else {
      setSelectedBook(book);
    }
  };

  const handleSelectChapter = async (chapterId: string, targetPassageId?: string) => {
    if (!selectedBook) return;
    setLoadingChapter(true);
    try {
      const res = await fetch(`./kulliyat/${selectedBook.id}/${chapterId}.json`);
      const data: ChapterContent = await res.json();
      setCurrentChapter(data);
      if (targetPassageId) {
        setTimeout(() => {
          const el = document.getElementById(targetPassageId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      console.error('Bahis yüklenemedi:', e);
    } finally {
      setLoadingChapter(false);
    }
  };

  const handleSelectSearchResult = async (bookId: string, chapterId: string, passageId: string) => {
    const targetBook = books.find((b) => b.id === bookId);
    if (!targetBook) return;
    setSelectedBook(targetBook);
    setLoadingChapter(true);
    try {
      const res = await fetch(`./kulliyat/${bookId}/${chapterId}.json`);
      const data: ChapterContent = await res.json();
      setCurrentChapter(data);
      setTimeout(() => {
        const el = document.getElementById(passageId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } catch (e) {
      console.error('Arama sonucu açılamadı:', e);
    } finally {
      setLoadingChapter(false);
    }
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

  if (currentChapter && selectedBook) {
    return (
      <div className={theme === 'dark' || theme === 'night' ? 'dark' : ''}>
        {loadingChapter && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-xs flex items-center justify-center z-50">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        )}
        <Reader
          book={selectedBook}
          chapter={currentChapter}
          theme={theme}
          fontSize={fontSize}
          onBack={() => setCurrentChapter(null)}
          onThemeChange={setTheme}
          onFontSizeChange={(delta) => setFontSize((prev) => Math.max(14, Math.min(32, prev + delta)))}
          onNextChapter={handleNextChapter}
          onPrevChapter={handlePrevChapter}
          onOpenSpeedReader={() => setSpeedReaderOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenMutalaa={(passage, snippet, tab) =>
            setMutalaaState({
              isOpen: true,
              passage,
              snippet,
              tab: tab || 'sirri-temsil',
            })
          }
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
          onSelectResult={handleSelectSearchResult}
        />

        <MutalaaDrawer
          isOpen={mutalaaState.isOpen}
          onClose={() => setMutalaaState((prev) => ({ ...prev, isOpen: false }))}
          passage={mutalaaState.passage}
          selectedTextSnippet={mutalaaState.snippet}
          theme={theme}
          initialTab={mutalaaState.tab}
          onNavigateToPassage={handleSelectSearchResult}
        />
      </div>
    );
  }

  return (
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
        onSelectResult={handleSelectSearchResult}
      />
    </div>
  );
}

export default App;
