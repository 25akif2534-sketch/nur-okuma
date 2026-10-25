import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ChapterContent, ThemeMode, BookMeta, Passage } from '../types';
import { renderHighlightedText, CROSS_BOOK_REDIRECTS } from '../utils/searchUtils';
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
  ChevronDown
} from 'lucide-react';

interface ReaderProps {
  book: BookMeta;
  chapter: ChapterContent;
  theme: ThemeMode;
  fontSize: number;
  highlightQuery?: string;
  targetPassageId?: string;
  hasActiveMutalaaSession?: boolean;
  activeMutalaaConcept?: string;
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

export const Reader: React.FC<ReaderProps> = ({
  book,
  chapter,
  theme,
  fontSize,
  highlightQuery,
  targetPassageId,
  hasActiveMutalaaSession,
  activeMutalaaConcept,
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
  const [headerHidden, setHeaderHidden] = useState(false);
  const [quoteToast, setQuoteToast] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);
  const onProgressChangeRef = useRef(onProgressChange);

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

  // Odak Modu (aşağı kaydırınca üst çubuğu gizle, yukarı kaydırınca göster) + İlerleme Çizgisi + Kaydırma Hafızası
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

      const delta = currentY - lastScrollYRef.current;
      if (currentY < 90) {
        setHeaderHidden(false);
      } else if (delta > 12 && !appearanceMenuOpen) {
        setHeaderHidden(true);
      } else if (delta < -10) {
        setHeaderHidden(false);
      }
      lastScrollYRef.current = currentY;

      try {
        localStorage.setItem(scrollKey, String(pct));
      } catch {
        // ignore storage errors
      }
      onProgressChangeRef.current?.(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [book.id, chapter.id, appearanceMenuOpen]);

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
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        return;
      }
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
    }, 60);
  };

  // Ekranda seçim kaldırıldığında veya dışarı tıklandığında pop-up ve menüleri kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#selection-popup')) {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setSelectionMenu((prev) => ({ ...prev, visible: false }));
        }
      }
      if (!target.closest('#appearance-menu-container')) {
        setAppearanceMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
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

      {/* Metin Seçim Çubuğu — Çapraz İzah, Buradan Hızlı Oku ve Alıntı Kartı */}
      {selectionMenu.visible && selectionMenu.passage && (
        <div
          id="selection-popup"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-stone-900 text-white rounded-2xl shadow-2xl border border-amber-500/50 text-xs sm:text-sm max-w-[95vw]"
        >
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
        </div>
      )}

      {/* Ultra Sade Üst Çubuk: Solda Geri, Ortada Tam Başlık, Sağda Tek "Menü" Düğmesi */}
      <header
        className={`sticky top-0 z-30 w-full backdrop-blur-md border-b px-3 sm:px-4 py-2 transition-all duration-300 ${getHeaderBgClass()} ${
          headerHidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
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
              <div
                className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-2xl border p-4 z-50 space-y-4 max-h-[82vh] overflow-y-auto ${getMenuPopoverClass()}`}
              >
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
            )}
          </div>
        </div>

        {/* Tek Geri Dönüş Butonu: Çapraz İzah Listesine ve Diğer Kitaplara Dön */}
        {hasActiveMutalaaSession && onReopenMutalaa && (
          <div className="max-w-4xl mx-auto mt-2 pt-2 border-t border-amber-500/25">
            <button
              onClick={onReopenMutalaa}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-transform active:scale-98"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Çapraz İzah Listesine Dön
                {activeMutalaaConcept ? ` ("${activeMutalaaConcept}" • Diğer Kitaplara Bak)` : ''}
              </span>
            </button>
          </div>
        )}
      </header>

      {/* Main Reading Canvas */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10 sm:py-16">
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
                onMouseUp={() => updateSelectionFromPassage(psg)}
                onTouchEnd={() => updateSelectionFromPassage(psg)}
                className="scroll-mt-24"
              >
                <article
                  className="space-y-6 leading-relaxed font-serif text-justify select-text"
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
                >
                  {paragraphs.map((para, i) => {
                    if (para === '***') {
                      return <TezhipDivider key={i} />;
                    }

                    const isSubHeading =
                      psg.shortTitle &&
                      psg.shortTitle !== chapter.title &&
                      para === psg.shortTitle;

                    const renderedContent = highlightQuery
                      ? renderHighlightedText(
                          para,
                          highlightQuery,
                          !targetPassageId || psg.id === targetPassageId
                        )
                      : para;

                    if (isSubHeading) {
                      return (
                        <h3
                          key={i}
                          className="font-bold text-amber-800 dark:text-amber-300 pt-6 pb-2 text-center indent-0 tracking-wide"
                          style={{ fontSize: `${Math.round(fontSize * 1.15)}px` }}
                        >
                          {renderedContent}
                        </h3>
                      );
                    }

                    if (isArabicOnlyLine(para)) {
                      return (
                        <p
                          key={i}
                          dir="rtl"
                          className="font-arabic text-center indent-0 my-4 py-1.5 px-2 text-amber-950 dark:text-amber-200 tracking-normal"
                          style={{
                            fontSize: `${Math.round(fontSize * 1.32)}px`,
                            lineHeight: 2.1,
                          }}
                        >
                          {renderedContent}
                        </p>
                      );
                    }

                    return (
                      <p key={i} className="indent-6 sm:indent-8 tracking-normal">
                        {renderedContent}
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
    </div>
  );
};
