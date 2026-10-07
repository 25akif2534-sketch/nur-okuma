import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, BookOpen, ChevronRight, Loader2, Bookmark, Camera } from 'lucide-react';
import { extractTextFromImage } from '../services/aiService';

export interface SearchItem {
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  passageId: string;
  title: string;
  text: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (bookId: string, chapterId: string, passageId: string) => void;
}

// Türkçe karakter duyarlılığını kaldıran ve küçük harfe çeviren yardımcı
function normalizeSearchText(str: string): string {
  return str
    .toLowerCase()
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('all');
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const extractedText = await extractTextFromImage(base64Data, file.type || 'image/jpeg');
          if (extractedText) {
            // İlk anlamlı 3-4 kelimeyi arama kutusuna yaz
            const firstWords = extractedText.replace(/\r?\n/g, ' ').substring(0, 60).trim();
            setQuery(firstWords);
          }
        } catch (err: any) {
          alert('Fotoğraftaki metin okunamadı: ' + err.message);
        } finally {
          setOcrLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setOcrLoading(false);
    }
  };

  // Load search index when modal opens for the first time
  useEffect(() => {
    if (isOpen && data.length === 0 && !loading) {
      setLoading(true);
      fetch('/kulliyat/search-index.json')
        .then((res) => res.json())
        .then((json: SearchItem[]) => {
          setData(json);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Arama dizini yüklenemedi:', err);
          setLoading(false);
        });
    }
  }, [isOpen, data.length, loading]);

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

  // Real-time pure substring search across 3,075 passages
  const results = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q || q.length < 2) return [];

    const filtered = selectedBookFilter === 'all'
      ? data
      : data.filter((d) => d.bookId === selectedBookFilter);

    const matches: { item: SearchItem; snippet: string }[] = [];

    for (const item of filtered) {
      const normText = normalizeSearchText(item.text);
      const normTitle = normalizeSearchText(item.title);
      const idx = normText.indexOf(q);

      if (idx !== -1 || normTitle.includes(q)) {
        let snippet = '';
        if (idx !== -1) {
          const start = Math.max(0, idx - 60);
          const end = Math.min(item.text.length, idx + q.length + 80);
          snippet = (start > 0 ? '...' : '') + item.text.substring(start, end).replace(/\r?\n/g, ' ') + (end < item.text.length ? '...' : '');
        } else {
          snippet = item.text.substring(0, 140).replace(/\r?\n/g, ' ') + '...';
        }
        matches.push({ item, snippet });
        if (matches.length >= 60) break; // İlk 60 sonucu hızlıca getir
      }
    }

    return matches;
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
            placeholder={ocrLoading ? "Fotoğraftaki metin okunuyor..." : "Külliyat'ta kelime, kavram veya başlık ara... (Örn: Haşir, Ene, Sırr-ı temsil)"}
            disabled={ocrLoading}
            className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 text-base sm:text-lg outline-none font-serif"
          />

          {/* Kamera / Fotoğraf Yükleme Butonu */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrLoading}
            className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-amber-600 transition-colors"
            title="Kitaptan Fotoğraf Çek / Yükle (Metni Tanı ve Külliyat'ta Bul)"
          >
            {ocrLoading ? <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> : <Camera className="w-5 h-5" />}
          </button>

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
            >
              <X className="w-4 h-4" />
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
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
              }`}
            >
              {b.title}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading && (
            <div className="py-16 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <p className="text-sm font-serif">Külliyat arama dizini yükleniyor...</p>
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="py-16 text-center text-stone-400 dark:text-stone-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-serif">Aramak istediğiniz en az 2 harfli bir kelime yazın.</p>
              <p className="text-xs mt-1 opacity-70">
                15 kitap, 3.075 orijinal pasaj içinde harfi harfine taranır.
              </p>
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-16 text-center text-stone-500">
              <p className="text-base font-serif">Sonuç bulunamadı.</p>
              <p className="text-xs mt-1 text-stone-400">
                Farklı bir kelime kökü veya başlık aramayı deneyebilirsiniz.
              </p>
            </div>
          )}

          {!loading &&
            results.map(({ item, snippet }) => (
              <div
                key={`${item.bookId}-${item.chapterId}-${item.passageId}`}
                onClick={() => {
                  onSelectResult(item.bookId, item.chapterId, item.passageId);
                  onClose();
                }}
                className="p-3.5 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-amber-500 dark:hover:border-amber-600 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-400">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{item.bookTitle}</span>
                    <span className="opacity-40">•</span>
                    <span className="text-stone-600 dark:text-stone-400">{item.chapterTitle}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-600 shrink-0" />
                </div>

                <div className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">
                  {item.title}
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 font-serif leading-relaxed line-clamp-2">
                  {snippet}
                </p>
              </div>
            ))}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40 text-[11px] text-stone-400 flex justify-between items-center">
          <span>Toplam 3.075 orijinal pasajda aranır</span>
          <span>Bulunan: {results.length} sonuç</span>
        </div>
      </div>
    </div>
  );
};
