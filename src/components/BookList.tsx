import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { BookMeta, TrackedBookInfo } from '../types';
import { BOOK_PRIORITY } from '../utils/searchUtils';
import {
  ChevronRight,
  ChevronDown,
  Search,
  BookmarkCheck,
  RefreshCw,
  Smartphone,
  Share2,
  Clock,
  X,
  ListTree
} from 'lucide-react';

export interface LastReadInfo {
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  progressPercent?: number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface VecizeItem {
  quote: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
}

const DAILY_VECIZELER: VecizeItem[] = [
  {
    quote: 'Bismillah her hayrın başıdır. Biz dahi başta ona başlarız.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-1',
    chapterTitle: 'Birinci Söz',
  },
  {
    quote: 'İman hem nurdur hem kuvvettir. Evet, hakiki imanı elde eden adam, kâinata meydan okuyabilir.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-23',
    chapterTitle: 'Yirmi Üçüncü Söz',
  },
  {
    quote: 'Güzel gören güzel düşünür. Güzel düşünen, hayatından lezzet alır.',
    bookId: 'mektubat',
    bookTitle: 'Mektubat',
    chapterId: 'ch-34',
    chapterTitle: 'Hakikat Çekirdekleri',
  },
  {
    quote: 'Bütün mevcudat, lisan-ı hâl ile Bismillah der.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-1',
    chapterTitle: 'Birinci Söz',
  },
  {
    quote: 'Her şey kader ile takdir edilmiştir. Kısmetine razı ol ki rahat edesin.',
    bookId: 'mesnevi-i-nuriye',
    bookTitle: 'Mesnevî-i Nuriye',
    chapterId: 'ch-7',
    chapterTitle: 'Hubab',
  },
  {
    quote: 'İnsan bir yolcudur. Sabavet, gençlik, ihtiyarlık, kabir, berzah, haşir, sırat onun menzilleridir.',
    bookId: 'mesnevi-i-nuriye',
    bookTitle: 'Mesnevî-i Nuriye',
    chapterId: 'ch-11',
    chapterTitle: 'Şule',
  },
  {
    quote: 'Acizlik vezaif-i ubudiyetin en mühim bir esasıdır; insanı dergâh-ı İlâhîye bağlar.',
    bookId: 'lem-alar',
    bookTitle: "Lem'alar",
    chapterId: 'ch-2',
    chapterTitle: "İkinci Lem'a",
  },
  {
    quote: 'Amelinizde rıza-yı İlâhî olmalı. Eğer O razı olsa, bütün dünya küsse ehemmiyeti yok.',
    bookId: 'lem-alar',
    bookTitle: "Lem'alar",
    chapterId: 'ch-21',
    chapterTitle: "Yirmi Birinci Lem'a",
  },
  {
    quote: 'Karıncayı emirsiz, arıları ya’subsuz bırakmayan kudret-i ezeliye, elbette beşeri de nebîsiz bırakmaz.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-10',
    chapterTitle: 'Onuncu Söz',
  },
  {
    quote: 'Hakiki zevk ve elemsiz lezzet ve kedersiz sevinç ve hayattaki saadet yalnız imandadır.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-13',
    chapterTitle: 'On Üçüncü Söz',
  },
  {
    quote: 'Kâinatta en yüksek hakikat imandır, imandan sonra namazdır.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-21',
    chapterTitle: 'Yirmi Birinci Söz',
  },
  {
    quote: 'Helâl dairesi geniştir, keyfe kâfi gelir. Harama girmeye hiç lüzum yoktur.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-6',
    chapterTitle: 'Altıncı Söz',
  },
  {
    quote: 'Dünya madem fânidir; değmiyor alâka-i kalbe.',
    bookId: 'lem-alar',
    bookTitle: "Lem'alar",
    chapterId: 'ch-17',
    chapterTitle: "Onyedinci Lem'a",
  },
  {
    quote: 'İlim odur ki kalbe nur, ruha inşirah versin.',
    bookId: 'mesnevi-i-nuriye',
    bookTitle: 'Mesnevî-i Nuriye',
    chapterId: 'ch-2',
    chapterTitle: 'Katre',
  },
  {
    quote: 'Sultân-ı kâinat birdir, her şeyin anahtarı O’nun yanında, her şeyin dizgini O’nun elindedir.',
    bookId: 'mektubat',
    bookTitle: 'Mektubat',
    chapterId: 'ch-20',
    chapterTitle: 'Yirminci Mektup',
  },
  {
    quote: 'Zaman gösterdi ki: Cennet ucuz değil, cehennem dahi lüzumsuz değil.',
    bookId: 'mektubat',
    bookTitle: 'Mektubat',
    chapterId: 'ch-22',
    chapterTitle: 'Yirmi İkinci Mektup',
  },
  {
    quote: 'Hastalık bir define-i uhreviyedir, pek kıymettar bir hediye-i Rabbaniyedir.',
    bookId: 'lem-alar',
    bookTitle: "Lem'alar",
    chapterId: 'ch-25',
    chapterTitle: "Yirmi Beşinci Lem'a",
  },
  {
    quote: 'Göz bir hassedir ki ruh bu âlemi o pencere ile seyreder.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-6',
    chapterTitle: 'Altıncı Söz',
  },
  {
    quote: 'Tevhid ve vahdette cemal-i İlâhî ve kemal-i Rabbânî tezahür eder.',
    bookId: 'sualar',
    bookTitle: 'Şualar',
    chapterId: 'ch-2',
    chapterTitle: 'İkinci Şua',
  },
  {
    quote: 'İman, insanı insan eder; belki insanı sultan eder.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-23',
    chapterTitle: 'Yirmi Üçüncü Söz',
  },
  {
    quote: 'Cenâb-ı Hakk’ı bulan her şeyi bulur; O’nu bulmayan hiçbir şey bulamaz.',
    bookId: 'asa-yi-musa',
    bookTitle: 'Asa-yı Musa',
    chapterId: 'ch-1',
    chapterTitle: 'Birinci Kısım',
  },
  {
    quote: 'Her bir günahta küfre gidecek bir yol vardır.',
    bookId: 'lem-alar',
    bookTitle: "Lem'alar",
    chapterId: 'ch-2',
    chapterTitle: "İkinci Lem'a",
  },
  {
    quote: 'Ahirette seni kurtaracak bir eserin olmadığı takdirde, fâni dünyada bıraktığın eserlere de kıymet verme.',
    bookId: 'mesnevi-i-nuriye',
    bookTitle: 'Mesnevî-i Nuriye',
    chapterId: 'ch-3',
    chapterTitle: 'Habbe',
  },
  {
    quote: 'Hayat bir faaliyet ve harekettir; şevk ise onun matiyyesidir.',
    bookId: 'mektubat',
    bookTitle: 'Mektubat',
    chapterId: 'ch-34',
    chapterTitle: 'Hakikat Çekirdekleri',
  },
  {
    quote: 'Kadir-i Zülcelal her şeye lâyık bir vücut ve münasip bir suret giydirmiştir.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-22',
    chapterTitle: 'Yirmi İkinci Söz',
  },
  {
    quote: 'Muhabbet, şu kâinatın bir sebeb-i vücududur; hem şu kâinatın rabıtasıdır.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-24',
    chapterTitle: 'Yirmi Dördüncü Söz',
  },
  {
    quote: 'İhlası kazanmak ve muhafaza etmek en büyük bir esastır.',
    bookId: 'lem-alar',
    bookTitle: "Lem'alar",
    chapterId: 'ch-20',
    chapterTitle: "Yirminci Lem'a",
  },
  {
    quote: 'Namaz kılmak ve büyük günahları işlememek, ne derece hakiki bir vazife-i insaniye olduğu aşikârdır.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-4',
    chapterTitle: 'Dördüncü Söz',
  },
  {
    quote: 'Şükür, nimeti ziyadeleştirir ve gafleti dağıtır.',
    bookId: 'mektubat',
    bookTitle: 'Mektubat',
    chapterId: 'ch-28',
    chapterTitle: 'Yirmi Sekizinci Mektup',
  },
  {
    quote: 'Bâki bir hakikat, fâni şeylere bina edilmez.',
    bookId: 'mektubat',
    bookTitle: 'Mektubat',
    chapterId: 'ch-34',
    chapterTitle: 'Hakikat Çekirdekleri',
  },
  {
    quote: 'Lezzet-i hizmet-i imaniye her zahmete tefevvuk eder.',
    bookId: 'sualar',
    bookTitle: 'Şualar',
    chapterId: 'ch-14',
    chapterTitle: 'On Dördüncü Şua',
  },
  {
    quote: 'Her hakiki hasenat gibi cesaretin dahi menbaı imandır, ubudiyettir.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-3',
    chapterTitle: 'Üçüncü Söz',
  },
  {
    quote: 'Akıl bir alettir; eğer Cenâb-ı Hakk’a satılsa pek kıymettar bir anahtar olur.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-6',
    chapterTitle: 'Altıncı Söz',
  },
  {
    quote: 'Ömür sermayesi pek azdır; lüzumlu işler pek çoktur.',
    bookId: 'tarihce-i-hayat',
    bookTitle: 'Tarihçe-i Hayat',
    chapterId: 'ch-1',
    chapterTitle: 'İlk Hayatı',
  },
  {
    quote: 'Kaderin her şeyi güzeldir; şer gibi görünen şeylerin altında dahi hayırlar gizlidir.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-26',
    chapterTitle: 'Yirmi Altıncı Söz',
  },
  {
    quote: 'Hırs, sebeb-i haybettir ve illet-i zilletdir; kanaat ise izzet ve berekettir.',
    bookId: 'mektubat',
    bookTitle: 'Mektubat',
    chapterId: 'ch-22',
    chapterTitle: 'Yirmi İkinci Mektup',
  },
  {
    quote: 'Kur’an bütün asırlara hitap eden ezeli bir hutbedir.',
    bookId: 'sozler',
    bookTitle: 'Sözler',
    chapterId: 'ch-25',
    chapterTitle: 'Yirmi Beşinci Söz',
  },
  {
    quote: 'Merhamet-i İlâhiyeden ziyade merhamet edilmez.',
    bookId: 'lem-alar',
    bookTitle: "Lem'alar",
    chapterId: 'ch-13',
    chapterTitle: "On Üçüncü Lem'a",
  },
  {
    quote: 'Hak namına, sırf lillâh için yapılan zerre miskal amel kaybolmaz.',
    bookId: 'barla-lahikasi',
    bookTitle: 'Barla Lâhikası',
    chapterId: 'ch-1',
    chapterTitle: 'Mektuplar',
  },
  {
    quote: 'Tevazu, tekebbür edene karşı bir tecellî-i izzettir.',
    bookId: 'mektubat',
    bookTitle: 'Mektubat',
    chapterId: 'ch-34',
    chapterTitle: 'Hakikat Çekirdekleri',
  },
  {
    quote: 'Kâinat bir kitâb-ı kebîrdir; her bir harfi bir kelime, her bir kelimesi bir kitaptır.',
    bookId: 'mesnevi-i-nuriye',
    bookTitle: 'Mesnevî-i Nuriye',
    chapterId: 'ch-8',
    chapterTitle: 'Nokta',
  },
  {
    quote: 'İnne me’al-usri yüsrâ sırrıyla, her meşakkatin arkasında bir kolaylık ve saadet vardır.',
    bookId: 'sualar',
    bookTitle: 'Şualar',
    chapterId: 'ch-13',
    chapterTitle: 'On Üçüncü Şua',
  },
  {
    quote: 'Mü’minin mü’mine en büyük yardımı dua iledir.',
    bookId: 'mektubat',
    bookTitle: 'Mektubat',
    chapterId: 'ch-23',
    chapterTitle: 'Yirmi Üçüncü Mektup',
  },
  {
    quote: 'Biz acele ettik kışta geldik; sizler cennet-âsâ bir baharda geleceksiniz.',
    bookId: 'tarihce-i-hayat',
    bookTitle: 'Tarihçe-i Hayat',
    chapterId: 'ch-3',
    chapterTitle: 'Münazarat',
  },
];

interface BookListProps {
  books: BookMeta[];
  selectedBook: BookMeta | null;
  lastRead?: LastReadInfo | null;
  trackedBook?: TrackedBookInfo | null;
  onSelectBook: (book: BookMeta) => void;
  onSelectChapter: (chapterId: string, passageId?: string) => void;
  onResumeLastRead?: (info: LastReadInfo) => void;
  onSetTrackedBook?: (info: TrackedBookInfo) => void;
  onOpenSearch: () => void;
}

export const BookList: React.FC<BookListProps> = ({
  books,
  selectedBook,
  lastRead,
  trackedBook,
  onSelectBook,
  onSelectChapter,
  onResumeLastRead,
  onSetTrackedBook,
  onOpenSearch,
}) => {
  // Her açılışta taze rastgele bir vecize seçer (asla hep aynı vecize kalmaz)
  const [vecizeIndex, setVecizeIndex] = useState<number>(() => {
    return Math.floor(Math.random() * DAILY_VECIZELER.length);
  });

  // Vecize kutusunu gizleme tercihi
  const [hideVecize, setHideVecize] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nur_hide_vecize') === 'true';
    } catch {
      return false;
    }
  });

  // Bugün yapılan okuma istatistiği (dakika ve tamamlanan bahis)
  const [todayStats, setTodayStats] = useState<{ minutes: number; chaptersCount: number }>(() => {
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem(`nur_daily_${todayKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          minutes: parsed.minutes || 0,
          chaptersCount: (parsed.chaptersCompleted || []).length,
        };
      }
    } catch {
      // ignore
    }
    return { minutes: 0, chaptersCount: 0 };
  });

  // Sayfa odaklandığında bugünkü okuma dakikasını tazele
  useEffect(() => {
    const refreshStats = () => {
      const todayKey = new Date().toISOString().slice(0, 10);
      try {
        const raw = localStorage.getItem(`nur_daily_${todayKey}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          setTodayStats({
            minutes: parsed.minutes || 0,
            chaptersCount: (parsed.chaptersCompleted || []).length,
          });
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('focus', refreshStats);
    return () => window.removeEventListener('focus', refreshStats);
  }, []);

  // Hangi bahsin alt başlıklarının (1. Makam, 2. Makam, Hâtime vb.) açık olduğu
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  // Çevrimdışı (İnternetsiz) Tüm Külliyatı Otomatik İndirme Durumu
  const [offlineReady, setOfflineReady] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nur_offline_ready_v5') === 'true';
    } catch {
      return false;
    }
  });
  const [downloadingOffline, setDownloadingOffline] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState(0);
  const autoCacheStartedRef = useRef(false);

  // Uygulama telefona kuruldu mu veya kullanıcı kurulum kutusunu gizledi mi?
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    try {
      const standaloneMedia =
        typeof window !== 'undefined' &&
        window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone =
        typeof window !== 'undefined' &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      const savedInstalled = localStorage.getItem('nur_app_installed') === 'true';
      return Boolean(standaloneMedia || iosStandalone || savedInstalled);
    } catch {
      return false;
    }
  });

  // Telefona Uygulama Olarak Kurma (PWA) Rehberi
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setIsAppInstalled(true);
      setShowInstallGuide(false);
      try {
        localStorage.setItem('nur_app_installed', 'true');
      } catch {
        // ignore
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const markAppInstalledAndHideButton = () => {
    setIsAppInstalled(true);
    setShowInstallGuide(false);
    try {
      localStorage.setItem('nur_app_installed', 'true');
    } catch {
      // ignore
    }
  };

  const handleInstallAppClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === 'accepted') {
        markAppInstalledAndHideButton();
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  // İlk açılışta Külliyat henüz cihaza kaydedilmediyse ikinci bir düğmeye gerek kalmadan arka planda otomatik indir
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (
      offlineReady ||
      autoCacheStartedRef.current ||
      books.length === 0 ||
      typeof caches === 'undefined'
    ) {
      return;
    }
    autoCacheStartedRef.current = true;

    const autoCacheKulliyat = async () => {
      if (isMountedRef.current) {
        setDownloadingOffline(true);
        setOfflineProgress(2);
      }

      try {
        const cache = await caches.open('nur-okuma-v4');
        const assetUrls: string[] = [];
        document
          .querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
            'script[src], link[rel="stylesheet"][href]'
          )
          .forEach((el) => {
            const rawUrl =
              el instanceof HTMLScriptElement ? el.src : el.href;
            if (rawUrl) assetUrls.push(rawUrl);
          });

        const urlsToCache: string[] = [
          './',
          './index.html',
          './manifest.json',
          './favicon.svg',
          './favicon.png',
          './icon-192.png',
          './icon-512.png',
          './apple-touch-icon.png',
          './kulliyat/books-index.json',
          ...assetUrls,
        ];

        for (const b of books) {
          if (b.id === 'kucuk-kitaplar') continue;
          for (const ch of b.chapters) {
            urlsToCache.push(`./kulliyat/${b.id}/${ch.id}.json`);
          }
        }
        urlsToCache.push('./kulliyat/search-index.json');

        let completed = 0;
        const total = urlsToCache.length;
        const batchSize = 15;

        const fetchWithTimeout = async (url: string) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          try {
            const res = await fetch(url, { signal: controller.signal });
            if (res.ok) {
              await cache.put(url, res.clone());
            }
          } catch {
            // Tekil ağ hatasını yoksay, akışı durdurma
          } finally {
            clearTimeout(timer);
            completed++;
          }
        };

        for (let i = 0; i < total; i += batchSize) {
          const batch = urlsToCache.slice(i, i + batchSize);
          await Promise.all(batch.map((u) => fetchWithTimeout(u)));
          if (isMountedRef.current) {
            setOfflineProgress(
              Math.min(99, Math.max(2, Math.round((completed / total) * 100)))
            );
          }
        }

        try {
          localStorage.setItem('nur_offline_ready_v5', 'true');
        } catch {
          // ignore
        }
        if (isMountedRef.current) {
          setOfflineProgress(100);
          setOfflineReady(true);
        }
      } catch {
        // ignore cache error
      } finally {
        if (isMountedRef.current) {
          setDownloadingOffline(false);
        }
      }
    };

    autoCacheKulliyat();
  }, [books, offlineReady]);

  const [shareCopied, setShareCopied] = useState(false);
  const handleShareApp = async () => {
    const shareUrl = 'https://25akif2534-sketch.github.io/nur-okuma/';
    const shareData = {
      title: 'Risale-i Nur Külliyatı — Okuma & Çapraz İzah',
      text: 'Diyanet nüshası esas alınarak hazırlanmış, Hızlı Okuma ve Çapraz İzah destekli reklamsız Risale-i Nur okuma programı:',
      url: shareUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Kullanıcı kapattıysa kopyalamaya düş
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const currentVecize = DAILY_VECIZELER[vecizeIndex] || DAILY_VECIZELER[0];

  // Esas Okuma / Hatim Takibi (Kullanıcının belirlediği veya son okuduğu kitap)
  const activeTracked: TrackedBookInfo | null = useMemo(() => {
    if (trackedBook) return trackedBook;
    if (lastRead) {
      const b = books.find((x) => x.id === lastRead.bookId);
      const chIdx = b ? b.chapters.findIndex((c) => c.id === lastRead.chapterId) : 0;
      return {
        bookId: lastRead.bookId,
        bookTitle: lastRead.bookTitle,
        chapterId: lastRead.chapterId,
        chapterTitle: lastRead.chapterTitle,
        chapterIndex: chIdx >= 0 ? chIdx + 1 : 1,
        totalChapters: b ? b.chapters.length : 1,
        progressPercent: lastRead.progressPercent,
      };
    }
    if (books.length > 0) {
      const b = books.find((x) => x.id.includes('sozler')) || books[0];
      return {
        bookId: b.id,
        bookTitle: b.title,
        chapterId: b.chapters[0]?.id || 'ch-1',
        chapterTitle: b.chapters[0]?.title || '',
        chapterIndex: 1,
        totalChapters: b.chapters.length,
        progressPercent: 0,
      };
    }
    return null;
  }, [trackedBook, lastRead, books]);

  const trackedPct = activeTracked && activeTracked.totalChapters > 0
    ? Math.min(100, Math.round((activeTracked.chapterIndex / activeTracked.totalChapters) * 100))
    : 0;

  const visibleBooks = books
    .filter((b) => b.id !== 'kucuk-kitaplar')
    .sort((a, b) => (BOOK_PRIORITY[a.id] || 99) - (BOOK_PRIORITY[b.id] || 99));

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col min-h-screen">
      {/* Telefona Uygulama Olarak Kurma Rehberi Modalı */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fbf0d9] dark:bg-stone-900 border border-amber-700/30 rounded-2xl max-w-md w-full p-5 text-stone-900 dark:text-stone-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-900/15 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2 font-serif font-bold text-base">
                <Smartphone className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span>Telefona Uygulama Olarak Ekle</span>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs sm:text-sm font-serif leading-relaxed">
              <p>
                Mağazaya veya üyeliğe ihtiyaç duymadan programı telefonunuzun ana ekranına gerçek uygulama olarak ekleyebilirsiniz:
              </p>
              <div className="p-3 rounded-xl bg-white/70 dark:bg-stone-800/80 space-y-1.5">
                <div className="font-bold text-amber-900 dark:text-amber-300">
                  iPhone / iPad (Safari):
                </div>
                <p>
                  1. Ekranın altındaki <strong>Paylaş</strong> (yukarı oklu kare) düğmesine dokunun.<br />
                  2. Listede aşağı inip <strong>“Ana Ekrana Ekle”</strong> seçeneğine basın.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/70 dark:bg-stone-800/80 space-y-1.5">
                <div className="font-bold text-amber-900 dark:text-amber-300">
                  Android (Chrome):
                </div>
                <p>
                  1. Sağ üstteki <strong>üç nokta (⋮)</strong> menüsüne dokunun.<br />
                  2. <strong>“Ana ekrana ekle”</strong> veya <strong>“Uygulamayı yükle”</strong> seçeneğine basın.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={markAppInstalledAndHideButton}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs sm:text-sm"
              >
                Ana Ekrana Ekledim (Bu Kutuyu Gizle)
              </button>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="py-2.5 px-4 rounded-xl border border-amber-900/20 dark:border-stone-700 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-xs sm:text-sm"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-4">
          <img
            src="./icon-192.png"
            alt="Risale-i Nur"
            className="w-16 h-16 rounded-2xl shadow-md border border-amber-700/30 object-cover bg-black"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
          Risale-i Nur Külliyatı
        </h1>
        <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto text-sm sm:text-base mb-6 font-serif">
          Diyanet nüshası esas alınarak hazırlanmış sade, hızlı ve huzurlu okuma programı.
        </p>

        {/* Global Search Trigger Bar */}
        <div className="max-w-xl mx-auto space-y-3">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-amber-600 dark:hover:border-amber-500 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 shadow-xs transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-serif">Külliyat'ta kelime, terkip veya cümle ara...</span>
            </div>
            <kbd className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              Ara
            </kbd>
          </button>

          {/* Tek Düğme: Uygulama henüz telefona kurulmadıysa görünür, kurulduktan sonra tamamen kaybolur */}
          {!isAppInstalled && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleInstallAppClick}
                className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl border border-amber-600/40 bg-amber-50/80 dark:bg-stone-900 hover:bg-amber-100/80 text-amber-950 dark:text-amber-300 text-xs font-serif font-semibold transition-colors"
              >
                <Smartphone className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>Telefona Uygulama Olarak Ekle</span>
              </button>
              <button
                onClick={markAppInstalledAndHideButton}
                className="p-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 transition-colors"
                title="Bu düğmeyi bir daha gösterme"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Külliyat ilk kez arka planda cihaza kaydedilirken görünür; %100 tamamlandığında tamamen kaybolur */}
          {downloadingOffline && !offlineReady && (
            <div className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl border border-amber-600/30 bg-amber-50/60 dark:bg-stone-900/80 text-amber-900 dark:text-amber-300 text-xs font-serif">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700 dark:text-amber-400 shrink-0" />
              <span>Külliyat internetsiz kullanım için cihaza kaydediliyor... %{offlineProgress}</span>
            </div>
          )}

          {/* GÜNLÜK OKUMA TAKİBİ & HATİM DEFTERİ KARTI */}
          {activeTracked && (
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-700/30 dark:border-amber-500/25 bg-[#fbf0d9]/85 dark:bg-stone-900/90 text-left shadow-xs space-y-3">
              {/* Üst Satır: Takip Edilen Kitap ve Günlük Süre */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/10 dark:border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-amber-600/15 text-amber-800 dark:text-amber-300">
                    <BookmarkCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 font-serif block">
                      Esas Okuma / Hatim Takibi
                    </span>
                    <span className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                      {activeTracked.bookTitle}
                    </span>
                  </div>
                </div>

                {/* Günlük Okuma Sayacı */}
                <div className="flex items-center gap-1.5 text-xs font-serif bg-white/70 dark:bg-stone-800/80 px-2.5 py-1 rounded-xl border border-amber-900/10 dark:border-stone-700">
                  <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span className="text-stone-700 dark:text-stone-300">
                    Bugün: <strong className="text-amber-900 dark:text-amber-300">{todayStats.minutes} dk</strong>
                    {todayStats.chaptersCount > 0 ? ` · ${todayStats.chaptersCount} bahis` : ''}
                  </span>
                </div>
              </div>

              {/* İlerleme Çubuğu */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-serif text-stone-600 dark:text-stone-400">
                  <span className="truncate pr-2">
                    Kalınan Bahis: <strong className="text-stone-900 dark:text-stone-100">{activeTracked.chapterTitle}</strong>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-amber-800 dark:text-amber-400 shrink-0">
                    {activeTracked.chapterIndex} / {activeTracked.totalChapters} Bahis (%{trackedPct})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-amber-900/10 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${trackedPct}%` }}
                  />
                </div>
              </div>

              {/* Devam Et Butonu */}
              <button
                onClick={() =>
                  onResumeLastRead?.({
                    bookId: activeTracked.bookId,
                    bookTitle: activeTracked.bookTitle,
                    chapterId: activeTracked.chapterId,
                    chapterTitle: activeTracked.chapterTitle,
                    progressPercent: activeTracked.progressPercent,
                  })
                }
                className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-serif font-semibold text-xs sm:text-sm shadow-xs transition-transform active:scale-98"
              >
                <span>Kaldığın Yerden Devam Et ({activeTracked.chapterTitle})</span>
                <span>→</span>
              </button>

              {/* Son Göz Atılan Bahis (Eğer takip edilen kitaptan farklıysa) */}
              {lastRead && lastRead.chapterId !== activeTracked.chapterId && (
                <div className="pt-2 border-t border-amber-900/10 dark:border-stone-800 flex items-center justify-between text-xs font-serif text-stone-600 dark:text-stone-400">
                  <span className="truncate">
                    Son Göz Atılan: <strong className="text-stone-800 dark:text-stone-200">{lastRead.bookTitle} • {lastRead.chapterTitle}</strong>
                    {typeof lastRead.progressPercent === 'number' && lastRead.progressPercent > 0
                      ? ` (%${lastRead.progressPercent})`
                      : ''}
                  </span>
                  <button
                    onClick={() => onResumeLastRead?.(lastRead)}
                    className="text-amber-700 dark:text-amber-400 font-bold hover:underline shrink-0 ml-2"
                  >
                    Oraya Git →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GÜNÜN VECİZESİ KARTI (45+ Zengin Havuz & İsteğe Göre Gizlenebilir) */}
          {!hideVecize ? (
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-700/20 dark:border-amber-500/20 bg-[#fbf0d9]/60 dark:bg-stone-900/80 text-left shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400 font-serif">
                  Günün Vecizesi
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setVecizeIndex((prev) => (prev + 1) % DAILY_VECIZELER.length)
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-300 transition-colors"
                    title="Başka bir vecize göster"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Değiştir</span>
                  </button>
                  <button
                    onClick={() => {
                      setHideVecize(true);
                      try {
                        localStorage.setItem('nur_hide_vecize', 'true');
                      } catch {
                        // ignore
                      }
                    }}
                    className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors px-1"
                    title="Vecize kutusunu gizle"
                  >
                    Gizle ✕
                  </button>
                </div>
              </div>
              <p className="font-serif italic text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed">
                “{currentVecize.quote}”
              </p>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-serif font-semibold text-amber-900 dark:text-amber-300">
                  — {currentVecize.bookTitle} • {currentVecize.chapterTitle}
                </span>
                {onResumeLastRead && (
                  <button
                    onClick={() =>
                      onResumeLastRead({
                        bookId: currentVecize.bookId,
                        bookTitle: currentVecize.bookTitle,
                        chapterId: currentVecize.chapterId,
                        chapterTitle: currentVecize.chapterTitle,
                      })
                    }
                    className="font-bold text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    Bahse Git →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-right">
              <button
                onClick={() => {
                  setHideVecize(false);
                  try {
                    localStorage.removeItem('nur_hide_vecize');
                  } catch {
                    // ignore
                  }
                }}
                className="text-[11px] font-serif text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 underline transition-colors"
              >
                Günün Vecizesini Göster
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 content-start">
        {visibleBooks.map((book) => {
          const isSelected = selectedBook?.id === book.id;
          const visibleChapters = book.chapters.filter(
            (ch) => !/fihrist|içindekiler/i.test(ch.title || '')
          );

          return (
            <div
              key={book.id}
              onClick={() => {
                setExpandedChapterId(null);
                onSelectBook(book);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${
                isSelected
                  ? 'border-amber-600 bg-[#fbf0d9] dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-md ring-2 ring-amber-500/30'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  {book.title}
                </span>
              </div>

              {isSelected && (
                <div className="mt-4 pt-3 border-t border-amber-900/20 dark:border-stone-700 space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider">
                      Bölümler / Bahisler:
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetTrackedBook?.({
                          bookId: book.id,
                          bookTitle: book.title,
                          chapterId: visibleChapters[0]?.id || 'ch-1',
                          chapterTitle: visibleChapters[0]?.title || '',
                          chapterIndex: 1,
                          totalChapters: visibleChapters.length,
                          progressPercent: 0,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-serif font-semibold flex items-center gap-1 transition-colors ${
                        activeTracked?.bookId === book.id
                          ? 'bg-amber-700 text-white shadow-2xs'
                          : 'bg-white/80 dark:bg-stone-800 text-amber-900 dark:text-amber-300 hover:bg-amber-600 hover:text-white border border-amber-900/10'
                      }`}
                      title="Bu kitabı esas hatim/okuma takibine al"
                    >
                      <BookmarkCheck className="w-3 h-3" />
                      <span>{activeTracked?.bookId === book.id ? 'Takip Edilen Kitap ✓' : 'Bu Kitabı Takip Et'}</span>
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto pr-1 space-y-1.5">
                    {visibleChapters.map((ch, idx) => {
                      const hasSubs = Boolean(ch.subHeadings && ch.subHeadings.length > 0);
                      const isSubOpen = expandedChapterId === ch.id;

                      return (
                        <div key={ch.id} className="space-y-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectChapter(ch.id);
                              }}
                              className="flex-1 min-w-0 text-left p-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 bg-white/70 dark:bg-stone-950/60 hover:bg-amber-600 dark:hover:bg-amber-600 hover:text-white flex items-center justify-between group transition-colors shadow-2xs"
                            >
                              <span className="truncate">
                                {idx + 1}. {ch.title}
                              </span>
                              <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                            </button>

                            {hasSubs && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedChapterId((prev) =>
                                    prev === ch.id ? null : ch.id
                                  );
                                }}
                                className={`px-2.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 ${
                                  isSubOpen
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-white/70 dark:bg-stone-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-600 hover:text-white'
                                }`}
                                title="Alt başlıkları (Makam, Nokta, Hâtime vb.) göster"
                              >
                                <ListTree className="w-3.5 h-3.5" />
                                <span className="text-[11px]">{ch.subHeadings?.length}</span>
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform ${
                                    isSubOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Alt Başlıklar Listesi (Örn: 20. Söz -> 1. Makam, 2. Makam, Hâtime vb.) */}
                          {hasSubs && isSubOpen && ch.subHeadings && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="ml-3 pl-2.5 border-l-2 border-amber-600/40 space-y-1 py-1"
                            >
                              {ch.subHeadings.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => onSelectChapter(ch.id, sub.id)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-serif text-stone-800 dark:text-stone-200 bg-white/50 dark:bg-stone-900/80 hover:bg-amber-600 hover:text-white transition-colors flex items-center justify-between"
                                >
                                  <span className="truncate">• {sub.title}</span>
                                  <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ana Sayfa Altı Hâtime / Dua Satırı ve Paylaşım Düğmesi */}
      <footer className="mt-14 pt-6 border-t border-stone-200/80 dark:border-stone-800/80 text-center space-y-3">
        <div className="text-amber-700/50 dark:text-amber-400/40 text-xs select-none font-serif tracking-widest">
          — • —
        </div>
        <p className="font-serif italic text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
          İman ve Kur'ân hizmetine küçük bir vesile olması niyetiyle hazırlanmıştır. Emeği geçenleri hayır duanızda unutmayınız.
        </p>
        <div className="pt-1">
          <button
            onClick={handleShareApp}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-300/80 dark:border-stone-700 text-xs font-serif text-stone-600 dark:text-stone-300 hover:border-amber-600 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>
              {shareCopied ? 'Uygulama Bağlantısı Kopyalandı ✓' : 'Uygulamayı Paylaş'}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
