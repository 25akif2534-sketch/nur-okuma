export interface LugatEntry {
  k: string; // Orijinal kelime başlığı (örn: DAKAİK-AŞİNA)
  a: string; // Lügat anlamı
}

export interface LugatItemResult {
  term: string;
  entry: LugatEntry;
}

export interface LugatSearchResult {
  query: string;
  matchedKey: string;
  entry?: LugatEntry; // Tekil tam eşleşme varsa
  compoundItems?: LugatItemResult[]; // Terkipse en uzun alt parçalar
}

let lugatCache: Record<string, LugatEntry> | null = null;
let loadingPromise: Promise<Record<string, LugatEntry>> | null = null;

// Türkçe şapkalı ve özel harfleri sadeleştir
export function normalizeWord(word: string): string {
  return word
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[âā]/g, 'a')
    .replace(/[îī]/g, 'i')
    .replace(/[ûū]/g, 'u')
    .replace(/[ôō]/g, 'o')
    .replace(/[^\w\s-ğüşıöçĞÜŞİÖÇ]/g, '')
    .trim();
}

// Noktalama işaretlerini ve tırnakları temizle
export function cleanPunctuation(text: string): string {
  return text
    .replace(/^[\s"'“‘(\[<{«]+/, '')
    .replace(/[\s"'”’)\],:;.!?»}>*]+$/, '')
    .trim();
}

// Türkçe yaygın çekim, bildirme ve hal ekleri (en uzundan en kısaya)
const COMMON_SUFFIXES = [
  'sindendir', 'sındandır', 'sundandır', 'sündendir',
  'lerinin', 'larının', 'lerinden', 'larından',
  'leriyle', 'larıyla', 'lerine', 'larına', 'lerini', 'larını',
  'indendir', 'ındandır', 'undandır', 'ündendir',
  'dendir', 'dandır', 'tendir', 'tandır',
  'sıyla', 'siyle', 'sına', 'sine', 'sında', 'sinde', 'sını', 'sini', 'sının', 'sinin',
  'imizden', 'ımızdan', 'umuzdan', 'ümüzden',
  'imize', 'ımıza', 'umuza', 'ümüze',
  'imizi', 'ımızı', 'umuzu', 'ümüzü',
  'imiz', 'ımız', 'umuz', 'ümüz',
  'iniz', 'ınız', 'unuz', 'ünüz',
  'leri', 'ları', 'deki', 'daki',
  'cesine', 'casına',
  'den', 'dan', 'ten', 'tan',
  'nin', 'nın', 'nun', 'nün',
  'yin', 'yın', 'yun', 'yün',
  'in', 'ın', 'un', 'ün',
  'ye', 'ya', 'e', 'a',
  'yi', 'yı', 'yu', 'yü', 'i', 'ı', 'u', 'ü',
  'le', 'la', 'ce', 'ca',
  'dir', 'dır', 'dur', 'dür', 'tir', 'tır', 'tur', 'tür',
  'si', 'sı', 'su', 'sü',
  'lik', 'lık', 'luk', 'lük',
  'ci', 'cı', 'cu', 'cü'
];

export async function loadLugat(): Promise<Record<string, LugatEntry>> {
  if (lugatCache) return lugatCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
      const res = await fetch(`${cleanBase}lugat.json`);
      if (!res.ok) {
        throw new Error(`Lügat yüklenemedi: HTTP ${res.status}`);
      }
      const data = await res.json();
      lugatCache = data;
      return data;
    } catch (err) {
      console.error('Lügat dosyası yüklenirken hata:', err);
      loadingPromise = null;
      return {};
    }
  })();

  return loadingPromise;
}

// Olası fonetik ve imla varyasyonlarını üret (örn: dekaik <-> dakaik, zîşan <-> zi-şan)
function generateWordVariants(input: string): string[] {
  const variants = new Set<string>();
  const rawLower = input.toLocaleLowerCase('tr-TR').trim();
  const normalized = normalizeWord(input);

  variants.add(rawLower);
  variants.add(normalized);

  // dekaik <-> dakaik ses değişimi
  if (normalized.includes('dekaik')) {
    variants.add(normalized.replace(/dekaik/g, 'dakaik'));
  }
  if (normalized.includes('dakaik')) {
    variants.add(normalized.replace(/dakaik/g, 'dekaik'));
  }

  // zişan / zisan <-> zi-şan
  if (normalized.includes('zisan') || normalized.includes('zişan')) {
    variants.add(normalized.replace(/zi(s|ş)an/g, 'zi-şan'));
    variants.add(normalized.replace(/zi(s|ş)an/g, 'zi-san'));
  }

  // Tireli <-> Boşluklu varyasyonlar
  const currentList = Array.from(variants);
  for (const v of currentList) {
    variants.add(v.replace(/-/g, ' '));
    variants.add(v.replace(/\s+/g, '-'));
    variants.add(v.replace(/-/g, ''));
  }

  return Array.from(variants);
}

// Tek bir kelime veya birleşik tamlamayı lügatte ara
function lookupTerm(
  dict: Record<string, LugatEntry>,
  term: string
): { key: string; entry: LugatEntry } | null {
  const cleaned = cleanPunctuation(term);
  if (!cleaned || cleaned.length < 2) return null;

  // 1. Doğrudan ve varyasyonlu arama
  const variants = generateWordVariants(cleaned);
  for (const v of variants) {
    if (dict[v]) return { key: v, entry: dict[v] };
  }

  // 2. Çift harf varyasyonları (örn: ubudiyet <-> ubudiyyet)
  for (const v of variants) {
    const doubleToSingle = v.replace(/([b-df-hj-np-tv-z])\1+/g, '$1');
    if (dict[doubleToSingle]) return { key: doubleToSingle, entry: dict[doubleToSingle] };

    for (const char of ['y', 'd', 't', 'l', 's', 'm', 'n', 'r', 'k']) {
      const singleToDouble = v.replace(
        new RegExp(`([^${char}])${char}([^${char}])`, 'g'),
        `$1${char}${char}$2`
      );
      if (dict[singleToDouble]) return { key: singleToDouble, entry: dict[singleToDouble] };
    }
  }

  // 3. Türkçe çekim eklerini soyup kökü arama (stemming)
  for (const v of variants) {
    for (const suffix of COMMON_SUFFIXES) {
      if (v.endsWith(suffix) && v.length - suffix.length >= 3) {
        const stem = v.slice(0, -suffix.length);
        const stemVariants = generateWordVariants(stem);
        for (const sv of stemVariants) {
          if (dict[sv]) return { key: sv, entry: dict[sv] };
        }

        // Arapça nispet ve sıfat eki soyma: -iyye, -iye (örn: usûliye -> usûl)
        if (stem.endsWith('iyye') && stem.length - 4 >= 3) {
          const nisbetStem = stem.slice(0, -4);
          for (const nv of generateWordVariants(nisbetStem)) {
            if (dict[nv]) return { key: nv, entry: dict[nv] };
          }
        } else if (stem.endsWith('iye') && stem.length - 3 >= 3) {
          const nisbetStem = stem.slice(0, -3);
          for (const nv of generateWordVariants(nisbetStem)) {
            if (dict[nv]) return { key: nv, entry: dict[nv] };
          }
        }

        // Yumuşama kontrolü: b->p, c->ç, d->t, ğ->k
        const softenedStems = [
          stem.replace(/b$/, 'p'),
          stem.replace(/c$/, 'ç'),
          stem.replace(/d$/, 't'),
          stem.replace(/ğ$/, 'k'),
        ];
        for (const s of softenedStems) {
          if (dict[s]) return { key: s, entry: dict[s] };
        }
      }
    }

    // Ek almamış ama nispet eki taşıyan kelimeler için doğrudan nispet eki kontrolü (-iyye, -iye)
    if (v.endsWith('iyye') && v.length - 4 >= 3) {
      const nisbetStem = v.slice(0, -4);
      for (const nv of generateWordVariants(nisbetStem)) {
        if (dict[nv]) return { key: nv, entry: dict[nv] };
      }
    } else if (v.endsWith('iye') && v.length - 3 >= 3) {
      const nisbetStem = v.slice(0, -3);
      for (const nv of generateWordVariants(nisbetStem)) {
        if (dict[nv]) return { key: nv, entry: dict[nv] };
      }
    }
  }

  return null;
}

export async function searchLugat(rawQuery: string): Promise<LugatSearchResult | null> {
  const cleaned = cleanPunctuation(rawQuery);
  if (!cleaned || cleaned.length < 2) return null;

  const dict = await loadLugat();
  if (!dict || Object.keys(dict).length === 0) return null;

  // Adım 1: Önce ifadenin tamamını tek parça olarak ara
  const directMatch = lookupTerm(dict, cleaned);
  if (directMatch) {
    return {
      query: cleaned,
      matchedKey: directMatch.key,
      entry: directMatch.entry,
    };
  }

  // Adım 2: Terkip / Çoklu Kelime Çözümleme (En Uzun Terkip Eşleşmesi - Greedy Matching)
  const isCompound = /[-–—\s]/.test(cleaned);
  if (isCompound) {
    // Kelimelere ayır, Osmanlıca izafet harflerini (-ı, -i, -u, -ü) filtrele
    const rawTokens = cleaned.split(/[-–—\s]+/).filter((t) => t.length > 0);
    const tokens: string[] = [];

    for (const t of rawTokens) {
      const lower = t.toLocaleLowerCase('tr-TR');
      if (['ı', 'i', 'u', 'ü'].includes(lower)) {
        continue;
      }
      tokens.push(t);
    }

    if (tokens.length > 0) {
      const compoundResults: LugatItemResult[] = [];
      const n = tokens.length;
      let i = 0;

      while (i < n) {
        let matched = false;

        // Mümkün olan en uzun birleşik öbeği dene (n-i'den başlayarak 1'e doğru)
        for (let len = n - i; len > 0; len--) {
          const chunkTokens = tokens.slice(i, i + len);
          const chunkTerm = chunkTokens.join('-');

          const found = lookupTerm(dict, chunkTerm);
          if (found) {
            compoundResults.push({
              term: chunkTerm,
              entry: found.entry,
            });
            i += len;
            matched = true;
            break;
          }
        }

        if (!matched) {
          i++;
        }
      }

      if (compoundResults.length > 0) {
        if (compoundResults.length === 1 && compoundResults[0].term.includes('-')) {
          return {
            query: cleaned,
            matchedKey: compoundResults[0].term,
            entry: compoundResults[0].entry,
          };
        }

        return {
          query: cleaned,
          matchedKey: cleaned,
          compoundItems: compoundResults,
        };
      }
    }
  }

  return null;
}
