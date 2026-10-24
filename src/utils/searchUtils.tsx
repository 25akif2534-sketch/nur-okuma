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
export const BOOK_PRIORITY: Record<string, number> = {
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

export function buildFlexibleRegex(query: string, exactWord = false): RegExp | null {
  const cleaned = query
    .trim()
    .toLowerCase()
    .replace(/i\u0307/g, 'i')
    .replace(/[-’’'`´^~.,;:!?()/\\“”"«»]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length < 2) return null;

  const tokens = cleaned.split(' ').filter((t) => t.length > 0);
  if (tokens.length === 0) return null;

  const baseCharMap: Record<string, string> = {
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
    k: '[kḳqKḲQ]',
    t: '[tṭTṬ]',
    d: '[dḍDḌ]',
    p: '[pP]',
    b: '[bB]',
  };

  // Kelime sonu ünsüz yumuşaması (vücut/vücud, kitap/kitab, fert/ferd) yalnızca kelimenin 3. harfinden itibaren geçerlidir; kelime başında "ters" ile "ders" karışmaz.
  const softConsonantMap: Record<string, string> = {
    t: '[tdṭḍTDṬḌ]',
    d: '[tdṭḍTDṬḌ]',
    p: '[pbPB]',
    b: '[pbPB]',
  };

  const escapeRegex = (ch: string) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const intraWordSep = "[-’’'`´^~]*";
  const interTokenSep = "(?:[-’’'`´^~.,;:!?()“”\"«»\\s]|\\r?\\n)+";
  const wordBoundaryStart = '(?<![a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ])';
  const wordBoundaryEnd = exactWord ? "(?![a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ])" : '';

  const tokenPatterns = tokens.map((token) =>
    token
      .split('')
      .map((ch, idx) => {
        if (idx >= 2 && softConsonantMap[ch]) {
          return softConsonantMap[ch];
        }
        return baseCharMap[ch] || escapeRegex(ch);
      })
      .join(intraWordSep)
  );

  const fullPattern = `${wordBoundaryStart}(${tokenPatterns.join(interTokenSep)})${wordBoundaryEnd}`;
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
    excludeSnippet?: string;
    exactWord?: boolean;
    maxResults?: number;
  }
): MatchedPassage[] {
  const rx = buildFlexibleRegex(query, options?.exactWord);
  if (!rx) return [];

  const bookFilter = options?.bookFilter || 'all';
  const maxResults = options?.maxResults || 100;

  const filtered = bookFilter === 'all'
    ? data
    : data.filter((d) => d.bookId === bookFilter);

  const matches: MatchedPassage[] = [];
  const seenSentenceSignatures = new Set<string>();

  // Seçilen cümlenin bizzat kendisini tekrar göstermemek için imzasını kaydet
  const excludedSig = options?.excludeSnippet
    ? options.excludeSnippet.toLowerCase().replace(/[^a-zğüşıöçâîû]/g, '').slice(0, 60)
    : '';

  for (const item of filtered) {
    const isSamePassage =
      Boolean(options?.excludePassageId) &&
      item.passageId === options?.excludePassageId &&
      item.title === options?.excludeTitle;

    rx.lastIndex = 0;
    let textMatch: RegExpExecArray | null;
    let lastSnippetEnd = -1;
    let foundInText = false;

    while ((textMatch = rx.exec(item.text)) !== null) {
      foundInText = true;
      const idx = textMatch.index;
      const matchLen = textMatch[0].length;
      if (matchLen === 0) {
        rx.lastIndex++;
        continue;
      }

      // Aynı cümlenin içindeki ikinci kelime eşleşmesini mükerrer kart yapma
      if (idx < lastSnippetEnd) {
        continue;
      }

      const matchedPhrase = textMatch[0];
      const snippet = extractSentenceSnippet(item.text, idx, matchLen);
      lastSnippetEnd = idx + matchLen + 60;

      const sigStart = Math.max(0, idx - 25);
      const sigEnd = Math.min(item.text.length, idx + matchLen + 25);
      const signature = item.text
        .substring(sigStart, sigEnd)
        .toLowerCase()
        .replace(/[^a-zğüşıöçâîû]/g, '');

      // Aynı pasajda bizzat seçilen cümlenin kendisiyse atla, ama aynı pasajdaki diğer cümleleri göster
      if (isSamePassage) {
        const snippetNorm = snippet.toLowerCase().replace(/[^a-zğüşıöçâîû]/g, '');
        if (!excludedSig || snippetNorm.includes(excludedSig) || excludedSig.includes(signature)) {
          continue;
        }
      }

      if (signature.length > 15 && seenSentenceSignatures.has(signature)) {
        continue;
      }
      if (signature.length > 15) {
        seenSentenceSignatures.add(signature);
      }

      matches.push({ item, snippet, matchedPhrase });
      if (matches.length >= maxResults) return matches;
    }

    if (!foundInText && !isSamePassage) {
      rx.lastIndex = 0;
      const titleMatch = rx.exec(item.title);
      if (titleMatch) {
        matches.push({
          item,
          snippet: item.text.substring(0, 150).replace(/\r?\n/g, ' ') + '...',
          matchedPhrase: titleMatch[0],
        });
        if (matches.length >= maxResults) return matches;
      }
    }
  }

  return matches;
}

export function extractConceptsFromText(
  selectedText: string,
  hasExplicitSelection = true
): string[] {
  const cleaned = selectedText
    .replace(/\*\*\*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return [];

  const concepts: string[] = [];
  const addUnique = (term: string) => {
    const t = term.replace(/^[,.;:!?'"“”‘’()[\]-]+|[,.;:!?'"“”‘’()[\]-]+$/g, '').trim();
    if (t.length < 2) return;
    const norm = t.toLowerCase();
    if (!concepts.some((c) => c.toLowerCase() === norm)) {
      concepts.push(t);
    }
  };

  const wordCount = cleaned.split(/\s+/).length;

  // 1) Kullanıcı bizzat bir kelime, terkip veya cümle seçtiyse (12 kelimeye / 160 karaktere kadar) seçilen ibarenin TAMAMINI ilk sıraya koy
  if (hasExplicitSelection && wordCount >= 1 && wordCount <= 14 && cleaned.length <= 180) {
    addUnique(cleaned);
  }

  // 2) Metin içindeki Osmanlıca izafet terkiplerini (örn: daire-i vücut, mahkeme-i kübra, Kur'an-ı Hakîm) çıkar
  const terkipRegex =
    /[a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ'’]{2,}(?:\s*-\s*(?:i|ı|u|ü|yı|yi|yu|yü)|ü'l-|u'l-|i'l-|ü’l-|u’l-|i’l-)\s*[a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ'’]{2,}/gi;
  let m: RegExpExecArray | null;
  while ((m = terkipRegex.exec(cleaned)) !== null) {
    addUnique(m[0]);
    if (!hasExplicitSelection && concepts.length >= 8) break;
  }

  // Eğer kullanıcı hiçbir metin seçmeden üstteki "Çapraz İzah" düğmesine bastıysa, rastgele kelimeler uydurma; yalnızca gerçek terkipleri öner
  if (!hasExplicitSelection) {
    return concepts.slice(0, 8);
  }

  // 3) Seçilen cümlenin içindeki anlamlı kelimeleri de alt seçenek olarak ekle
  const stopWords = new Set([
    've', 'bir', 'bu', 'şu', 'o', 'ile', 'de', 'da', 'ki', 'mi', 'mı', 'mu', 'mü',
    'için', 'icin', 'ise', 'her', 'gibi', 'hem', 'dahi', 'kadar', 'sonra', 'önce', 'once',
    'olan', 'olarak', 'olur', 'olup', 'oldu', 'olduğu', 'oldugu', 'olanlar', 'olmak', 'olmaz', 'olsa', 'olsun',
    'göre', 'gore', 'ancak', 'fakat', 'lakin', 'çünkü', 'cunku', 'zira', 'belki', 'hatta', 'hattâ',
    'eğer', 'eger', 'nasıl', 'nasil', 'öyle', 'oyle', 'böyle', 'boyle', 'şöyle', 'soyle',
    'bütün', 'butun', 'çok', 'cok', 'daha', 'bile', 'yine', 'veya', 'yahut', 'yani', 'mesela',
    'içinde', 'icinde', 'üzere', 'uzere', 'karşı', 'karsi', 'doğru', 'dogru', 'başka', 'baska',
    'kendi', 'sen', 'ben', 'biz', 'siz', 'onlar', 'bunlar', 'şunlar', 'kimse', 'hiçbir', 'hiç',
    'vardır', 'vardir', 'yoktur', 'değil', 'degil', 'eder', 'ediyor', 'etmek', 'ettiği', 'edilir',
    'dedi', 'diyor', 'dedim', 'dediler', 'demek', 'evet', 'hayır', 'zaman', 'vakit', 'tarzda',
    'birisi', 'diğer', 'diger', 'arkadaşı', 'beraber', 'bak', 'gel', 'işte', 'iste'
  ]);

  const words = cleaned
    .split(/\s+/)
    .map((w) => w.replace(/^[,.;:!?'"“”‘’()[\]-]+|[,.;:!?'"“”‘’()[\]-]+$/g, ''))
    .filter((w) => w.length >= 4 && !stopWords.has(w.toLowerCase()));

  for (const w of words) {
    if (concepts.length >= 8) break;
    addUnique(w);
  }

  return concepts.slice(0, 8);
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
