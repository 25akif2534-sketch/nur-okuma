import React, { useState, useEffect } from 'react';
import type { ChapterContent, ThemeMode, BookMeta, Passage } from '../types';
import {
  ArrowLeft,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Type,
  Gauge,
  Bookmark,
  Search,
  Sparkles,
  Compass,
  Users
} from 'lucide-react';

interface ReaderProps {
  book: BookMeta;
  chapter: ChapterContent;
  theme: ThemeMode;
  fontSize: number;
  onBack: () => void;
  onThemeChange: (theme: ThemeMode) => void;
  onFontSizeChange: (delta: number) => void;
  onNextChapter: () => void;
  onPrevChapter: () => void;
  onOpenSpeedReader: () => void;
  onOpenSearch: () => void;
  onOpenMutalaa: (passage: Passage, snippet?: string, tab?: 'sirri-temsil' | 'meclis') => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export const Reader: React.FC<ReaderProps> = ({
  book,
  chapter,
  theme,
  fontSize,
  onBack,
  onThemeChange,
  onFontSizeChange,
  onNextChapter,
  onPrevChapter,
  onOpenSpeedReader,
  onOpenSearch,
  onOpenMutalaa,
  hasNext,
  hasPrev,
}) => {
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

  const getPassageHeaderClass = () => {
    switch (theme) {
      case 'sepia':
        return 'border-amber-900/20 bg-amber-900/5 text-amber-900';
      case 'dark':
      case 'night':
        return 'border-zinc-800 bg-zinc-900/50 text-amber-300';
      case 'light':
      default:
        return 'border-stone-200 bg-stone-100 text-stone-800';
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

  // Mouse ile veya dokunarak metin seçildiğinde tetiklenir
  const handleMouseUp = (psg: Passage) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionMenu((prev) => ({ ...prev, visible: false }));
      return;
    }

    const text = sel.toString().trim();
    if (text.length > 5) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionMenu({
        visible: true,
        x: Math.min(window.innerWidth - 220, Math.max(10, rect.left + rect.width / 2 - 100)),
        y: Math.max(10, rect.top - 48 + window.scrollY),
        selectedText: text,
        passage: psg,
      });
    }
  };

  // Ekranda herhangi bir yere tıklandığında pop-up'ı kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#selection-popup')) {
        setSelectionMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${getThemeClass()}`}>
      {/* Metin Seçim Pop-up Menüsü */}
      {selectionMenu.visible && selectionMenu.passage && (
        <div
          id="selection-popup"
          style={{ top: `${selectionMenu.y}px`, left: `${selectionMenu.x}px` }}
          className="absolute z-50 flex items-center gap-1 p-1 bg-stone-900 text-white rounded-2xl shadow-2xl border border-stone-700 text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            onClick={() => {
              if (selectionMenu.passage) {
                onOpenMutalaa(selectionMenu.passage, selectionMenu.selectedText, 'sirri-temsil');
                setSelectionMenu((prev) => ({ ...prev, visible: false }));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-amber-600 transition-colors font-medium text-amber-200 hover:text-white"
          >
            <Compass className="w-3.5 h-3.5" />
            Sırr-ı Temsil
          </button>
          <div className="w-px h-4 bg-stone-700" />
          <button
            onClick={() => {
              if (selectionMenu.passage) {
                onOpenMutalaa(selectionMenu.passage, selectionMenu.selectedText, 'meclis');
                setSelectionMenu((prev) => ({ ...prev, visible: false }));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-amber-600 transition-colors font-medium text-amber-200 hover:text-white"
          >
            <Users className="w-3.5 h-3.5" />
            Meclise Sor
          </button>
        </div>
      )}

      {/* Top sticky navigation bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-opacity-90 border-b border-black/10 dark:border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kitaplar</span>
          </button>

          <div className="text-center truncate flex-1 px-2">
            <div className="text-xs opacity-75 font-serif">{book.title}</div>
            <div className="text-sm font-serif font-bold truncate">{chapter.title}</div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Külliyat İçi Arama Butonu */}
            <button
              onClick={onOpenSearch}
              className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-amber-700 dark:text-amber-400"
              title="Külliyat'ta Ara"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Hızlı Okuma Butonu */}
            <button
              onClick={onOpenSpeedReader}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-transform active:scale-95"
              title="Bu Bahsi Hızlı Okuma Motoruyla Oku"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hızlı Okuma</span>
            </button>

            {/* Font size buttons */}
            <div className="flex items-center rounded-lg border border-black/10 dark:border-white/10 overflow-hidden text-xs">
              <button
                onClick={() => onFontSizeChange(-1)}
                className="px-2.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 font-bold flex items-center gap-0.5"
                title="Yazı Küçült"
              >
                <Type className="w-3 h-3" />-
              </button>
              <span className="px-2 font-mono">{fontSize}</span>
              <button
                onClick={() => onFontSizeChange(1)}
                className="px-2.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 font-bold flex items-center gap-0.5"
                title="Yazı Büyüt"
              >
                <Type className="w-3 h-3" />+
              </button>
            </div>

            {/* Theme switcher */}
            <div className="flex items-center rounded-lg border border-black/10 dark:border-white/10 p-0.5">
              <button
                onClick={() => onThemeChange('light')}
                className={`p-1.5 rounded ${theme === 'light' ? 'bg-black/10 dark:bg-white/10' : ''}`}
                title="Açık Tema"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onThemeChange('sepia')}
                className={`p-1.5 rounded text-amber-900 ${theme === 'sepia' ? 'bg-amber-200/50' : ''}`}
                title="Kitap (Sepya) Tema"
              >
                <BookMarked className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`p-1.5 rounded ${theme === 'dark' ? 'bg-black/10 dark:bg-white/10' : ''}`}
                title="Koyu Tema"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
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
          <div className="mt-2 text-xs font-mono opacity-60">
            {passages.length} Tahkik Pasajı
          </div>
        </div>

        {/* Sectioned Passages */}
        <div className="space-y-14">
          {passages.map((psg) => {
            const paragraphs = psg.text
              .split(/\r?\n/)
              .map((p) => p.trim())
              .filter((p) => p.length > 0);

            return (
              <section
                key={psg.id}
                id={psg.id}
                onMouseUp={() => handleMouseUp(psg)}
                onTouchEnd={() => handleMouseUp(psg)}
                className="scroll-mt-24 space-y-4"
              >
                {/* Orijinal Numaralı Pasaj Başlığı & Mütalaa Butonu */}
                <div
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border font-serif text-sm font-semibold tracking-wide shadow-2xs ${getPassageHeaderClass()}`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Bookmark className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">{psg.title}</span>
                  </div>

                  {/* Pasaj Mütalaa Butonu */}
                  <button
                    onClick={() => onOpenMutalaa(psg)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600/10 hover:bg-amber-600 text-amber-800 dark:text-amber-200 hover:text-white text-xs font-medium transition-all shrink-0 ml-2"
                    title="Bu Pasajı Gemini Pro ile Mütalaa Et"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 hover:text-white" />
                    <span className="hidden sm:inline">Mütalaa Et</span>
                  </button>
                </div>

                {/* Pasaj Metni */}
                <article
                  className="space-y-6 leading-relaxed font-serif text-justify pt-2 select-text"
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                >
                  {paragraphs.map((para, i) => (
                    <p key={i} className="indent-6 sm:indent-8 tracking-normal">
                      {para}
                    </p>
                  ))}
                </article>
              </section>
            );
          })}
        </div>

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
