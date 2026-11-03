export interface RawVerseEntry {
  s: number;
  v: number;
  ar: string;
  tr: string;
}

export interface RawMealData {
  surahs: Record<string, string>;
  verses: RawVerseEntry[];
}

interface IndexedVerse extends RawVerseEntry {
  surahName: string;
  na: string;
  sk: string;
}

export interface MatchedVerseItem {
  surahNo: number;
  surahName: string;
  verseNo: number;
  risaleSnippet: string;
  fullArabic: string;
  arabicParts: {
    before: string;
    matched: string;
    after: string;
    isPartial: boolean;
  };
  meal: string;
}

let indexedVerses: IndexedVerse[] | null = null;
let loadingPromise: Promise<IndexedVerse[]> | null = null;
const matchCache = new Map<string, MatchedVerseItem[]>();

export function toSkel(text: string): string {
  return text
    .replace(/\u0640/g, '')
    .replace(/\u06E8/g, 'ن')
    .replace(/[ةۀۃ]/g, 'ه')
    .replace(/[کگڪ]/g, 'ك')
    .replace(/[^بتثجحخدذرزسشصضطظعغفقكلمنه]/g, '');
}

export function toNoAlif(text: string): string {
  return text
    .replace(/\u0640/g, '')
    .replace(/\u06E8/g, 'ن')
    .replace(/[\u06E7\u06E6]/g, 'ي')
    .replace(/\u06E5/g, 'و')
    .replace(/و[\u064B-\u065F]*\u0670(?=[ةه])/g, '')
    .replace(/ى[\u064B-\u065F]*\u0670(?=[ابتثجحخدذرزسشصضطظعغفقكلمنهوي])/g, '')
    .replace(/[ىيئېۍ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[ةۀۃ]/g, 'ه')
    .replace(/[کگڪ]/g, 'ك')
    .replace(/[^بتثجحخدذرزسشصضطظعغفقكلمنهوي]/g, '')
    .replace(/ي+/g, 'ي')
    .replace(/و+/g, 'و');
}

function toNormWithAlif(text: string): string {
  return text
    .replace(/\u0640/g, '')
    .replace(/\u0670/g, 'ا')
    .replace(/[أإآٱٲٳٵ]/g, 'ا')
    .replace(/[ىيئېۍ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[ةۀۃ]/g, 'ه')
    .replace(/[کگڪ]/g, 'ك')
    .replace(/[^ابتثجحخدذرزسشصضطظعغفقكلمنهوي]/g, '')
    .replace(/ا+/g, 'ا')
    .replace(/ي+/g, 'ي')
    .replace(/و+/g, 'و');
}

// Ayet olmayan yaygın dua, hadis başı/sonu ve serlevha ibareleri
const NON_VERSE_EXACT = new Set<string>([
  toNoAlif('او كما قال'),
  toNoAlif('وكما قال'),
  toNoAlif('باسمه سبحانه'),
  toNoAlif('وبه نستعين'),
  toNoAlif('رضي الله عنه'),
  toNoAlif('رضي الله عنهم'),
  toNoAlif('رضي الله عنها'),
  toNoAlif('عليه السلام'),
  toNoAlif('عليهم السلام'),
  toNoAlif('عليه الصلاة والسلام'),
  toNoAlif('صلى الله عليه وسلم'),
  toNoAlif('جل جلاله'),
  toNoAlif('عز وجل'),
  toNoAlif('سبحانه وتعالى'),
  toNoAlif('رحمه الله'),
  toNoAlif('رحمة الله عليه'),
  toNoAlif('قدس سره'),
  toNoAlif('لا اله الا هو'),
  toNoAlif('لا اله الا الله'),
  toNoAlif('ما شاء الله'),
  toNoAlif('ان شاء الله'),
  toNoAlif('بارك الله'),
  toNoAlif('الحمد لله'),
  toNoAlif('سبحان الله'),
  toNoAlif('الله اكبر'),
  toNoAlif('استغفر الله'),
]);

// Hurûf-u Mukattaa ayetleri
const MUKATTAA_MAP: Record<string, { s: number; v: number }> = {
  الم: { s: 2, v: 1 },
  المص: { s: 7, v: 1 },
  الر: { s: 10, v: 1 },
  المر: { s: 13, v: 1 },
  كهيعص: { s: 19, v: 1 },
  طه: { s: 20, v: 1 },
  طسم: { s: 26, v: 1 },
  طس: { s: 27, v: 1 },
  يس: { s: 36, v: 1 },
  ص: { s: 38, v: 1 },
  حم: { s: 40, v: 1 },
  عسق: { s: 42, v: 2 },
  ق: { s: 50, v: 1 },
  ن: { s: 68, v: 1 },
};

export function isMealLoaded(): boolean {
  return indexedVerses !== null && indexedVerses.length > 0;
}

export async function loadMealDatabase(): Promise<IndexedVerse[]> {
  if (indexedVerses) return indexedVerses;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
      const res = await fetch(`${cleanBase}elmalili_meal.json?v=2`);
      if (!res.ok) {
        throw new Error(`Meal veritabanı yüklenemedi: HTTP ${res.status}`);
      }
      const data: RawMealData = await res.json();
      const list: IndexedVerse[] = data.verses.map((v) => ({
        ...v,
        surahName: data.surahs[String(v.s)] || `${v.s}. Sure`,
        na: toNoAlif(v.ar),
        sk: toSkel(v.ar),
      }));
      indexedVerses = list;
      matchCache.clear();
      return list;
    } catch (err) {
      console.error('Meal veritabanı yüklenirken hata:', err);
      loadingPromise = null;
      return [];
    }
  })();

  return loadingPromise;
}

