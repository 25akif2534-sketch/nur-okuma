import React from 'react';

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

// "Başka mecmuada neşredilmiştir" notu bulunan kısa bölümler için doğrudan hedef kitap/bölüm yönlendirmeleri
export const CROSS_BOOK_REDIRECTS: Record<
  string,
  { bookId: string; chapterId: string; label: string }
> = {
  'lem-alar/ch-8': {
    bookId: 'sikke-i-tasdik-i-gaybi',
    chapterId: 'ch-6',
    label: 'Sikke-i Tasdik-i Gaybî • Sekizinci Lem’a (Keramet-i Gavsiye)',
  },
  'lem-alar/ch-18': {
    bookId: 'sikke-i-tasdik-i-gaybi',
    chapterId: 'ch-4',
    label: 'Sikke-i Tasdik-i Gaybî • On Sekizinci Lem’a (Keramet-i Aleviye)',
  },
  'lem-alar/ch-27': {
    bookId: 'tarihce-i-hayat',
    chapterId: 'ch-5',
    label: 'Tarihçe-i Hayat • Eskişehir Hayatı (Eskişehir Mahkeme Müdafaası)',
  },
  'lem-alar/ch-31': {
    bookId: 'sualar',
    chapterId: 'ch-1',
    label: 'Şuâlar • Birinci Şuâ (Otuz Birinci Lem’a)',
  },
  'lem-alar/ch-32': {
    bookId: 'sozler',
    chapterId: 'ch-34',
    label: 'Sözler • Lemaat (Otuz İkinci Lem’a)',
  },
  'lem-alar/ch-33': {
    bookId: 'mesnevi-i-nuriye',
    chapterId: 'ch-1',
    label: 'Mesnevî-i Nuriye (Otuz Üçüncü Lem’a)',
  },
  'mektubat/ch-30': {
    bookId: 'i-saratu-l-i-caz',
    chapterId: 'ch-1',
    label: 'İşaratü’l-İ’caz Tefsiri (Otuzuncu Mektup)',
  },
  'mektubat/ch-31': {
    bookId: 'lem-alar',
    chapterId: 'ch-1',
    label: 'Lem’alar • Birinci Lem’a (Otuz Birinci Mektup)',
  },
  'mektubat/ch-32': {
    bookId: 'sozler',
    chapterId: 'ch-34',
    label: 'Sözler • Lemaat (Otuz İkinci Mektup)',
  },
  'mektubat/ch-33': {
    bookId: 'sozler',
    chapterId: 'ch-33',
    label: 'Sözler • Otuz Üçüncü Söz (Otuz Üç Pencereli Risale)',
  },
};

// Ana kitap öncelik sırası
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

let cachedSearchIndex: SearchItem[] | null = null;
let loadingSearchPromise: Promise<SearchItem[]> | null = null;

export function getCachedSearchIndex(): SearchItem[] | null {
  return cachedSearchIndex;
}

export function preloadSearchIndex(): Promise<SearchItem[]> {
  if (cachedSearchIndex) return Promise.resolve(cachedSearchIndex);
  if (loadingSearchPromise) return loadingSearchPromise;

  loadingSearchPromise = fetch('./kulliyat/search-index.json')
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Arama dizini indirilemedi (HTTP ${res.status})`);
      }
      return res.json();
    })
    .then((raw: SearchItem[]) => {
      const cleaned = raw
        .filter((item) => {
          if (item.bookId === 'kucuk-kitaplar') return false;
          if (/fihrist|içindekiler/i.test(item.chapterTitle || '')) return false;
          if (/fihrist|içindekiler/i.test(item.title || '')) return false;
          return true;
        })
        .sort((a, b) => {
          const pa = BOOK_PRIORITY[a.bookId] || 99;
          const pb = BOOK_PRIORITY[b.bookId] || 99;
          return pa - pb;
        });

      cachedSearchIndex = cleaned;
      return cleaned;
    })
    .catch((err) => {
      loadingSearchPromise = null;
      throw err;
    });

  return loadingSearchPromise;
}

export function buildFlexibleRegex(query: string): RegExp | null {
  const cleaned = query
    .trim()
    .toLowerCase()
    .replace(/i\u0307/g, 'i')
    .replace(/[-’’'`´^~.,;:!?()/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length < 2) return null;

  const tokens = cleaned.split(' ').filter((t) => t.length > 0);
  if (tokens.length === 0) return null;

  const charMap: Record<string, string> = {
    a: '[aâàáäãāAÂÀÁÄÃĀ]',
    â: '[aâàáäãāAÂÀÁÄÃĀ]',
    e: '[eêéèëēEÊÉÈËĒ]',
    i: '[iıîíìïīİIÎÍÌÏĪ]',
    ı: '[iıîíìïīİIÎÍÌÏĪ]',
    î: '[iıîíìïīİIÎÍÌÏĪ]',
    u: '[uüûúùūUÜÛÚÙŪ]',
    ü: '[uüûúùūUÜÛÚÙŪ]',
    û: '[uüûúùūUÜÛÚÙŪ]',
    o: '[oöôóòōOÖÔÓÒŌ]',
    ö: '[oöôóòōOÖÔÓÒŌ]',
    s: '[sşŝSŞŜ]',
    ş: '[sşŝSŞŜ]',
    c: '[cçCÇ]',
    ç: '[cçCÇ]',
    g: '[gğGĞ]',
    ğ: '[gğGĞ]',
    t: '[tdṭḍTD]',
    d: '[tdṭḍTD]',
    p: '[pbPB]',
    b: '[pbPB]',
  };

  const escapeRegex = (ch: string) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const intraWordSep = "[-’’'`´^~]*";
  const interTokenSep = "(?:[-’’'`´^~.,;:!?()\\s]|\\r?\\n)+";

  const tokenPatterns = tokens.map((token) =>
    token
      .split('')
      .map((ch) => charMap[ch] || escapeRegex(ch))
      .join(intraWordSep)
  );

  const fullPattern = `(${tokenPatterns.join(interTokenSep)})`;
  try {
    return new RegExp(fullPattern, 'gi');
  } catch {
    return null;
  }
}

