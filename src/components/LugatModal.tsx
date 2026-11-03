import React, { useEffect } from 'react';
import { X, BookOpen, Copy, Check, Layers } from 'lucide-react';
import type { LugatSearchResult } from '../services/lugatService';

interface LugatModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: LugatSearchResult | null;
  searchedWord: string;
  theme: 'light' | 'sepia' | 'dark' | 'night';
}

export const LugatModal: React.FC<LugatModalProps> = ({
  isOpen,
  onClose,
  result,
  searchedWord,
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
    let text = '';
    if (result?.entry) {
      text = `${result.entry.k}\n\n${result.entry.a}`;
    } else if (result?.compoundItems && result.compoundItems.length > 0) {
      text = `${searchedWord} (Terkip)\n\n` +
        result.compoundItems
          .map((item) => `[${item.entry.k}]\n${item.entry.a}`)
          .join('\n\n---\n\n');
    }
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasData = Boolean(result?.entry || (result?.compoundItems && result.compoundItems.length > 0));

  return (
    <div
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div
        className={`w-full sm:max-w-xl max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl border ${getContainerBg()} overflow-hidden animate-in slide-in-from-bottom duration-200 select-none`}
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık Çubuğu */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              {result?.compoundItems && result.compoundItems.length > 0 ? (
                <Layers className="w-4 h-4" />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider opacity-60 font-medium">
                {result?.compoundItems && result.compoundItems.length > 0
                  ? 'Osmanlıca Terkip / Tamlama'
                  : 'Risale-i Nur Lügatı'}
              </div>
              <h3 className="text-lg font-serif font-bold tracking-wide truncate">
                {result?.entry?.k || searchedWord}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasData && (
              <button
                onClick={handleCopy}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-75 hover:opacity-100"
                title="Açıklamayı kopyala"
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

        {/* Gövde - Lügat Anlamı */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 text-sm sm:text-base leading-relaxed font-serif">
          {/* Durum 1: Terkip / Çoklu Kelime Eşleşmesi */}
          {result?.compoundItems && result.compoundItems.length > 0 ? (
            <div className="space-y-4">
              <div className="text-xs opacity-70 border-b border-black/10 dark:border-white/10 pb-2">
                "<span className="font-semibold">{searchedWord}</span>" terkibini oluşturan kelimeler:
              </div>

              {result.compoundItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border ${getCardBg()} space-y-2 shadow-xs`}
                >
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-1.5">
                    <span className="font-bold text-amber-800 dark:text-amber-400 tracking-wide text-base">
                      {item.entry.k}
                    </span>
                    {item.term.toLocaleLowerCase('tr-TR') !== item.entry.k.toLocaleLowerCase('tr-TR') && (
                      <span className="text-xs opacity-60">({item.term})</span>
                    )}
                  </div>
                  <div className="whitespace-pre-line text-justify text-xs sm:text-sm leading-relaxed">
                    {item.entry.a}
                  </div>
                </div>
              ))}
            </div>
          ) : result?.entry ? (
            /* Durum 2: Tekil Kelime Eşleşmesi */
            <div className="space-y-3">
              {searchedWord.toLocaleLowerCase('tr-TR') !==
                result.matchedKey.toLocaleLowerCase('tr-TR') && (
                <div className="text-xs px-3 py-1 rounded-lg border border-black/10 dark:border-white/10 inline-block opacity-75">
                  Metindeki şekli: <span className="font-semibold">{searchedWord}</span>
                </div>
              )}

              <div className="whitespace-pre-line text-justify selection:bg-amber-500/30">
                {result.entry.a}
              </div>
            </div>
          ) : (
            /* Durum 3: Bulunamadı */
            <div className="py-8 text-center space-y-2 opacity-80">
              <p>
                "<span className="font-semibold">{searchedWord}</span>" kelimesi veya terkibi lügatte bulunamadı.
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