function findSingleVerse(
  verses: IndexedVerse[],
  textStr: string,
  minNoAlif = 6,
  minSkel = 4
): IndexedVerse | null {
  const trimmed = textStr.trim();
  if (!trimmed) return null;

  // Hurûf-u Mukattaa kontrolü (üzerinde med işareti ٓ veya ٰ varsa ya da mukattaa satırıysa)
  const normAlif = toNormWithAlif(trimmed);
  if (MUKATTAA_MAP[normAlif] && (/[\u0653\u0670]/.test(trimmed) || normAlif.length >= 2)) {
    const target = MUKATTAA_MAP[normAlif];
    const found = verses.find((v) => v.s === target.s && v.v === target.v);
    if (found) return found;
  }

  const na = toNoAlif(trimmed);
  const sk = toSkel(trimmed);
  if (na.length < minNoAlif || sk.length < minSkel || NON_VERSE_EXACT.has(na)) {
    return null;
  }

  // Dua başlangıçlarını ("Allâhümme yâ...") tekil ayet aramasında ele
  if ( normAlif.startsWith('اللهميا') || normAlif.startsWith('اللهمبحق')) {
    return null;
  }

  // 1. Tam eşleşme (no_alif)
  for (let i = 0; i < verses.length; i++) {
    if (verses[i].na === na) {
      return verses[i];
    }
  }

  // 2. Alt dize eşleşmesi (no_alif)
  for (let i = 0; i < verses.length; i++) {
    if (verses[i].na.includes(na)) {
      return verses[i];
    }
  }

  // 3. Güçlü sessiz harf iskeleti (skel >= 8 ise)
  if (sk.length >= 8) {
    for (let i = 0; i < verses.length; i++) {
      if (verses[i].sk.includes(sk)) {
        return verses[i];
      }
    }
  }

  // 4. Başta fazladan 'و' veya 'ف' bağlacı varsa
  if ((na.startsWith('و') || na.startsWith('ف')) && na.length > minNoAlif + 1) {
    const na2 = na.slice(1);
    for (let i = 0; i < verses.length; i++) {
      if (verses[i].na.includes(na2)) {
        return verses[i];
      }
    }
  }

  return null;
}