export function extractSentenceSnippet(text: string, matchIdx: number, matchLen: number): string {
  let start = matchIdx;
  while (start > 0 && matchIdx - start < 120) {
    const ch = text[start - 1];
    if (ch === '.' || ch === '!' || ch === '?' || ch === '\n') break;
    start--;
  }

  let end = matchIdx + matchLen;
  while (end < text.length && end - (matchIdx + matchLen) < 140) {
    const ch = text[end];
    if (ch === '.' || ch === '!' || ch === '?' || ch === '\n') {
      if (ch !== '\n') end++;
      break;
    }
    end++;
  }

  const raw = text.substring(start, end).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  const prefix = start > 0 && !['.', '!', '?', '\n'].includes(text[start - 1]) ? '... ' : '';
  const suffix = end < text.length && !['.', '!', '?'].includes(text[end - 1]) ? ' ...' : '';
  return `${prefix}${raw}${suffix}`;
}

export function searchKulliyatPassages(
  data: SearchItem[],
  query: string,
  options?: {
    bookFilter?: string;
    excludePassageId?: string;
    excludeTitle?: string;
    maxResults?: number;
  }
): MatchedPassage[] {
  const rx = buildFlexibleRegex(query);
  if (!rx) return [];

  const bookFilter = options?.bookFilter || 'all';
  const maxResults = options?.maxResults || 60;

  const filtered = bookFilter === 'all'
    ? data
    : data.filter((d) => d.bookId === bookFilter);

  const matches: MatchedPassage[] = [];
  const seenSentenceSignatures = new Set<string>();

  for (const item of filtered) {
    if (
      options?.excludePassageId &&
      item.passageId === options.excludePassageId &&
      item.title === options?.excludeTitle
    ) {
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

  if (wordCount >= 1 && wordCount <= 4 && cleaned.length <= 50) {
    addUnique(cleaned);
  }

  const terkipRegex =
    /[a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ'’]+(?:\s*-\s*(?:i|ı|u|ü|yı|yi|yu|yü)|ü'l-|u'l-|i'l-|ü’l-|u’l-|i’l-)\s*[a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ'’]+/gi;
  let m: RegExpExecArray | null;
  while ((m = terkipRegex.exec(cleaned)) !== null) {
    addUnique(m[0]);
  }

  const stopWords = new Set([
    've', 'bir', 'bu', 'ile', 'de', 'da', 'için', 'icin', 'ise', 'her', 'gibi', 'hem', 'dahi',
    'olan', 'olarak', 'olur', 'olup', 'oldu', 'olduğu', 'oldugu', 'olanlar', 'olmak', 'olmaz',
    'göre', 'gore', 'kadar', 'sonra', 'önce', 'once', 'ancak', 'fakat', 'lakin', 'çünkü', 'cunku',
    'eğer', 'eger', 'nasıl', 'nasil', 'öyle', 'oyle', 'böyle', 'boyle', 'şöyle', 'soyle',
    'bütün', 'butun', 'çok', 'cok', 'daha', 'bile', 'yine', 'veya', 'yahut', 'yani',
    'içinde', 'icinde', 'üzere', 'uzere', 'karşı', 'karsi', 'doğru', 'dogru', 'başka', 'baska',
    'kendi', 'sen', 'ben', 'biz', 'siz', 'onlar', 'bunlar', 'şunlar', 'kimse', 'hiçbir',
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
          className="bg-amber-300 text-stone-950 px-1.5 py-0.5 rounded font-bold shadow-2xs"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}
