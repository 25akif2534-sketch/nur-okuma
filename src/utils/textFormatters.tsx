import React from 'react';
import { Bookmark } from 'lucide-react';
import { buildFlexibleRegex } from './searchUtils';

const ARABIC_CHUNK_REGEX = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+(?:[\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]*[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF])?)/g;
const FOOTNOTE_TOKEN_REGEX = /(\(H[aâ]şiye(?:\[\d+\])?\))/gi;

interface RenderRichTextOptions {
  highlightQuery?: string;
  withScrollTarget?: boolean;
  onOpenFootnote?: (num: string) => void;
}

/**
 * Verilen düz metni; arama vurguları, satır içi Arapça ibareler ve tıklanabilir Hâşiye düğmeleri ile zenginleştirir.
 */
export function renderRichText(
  text: string,
  options: RenderRichTextOptions = {}
): React.ReactNode {
  if (!text) return null;

  const { highlightQuery, withScrollTarget, onOpenFootnote } = options;
  const highlightRegex = highlightQuery && highlightQuery.trim().length >= 2
    ? buildFlexibleRegex(highlightQuery)
    : null;

  // 1. Kademe: Metni Hâşiye referanslarına göre böl: "(Hâşiye[1])" veya "(Hâşiye)"
  const footnoteParts = text.split(FOOTNOTE_TOKEN_REGEX);

  let firstMarked = false;

  return footnoteParts.map((part, fnIdx) => {
    // Hâşiye eşleşmesi mi?
    const fnMatch = part.match(/^\(H[aâ]şiye(?:\[(\d+)\])?\)$/i);
    if (fnMatch) {
      const num = fnMatch[1] || '1';
      return (
        <button
          key={`fn-${fnIdx}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFootnote?.(num);
          }}
          className="inline-flex items-center gap-0.5 mx-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 font-sans font-bold text-[11px] border border-amber-500/30 align-middle transition-transform active:scale-95 cursor-pointer select-none"
          title={`Hâşiye ${num} açıklamasını oku`}
        >
          <Bookmark className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
          <span>Hâşiye [{num}]</span>
        </button>
      );
    }

    // 2. Kademe: Kalan metin parçasındaki Arapça ibareleri ayır
    const arabicParts = part.split(ARABIC_CHUNK_REGEX);

    return (
      <React.Fragment key={`text-block-${fnIdx}`}>
        {arabicParts.map((subPart, arIdx) => {
          if (!subPart) return null;

          const isArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(subPart);

          if (isArabic) {
            return (
              <span
                key={`ar-${arIdx}`}
                dir="rtl"
                className="font-arabic text-[1.28em] font-normal leading-relaxed px-1 text-amber-950 dark:text-amber-100 inline-block align-baseline tracking-wide select-text"
              >
                {subPart}
              </span>
            );
          }

          // 3. Kademe: Latin/Türkçe metin üzerinde arama vurgusu varsa işaretle
          if (highlightRegex) {
            const hParts = subPart.split(highlightRegex);
            if (hParts.length > 1) {
              return hParts.map((hPart, hIdx) => {
                if (hIdx % 2 === 1) {
                  const isTarget = withScrollTarget && !firstMarked;
                  if (isTarget) firstMarked = true;
                  return (
                    <mark
                      key={`mark-${hIdx}`}
                      data-search-highlight={isTarget ? 'true' : undefined}
                      className="bg-amber-300 text-stone-950 px-1 py-0.5 rounded font-bold shadow-2xs"
                    >
                      {hPart}
                    </mark>
                  );
                }
                return <span key={`sub-${hIdx}`}>{hPart}</span>;
              });
            }
          }

          return <span key={`raw-${arIdx}`}>{subPart}</span>;
        })}
      </React.Fragment>
    );
  });
}
