import React, { useState } from 'react';
import {
  X,
  Compass,
  Users,
  GitFork,
  Loader2,
  Send,
  ExternalLink
} from 'lucide-react';
import type { Passage, ThemeMode } from '../types';
import {
  analyzeSirriTemsil,
  consultCouncil,
  explainCrossReferences
} from '../services/aiService';
import type {
  SirriTemsilResult,
  CouncilResult,
  CrossExegesisResult
} from '../services/aiService';
import type { SearchItem } from './SearchModal';

interface MutalaaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  passage: Passage | null;
  selectedTextSnippet?: string;
  theme: ThemeMode;
  initialTab?: 'sirri-temsil' | 'meclis' | 'capraz';
  onNavigateToPassage?: (bookId: string, chapterId: string, passageId: string) => void;
}

export const MutalaaDrawer: React.FC<MutalaaDrawerProps> = ({
  isOpen,
  onClose,
  passage,
  selectedTextSnippet,
  theme,
  initialTab = 'sirri-temsil',
  onNavigateToPassage,
}) => {
  const [activeTab, setActiveTab] = useState<'sirri-temsil' | 'meclis' | 'capraz'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results state
  const [sirriResult, setSirriResult] = useState<SirriTemsilResult | null>(null);
  const [councilResult, setCouncilResult] = useState<CouncilResult | null>(null);
  const [userQuestion, setUserQuestion] = useState('');

  // Çapraz İzah Durumu
  const [crossMatches, setCrossMatches] = useState<SearchItem[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<SearchItem | null>(null);
  const [crossExegesisResult, setCrossExegesisResult] = useState<CrossExegesisResult | null>(null);
  const [crossSearching, setCrossSearching] = useState(false);

  if (!isOpen || !passage) return null;

  const currentPassageText = selectedTextSnippet || passage.text;

  // 1. Sırr-ı Temsil
  const handleRunSirriTemsil = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeSirriTemsil(passage.title, currentPassageText);
      setSirriResult(res);
    } catch (e: any) {
      setError(e.message || 'Hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Müzakere Kürsüleri
  const handleRunCouncil = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await consultCouncil(passage.title, currentPassageText, userQuestion);
      setCouncilResult(res);
    } catch (e: any) {
      setError(e.message || 'Hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Çapraz Atıf Bul ve İzah Et
  const handleFindCrossReferences = async () => {
    setCrossSearching(true);
    setError(null);
    setCrossMatches([]);
    setSelectedMatch(null);
    setCrossExegesisResult(null);

    try {
      const res = await fetch('./kulliyat/search-index.json');
      const allPassages: SearchItem[] = await res.json();

      // Pasajdan en manidar 2-3 kelimeyi tespit et
      const stopWords = ['ve', 'bir', 'bu', 'ile', 'de', 'da', 'icin', 'o', 'ki', 'ise', 'her', 'gibi', 'hem', 'en', 'dahi'];
      const words = currentPassageText
        .toLowerCase()
        .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇâîûÂÎÛ\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.includes(w));

      // Sık geçen kelimeler
      const freq: { [key: string]: number } = {};
      words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
      const topKeywords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((p) => p[0]);

      // Başka kitaplardaki eşleşen pasajları bul
      const matches = allPassages.filter((p) => {
        if (p.passageId === passage.id && p.title === passage.title) return false;
        const norm = p.text.toLowerCase();
        return topKeywords.some((kw) => norm.includes(kw));
      }).slice(0, 5);

      setCrossMatches(matches);
      if (matches.length > 0) {
        handleExplainPair(matches[0]);
      }
    } catch (e: any) {
      setError(e.message || 'Çapraz atıflar aranamadı.');
    } finally {
      setCrossSearching(false);
    }
  };

  const handleExplainPair = async (match: SearchItem) => {
    setSelectedMatch(match);
    setLoading(true);
    setError(null);
    try {
      const res = await explainCrossReferences(
        passage.title,
        currentPassageText.substring(0, 600),
        match.title,
        match.text.substring(0, 600)
      );
      setCrossExegesisResult(res);
    } catch (e: any) {
      setError(e.message || 'İzah oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const drawerBg = theme === 'dark' || theme === 'night'
    ? 'bg-stone-900 text-stone-100 border-stone-800'
    : 'bg-white text-stone-900 border-stone-200';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl h-full shadow-2xl border-l flex flex-col overflow-hidden ${drawerBg}`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60">
                Tahkik & Mütalaa Odası
              </div>
              <h3 className="font-serif font-bold text-sm sm:text-base truncate max-w-sm">
                {passage.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected snippet badge */}
        {selectedTextSnippet && (
          <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs font-serif italic text-amber-900 dark:text-amber-200">
            <span className="font-sans font-bold not-italic mr-1 text-[11px] uppercase tracking-wider">
              Seçilen Cümle:
            </span>
            "{selectedTextSnippet}"
          </div>
        )}

        {/* Tab Selector (3 Sekme) */}
        <div className="grid grid-cols-3 p-2 gap-1 border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-xs font-medium">
          <button
            onClick={() => setActiveTab('sirri-temsil')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'sirri-temsil'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Sırr-ı Temsil
          </button>
          <button
            onClick={() => setActiveTab('meclis')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'meclis'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Müzakere Kürsüsü
          </button>
          <button
            onClick={() => {
              setActiveTab('capraz');
              if (crossMatches.length === 0) handleFindCrossReferences();
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'capraz'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            Çapraz İzah
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs leading-relaxed">
              <strong>Hata:</strong> {error}
            </div>
          )}

          {/* TAB 1: Sırr-ı Temsil */}
          {activeTab === 'sirri-temsil' && (
            <div className="space-y-5">
              {!sirriResult && !loading && (
                <div className="py-10 text-center space-y-3">
                  <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl inline-block">
                    <Compass className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif font-bold text-base">Sırr-ı Temsil Dörtlü Tahkiki</h4>
                  <p className="text-xs opacity-70 max-w-sm mx-auto leading-relaxed">
                    Bu pasajı <strong>Dürbün, Cihetü'l-Vahdet, Merdiven ve Pencere</strong> merhaleleriyle tahlil edin. Sadece bu pasaj ele alınır; ezberden uydurma yapılmaz.
                  </p>
                  <button
                    onClick={handleRunSirriTemsil}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md active:scale-95 transition-all mt-2"
                  >
                    <span>Mütalaayı Başlat</span>
                  </button>
                </div>
              )}

              {loading && (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                  <p className="font-serif text-sm">Hakikat tahkik ediliyor...</p>
                  <span className="text-[11px] opacity-50">Metne bağlı tahlil</span>
                </div>
              )}

              {sirriResult && !loading && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-1.5">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      🔭 1. Dürbün (Temsil & Yakınlaştırma)
                    </span>
                    <p className="text-xs sm:text-sm font-serif leading-relaxed">
                      {sirriResult.durbun}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-1.5">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      🌐 2. Cihetü'l-Vahdet (Külliyat & Esmâ Rabıtası)
                    </span>
                    <p className="text-xs sm:text-sm font-serif leading-relaxed">
                      {sirriResult.cihetulVahdet}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      🪜 3. Merdiven (Akıl ve Mantık Basamakları)
                    </span>
                    <ul className="space-y-1.5 text-xs sm:text-sm font-serif">
                      {sirriResult.merdiven.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-bold text-amber-600 shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl border border-amber-600/30 bg-amber-500/10 space-y-1.5">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      🪟 4. Pencere (Yakîn-i İmanî Neticesi)
                    </span>
                    <p className="text-xs sm:text-sm font-serif leading-relaxed font-medium">
                      {sirriResult.pencere}
                    </p>
                  </div>

                  <button
                    onClick={handleRunSirriTemsil}
                    className="w-full py-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium transition-colors"
                  >
                    Yeniden Tahlil Et
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Müzakere Kürsüleri */}
          {activeTab === 'meclis' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                <input
                  type="text"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  placeholder="Müzakere heyetine özel bir sual yöneltin..."
                  className="flex-1 bg-transparent px-3 text-xs outline-none font-serif"
                />
                <button
                  onClick={handleRunCouncil}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium flex items-center gap-1 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Müzakereyi Başlat
                </button>
              </div>

              {loading && (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                  <p className="font-serif text-sm">İlmi heyet pasajı müzakere ediyor...</p>
                </div>
              )}

              {councilResult && !loading && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {councilResult.erkanlar.map((erk, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-amber-700 dark:text-amber-400">
                          {erk.erkan}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 font-mono opacity-70">
                          {erk.unvan}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-serif leading-relaxed">
                        {erk.gorus}
                      </p>
                    </div>
                  ))}

                  <div className="p-4 rounded-2xl border border-amber-600/30 bg-amber-500/10 space-y-1">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      Hülâsa (Nihai Ders)
                    </span>
                    <p className="text-xs sm:text-sm font-serif leading-relaxed font-medium">
                      {councilResult.hulasa}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Çapraz İzah Motoru */}
          {activeTab === 'capraz' && (
            <div className="space-y-5">
              {crossSearching && (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                  <p className="text-xs font-serif">Külliyat'ta ikiz ve mütemmim bahisler taranıyor...</p>
                </div>
              )}

              {!crossSearching && crossMatches.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Külliyat'taki İkiz Bahisler:
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {crossMatches.map((m) => (
                      <button
                        key={`${m.bookId}-${m.chapterId}-${m.passageId}`}
                        onClick={() => handleExplainPair(m)}
                        className={`p-2.5 rounded-xl border text-left shrink-0 max-w-[200px] transition-all ${
                          selectedMatch?.passageId === m.passageId
                            ? 'border-amber-600 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                            : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 opacity-70'
                        }`}
                      >
                        <div className="text-[10px] font-bold opacity-70 truncate">{m.bookTitle}</div>
                        <div className="text-xs font-serif font-bold truncate">{m.title}</div>
                      </button>
                    ))}
                  </div>

                  {/* İkiz Bahsin İzahı */}
                  {selectedMatch && (
                    <div className="mt-4 p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] space-y-3">
                      <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="font-serif font-bold text-xs text-amber-700 dark:text-amber-400">
                          🔗 {selectedMatch.bookTitle} • {selectedMatch.title}
                        </span>
                        {onNavigateToPassage && (
                          <button
                            onClick={() => {
                              onNavigateToPassage(selectedMatch.bookId, selectedMatch.chapterId, selectedMatch.passageId);
                              onClose();
                            }}
                            className="text-[11px] text-amber-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            Bahse Git <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {loading ? (
                        <div className="py-6 text-center text-xs flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                          İki bahsin irtibatı tahlil ediliyor...
                        </div>
                      ) : crossExegesisResult ? (
                        <div className="space-y-2 text-xs sm:text-sm font-serif leading-relaxed">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {crossExegesisResult.anahtarKavramlar.map((k, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[10px] font-mono"
                              >
                                #{k}
                              </span>
                            ))}
                          </div>
                          <p>{crossExegesisResult.izah}</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