function computeArabicHighlightParts(
  fullArabic: string,
  risaleSnippet: string
): { before: string; matched: string; after: string; isPartial: boolean } {
  const qNa = toNoAlif(risaleSnippet);
  const qSk = toSkel(risaleSnippet);
  const fullNa = toNoAlif(fullArabic);

  if (!qNa || qNa.length >= fullNa.length * 0.88) {
    return { before: '', matched: fullArabic, after: '', isPartial: false };
  }

  const words = fullArabic.split(/\s+/).filter(Boolean);
  const wordNas = words.map((w) => toNoAlif(w));
  const wordSks = words.map((w) => toSkel(w));

  const tryTarget = (target: string, perWord: string[]) => {
    for (let a = 0; a < words.length; a++) {
      let acc = '';
      for (let b = a; b < words.length; b++) {
        acc += perWord[b];
        if (acc.includes(target)) {
          let start = a;
          while (start < b && perWord.slice(start + 1, b + 1).join('').includes(target)) {
            start++;
          }
          const isAll = start === 0 && b === words.length - 1;
          return {
            before: words.slice(0, start).join(' '),
            matched: words.slice(start, b + 1).join(' '),
            after: words.slice(b + 1).join(' '),
            isPartial: !isAll,
          };
        }
      }
    }
    return null;
  };

  const byNa = tryTarget(qNa, wordNas);
  if (byNa) return byNa;

  if (qNa.startsWith('و') || qNa.startsWith('ف')) {
    const byStripped = tryTarget(qNa.slice(1), wordNas);
    if (byStripped) return byStripped;
  }

  if (qSk.length >= 5) {
    const bySk = tryTarget(qSk, wordSks);
    if (bySk) return bySk;
  }

  return { before: '', matched: fullArabic, after: '', isPartial: false };
}

export function findVersesInArabicTextSync(rawChunk: string): MatchedVerseItem[] {
  if (!indexedVerses || indexedVerses.length === 0) return [];
  const key = rawChunk.trim();
  if (!key) return [];

  const cached = matchCache.get(key);
  if (cached) return cached;

  const verses = indexedVerses;
  const parts = key
    .split(/[٭*۞\r\n﴿﴾«»]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const rawMatches: Array<{ snippet: string; verse: IndexedVerse }> = [];

  for (const part of parts) {
    const na = toNoAlif(part);
    const normAlif = toNormWithAlif(part);
    const isMukattaa = Boolean(MUKATTAA_MAP[normAlif] && /[\u0653\u0670]/.test(part));

    if (!isMukattaa && (!na || NON_VERSE_EXACT.has(na) || na.length < 6)) {
      continue;
    }

    // Uzun duaları ("Allâhümme...") ele
    if (normAlif.startsWith('اللهميا') || normAlif.startsWith('اللهمبحق')) {
      continue;
    }

    const single = findSingleVerse(verses, part, 6, 4);
    if (single) {
      rawMatches.push({ snippet: part, verse: single });
      continue;
    }

    // Aynı satırda birden fazla ayet yan yana yazılmışsa kelime bazlı en uzun eşleşmeyle ayrıştır
    const words = part.split(/\s+/).filter((w) => toNoAlif(w).length > 0);
    if (words.length < 2) continue;

    const segMatches: Array<{ snippet: string; verse: IndexedVerse }> = [];
    let matchedChars = 0;
    let i = 0;

    while (i < words.length) {
      let bestJ = -1;
      let bestV: IndexedVerse | null = null;

      for (let j = words.length; j > i; j--) {
        const subStr = words.slice(i, j).join(' ');
        if (toNoAlif(subStr).length < 7) continue;
        const v = findSingleVerse(verses, subStr, 7, 5);
        if (v) {
          bestJ = j;
          bestV = v;
          break;
        }
      }

      if (bestV && bestJ > i) {
        const subStr = words.slice(i, bestJ).join(' ');
        segMatches.push({ snippet: subStr, verse: bestV });
        matchedChars += toNoAlif(subStr).length;
        i = bestJ;
      } else {
        i++;
      }
    }

    if (segMatches.length > 0 && matchedChars / na.length >= 0.78) {
      rawMatches.push(...segMatches);
    }
  }

  const results: MatchedVerseItem[] = rawMatches.map(({ snippet, verse }) => ({
    surahNo: verse.s,
    surahName: verse.surahName,
    verseNo: verse.v,
    risaleSnippet: snippet.trim(),
    fullArabic: verse.ar,
    arabicParts: computeArabicHighlightParts(verse.ar, snippet.trim()),
    meal: verse.tr,
  }));

  matchCache.set(key, results);
  return results;
}

export async function searchMealByArabicText(rawChunk: string): Promise<MatchedVerseItem[]> {
  await loadMealDatabase();
  return findVersesInArabicTextSync(rawChunk);
}
