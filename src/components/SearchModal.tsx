import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, BookOpen, ChevronRight, Loader2, Bookmark } from 'lucide-react';

export interface SearchItem {
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  passageId: string;
  title: string;
  text: string;
}

export interface MatchedPassage {
  item: SearchItem;
  snippet: string;
  matchedPhrase: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (bookId: string, chapterId: string, passageId: string, highlightQuery?: string) => void;
}

// Ana kitap öncelik sırası (Asâ-yı Musa ve Tarihçe-i Hayat gibi derleme eserler sonda taranır ki ilk olarak asıl kaynak olan Sözler/Şualar/Lem'alar/Mektubat gelsin)
const BOOK_PRIORITY: Record<string, number> = {
  sozler: 1,
  mektubat: 2,
  'lem-alar': 3,
  sualar: 4,
  'mesnevi-i-nuriye': 5,
  'i-saratu-l-i-caz': 6,
  muhakemat: 7,
  'barla-lahikasi': 8,
  'kastamonu-lahikasi': 9,
  'emirdag-lahikasi-1': 10,
  'emirdag-lahikasi-2': 11,
  'sikke-i-tasdik-i-gaybi': 12,
  'asa-yi-musa': 13,
  'tarihce-i-hayat': 14,
};

// Arama dizinini bellekte tutarak tekrar yüklemeyi önle; Fihrist ve Küçük Kitaplar gibi mükerrerleri ele
let cachedSearchIndex: SearchItem[] | null = null;
let indexFetchPromise: Promise<SearchItem[]> | null = null;

export function preloadSearchIndex(): Promise<SearchItem[]> {
  if (cachedSearchIndex) return Promise.resolve(cachedSearchIndex);
  if (!indexFetchPromise) {
    indexFetchPromise = fetch('./kulliyat/search-index.json')
      .then((res) => res.json())
      .then((json: SearchItem[]) => {
        // 1. Küçük Kitaplar ve Fihrist bölümlerini ele
        const cleaned = json.filter((item) => {
          if (item.bookId === 'kucuk-kitaplar') return false;
          if (/fihrist/i.test(item.chapterTitle) || /fihrist/i.test(item.title)) return false;
          return true;
        });

        // 2. Ana kitaplara öncelik verecek şekilde sırala
        cleaned.sort((a, b) => {
          const pa = BOOK_PRIORITY[a.bookId] || 99;
          const pb = BOOK_PRIORITY[b.bookId] || 99;
          return pa - pb;
        });

        cachedSearchIndex = cleaned;
        return cleaned;
      })
      .catch((err) => {
        indexFetchPromise = null;
        throw err;
      });
  }
  return indexFetchPromise;
}

/**
 * Kullanıcının tiresiz, kesmesiz, şapkasız, ı/i, ş/s veya t/d, p/b ünsüz yumuşaması farkıyla yazdığı
 * ifadeleri ("daire- i vücut", "medarı şüphe", "ehli iman", "istinat") orijinal
 * Risale imlasıyla ("daire-i vücud", "medâr-ı şüphe", "ehl-i iman", "istinad") eşleştiren esnek Regex üretici
 */
export function buildFlexibleRegex(query: string): RegExp | null {
  const cleaned = query
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .replace(/[-'’‘ʼ.,;:!?"()[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length < 2) return null;

  const charMap: Record<string, string> = {
    a: '[aâāáàAÂĀ]',
    â: '[aâāáàAÂĀ]',
    ā: '[aâāáàAÂĀ]',
    i: '[iıîīİIÎĪ]',
    ı: '[iıîīİIÎĪ]',
    î: '[iıîīİIÎĪ]',
    ī: '[iıîīİIÎĪ]',
    u: '[uüûūUÜÛŪ]',
    ü: '[uüûūUÜÛŪ]',
    û: '[uüûūUÜÛŪ]',
    ū: '[uüûūUÜÛŪ]',
    o: '[oöôOÖÔ]',
    ö: '[oöôOÖÔ]',
    ô: '[oöôOÖÔ]',
    s: '[sşSŞ]',
    ş: '[sşSŞ]',
    c: '[cçCÇ]',
    ç: '[cçCÇ]',
    g: '[gğGĞ]',
    ğ: '[gğGĞ]',
    k: '[kāķqK]',
    t: '[tdṭḍTD]',
    d: '[tdṭḍTD]',
    p: '[pbPB]',
    b: '[pbPB]',
  };

  let pattern = '';
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === ' ') {
      pattern += "[\\s\\-'’‘ʼ]+";
    } else {
      const mapped = charMap[ch] || ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern += mapped;
      if (i < cleaned.length - 1 && cleaned[i + 1] !== ' ') {
        pattern += "[\\s\\-'’‘ʼ\\u0307]?";
      }
    }
  }

  try {
    return new RegExp(`(${pattern})`, 'gi');
  } catch {
    return null;
  }
}

