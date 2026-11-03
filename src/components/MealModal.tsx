import React, { useEffect } from 'react';
import { X, BookMarked, Copy, Check, Layers } from 'lucide-react';
import type { MatchedVerseItem } from '../services/mealService';

interface MealModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MatchedVerseItem[];
  clickedArabicText: string;
  theme: 'light' | 'sepia' | 'dark' | 'night';
}

export const MealModal: React.FC<MealModalProps> = ({
  isOpen,
  onClose,
  items,
  clickedArabicText,
  theme,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (!isOpen) return;

    try {
      window.getSelection()?.removeAllRanges();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    } catch {
      // ignore
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getContainerBg = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#f7ebcf] text-[#3e2e1c] border-amber-900/30';
      case 'dark':
        return 'bg-[#211f1d] text-[#e7e5e4] border-zinc-700';
      case 'night':
        return 'bg-[#1a1510] text-[#e6dac8] border-amber-900/40';
      case 'light':
      default:
        return 'bg-white text-stone-900 border-stone-200';
    }
  };

  const getCardBg = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#fbf4e2] border-amber-900/20 text-[#3e2e1c]';
      case 'dark':
        return 'bg-[#2a2724] border-zinc-700 text-[#e7e5e4]';
      case 'night':
        return 'bg-[#231d16] border-amber-900/35 text-[#e6dac8]';
      case 'light':
      default:
        return 'bg-stone-50 border-stone-200 text-stone-900';
    }
  };

  const handleCopy = () => {
    if (!items || items.length === 0) return;
    const text = items
      .map(
        (it) =>
          `[${it.surahName}, ${it.verseNo}. Ayet]\n${it.fullArabic}\n\nMeal (Elmalılı Hamdi Yazır):\n${it.meal}`
      )
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const headerTitle =
    items.length === 1
      ? `${items[0].surahName} • ${items[0].verseNo}. Ayet`
      : items.length > 1
      ? `${items.length} Ayet-i Kerime`
      : 'Kur’an-ı Kerim Meali';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div
        className={`w-full sm:max-w-2xl max-h-[86vh] flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl border ${getContainerBg()} overflow-hidden animate-in slide-in-from-bottom duration-200`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık Çubuğu */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              {items.length > 1 ? (
                <Layers className="w-4 h-4" />
              ) : (
                <BookMarked className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider opacity-65 font-medium">
                Elmalılı Hamdi Yazır Meali
              </div>
              <h3 className="text-base sm:text-lg font-serif font-bold tracking-wide truncate">
                {headerTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {items.length > 0 && (
              <button
                onClick={handleCopy}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-75 hover:opacity-100"
                title="Ayet ve meali kopyala"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-75 hover:opacity-100"
              title="Kapat (Esc)"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gövde - Ayet ve Meal Kartları */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 text-sm sm:text-base leading-relaxed font-serif select-text">
          {items.length > 0 ? (
            items.map((item, idx) => (
              <div
                key={`${item.surahNo}-${item.verseNo}-${idx}`}
                className={`p-4 sm:p-5 rounded-2xl border ${getCardBg()} space-y-3.5 shadow-xs`}
              >
                {/* Sure ve Ayet Başlığı */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-amber-600/20 text-amber-800 dark:text-amber-300 font-sans font-bold text-xs">
                      {item.surahNo}:{item.verseNo}
                    </span>
                    <span className="font-bold text-amber-900 dark:text-amber-300 text-sm sm:text-base">
                      {item.surahName} • {item.verseNo}. Ayet
                    </span>
                  </div>
                  {item.arabicParts.isPartial && (
                    <span className="text-[11px] font-sans px-2 py-0.5 rounded-md border border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300">
                      Ayetten Bölüm
                    </span>
                  )}
                </div>

                {/* Arapça Ayet Metni (Risale'de geçen kısım renkli vurgulu) */}
                <div className="space-y-1.5">
                  <p
                    dir="rtl"
                    className="font-arabic text-right text-xl sm:text-2xl leading-[2.2] px-3 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-amber-900/10 dark:border-amber-400/10 text-amber-950 dark:text-amber-100"
                  >
                    {item.arabicParts.isPartial ? (
                      <>
                        {item.arabicParts.before && (
                          <span className="opacity-55">{item.arabicParts.before} </span>
                        )}
                        <span className="bg-amber-400/30 dark:bg-amber-500/30 text-amber-950 dark:text-amber-100 px-1.5 py-0.5 rounded-lg ring-1 ring-amber-500/40">
                          {item.arabicParts.matched}
                        </span>
                        {item.arabicParts.after && (
                          <span className="opacity-55"> {item.arabicParts.after}</span>
                        )}
                      </>
                    ) : (
                      item.fullArabic
                    )}
                  </p>
                  {item.arabicParts.isPartial && (
                    <div className="text-[11px] opacity-65 text-right font-sans">
                      Vurgulanan kısım Risale metninde geçen ayet parçasıdır.
                    </div>
                  )}
                </div>

                {/* Türkçe Meal Metni */}
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] uppercase tracking-wider opacity-60 font-sans font-bold">
                    Meali:
                  </div>
                  <p className="text-justify leading-relaxed text-sm sm:text-base">
                    {item.meal}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center space-y-3 opacity-80">
              <p
                dir="rtl"
                className="font-arabic text-xl text-amber-900 dark:text-amber-200"
              >
                {clickedArabicText}
              </p>
              <p className="text-sm">
                Bu Arapça ibare Kur’an-ı Kerim ayetleri arasında eşleşmedi (hadis-i şerif, dua veya kelâm-ı kibar olabilir).
              </p>
            </div>
          )}
        </div>

        {/* Alt Kısım - Kapatma Çubuğu */}
        <div className="px-5 py-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs opacity-75">
          <span>Kapatmak için dışarı dokunun veya Esc tuşuna basın</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
