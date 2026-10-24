import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  GitFork,
  Loader2,
  Search,
  ExternalLink,
  BookOpen,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import type { Passage, ThemeMode } from '../types';
import {
  preloadSearchIndex,
  getCachedSearchIndex,
  extractConceptsFromText,
  searchKulliyatPassages,
  renderHighlightedText,
  type SearchItem
} from '../utils/searchUtils';

interface MutalaaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  passage: Passage | null;
  selectedTextSnippet?: string;
  theme: ThemeMode;
  currentBookId?: string;
  currentChapterId?: string;
  currentPassageId?: string;
  currentChapterFirstPassage?: Passage | null;
  onSwitchPassage?: (passage: Passage) => void;
  onActiveConceptChange?: (concept: string) => void;
  onNavigateToPassage?: (
    bookId: string,
    chapterId: string,
    passageId: string,
    searchQuery?: string
  ) => void;
}

export const MutalaaDrawer: React.FC<MutalaaDrawerProps> = ({
  isOpen,
  onClose,
  passage,
  selectedTextSnippet,
  theme,
  currentBookId,
  currentChapterId,
  currentPassageId,
  currentChapterFirstPassage,
  onSwitchPassage,
  onActiveConceptChange,
  onNavigateToPassage,
}) => {
  const [indexData, setIndexData] = useState<SearchItem[]>(() => getCachedSearchIndex() || []);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [concepts, setConcepts] = useState<string[]>([]);
  const [activeConcept, setActiveConcept] = useState<string>('');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [exactWord, setExactWord] = useState<boolean>(false);
  const [visitedKeys, setVisitedKeys] = useState<Set<string>>(new Set());

  const lastSourceKeyRef = useRef<string>('');
  const onActiveConceptChangeRef = useRef(onActiveConceptChange);
  useEffect(() => {
    onActiveConceptChangeRef.current = onActiveConceptChange;
  }, [onActiveConceptChange]);

  const passageId = passage?.id || '';
  const passageTitle = passage?.title || '';
  const passageText = passage?.text || '';

  useEffect(() => {
    if (!isOpen || !passageId) return;

    const sourceKey = `${passageId}:::${selectedTextSnippet || ''}`;
    if (lastSourceKeyRef.current === sourceKey) {
      return;
    }

    lastSourceKeyRef.current = sourceKey;
    let cancelled = false;
    const hasExplicitSelection = Boolean(selectedTextSnippet && selectedTextSnippet.trim().length > 0);
    const sourceText = (selectedTextSnippet || passageText).trim();
    const extracted = extractConceptsFromText(sourceText, hasExplicitSelection);
    setConcepts(extracted);
    setCustomQuery('');
    setVisitedKeys(new Set());
    setErrorMsg(null);
    setLoadingIndex(true);

    preloadSearchIndex()
      .then((data) => {
        if (cancelled) return;
        setIndexData(data);

        let chosen = extracted[0] || (hasExplicitSelection ? sourceText.slice(0, 120) : '');
        for (const candidate of extracted) {
          const res = searchKulliyatPassages(data, candidate, {
            excludePassageId: passageId,
            excludeTitle: passageTitle,
            excludeSnippet: selectedTextSnippet,
            maxResults: 5,
          });
          if (res.length > 0) {
            chosen = candidate;
            break;
          }
        }
        setActiveConcept(chosen);
        if (onActiveConceptChangeRef.current) {
          onActiveConceptChangeRef.current(chosen);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg('Külliyat dizini yüklenemedi. İnternet bağlantınızı kontrol ediniz.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingIndex(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, passageId, passageTitle, passageText, selectedTextSnippet]);

  // Seçili kelime, terkip veya cümlenin Külliyat'taki diğer geçtiği cümleleri
  const matches = useMemo(() => {
    if (!passageId || indexData.length === 0) return [];
    const queryToRun = activeConcept.trim();
    if (queryToRun.length < 2) return [];
    return searchKulliyatPassages(indexData, queryToRun, {
      excludePassageId: passageId,
      excludeTitle: passageTitle,
      excludeSnippet: selectedTextSnippet,
      exactWord,
      maxResults: 80,
    });
  }, [passageId, passageTitle, selectedTextSnippet, indexData, activeConcept, exactWord]);

  if (!isOpen || !passage) return null;

  const handleSelectConcept = (concept: string) => {
    setActiveConcept(concept);
    if (onActiveConceptChange) onActiveConceptChange(concept);
  };

  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customQuery.trim();
    if (trimmed.length >= 2) {
      if (!concepts.includes(trimmed)) {
        setConcepts((prev) => [trimmed, ...prev]);
      }
      setActiveConcept(trimmed);
      if (onActiveConceptChange) onActiveConceptChange(trimmed);
    }
  };

  const isViewingDifferentChapter =
    currentChapterFirstPassage &&
    currentChapterFirstPassage.id !== passage.id &&
    currentChapterFirstPassage.title !== passage.title;

  const drawerBg =
    theme === 'dark' || theme === 'night'
      ? 'bg-stone-900 text-stone-100 border-stone-800'
      : 'bg-white text-stone-900 border-stone-200';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl h-full shadow-2xl border-l flex flex-col overflow-hidden ${drawerBg}`}
      >
        {/* Üst Başlık */}
        <div className="p-4 sm:p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
              <GitFork className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wider font-semibold opacity-60 truncate">
                Çapraz İzah • Külliyat İçi Atıflar
              </div>
              <h3 className="font-serif font-bold text-sm sm:text-base truncate">
                {passage.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isViewingDifferentChapter && onSwitchPassage && currentChapterFirstPassage && (
              <button
                onClick={() => {
                  lastSourceKeyRef.current = '';
                  onSwitchPassage(currentChapterFirstPassage);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 text-[11px] font-semibold transition-colors"
                title="Şu an açık olan yeni bahsin kavramlarını analiz et"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Bu Bahsi Analiz Et</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 transition-colors shrink-0"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Seçilen Cümle / İbare Kutusu */}
        {selectedTextSnippet && (
          <div className="px-5 py-2.5 bg-amber-100 dark:bg-amber-950/60 border-b border-amber-300 dark:border-amber-800 text-xs font-serif italic text-stone-950 dark:text-amber-100 line-clamp-3">
            <span className="font-sans font-bold not-italic mr-1.5 text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-300">
              Seçilen İbare:
            </span>
            "{selectedTextSnippet}"
          </div>
        )}

        {/* İbare / Terkip / Kelime Seçici ve Arama */}
        <div className="p-4 border-b border-black/10 dark:border-white/10 bg-stone-50 dark:bg-stone-950/40 space-y-3">
          {concepts.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  {selectedTextSnippet
                    ? 'Seçilen İbare, Terkip ve Kelimeler:'
                    : 'Bu Bahisteki Terkipler (Tıklayıp Ara):'}
                </span>
                <button
                  type="button"
                  onClick={() => setExactWord((prev) => !prev)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors ${
                    exactWord
                      ? 'bg-amber-600 text-white border-amber-700'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                  }`}
                  title="Açık olduğunda kelimenin ek almış hallerini değil yalnızca tam eşleşmesini listeler"
                >
                  {exactWord ? '✓ Tam Kelime' : 'Tam Kelime'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {concepts.map((concept) => {
                  const isSelected = activeConcept === concept;
                  return (
                    <button
                      key={concept}
                      onClick={() => handleSelectConcept(concept)}
                      className={`px-3 py-1 rounded-lg text-xs font-serif font-semibold transition-all border max-w-full truncate ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs scale-[1.01]'
                          : 'bg-stone-200/90 text-stone-900 border-stone-300 hover:bg-amber-100 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700'
                      }`}
                    >
                      {concept}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* İsteğe Bağlı Kelime/Terkip/Cümle Arama Kutusu */}
          <form onSubmit={handleCustomSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Kelime, terkip veya cümle yazın (örn: daire-i vücut)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs outline-none focus:border-amber-600"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              Ara
            </button>
          </form>
        </div>

        {/* Sonuç Listesi: Külliyat'ta Geçtiği Cümleler */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {loadingIndex ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              <p className="text-xs font-serif font-medium">
                Külliyat dizini taranıyor...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs sm:text-sm font-serif text-red-600">{errorMsg}</p>
              <button
                onClick={() => {
                  lastSourceKeyRef.current = '';
                  setErrorMsg(null);
                  setLoadingIndex(true);
                  preloadSearchIndex()
                    .then((data) => setIndexData(data))
                    .catch(() => setErrorMsg('Külliyat dizini yine yüklenemedi.'))
                    .finally(() => setLoadingIndex(false));
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold"
              >
                Tekrar Dene
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="py-12 text-center space-y-2 opacity-75">
              <BookOpen className="w-8 h-8 mx-auto text-amber-600/60" />
              <p className="text-sm font-serif font-medium">
                "{activeConcept}" ifadesi için başka bahiste farklı bir cümle bulunamadı.
              </p>
              <p className="text-xs opacity-70 max-w-xs mx-auto">
                Üstteki diğer kavramlara tıklayabilir veya arama kutusuna farklı bir kelime grubu yazabilirsiniz.
              </p>
            </div>
          ) : (
            <>
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 pb-1">
                "{activeConcept}" İbaresinin Geçtiği Cümleler ({matches.length}{matches.length === 80 ? '+' : ''} yer)
              </div>

              <div className="space-y-3">
                {matches.map((m, idx) => {
                  const itemKey = `${m.item.bookId}-${m.item.chapterId}-${m.item.passageId}`;
                  const isCurrentlyViewing =
                    currentBookId === m.item.bookId &&
                    currentChapterId === m.item.chapterId &&
                    currentPassageId === m.item.passageId;
                  const isVisited = visitedKeys.has(itemKey);

                  return (
                    <div
                      key={`${itemKey}-${idx}`}
                      onClick={() => {
                        if (onNavigateToPassage) {
                          setVisitedKeys((prev) => {
                            const next = new Set(prev);
                            next.add(itemKey);
                            return next;
                          });
                          onNavigateToPassage(
                            m.item.bookId,
                            m.item.chapterId,
                            m.item.passageId,
                            activeConcept
                          );
                          onClose();
                        }
                      }}
                      className={`group cursor-pointer p-3.5 rounded-2xl border transition-all space-y-2 ${
                        isCurrentlyViewing
                          ? 'border-amber-600 bg-amber-500/10 shadow-sm'
                          : 'border-black/10 dark:border-white/10 hover:border-amber-500/60 bg-black/[0.015] dark:bg-white/[0.02] hover:bg-amber-500/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 shrink-0">
                            {m.item.bookTitle}
                          </span>
                          <span className="text-xs font-serif font-bold truncate opacity-85">
                            {m.item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCurrentlyViewing ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Şu An Açık
                            </span>
                          ) : isVisited ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Bakıldı
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                              Cümleye Git
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm font-serif leading-relaxed opacity-90 border-l-2 border-amber-500/40 pl-3 py-0.5">
                        {renderHighlightedText(m.snippet, activeConcept)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