/**
 * Eşleşen kelimenin içinde geçtiği cümleyi başından sonuna kısaca çıkarır
 */
export function extractSentenceSnippet(text: string, matchIdx: number, matchLen: number): string {
  // Cümle başını bul (., !, ?, \n)
  let sentStart = matchIdx;
  while (sentStart > 0 && matchIdx - sentStart < 110) {
    const ch = text[sentStart - 1];
    if (ch === '.' || ch === '!' || ch === '?' || ch === '\n' || ch === '\r') break;
    sentStart--;
  }

  // Cümle sonunu bul
  let sentEnd = matchIdx + matchLen;
  while (sentEnd < text.length && sentEnd - (matchIdx + matchLen) < 120) {
    const ch = text[sentEnd];
    if (ch === '.' || ch === '!' || ch === '?' || ch === '\n' || ch === '\r') {
      if (ch === '.' || ch === '!' || ch === '?') sentEnd++;
      break;
    }
    sentEnd++;
  }

  const raw = text.substring(sentStart, sentEnd).replace(/\s+/g, ' ').trim();
  const prefix = sentStart > 0 && !/[.!?(\n\r]/.test(text[sentStart - 1]) ? '... ' : '';
  const suffix = sentEnd < text.length && !/[.!?]$/.test(raw) ? ' ...' : '';
  return prefix + raw + suffix;
}

/**
 * Külliyat içinde tekrarsız (mükerrer cümleleri eleyerek) arama yapan saf kodlamalı motor
 */
export function searchKulliyatPassages(
  data: SearchItem[],
  query: string,
  options?: {
    bookFilter?: string;
    excludePassageId?: string;
    excludeTitle?: string;
    maxResults?: number;
  }
): { item: SearchItem; snippet: string; matchedPhrase: string }[] {
  const rx = buildFlexibleRegex(query);
  if (!rx) return [];

  const bookFilter = options?.bookFilter || 'all';
  const maxResults = options?.maxResults || 60;

  const filtered = bookFilter === 'all'
    ? data
    : data.filter((d) => d.bookId === bookFilter);

  const matches: { item: SearchItem; snippet: string; matchedPhrase: string }[] = [];
  const seenSentenceSignatures = new Set<string>();

  for (const item of filtered) {
    if (options?.excludePassageId && item.passageId === options.excludePassageId && item.title === options?.excludeTitle) {
      continue;
    }

    rx.lastIndex = 0;
    const textMatch = rx.exec(item.text);
    rx.lastIndex = 0;
    const titleMatch = !textMatch ? rx.exec(item.title) : null;

    if (textMatch || titleMatch) {
      let snippet = '';
      let matchedPhrase = '';

      if (textMatch) {
        const idx = textMatch.index;
        const matchLen = textMatch[0].length;
        matchedPhrase = textMatch[0];
        snippet = extractSentenceSnippet(item.text, idx, matchLen);

        // Mükerrer cümle kontrolü (Örn: Sözler/Şualar'daki cümlenin Asâ-yı Musa'da birebir tekrarı varsa ele)
        const sigStart = Math.max(0, idx - 25);
        const sigEnd = Math.min(item.text.length, idx + matchLen + 25);
        const signature = item.text
          .substring(sigStart, sigEnd)
          .toLowerCase()
          .replace(/[^a-zğüşıöçâîû]/g, '');

        if (signature.length > 15 && seenSentenceSignatures.has(signature)) {
          continue;
        }
        if (signature.length > 15) {
          seenSentenceSignatures.add(signature);
        }
      } else if (titleMatch) {
        matchedPhrase = titleMatch[0];
        snippet = item.text.substring(0, 150).replace(/\r?\n/g, ' ') + '...';
      }

      matches.push({ item, snippet, matchedPhrase });
      if (matches.length >= maxResults) break;
    }
  }

  return matches;
}

/**
 * Seçilen metin parçasından yapay zekâ kullanmadan (%100 saf kodlamayla)
 * Osmanlıca tamlamaları (örn: "daire-i vücud", "medar-ı şüphe") ve anahtar kavramları çıkarır
 */
export function extractConceptsFromText(selectedText: string): string[] {
  const cleaned = selectedText.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const concepts: string[] = [];
  const addUnique = (term: string) => {
    const t = term.replace(/^[,.;:!?'"“”‘’()-]+|[,.;:!?'"“”‘’()-]+$/g, '').trim();
    if (t.length < 3) return;
    const norm = t.toLowerCase();
    if (!concepts.some((c) => c.toLowerCase() === norm)) {
      concepts.push(t);
    }
  };

  const wordCount = cleaned.split(/\s+/).length;

  // 1. Eğer kullanıcı doğrudan 1-4 kelimelik bir kavram/ibare seçtiyse en başa onu koy
  if (wordCount >= 1 && wordCount <= 4 && cleaned.length <= 50) {
    addUnique(cleaned);
  }

  // 2. Metin içindeki Osmanlıca/Farsça terkipleri (örn: daire-i vücud, medar-ı şüphe, Kur'an-ı Hakîm, ehl-i iman) bul
  const terkipRegex = /[a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ'’]+(?:\s*-\s*(?:i|ı|u|ü|yı|yi|yu|yü)|ü'l-|u'l-|i'l-|ü’l-|u’l-|i’l-)\s*[a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ'’]+/gi;
  let m: RegExpExecArray | null;
  while ((m = terkipRegex.exec(cleaned)) !== null) {
    addUnique(m[0]);
  }

  // 3. Yaygın bağlaç/edat/fiilleri eleyerek anlamlı kavram kelimelerini çıkar
  const stopWords = new Set([
    've', 'bir', 'bu', 'ile', 'de', 'da', 'için', 'icin', 'ise', 'her', 'gibi', 'hem', 'dahi',
    'olan', 'olarak', 'olur', 'olup', 'oldu', 'olduğu', 'oldugu', 'olanlar', 'olmak', 'olmaz',
    'göre', 'gore', 'kadar', 'sonra', 'önce', 'once', 'ancak', 'fakat', 'lakin', 'çünkü', 'cunku',
    'eğer', 'eger', 'nasıl', 'nasil', 'öyle', 'oyle', 'böyle', 'boyle', 'şöyle', 'soyle',
    'bütün', 'butun', 'चोक', 'çok', 'cok', 'daha', 'bile', 'yine', 'veya', 'yahut', 'yani',
    'içinde', 'icinde', 'üzere', 'uzere', 'karşı', 'karsi', 'doğru', 'dogru', 'başka', 'baska',
    'kendi', '선', 'sen', 'ben', 'biz', 'siz', 'onlar', 'bunlar', 'şunlar', 'kimse', 'hiçbir',
    'vardır', 'vardir', 'yoktur', 'değil', 'degil', 'eder', 'ediyor', 'etmek', 'ettiği', 'edilir'
  ]);

  const words = cleaned
    .split(/\s+/)
    .map((w) => w.replace(/^[,.;:!?'"“”‘’()-]+|[,.;:!?'"“”‘’()-]+$/g, ''))
    .filter((w) => w.length >= 4 && !stopWords.has(w.toLowerCase()));

  for (const w of words) {
    if (concepts.length >= 7) break;
    addUnique(w);
  }

  return concepts.slice(0, 6);
}

/**
 * Verilen metin içindeki arama eşleşmelerini renkli <mark> etiketiyle vurgular
 */
export function renderHighlightedText(
  text: string,
  query: string,
  withScrollTarget = false
): React.ReactNode {
  if (!query || query.trim().length < 2) return text;
  const rx = buildFlexibleRegex(query);
  if (!rx) return text;

  const parts = text.split(rx);
  if (parts.length === 1) return text;

  let firstMarked = false;
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      const isTarget = withScrollTarget && !firstMarked;
      if (isTarget) firstMarked = true;
      return (
        <mark
          key={idx}
          data-search-highlight={isTarget ? 'true' : undefined}
          className="bg-amber-300/90 dark:bg-amber-500/40 text-stone-950 dark:text-amber-100 px-1 py-0.5 rounded font-semibold shadow-2xs"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchItem[]>(cachedSearchIndex || []);
  const [loading, setLoading] = useState(false);
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('all');

  // Load search index when modal opens
  useEffect(() => {
    if (isOpen && data.length === 0 && !loading) {
      if (cachedSearchIndex) {
        setData(cachedSearchIndex);
        return;
      }
      setLoading(true);
      preloadSearchIndex()
        .then((json) => {
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
                Tire, şapka veya kesme işareti kullanmadan da (örn: "medarı şüphe", "ehli iman") arayabilirsiniz.
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
                  onSelectResult(item.bookId, item.chapterId, item.passageId, query.trim());
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
                  {renderHighlightedText(item.title, query)}
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 font-serif leading-relaxed line-clamp-2">
                  {renderHighlightedText(snippet, query)}
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
