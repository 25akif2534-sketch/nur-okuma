import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, BookOpen, ChevronRight, Loader2, Bookmark } from 'lucide-react';
import {
  preloadSearchIndex,
  getCachedSearchIndex,
  searchKulliyatPassages,
  renderHighlightedText,
  type SearchItem
} from '../utils/searchUtils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (bookId: string, chapterId: string, passageId: string, highlightQuery?: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchItem[]>(() => getCachedSearchIndex() || []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('all');

  const loading = isOpen && data.length === 0 && !errorMsg;

  // Load search index when modal opens
  useEffect(() => {
    if (!isOpen || data.length > 0) return;

    let cancelled = false;
    preloadSearchIndex()
      .then((json) => {
        if (!cancelled) {
          setData(json);
        }
      })
      .catch((err) => {
        console.error('Arama dizini yüklenemedi:', err);
        if (!cancelled) {
          setErrorMsg('Arama dizini yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, data.length]);

  // Keyboard shortcut (Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Unique books list for filter tabs
  const bookList = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((item) => {
      if (!map.has(item.bookId)) {
        map.set(item.bookId, item.bookTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [data]);

  // Real-time flexible & deduplicated search
  const results = useMemo(() => {
    return searchKulliyatPassages(data, query, {
      bookFilter: selectedBookFilter,
      maxResults: 60,
    });
  }, [query, data, selectedBookFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Külliyat'ta kelime, kavram veya başlık ara... (Örn: daire-i vücut, medarı şüphe, haşir)"
            className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 text-base sm:text-lg outline-none font-serif"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-[11px] font-medium text-stone-600 dark:text-stone-300 shrink-0"
            >
              Temizle
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto text-xs bg-stone-50/50 dark:bg-stone-950/20 scrollbar-none">
          <button
            onClick={() => setSelectedBookFilter('all')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
              selectedBookFilter === 'all'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
            }`}
          >
            Tüm Külliyat
          </button>
          {bookList.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBookFilter(b.id)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
                selectedBookFilter === b.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-amber-400'
              }`}
            >
              {b.title}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-stone-500">
              <Loader2 className="w-7 h-7 animate-spin text-amber-600 mb-2.5" />
              <span className="font-serif text-sm">Külliyat arama dizini hazırlanıyor...</span>
            </div>
          )}

          {!loading && errorMsg && (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-red-600 font-serif">{errorMsg}</p>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  preloadSearchIndex()
                    .then((json) => {
                      setData(json);
                    })
                    .catch(() => {
                      setErrorMsg('Arama dizini yine yüklenemedi.');
                    });
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {!loading && !errorMsg && query.trim().length < 2 && (
            <div className="py-14 text-center text-stone-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto opacity-40 text-amber-600" />
              <p className="font-serif text-sm">
                Aramak istediğiniz kelime veya cümleyi yukarıya yazınız (en az 2 harf).
              </p>
              <p className="text-xs opacity-75">
                İmla farkları (örn: <em>daire- i vücut / daire-i vücud</em>, <em>medarı şüphe / medâr-ı şüphe</em>) otomatik eşleştirilir.
              </p>
            </div>
          )}

          {!loading && !errorMsg && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-14 text-center text-stone-500">
              <p className="font-serif text-sm">"{query}" için eşleşen bir pasaj bulunamadı.</p>
            </div>
          )}

          {!loading &&
            !errorMsg &&
            results.map(({ item, snippet }, index) => (
              <button
                key={`${item.bookId}-${item.chapterId}-${item.passageId}-${index}`}
                onClick={() => {
                  onSelectResult(item.bookId, item.chapterId, item.passageId, query.trim());
                  onClose();
                }}
                className="w-full text-left p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 dark:hover:border-amber-500 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all group"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-amber-800 dark:text-amber-300 truncate">
                    <Bookmark className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <p className="text-xs sm:text-sm font-serif text-stone-700 dark:text-stone-300 leading-relaxed line-clamp-3">
                  {renderHighlightedText(snippet, query)}
                </p>
              </button>
            ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 flex items-center justify-between text-[11px] text-stone-500">
          <span>
            {query.trim().length >= 2
              ? `${results.length}${results.length === 60 ? '+' : ''} benzersiz sonuç listeleniyor`
              : 'Külliyat İçi Tam Metin Tarama'}
          </span>
          <span>Kapatmak için ESC</span>
        </div>
      </div>
    </div>
  );
};
