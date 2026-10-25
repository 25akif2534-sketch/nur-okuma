import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  X,
  Gauge,
  Sliders,
  Eye,
  BookOpen
} from 'lucide-react';
import type { ThemeMode } from '../types';

interface SpeedReaderModalProps {
  isOpen: boolean;
  onClose: (progressPercent?: number, snippet?: string) => void;
  title: string;
  bookTitle: string;
  content: string;
  theme: ThemeMode;
  initialTextSnippet?: string;
}

const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function getOrpIndex(word: string): number {
  const len = word ? word.length : 0;
  if (len <= 1) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

function findInitialWordIndex(words: string[], snippet?: string): number {
  if (!snippet || words.length === 0) return 0;

  const normToken = (s: string) =>
    s.toLowerCase().replace(/^[,.;:!?'"“”‘’()[\]-]+|[,.;:!?'"“”‘’()[\]-]+$/g, '');

  const targetTokens = snippet
    .trim()
    .split(/\s+/)
    .map(normToken)
    .filter((t) => t.length > 0);

  if (targetTokens.length === 0) return 0;

  const searchLen = Math.min(targetTokens.length, 4);
  for (let i = 0; i <= words.length - searchLen; i++) {
    let match = true;
    for (let j = 0; j < searchLen; j++) {
      if (!normToken(words[i + j]).includes(targetTokens[j])) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return 0;
}

export const SpeedReaderModal: React.FC<SpeedReaderModalProps> = ({
  isOpen,
  onClose,
  title,
  bookTitle,
  content,
  theme,
  initialTextSnippet,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('nur_speed_wpm'));
      return saved >= 100 && saved <= 900 ? saved : 350;
    } catch {
      return 350;
    }
  });
  const [chunkSize, setChunkSize] = useState<1 | 2 | 3>(1);
  const [showContext, setShowContext] = useState(true);
  const [skipArabic, setSkipArabic] = useState(false);
  const [pauseOnPunctuation] = useState(true);

  const accumulatedTimeRef = useRef(0);
  const lastTickTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('nur_speed_wpm', String(wpm));
    } catch {
      // ignore storage error
    }
  }, [wpm]);

  // Metni dipnot işaretlerinden ve ayraçlardan temizle, Arapça tek harfli bağlaçları yanındaki kelimeyle birleştir
  const words = useMemo(() => {
    if (!content) return [];
    const cleaned = content
      .replace(/\r\n/g, '\n')
      .replace(/\*\*\*+/g, ' ')
      .replace(/۞/g, ' ')
      .replace(/\(\*+\[\d+\]\)/g, ' ')
      .replace(/\(Hâşiye\[\d+\]\)/gi, ' ')
      .replace(/\[\d+\]\s*\*/g, ' ')
      .replace(/\[\d+\]/g, ' ');

    const rawTokens = cleaned
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0 && w !== '*');

    const processed: string[] = [];
    let i = 0;
    while (i < rawTokens.length) {
      const token = rawTokens[i];
      const isAr = RTL_REGEX.test(token);
      if (isAr) {
        if (skipArabic) {
          i++;
          continue;
        }
        // Arapça tek/iki harfli edatları (و , فى , لا vb.) veya kısa ibareleri 2-3 kelimelik anlamlı grup yap
        let group = token;
        let count = 1;
        while (
          i + 1 < rawTokens.length &&
          RTL_REGEX.test(rawTokens[i + 1]) &&
          (group.length <= 4 || count < 3)
        ) {
          i++;
          group += ' ' + rawTokens[i];
          count++;
        }
        processed.push(group);
      } else {
        processed.push(token);
      }
      i++;
    }
    return processed;
  }, [content, skipArabic]);

  const [currentIndex, setCurrentIndex] = useState(() =>
    findInitialWordIndex(words, initialTextSnippet)
  );

  // Word delay calculation with punctuation intelligence
  const getWordDelay = useCallback(
    (word: string) => {
      const baseDelay = (60 / Math.max(100, wpm)) * 1000 * chunkSize;
      if (!pauseOnPunctuation || !word) return baseDelay;

      if (RTL_REGEX.test(word)) {
        return baseDelay * 1.6;
      }
      const lastChar = word.slice(-1);
      if (['.', '!', '?', '…'].includes(lastChar) || word.endsWith('...')) {
        return baseDelay * 1.8;
      }
      if ([',', ';', ':', '—', '-', '،', '؛'].includes(lastChar)) {
        return baseDelay * 1.35;
      }
      if (word.length > 12) {
        return baseDelay * 1.15;
      }
      return baseDelay;
    },
    [wpm, chunkSize, pauseOnPunctuation]
  );

  // Play / Pause cycle with clean requestAnimationFrame loop
  useEffect(() => {
    if (!isPlaying || words.length === 0) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      return;
    }

    lastTickTimeRef.current = performance.now();
    accumulatedTimeRef.current = 0;

    const tick = (now: number) => {
      if (!lastTickTimeRef.current) {
        lastTickTimeRef.current = now;
      }

      const delta = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;
      accumulatedTimeRef.current += delta;

      const currentWord = words[currentIndex] || '';
      const neededDelay = getWordDelay(currentWord);

      if (accumulatedTimeRef.current >= neededDelay) {
        accumulatedTimeRef.current -= neededDelay;
        setCurrentIndex((prev) => {
          const next = prev + chunkSize;
          if (next >= words.length) {
            setIsPlaying(false);
            return Math.max(0, words.length - 1);
          }
          return next;
        });
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isPlaying, words, currentIndex, chunkSize, getWordDelay]);

  const handleCloseWithSync = useCallback(() => {
    setIsPlaying(false);
    const validWords = words;
    const currentSafe = Math.min(currentIndex, Math.max(0, validWords.length - 1));
    const pct = validWords.length > 0 ? ((currentSafe + 1) / validWords.length) * 100 : 0;
    const snippet = validWords.slice(Math.max(0, currentSafe - 1), Math.min(validWords.length, currentSafe + 4)).join(' ');
    onClose(pct, snippet);
  }, [words, currentIndex, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - (e.shiftKey ? 20 : 5)));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(words.length - 1, prev + (e.shiftKey ? 20 : 5)));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setWpm((w) => Math.min(1000, w + 25));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setWpm((w) => Math.max(100, w - 25));
      } else if (e.code === 'Escape') {
        handleCloseWithSync();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, words.length, handleCloseWithSync]);

  if (!isOpen) return null;

  const safeIndex = Math.min(currentIndex, Math.max(0, words.length - 1));
  const currentWord = words[safeIndex] || '';
  const isArabic = RTL_REGEX.test(currentWord);

  // Color pallet based on reader theme
  const getModalBg = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#f7ebcf] text-[#3e2e1c] border-amber-900/20';
      case 'dark':
      case 'night':
        return 'bg-[#18181b] text-zinc-100 border-zinc-800';
      case 'light':
      default:
        return 'bg-white text-stone-900 border-stone-200';
    }
  };

  const currentChunk = words.slice(safeIndex, safeIndex + chunkSize).join(' ');

  // ORP segmentation for Single Word
  const orpIdx = getOrpIndex(currentWord);
  const prefix = currentWord.substring(0, orpIdx);
  const orpChar = currentWord.charAt(orpIdx);
  const suffix = currentWord.substring(orpIdx + 1);

  // Context snippet around current index
  const contextStart = Math.max(0, safeIndex - 12);
  const contextEnd = Math.min(words.length, safeIndex + 18);

  const percent = words.length > 0 ? Math.min(100, Math.round(((safeIndex + 1) / words.length) * 100)) : 0;
  const remainingMinutes = Math.ceil(Math.max(0, words.length - safeIndex) / Math.max(100, wpm));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full max-w-4xl rounded-3xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden ${getModalBg()}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold opacity-60">
                {bookTitle} • Hızlı Okuma Motoru (RSVP)
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg">{title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCloseWithSync}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
              title="Kaldığınız yeri ana okuma sayfasına kaydeder ve kapatır"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Buradan Devam Et</span>
            </button>
            <button
              onClick={handleCloseWithSync}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Kapat ve Kaldığım Yere Dön"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RSVP Canvas Stage */}
        <div className="flex-1 flex flex-col items-center justify-center py-10 sm:py-14 px-4 select-none relative">
          {/* Target Focus Lines */}
          <div className="w-full max-w-xl relative flex flex-col items-center">
            {/* Top guide notch */}
            <div className="w-1.5 h-3 bg-red-500/70 rounded-full mb-3" />

            {/* Word Display Box */}
            <div
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-full py-8 px-6 rounded-2xl bg-black/5 dark:bg-white/5 cursor-pointer flex items-center justify-center font-serif tracking-normal text-3xl sm:text-5xl font-bold min-h-[140px] transition-all hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 shadow-inner"
            >
              {words.length === 0 ? (
                <span className="text-sm opacity-50 font-sans">Metin bulunamadı</span>
              ) : isArabic ? (
                <span className="text-amber-700 dark:text-amber-400 font-serif text-center leading-relaxed" dir="rtl">
                  {currentWord}
                </span>
              ) : chunkSize === 1 ? (
                <div className="flex items-baseline w-full font-mono">
                  <span className="w-1/2 text-right opacity-90 pr-0.5">{prefix}</span>
                  <span className="text-red-500 font-extrabold px-0.5 scale-110 transform inline-block">
                    {orpChar}
                  </span>
                  <span className="w-1/2 text-left opacity-90 pl-0.5">{suffix}</span>
                </div>
              ) : (
                <span className="text-center font-serif leading-tight">{currentChunk}</span>
              )}
            </div>

            {/* Bottom guide notch */}
            <div className="w-1.5 h-3 bg-red-500/70 rounded-full mt-3" />
          </div>

          {/* Quick Tip */}
          <div className="text-[11px] opacity-50 mt-4 font-mono text-center">
            [Boşluk]: {isPlaying ? 'Durdur' : 'Başlat'} • [← / →]: Geri/İleri • [↑ / ↓]: Hız (WPM)
          </div>
        </div>

        {/* Context Preview (Çevre Metin) */}
        {showContext && words.length > 0 && (
          <div className="px-6 py-3 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-xs sm:text-sm font-serif leading-relaxed text-center line-clamp-2">
            {words.slice(contextStart, contextEnd).map((w, idx) => {
              const actualIdx = contextStart + idx;
              const isCurr = actualIdx >= safeIndex && actualIdx < safeIndex + chunkSize;
              return (
                <span
                  key={actualIdx}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex(actualIdx);
                  }}
                  className={`cursor-pointer ${
                    isCurr
                      ? 'bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold px-1 rounded'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {w}{' '}
                </span>
              );
            })}
          </div>
        )}

        {/* Controls & Speed Deck */}
        <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 space-y-4 bg-black/[0.02] dark:bg-white/[0.02]">
          {/* Progress Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono opacity-60">
              <span>
                {safeIndex + 1} / {words.length} adım
              </span>
              <span>
                %{percent} • Kalan: ~{remainingMinutes} dk
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, words.length - 1)}
              value={safeIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentIndex(Number(e.target.value));
              }}
              className="w-full accent-amber-600 h-1.5 bg-black/10 dark:bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Playbar Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Play / Step group */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 10))}
                className="p-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium flex items-center gap-1"
                title="10 Kelime Geri"
              >
                <SkipBack className="w-4 h-4" />
                -10
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-medium shadow-md transition-all"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                <span>{isPlaying ? 'Durdur' : 'Başlat'}</span>
              </button>

              <button
                onClick={() => setCurrentIndex((p) => Math.min(words.length - 1, p + 10))}
                className="p-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium flex items-center gap-1"
                title="10 Kelime İleri"
              >
                +10
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIndex(0);
                }}
                className="p-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                title="Başa Dön"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* WPM and Options Deck */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Presets */}
              <div className="hidden sm:flex items-center gap-1 text-xs font-mono">
                {[250, 350, 450, 600].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setWpm(rate)}
                    className={`px-2.5 py-1 rounded-lg border transition-colors ${
                      wpm === rate
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {rate}
                  </button>
                ))}
              </div>

              {/* WPM Slider */}
              <div className="flex items-center gap-2 text-xs">
                <Sliders className="w-4 h-4 opacity-60" />
                <span className="font-mono font-bold w-14 text-amber-700 dark:text-amber-400">
                  {wpm} WPM
                </span>
                <input
                  type="range"
                  min={100}
                  max={900}
                  step={25}
                  value={wpm}
                  onChange={(e) => setWpm(Number(e.target.value))}
                  className="w-24 sm:w-28 accent-amber-600 h-1 bg-black/10 dark:bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              {/* Chunk selector (1, 2, 3 words) */}
              <select
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value) as 1 | 2 | 3)}
                className="text-xs px-2 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent font-medium"
                title="Kelime Grubu"
              >
                <option value={1} className="dark:bg-zinc-800 text-stone-900 dark:text-stone-100">
                  1 Kelime
                </option>
                <option value={2} className="dark:bg-zinc-800 text-stone-900 dark:text-stone-100">
                  2 Kelime
                </option>
                <option value={3} className="dark:bg-zinc-800 text-stone-900 dark:text-stone-100">
                  3 Kelime
                </option>
              </select>

              {/* Arapça Göster / Atla Düğmesi */}
              <button
                onClick={() => setSkipArabic((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  skipArabic
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title="Arapça ibareleri hızlı okumada atla veya göster"
              >
                {skipArabic ? 'Arapça: Atla' : 'Arapça: Açık'}
              </button>

              {/* Toggle Context */}
              <button
                onClick={() => setShowContext(!showContext)}
                className={`p-2 rounded-xl border border-black/10 dark:border-white/10 transition-colors ${
                  showContext ? 'bg-amber-500/10 text-amber-600' : 'opacity-40'
                }`}
                title="Çevre Metni Göster/Gizle"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
