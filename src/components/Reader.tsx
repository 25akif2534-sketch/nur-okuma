import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ChapterContent, ThemeMode, BookMeta, Passage } from '../types';
import { CROSS_BOOK_REDIRECTS } from '../utils/searchUtils';
import { renderRichText } from '../utils/textFormatters';
import {
  ArrowLeft,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Gauge,
  Search,
  GitFork,
  ExternalLink,
  Minus,
  Plus,
  Share2,
  Clock,
  Menu,
  ListTree,
  ChevronDown,
  Bookmark,
  BookOpen,
  X
} from 'lucide-react';
import { LugatModal } from './LugatModal';
import {
  searchLugat,
  cleanPunctuation,
  type LugatSearchResult,
} from '../services/lugatService';

interface ReaderProps {
  book: BookMeta;
  chapter: ChapterContent;
  theme: ThemeMode;
  fontSize: number;
  highlightQuery?: string;
  targetPassageId?: string;
  hasActiveMutalaaSession?: boolean;
  activeMutalaaConcept?: string;
  originBookTitle?: string;
  originChapterTitle?: string;
  isViewingReference?: boolean;
  onReturnToOrigin?: () => void;
  onCloseMutalaaSession?: () => void;
  onBack: () => void;
  onThemeChange: (theme: ThemeMode) => void;
  onFontSizeChange: (delta: number) => void;
  onNextChapter: () => void;
  onPrevChapter: () => void;
  onOpenSpeedReader: (startFromText?: string) => void;
  onOpenSearch: () => void;
  onOpenMutalaa: (passage: Passage, snippet?: string) => void;
  onReopenMutalaa?: () => void;
  onNavigateToBookChapter?: (bookId: string, chapterId: string) => void;
  onProgressChange?: (percent: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_LETTER_REGEX = /[a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ]/;

function isArabicOnlyLine(line: string): boolean {
  return ARABIC_CHAR_REGEX.test(line) && !LATIN_LETTER_REGEX.test(line);
}

const TezhipDivider: React.FC = () => (
  <div
    className="flex items-center justify-center gap-3 select-none opacity-55 text-amber-800 dark:text-amber-400 my-7 py-1"
    aria-hidden="true"
  >
    <span className="h-px w-14 sm:w-24 bg-gradient-to-r from-transparent to-amber-700/70 dark:to-amber-400/70" />
    <span className="w-2 h-2 rounded-full border border-amber-700 dark:border-amber-400" />
    <span className="h-px w-14 sm:w-24 bg-gradient-to-l from-transparent to-amber-700/70 dark:to-amber-400/70" />
  </div>
);

async function generateAndShareQuoteCard(
  quoteText: string,
  bookTitle: string,
  chapterTitle: string
): Promise<string> {
  const cleanQuote = quoteText.replace(/\s+/g, ' ').trim();
  const clippedQuote =
    cleanQuote.length > 520 ? cleanQuote.slice(0, 517).trim() + '...' : cleanQuote;

  const canvas = document.createElement('canvas');
  const width = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'Hata';

  const fontSize = clippedQuote.length > 320 ? 34 : clippedQuote.length > 180 ? 40 : 46;
  const lineHeight = Math.round(fontSize * 1.62);
  ctx.font = `500 ${fontSize}px "Literata", Georgia, serif`;

  const maxTextWidth = width - 220;
  const words = clippedQuote.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxTextWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const textBlockHeight = lines.length * lineHeight;
  const height = Math.max(1080, textBlockHeight + 460);
  canvas.width = width;
  canvas.height = height;

  // Sepya Zemin
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#fdf6e4');
  grad.addColorStop(1, '#f4e3c1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Dış ve İç Tezhip Çerçevesi
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.strokeStyle = 'rgba(146, 64, 14, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(64, 64, width - 128, height - 128);

  // Köşe Süsleri
  const corners = [
    [64, 64],
    [width - 64, 64],
    [64, height - 64],
    [width - 64, height - 64],
  ];
  ctx.fillStyle = '#b45309';
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Üst Başlık
  ctx.fillStyle = '#92400e';
  ctx.font = '700 24px "Literata", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('RİSALE-İ NUR KÜLLİYATI', width / 2, 140);

  // Üst Motif Çizgisi
  ctx.strokeStyle = 'rgba(146, 64, 14, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 140, 168);
  ctx.lineTo(width / 2 + 140, 168);
  ctx.stroke();

  // Alıntı Metni
  ctx.fillStyle = '#2c1e10';
  ctx.font = `500 ${fontSize}px "Literata", Georgia, serif`;
  const startY = Math.round((height - textBlockHeight) / 2) + Math.round(fontSize * 0.35);

  lines.forEach((line, idx) => {
    ctx.fillText(line, width / 2, startY + idx * lineHeight);
  });

  // Alt Kaynak Bilgisi
  const footerY = height - 135;
  ctx.strokeStyle = 'rgba(146, 64, 14, 0.4)';
  ctx.beginPath();
  ctx.moveTo(width / 2 - 100, footerY - 42);
  ctx.lineTo(width / 2 + 100, footerY - 42);
  ctx.stroke();

  ctx.fillStyle = '#78350f';
  ctx.font = '700 28px "Literata", Georgia, serif';
  ctx.fillText(`${bookTitle} • ${chapterTitle}`, width / 2, footerY);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );
  if (!blob) return 'Hata';

  const file = new File([blob], 'risale-i-nur-alinti.png', { type: 'image/png' });

  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: `${bookTitle} • ${chapterTitle}`,
        text: `"${clippedQuote}" — ${bookTitle}, ${chapterTitle}`,
      });
      return 'Alıntı kartı paylaşıldı';
    } catch {
      // Kullanıcı paylaşımı kapattıysa indirmeye geç
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'risale-i-nur-alinti.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return 'Alıntı kartı görsel olarak indirildi';
}

