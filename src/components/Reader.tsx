import React, { useState, useEffect } from 'react';
import type { ChapterContent, ThemeMode, BookMeta, Passage } from '../types';
import { renderHighlightedText, CROSS_BOOK_REDIRECTS } from '../utils/searchUtils';
import {
  ArrowLeft,
  Sun,
  Moon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Type,
  Gauge,
  Search,
  GitFork,
  ExternalLink,
  Minus,
  Plus
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
  hasNext: boolean;
  hasPrev: boolean;
}

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_LETTER_REGEX = /[a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ]/;

function isArabicOnlyLine(line: string): boolean {
  return ARABIC_CHAR_REGEX.test(line) && !LATIN_LETTER_REGEX.test(line);
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
  hasNext,
  hasPrev,
}) => {
  const [appearanceMenuOpen, setAppearanceMenuOpen] = useState(false);

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
        return 'bg-[#09090b] text-[#a1a1aa] selection:bg-[#27272a]';
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
        return 'bg-[#09090b]/95 border-white/10';
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
        return 'bg-[#121215] text-zinc-200 border-zinc-800';
      case 'light':
      default:
        return 'bg-white text-stone-900 border-stone-200';
    }
  };

  const passages: Passage[] = chapter.passages && chapter.passages.length > 0
    ? chapter.passages
    : [
        {
          id: 'p-1',
          title: `${book.title} • ${chapter.title}`,
          shortTitle: chapter.title,
          text: chapter.rawContent || ''
        }
      ];

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
      {/* Metin Seçim Çubuğu — Hem Çapraz İzah hem de Seçilen Yerden Hızlı Okuma başlatır */}
      {selectionMenu.visible && selectionMenu.passage && (
        <div
          id="selection-popup"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-stone-900 text-white rounded-2xl shadow-2xl border border-amber-500/50 text-xs sm:text-sm max-w-[94vw]"
        >
          <button
            onClick={() => {
              if (selectionMenu.passage) {
                onOpenMutalaa(selectionMenu.passage, selectionMenu.selectedText);
                setSelectionMenu((prev) => ({ ...prev, visible: false }));
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 transition-colors font-semibold text-white truncate max-w-[60vw] sm:max-w-xs"
          >
            <GitFork className="w-4 h-4 shrink-0" />
            <span className="truncate">
              Çapraz İzah: "{selectionMenu.selectedText.slice(0, 24)}
              {selectionMenu.selectedText.length > 24 ? '...' : ''}"
            </span>
          </button>

          <button
            onClick={() => {
              onOpenSpeedReader(selectionMenu.selectedText);
              setSelectionMenu((prev) => ({ ...prev, visible: false }));
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-500/40 transition-colors font-semibold text-amber-300 shrink-0"
            title="Hızlı okumayı seçtiğiniz bu cümleden itibaren başlat"
          >
            <Gauge className="w-4 h-4 shrink-0" />
            <span>Buradan Hızlı Oku</span>
          </button>
        </div>
      )}

      {/* Sadeleştirilmiş Üst Çubuk (Buton kalabalığı "Aa" Görünüm Menüsünde toplandı) */}
      <header className={`sticky top-0 z-30 w-full backdrop-blur-md border-b px-3 sm:px-4 py-2.5 transition-colors ${getHeaderBgClass()}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs sm:text-sm font-medium transition-colors shrink-0"
            title="Kitap Listesine Dön"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kitaplar</span>
          </button>

          <div className="text-center truncate flex-1 min-w-0 px-1">
            <div className="text-[11px] opacity-75 font-serif truncate">{book.title}</div>
            <div className="text-xs sm:text-sm font-serif font-bold truncate">{chapter.title}</div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Külliyat İçi Arama Butonu */}
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-amber-700 dark:text-amber-400"
              title="Külliyat'ta Ara"
              aria-label="Külliyat'ta Ara"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Çapraz İzah Butonu */}
            <button
              onClick={() => {
                if (hasActiveMutalaaSession && onReopenMutalaa) {
                  onReopenMutalaa();
                } else if (passages.length > 0) {
                  onOpenMutalaa(passages[0]);
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-600/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 text-xs font-semibold transition-transform active:scale-95"
              title="Çapraz İzah Penceresini Aç"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çapraz İzah</span>
            </button>

            {/* Hızlı Okuma Butonu */}
            <button
              onClick={() => onOpenSpeedReader()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-transform active:scale-95"
              title="Bu Bahsi Hızlı Okuma Motoruyla Oku"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hızlı Oku</span>
            </button>

            {/* Tek "Aa" Görünüm & Tema Menüsü Düğmesi */}
            <div id="appearance-menu-container" className="relative">
              <button
                onClick={() => setAppearanceMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  appearanceMenuOpen
                    ? 'border-amber-600 bg-amber-500/20 text-amber-900 dark:text-amber-300'
                    : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title="Yazı Boyutu ve Tema Ayarları"
                aria-label="Görünüm Ayarları"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="font-serif">Aa</span>
              </button>

              {appearanceMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border p-4 z-50 space-y-4 ${getMenuPopoverClass()}`}
                >
                  {/* Yazı Boyutu Ayarı */}
                  <div className="space-y-2">
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

                  {/* Tema Seçici (4 Tema: Açık, Sepya, Koyu, Gece) */}
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
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Gece</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
        <div className="text-center mb-12 pb-6 border-b border-black/10 dark:border-white/10">
          <span className="text-xs uppercase tracking-widest opacity-60 font-serif">
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
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                >
                  {paragraphs.map((para, i) => {
                    if (para === '***') {
                      return (
                        <div
                          key={i}
                          className="text-center opacity-50 tracking-widest py-2 select-none"
                        >
                          * * *
                        </div>
                      );
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
                          className="font-bold text-amber-900 dark:text-amber-300 pt-4 pb-1 text-left tracking-normal"
                          style={{ fontSize: `${Math.round(fontSize * 1.12)}px` }}
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
                          className="text-center indent-0 my-4 py-2 px-3 rounded-xl bg-amber-500/5 text-amber-950 dark:text-amber-200 tracking-normal"
                          style={{
                            fontSize: `${Math.round(fontSize * 1.2)}px`,
                            lineHeight: 2.0,
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

        {/* Bottom Chapter Navigation */}
        <div className="mt-16 pt-8 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
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