function getWordAtPoint(x: number, y: number): string | null {
  let range: Range | null = null;
  const doc = document as any;
  if (doc.caretPositionFromPoint) {
    const pos = doc.caretPositionFromPoint(x, y);
    if (pos && pos.offsetNode && pos.offsetNode.nodeType === Node.TEXT_NODE) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
    }
  } else if (doc.caretRangeFromPoint) {
    range = doc.caretRangeFromPoint(x, y);
  }

  if (range && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
    const textNode = range.startContainer as Text;
    const text = textNode.textContent || '';
    const offset = range.startOffset;

    // offset öncesi ve sonrası kelime karakterlerini tara
    let start = offset;
    while (start > 0 && !/[\s"'“‘(\[<{«.,:;!?»}>*]/.test(text[start - 1])) {
      start--;
    }
    let end = offset;
    while (end < text.length && !/[\s"'”’)\],:;.!?»}>*]/.test(text[end])) {
      end++;
    }

    const word = text.slice(start, end).trim();
    if (word.length >= 2) return word;
  }
  return null;
}

export const Reader: React.FC<ReaderProps> = ({
  book,
  chapter,
  theme,
  fontSize,
  highlightQuery,
  targetPassageId,
  hasActiveMutalaaSession,
  activeMutalaaConcept,
  originBookTitle,
  originChapterTitle,
  isViewingReference,
  onReturnToOrigin,
  onCloseMutalaaSession,
  onBack,
  onThemeChange,
  onFontSizeChange,
  onNextChapter,
  onPrevChapter,
  onOpenSpeedReader,
  onOpenSearch,
  onOpenMutalaa,
  onReopenMutalaa,
  onNavigateToBookChapter,
  onProgressChange,
  hasNext,
  hasPrev,
}) => {
  const [appearanceMenuOpen, setAppearanceMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState<number>(() => {
    try {
      const savedPct = Number(
        localStorage.getItem(`nur_scroll_${book.id}_${chapter.id}`)
      );
      if (!Number.isNaN(savedPct) && savedPct > 2 && savedPct < 98) {
        return savedPct;
      }
    } catch {
      // ignore
    }
    return 0;
  });
  const [quoteToast, setQuoteToast] = useState<string | null>(null);
  const [activeFootnote, setActiveFootnote] = useState<{ num: string; text: string } | null>(null);
  const onProgressChangeRef = useRef(onProgressChange);

  // Bu bölümdeki tüm hâşiyeleri (dipnotları) haritalandır
  const footnotesMap = useMemo(() => {
    const map: Record<string, string> = {};
    (chapter.passages || []).forEach((p) => {
      const lines = p.text.split(/\r?\n/);
      lines.forEach((line) => {
        const m = line.match(/^\[(\d+)\]\s*H[aâ]şiye:\s*(.+)$/i);
        if (m) {
          map[m[1]] = m[2].trim();
        } else {
          const singleM = line.match(/^H[aâ]şiye:\s*(.+)$/i);
          if (singleM && !map['1']) {
            map['1'] = singleM[1].trim();
          }
        }
      });
    });
    return map;
  }, [chapter.passages]);

  // Günlük Okuma Süresi Sayacı (Dakika başı aktif okumayı kaydeder)
  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        try {
          const raw = localStorage.getItem(`nur_daily_${todayKey}`);
          const data = raw ? JSON.parse(raw) : { date: todayKey, minutes: 0, chaptersCompleted: [] };
          data.minutes = (data.minutes || 0) + 1;
          localStorage.setItem(`nur_daily_${todayKey}`, JSON.stringify(data));
        } catch {
          // ignore
        }
      }
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Bahis %80'den fazla okunduysa bugünün tamamlanan bahislerine ekle
  useEffect(() => {
    if (scrollProgress >= 80) {
      const todayKey = new Date().toISOString().slice(0, 10);
      try {
        const raw = localStorage.getItem(`nur_daily_${todayKey}`);
        const data = raw ? JSON.parse(raw) : { date: todayKey, minutes: 0, chaptersCompleted: [] };
        const key = `${book.id}/${chapter.id}`;
        if (!data.chaptersCompleted) data.chaptersCompleted = [];
        if (!data.chaptersCompleted.includes(key)) {
          data.chaptersCompleted.push(key);
          localStorage.setItem(`nur_daily_${todayKey}`, JSON.stringify(data));
        }
      } catch {
        // ignore
      }
    }
  }, [scrollProgress, book.id, chapter.id]);

  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  }, [onProgressChange]);

  // Metin seçildiğinde açılan pop-up menü durumu
  const [selectionMenu, setSelectionMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    selectedText: string;
    passage: Passage | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    selectedText: '',
    passage: null,
  });

  // Lügat Pop-up Kartı Durumu
  const [lugatModalState, setLugatModalState] = useState<{
    isOpen: boolean;
    searchedWord: string;
    result: LugatSearchResult | null;
  }>({
    isOpen: false,
    searchedWord: '',
    result: null,
  });

  const longPressTimerRef = useRef<any>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const openLugat = async (word: string) => {
    // Seçim menüsünü kapat ve tarayıcı seçimini temizle
    setSelectionMenu((prev) => ({ ...prev, visible: false }));
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      // ignore
    }
    const cleaned = cleanPunctuation(word);
    if (!cleaned) return;
    const res = await searchLugat(cleaned);
    setLugatModalState({
      isOpen: true,
      searchedWord: cleaned,
      result: res,
    });
  };

  const handlePointerDown = (clientX: number, clientY: number, psg: Passage) => {
    if (lugatModalState.isOpen) return;
    touchStartPosRef.current = { x: clientX, y: clientY };

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      const word = getWordAtPoint(clientX, clientY) || window.getSelection()?.toString().trim();
      if (word && word.length >= 2) {
        if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
          try {
            (navigator as any).vibrate(30);
          } catch {
            // ignore
          }
        }
        setSelectionMenu({
          visible: true,
          x: 0,
          y: 0,
          selectedText: word,
          passage: psg,
        });
      }
    }, 450);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!touchStartPosRef.current) return;
    const dist = Math.hypot(
      clientX - touchStartPosRef.current.x,
      clientY - touchStartPosRef.current.y
    );
    if (dist > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const getThemeClass = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#fbf0d9] text-[#433422] selection:bg-[#ecd6ad]';
      case 'dark':
        return 'bg-[#1c1917] text-[#e7e5e4] selection:bg-[#44403c]';
      case 'night':
        // Gece Sepyası: Koyu kahve zemin üzerine göz yormayan sıcak krem yazı
        return 'bg-[#16120e] text-[#dfd2c0] selection:bg-[#382d22]';
      case 'light':
      default:
        return 'bg-[#fafaf9] text-[#292524] selection:bg-[#e7e5e4]';
    }
  };

  const getHeaderBgClass = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#fbf0d9]/95 border-amber-900/15';
      case 'dark':
        return 'bg-[#1c1917]/95 border-white/10';
      case 'night':
        return 'bg-[#16120e]/95 border-amber-900/25';
      case 'light':
      default:
        return 'bg-[#fafaf9]/95 border-black/10';
    }
  };

  const getMenuPopoverClass = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#f7ebcf] text-[#3e2e1c] border-amber-900/25';
      case 'dark':
        return 'bg-[#262320] text-[#e7e5e4] border-zinc-700';
      case 'night':
        return 'bg-[#211b15] text-[#e6dac8] border-amber-900/30';
      case 'light':
      default:
        return 'bg-white text-stone-900 border-stone-200';
    }
  };

  const passages: Passage[] = useMemo(
    () =>
      chapter.passages && chapter.passages.length > 0
        ? chapter.passages
        : [
            {
              id: 'p-1',
              title: `${book.title} • ${chapter.title}`,
              shortTitle: chapter.title,
              text: chapter.rawContent || '',
            },
          ],
    [book.title, chapter.passages, chapter.rawContent, chapter.title]
  );

  // Bu bahsin içindeki alt başlıklar (1. Makam, 2. Makam, Hâtime vb.)
  const chapterSubHeadings = useMemo(() => {
    const list: Array<{ id: string; title: string }> = [];
    const seen = new Set<string>();
    for (const p of passages) {
      if (
        p.shortTitle &&
        p.shortTitle !== chapter.title &&
        p.shortTitle.toLocaleLowerCase('tr-TR') !==
          chapter.title.toLocaleLowerCase('tr-TR') &&
        !seen.has(p.shortTitle)
      ) {
        seen.add(p.shortTitle);
        list.push({ id: p.id, title: p.shortTitle });
      }
    }
    return list;
  }, [passages, chapter.title]);

  // Bahsin toplam kelime sayısı ve tahmini okuma süresi (180 kelime/dk)
  const totalMinutes = useMemo(() => {
    const wordCount = passages.reduce(
      (acc, p) => acc + p.text.trim().split(/\s+/).length,
      0
    );
    return Math.max(1, Math.round(wordCount / 180));
  }, [passages]);

  const remainingMinutes = Math.max(
    1,
    Math.ceil(totalMinutes * (1 - scrollProgress / 100))
  );

  // Sabit Üst Çubuk + İlerleme Çizgisi + Başa Dön Butonu + Kaydırma Hafızası
  useEffect(() => {
    const scrollKey = `nur_scroll_${book.id}_${chapter.id}`;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct =
        docHeight > 20
          ? Math.min(100, Math.max(0, Math.round((currentY / docHeight) * 100)))
          : 100;

      setScrollProgress(pct);

      try {
        localStorage.setItem(scrollKey, String(pct));
      } catch {
        // ignore storage errors
      }
      onProgressChangeRef.current?.(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [book.id, chapter.id]);

  // Bahis ilk açıldığında (arama vurgusu yoksa) kaydedilmiş yüzdeden devam et
  useEffect(() => {
    if (targetPassageId || highlightQuery) return;
    try {
      const savedPct = Number(
        localStorage.getItem(`nur_scroll_${book.id}_${chapter.id}`)
      );
      if (!Number.isNaN(savedPct) && savedPct > 2 && savedPct < 98) {
        const timer = setTimeout(() => {
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          if (docHeight > 100) {
            window.scrollTo({
              top: Math.round((savedPct / 100) * docHeight),
              behavior: 'smooth',
            });
          }
        }, 120);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, [book.id, chapter.id, targetPassageId, highlightQuery]);

  // Mouse veya dokunmatik ekranda metin seçildiğinde tetiklenir
  const updateSelectionFromPassage = (psg: Passage) => {
    if (lugatModalState.isOpen) return;
    setTimeout(() => {
      if (lugatModalState.isOpen) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const text = sel.toString().trim();
      if (text.length >= 2) {
        setSelectionMenu({
          visible: true,
          x: 0,
          y: 0,
          selectedText: text,
          passage: psg,
        });
      }
    }, 70);
  };

  // Ekranda seçim kaldırıldığında veya dışarı tıklandığında pop-up ve menüleri kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#selection-popup') && !target.closest('[role="dialog"]')) {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setSelectionMenu((prev) => ({ ...prev, visible: false }));
        }
      }
      if (!target.closest('#appearance-menu-container') && !target.closest('article')) {
        setAppearanceMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAppearanceMenuOpen(false);
        setSelectionMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Arama sonucundan gelindiyse doğrudan renkli kelimenin olduğu cümleye kaydır
  useEffect(() => {
    if (!targetPassageId && !highlightQuery) return;
    const timer = setTimeout(() => {
      const passageEl = targetPassageId ? document.getElementById(targetPassageId) : document;
      const markEl = passageEl?.querySelector('[data-search-highlight="true"]') as HTMLElement | null;
      if (markEl) {
        markEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (targetPassageId) {
        const el = document.getElementById(targetPassageId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [chapter.id, targetPassageId, highlightQuery]);

  return (
    <div className={`min-h-screen w-full overflow-x-hidden flex flex-col transition-colors duration-200 ${getThemeClass()}`}>
      {/* Üst İnce Altın İlerleme Çizgisi (Her zaman en üstte sabit) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-amber-900/10 dark:bg-amber-400/10 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Alıntı Kartı Bildirimi */}
      {quoteToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-stone-900 text-amber-200 border border-amber-500/40 shadow-xl text-xs font-serif">
          {quoteToast}
        </div>
      )}

      {/* Metin Seçim Çubuğu — Lügat, Çapraz İzah, Buradan Hızlı Oku ve Alıntı Kartı */}
      {selectionMenu.visible && selectionMenu.passage && (
        <div
          id="selection-popup"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-stone-900 text-white rounded-2xl shadow-2xl border border-amber-500/50 text-xs sm:text-sm max-w-[95vw]"
        >
          <button
            onClick={() => {
              const textToSearch = selectionMenu.selectedText;
              setSelectionMenu((prev) => ({ ...prev, visible: false }));
              openLugat(textToSearch);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 border border-amber-400/40 transition-colors font-semibold text-white shrink-0 shadow-xs"
            title="Seçilen kelimenin lügat anlamına bak"
          >
            <BookOpen className="w-4 h-4 text-amber-200 shrink-0" />
            <span>Lügat</span>
          </button>

          <button
            onClick={() => {
              if (selectionMenu.passage) {
                onOpenMutalaa(selectionMenu.passage, selectionMenu.selectedText);
                setSelectionMenu((prev) => ({ ...prev, visible: false }));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 transition-colors font-semibold text-white truncate max-w-[52vw] sm:max-w-xs"
          >
            <GitFork className="w-4 h-4 shrink-0" />
            <span className="truncate">
              Çapraz İzah: "{selectionMenu.selectedText.slice(0, 20)}
              {selectionMenu.selectedText.length > 20 ? '...' : ''}"
            </span>
          </button>

          <button
            onClick={() => {
              onOpenSpeedReader(selectionMenu.selectedText);
              setSelectionMenu((prev) => ({ ...prev, visible: false }));
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-500/40 transition-colors font-semibold text-amber-300 shrink-0"
            title="Hızlı okumayı seçtiğiniz bu cümleden itibaren başlat"
          >
            <Gauge className="w-4 h-4 shrink-0" />
            <span>Buradan Hızlı Oku</span>
          </button>

          <button
            onClick={async () => {
              const textToShare = selectionMenu.selectedText;
              setSelectionMenu((prev) => ({ ...prev, visible: false }));
              const msg = await generateAndShareQuoteCard(
                textToShare,
                book.title,
                chapter.title
              );
              setQuoteToast(msg);
              setTimeout(() => setQuoteToast(null), 2800);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 transition-colors font-semibold text-stone-200 shrink-0"
            title="Seçilen cümleyi sepya zeminli Alıntı Kartı görseli olarak paylaş veya indir"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Alıntı Kartı</span>
          </button>

          <button
            onClick={() => {
              setSelectionMenu((prev) => ({ ...prev, visible: false }));
              window.getSelection()?.removeAllRanges();
            }}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-400 hover:text-white transition-colors shrink-0 ml-0.5"
            title="Seçimi Kapat (Esc)"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Ultra Sade Sabit Üst Çubuk: Solda Geri, Ortada Tam Başlık, Sağda Tek "Menü" Düğmesi */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 w-full backdrop-blur-md border-b px-3 sm:px-4 py-2 transition-colors duration-200 shadow-xs ${getHeaderBgClass()}`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs sm:text-sm font-medium transition-colors shrink-0"
            title="Kitap Listesine Dön"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kitaplar</span>
          </button>

          {/* Ortada Kesilmeyen Geniş Başlık (Alt başlık varsa tıklayınca menüyü açar) */}
          <button
            onClick={() => setAppearanceMenuOpen((prev) => !prev)}
            className="text-center truncate flex-1 min-w-0 px-2 py-0.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Alt başlıkları ve okuma araçlarını görmek için dokunun"
          >
            <div className="text-[11px] opacity-75 font-serif truncate">
              {book.title}
            </div>
            <div className="text-xs sm:text-sm font-serif font-bold truncate flex items-center justify-center gap-1">
              <span className="truncate">{chapter.title}</span>
              {chapterSubHeadings.length > 0 && (
                <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
              )}
            </div>
          </button>

          {/* Sağda Tek "Menü" Düğmesi (Buton kalabalığına son verir) */}
          <div id="appearance-menu-container" className="relative shrink-0">
            <button
              onClick={() => setAppearanceMenuOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                appearanceMenuOpen
                  ? 'border-amber-600 bg-amber-500/20 text-amber-900 dark:text-amber-300'
                  : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="Okuma Araçları, Alt Başlıklar ve Görünüm Menüsü"
              aria-label="Menü"
            >
              <Menu className="w-4 h-4" />
              <span>Menü</span>
            </button>

            {appearanceMenuOpen && (
              <>
                {/* Dışarı tıklandığında menüyü kapatan görünmez perde */}
                <div
                  className="fixed inset-0 z-40 bg-black/10"
                  onClick={() => setAppearanceMenuOpen(false)}
                />
                <div
                  className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-2xl border p-4 z-50 space-y-4 max-h-[82vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 ${getMenuPopoverClass()}`}
                >
                  {/* Menü Başlığı ve Kapatma Butonu */}
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2.5">
                    <span className="font-serif font-bold text-sm tracking-wide text-amber-900 dark:text-amber-300">
                      Okuma Menüsü
                    </span>
                    <button
                      onClick={() => setAppearanceMenuOpen(false)}
                      className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 transition-colors"
                      title="Menüyü Kapat (Esc)"
                      aria-label="Kapat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. Okuma Araçları (Hızlı Oku, Çapraz İzah, Külliyat'ta Ara) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider opacity-70">
                    <span>Okuma Araçları</span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                      %{scrollProgress} · <Clock className="w-2.5 h-2.5 inline" /> ≈{remainingMinutes} dk
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      onClick={() => {
                        setAppearanceMenuOpen(false);
                        onOpenSpeedReader();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        <span>Bu Bahsi Hızlı Oku</span>
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-80" />
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          setAppearanceMenuOpen(false);
                          if (hasActiveMutalaaSession && onReopenMutalaa) {
                            onReopenMutalaa();
                          } else if (passages.length > 0) {
                            onOpenMutalaa(passages[0]);
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-amber-600/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 text-xs font-semibold transition-colors"
                      >
                        <GitFork className="w-3.5 h-3.5 shrink-0" />
                        <span>Çapraz İzah</span>
                      </button>

                      <button
                        onClick={() => {
                          setAppearanceMenuOpen(false);
                          onOpenSearch();
                        }}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold transition-colors"
                      >
                        <Search className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                        <span>Külliyat'ta Ara</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Bu Bahsin Alt Başlıkları (1. Makam, 2. Makam, Hâtime vb.) */}
                {chapterSubHeadings.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-70">
                      <ListTree className="w-3.5 h-3.5" />
                      <span>Bu Bahsin Alt Başlıkları ({chapterSubHeadings.length})</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                      {chapterSubHeadings.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setAppearanceMenuOpen(false);
                            const el = document.getElementById(sub.id);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-serif hover:bg-amber-600 hover:text-white transition-colors flex items-center justify-between"
                        >
                          <span className="truncate">• {sub.title}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Yazı Boyutu Ayarı */}
                <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider opacity-70">
                    <span>Yazı Boyutu</span>
                    <span className="font-mono">{fontSize} px</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onFontSizeChange(-1)}
                      className="flex-1 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-1 text-xs font-bold"
                      title="Yazıyı Küçült"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Küçült</span>
                    </button>
                    <button
                      onClick={() => onFontSizeChange(1)}
                      className="flex-1 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-1 text-xs font-bold"
                      title="Yazıyı Büyüt"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Büyüt</span>
                    </button>
                  </div>
                </div>

                {/* 4. Tema Seçici (4 Tema: Sepya, Açık, Koyu, Gece Sepyası — Yıldız/Gemini ikonu kaldırıldı) */}
                <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                    Okuma Teması
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs font-medium">
                    <button
                      onClick={() => onThemeChange('sepia')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                        theme === 'sepia'
                          ? 'border-amber-600 bg-amber-500/20 font-bold ring-1 ring-amber-600'
                          : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <BookMarked className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span>Sepya</span>
                    </button>

                    <button
                      onClick={() => onThemeChange('light')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                        theme === 'light'
                          ? 'border-amber-600 bg-amber-500/20 font-bold ring-1 ring-amber-600'
                          : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Açık</span>
                    </button>

                    <button
                      onClick={() => onThemeChange('dark')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                        theme === 'dark'
                          ? 'border-amber-500 bg-amber-500/20 font-bold ring-1 ring-amber-500'
                          : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Koyu</span>
                    </button>

                    <button
                      onClick={() => onThemeChange('night')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                        theme === 'night'
                          ? 'border-amber-500 bg-amber-500/20 font-bold ring-1 ring-amber-500'
                          : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Gece Sepyası</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          </div>
        </div>

        {/* Çapraz İzah ile bir atfa gidildiyse: Listeye Dönüş ve Mütalaayı Bitir Çubuğu */}
        {isViewingReference && (
          <div className="max-w-4xl mx-auto mt-2 pt-2 border-t border-amber-500/25 flex items-center gap-2">
            <button
              onClick={onReturnToOrigin}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors"
              title="Çapraz İzah arama listesine geri dön"
            >
              <GitFork className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                ↩ Çapraz İzah Listesine Dön ({activeMutalaaConcept ? `"${activeMutalaaConcept}"` : originBookTitle ? `${originBookTitle}${originChapterTitle ? ` • ${originChapterTitle}` : ''}` : 'Atıf'})
              </span>
            </button>

            {onCloseMutalaaSession && (
              <button
                onClick={onCloseMutalaaSession}
                className="px-3 py-2 rounded-xl border border-amber-700/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-semibold shrink-0 transition-colors"
                title="Mütalaayı bitir ve asıl kitaptaki okuma yerine dön"
              >
                <X className="w-3.5 h-3.5 inline mr-1" />
                <span>Bitir</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Reading Canvas */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 pt-16 sm:pt-20 pb-10 sm:pb-16">
        <div className="text-center mb-10 pb-6 border-b border-amber-900/15 dark:border-amber-400/15">
          <span className="text-xs uppercase tracking-widest opacity-65 font-serif">
            {book.title}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mt-2">
            {chapter.title}
          </h2>
        </div>

        {/* Kesintisiz Bahis Metni */}
        <div className="space-y-6">
          {passages.map((psg) => {
            const paragraphs = psg.text
              .split(/\r?\n/)
              .map((p) => p.trim())
              .filter((p) => p.length > 0);

            return (
              <section
                key={psg.id}
                id={psg.id}
                onMouseUp={() => {
                  handlePointerUp();
                  updateSelectionFromPassage(psg);
                }}
                onTouchEnd={() => {
                  handlePointerUp();
                  updateSelectionFromPassage(psg);
                }}
                className="scroll-mt-24"
              >
                <article
                  className="space-y-6 leading-relaxed font-serif text-justify select-text"
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY, psg);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length === 1) {
                      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onMouseDown={(e) => {
                    if (e.button === 0) {
                      handlePointerDown(e.clientX, e.clientY, psg);
                    }
                  }}
                  onMouseMove={(e) => {
                    handlePointerMove(e.clientX, e.clientY);
                  }}
                  onDoubleClick={(e) => {
                    const word = getWordAtPoint(e.clientX, e.clientY) || window.getSelection()?.toString().trim();
                    if (word && word.length >= 2) {
                      setSelectionMenu({
                        visible: true,
                        x: 0,
                        y: 0,
                        selectedText: word,
                        passage: psg,
                      });
                    }
                  }}
                >
                  {paragraphs.map((para, i) => {
                    if (para === '***') {
                      return <TezhipDivider key={i} />;
                    }

                    const isSubHeading =
                      psg.shortTitle &&
                      psg.shortTitle !== chapter.title &&
                      para === psg.shortTitle;

                    if (isSubHeading) {
                      return (
                        <h3
                          key={i}
                          className="font-bold text-amber-800 dark:text-amber-300 pt-6 pb-2 text-center indent-0 tracking-wide"
                          style={{ fontSize: `${Math.round(fontSize * 1.15)}px` }}
                        >
                          {renderRichText(para, {
                            highlightQuery,
                            withScrollTarget: !targetPassageId || psg.id === targetPassageId,
                          })}
                        </h3>
                      );
                    }

                    // Hâşiye (Dipnot) tanımı paragrafı: [1] Hâşiye: ...
                    const fnDefMatch = para.match(/^\[(\d+)\]\s*H[aâ]şiye:\s*(.+)$/i);
                    if (fnDefMatch) {
                      return (
                        <aside
                          key={i}
                          className="my-4 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border-l-4 border-amber-600 dark:border-amber-400 text-stone-900 dark:text-stone-100 shadow-xs indent-0"
                        >
                          <div className="flex items-center gap-2 font-bold font-serif text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5">
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Hâşiye [{fnDefMatch[1]}]</span>
                          </div>
                          <p className="font-serif text-sm sm:text-base leading-relaxed text-justify opacity-95">
                            {renderRichText(fnDefMatch[2], {
                              highlightQuery,
                              withScrollTarget: !targetPassageId || psg.id === targetPassageId,
                              onOpenFootnote: (num) => {
                                const noteText = footnotesMap[num] || fnDefMatch[2];
                                setActiveFootnote({ num, text: noteText });
                              },
                            })}
                          </p>
                        </aside>
                      );
                    }

                    if (isArabicOnlyLine(para)) {
                      return (
                        <p
                          key={i}
                          dir="rtl"
                          className="font-arabic text-center indent-0 my-5 py-3 px-4 rounded-2xl bg-black/[0.025] dark:bg-white/[0.025] text-amber-950 dark:text-amber-100 tracking-wide select-text border border-amber-900/10 dark:border-amber-400/10 shadow-xs"
                          style={{
                            fontSize: `${Math.max(22, Math.round(fontSize * 1.38))}px`,
                            lineHeight: 2.35,
                          }}
                        >
                          {renderRichText(para, {
                            highlightQuery,
                            withScrollTarget: !targetPassageId || psg.id === targetPassageId,
                          })}
                        </p>
                      );
                    }

                    return (
                      <p key={i} className="indent-6 sm:indent-8 tracking-normal">
                        {renderRichText(para, {
                          highlightQuery,
                          withScrollTarget: !targetPassageId || psg.id === targetPassageId,
                          onOpenFootnote: (num) => {
                            const noteText = footnotesMap[num] || 'Bu hâşiyenin metni sayfa sonunda bulunmaktadır.';
                            setActiveFootnote({ num, text: noteText });
                          },
                        })}
                      </p>
                    );
                  })}
                </article>
              </section>
            );
          })}
        </div>

        {/* Başka Mecmuada Neşredilen Bahisler İçin Doğrudan Geçiş Kutusu */}
        {CROSS_BOOK_REDIRECTS[`${book.id}/${chapter.id}`] && onNavigateToBookChapter && (
          <div className="mt-8 p-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Doğrudan Bağlantı
              </div>
              <p className="text-sm font-serif">
                Bu risalenin tam metni{' '}
                <strong>{CROSS_BOOK_REDIRECTS[`${book.id}/${chapter.id}`].label}</strong>{' '}
                bölümünde yer almaktadır.
              </p>
            </div>
            <button
              onClick={() => {
                const target = CROSS_BOOK_REDIRECTS[`${book.id}/${chapter.id}`];
                if (target) {
                  onNavigateToBookChapter(target.bookId, target.chapterId);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-sm shrink-0 transition-transform active:scale-95"
            >
              <span>Bahsin Olduğu Yere Git</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bahis Sonu Tezhip Mührü */}
        <div className="mt-12">
          <TezhipDivider />
        </div>

        {/* Bottom Chapter Navigation */}
        <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
          <button
            onClick={onPrevChapter}
            disabled={!hasPrev}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium transition-all ${
              !hasPrev
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-black/5 dark:hover:bg-white/5 active:scale-95'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Önceki Bahis
          </button>

          <button
            onClick={onNextChapter}
            disabled={!hasNext}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium transition-all ${
              !hasNext
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-black/5 dark:hover:bg-white/5 active:scale-95'
            }`}
          >
            Sonraki Bahis
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Hâşiye (Dipnot) Tıklama Açılır Kartı */}
      {activeFootnote && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveFootnote(null)}
        >
          <div
            className={`w-full max-w-xl rounded-3xl shadow-2xl border p-5 sm:p-6 space-y-4 max-h-[85vh] flex flex-col ${
              theme === 'sepia'
                ? 'bg-[#fbf0d9] text-[#433422] border-amber-800/30'
                : theme === 'night'
                ? 'bg-[#181410] text-[#dfd2c0] border-amber-500/30'
                : theme === 'dark'
                ? 'bg-zinc-900 text-zinc-100 border-zinc-700'
                : 'bg-white text-stone-900 border-stone-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold font-serif text-base sm:text-lg">
                <Bookmark className="w-4 h-4 text-amber-600" />
                <span>Hâşiye [{activeFootnote.num}]</span>
              </div>
              <button
                onClick={() => setActiveFootnote(null)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto pr-1 font-serif text-sm sm:text-base leading-relaxed text-justify space-y-3 select-text"
              onMouseUp={() => {
                handlePointerUp();
                const fnPassage: Passage = {
                  id: `footnote-${activeFootnote.num}`,
                  title: `${book.title} • ${chapter.title} (Hâşiye [${activeFootnote.num}])`,
                  shortTitle: `Hâşiye [${activeFootnote.num}]`,
                  text: activeFootnote.text,
                };
                updateSelectionFromPassage(fnPassage);
              }}
              onTouchEnd={() => {
                handlePointerUp();
                const fnPassage: Passage = {
                  id: `footnote-${activeFootnote.num}`,
                  title: `${book.title} • ${chapter.title} (Hâşiye [${activeFootnote.num}])`,
                  shortTitle: `Hâşiye [${activeFootnote.num}]`,
                  text: activeFootnote.text,
                };
                updateSelectionFromPassage(fnPassage);
              }}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  const fnPassage: Passage = {
                    id: `footnote-${activeFootnote.num}`,
                    title: `${book.title} • ${chapter.title} (Hâşiye [${activeFootnote.num}])`,
                    shortTitle: `Hâşiye [${activeFootnote.num}]`,
                    text: activeFootnote.text,
                  };
                  handlePointerDown(e.touches[0].clientX, e.touches[0].clientY, fnPassage);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 1) {
                  handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onMouseDown={(e) => {
                if (e.button === 0) {
                  const fnPassage: Passage = {
                    id: `footnote-${activeFootnote.num}`,
                    title: `${book.title} • ${chapter.title} (Hâşiye [${activeFootnote.num}])`,
                    shortTitle: `Hâşiye [${activeFootnote.num}]`,
                    text: activeFootnote.text,
                  };
                  handlePointerDown(e.clientX, e.clientY, fnPassage);
                }
              }}
              onMouseMove={(e) => {
                handlePointerMove(e.clientX, e.clientY);
              }}
              onDoubleClick={(e) => {
                const word = getWordAtPoint(e.clientX, e.clientY) || window.getSelection()?.toString().trim();
                if (word && word.length >= 2) {
                  const fnPassage: Passage = {
                    id: `footnote-${activeFootnote.num}`,
                    title: `${book.title} • ${chapter.title} (Hâşiye [${activeFootnote.num}])`,
                    shortTitle: `Hâşiye [${activeFootnote.num}]`,
                    text: activeFootnote.text,
                  };
                  setSelectionMenu({
                    visible: true,
                    x: 0,
                    y: 0,
                    selectedText: word,
                    passage: fnPassage,
                  });
                }
              }}
            >
              {renderRichText(activeFootnote.text, { highlightQuery })}
            </div>

            <div className="pt-2 flex justify-end border-t border-black/5 dark:border-white/5">
              <button
                onClick={() => setActiveFootnote(null)}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all"
              >
                Kapat ve Okumaya Dön
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kelime Üzerine Basılı Tutulduğunda Açılan Lügat Kartı */}
      <LugatModal
        isOpen={lugatModalState.isOpen}
        onClose={() => {
          setLugatModalState((prev) => ({ ...prev, isOpen: false }));
          setSelectionMenu((prev) => ({ ...prev, visible: false }));
          try {
            window.getSelection()?.removeAllRanges();
          } catch {
            // ignore
          }
        }}
        result={lugatModalState.result}
        searchedWord={lugatModalState.searchedWord}
        theme={theme}
      />
    </div>
  );
};
