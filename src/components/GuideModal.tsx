import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Smartphone,
  WifiOff,
  HeartHandshake,
  BookMarked,
  BookOpen,
  GitFork,
  Gauge,
  RefreshCw,
  Share2,
  ImageDown,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export const APP_SHARE_URL = 'https://25akif2534-sketch.github.io/nur-okuma/';

export const APP_DUA_TEXT =
  'İman ve Kur’ân hakikatlerinin okunmasına ve anlaşılmasına küçük bir vesile olması niyetiyle hazırlanmıştır. Yâ Erhame’r-Râhimîn! Müellif-i muhterem Bediüzzaman Said Nursî Hazretlerine, bu eserlerin neşrinde ve bu programın hazırlanmasında emeği geçenlere, okuyan ve paylaşan kardeşlerimize, anne-babalarımıza ve bilcümle ehl-i imana rahmet ve mağfiretinle muamele eyle. Âmin.';

export const APP_PROMO_SHARE_TEXT = `📖 *RİSALE-İ NUR KÜLLİYATI — Okuma, Lügat, Meal & Çapraz İzah Programı*

Diyanet nüshası esas alınarak hazırlanmış; reklamsız, üyeliksiz ve internetsiz çalışan Risale-i Nur okuma ve mütalaa rehberi:

✨ *Diğer Uygulamalardan Farkı Nedir?*
• *Elmalılı Hamdi Yazır Meali:* Sure ve ayet numarası yazmayan veya sadece bir kısmı geçen Arapça ayetlere dokununca sure/ayet numarasını bulur, geçen kısmı Arapça tam ayet içinde renkli vurgular ve mealini açar.
• *Akıllı Osmanlıca Lügat & Terkip Çözücü:* Kelimeye veya tamlamaya basılı tutunca Türkçe çekim eklerini soyup kök ve terkip anlamını gösterir.
• *Çapraz İzah (Mütalaa):* Seçilen bir kavramın Külliyat’taki diğer geçtiği yerleri listeler, inceledikten sonra tek tıkla okunan satıra geri döndürür.
• *Hızlı Okuma (RSVP) & Hatim Takibi:* Göz yormayan odak noktalı hızlı okuma motoru ve kalınan yeri / günlük okuma süresini kaydeden hatim çubuğu sunar.

📲 *Telefona Nasıl Kurulur?*
• *iPhone / iPad (Safari):* Bağlantıyı açın → Ekranın altındaki *Paylaş (↑)* düğmesine dokunun → *"Ana Ekrana Ekle"* seçeneğine basın.
• *Android (Chrome):* Bağlantıyı açın → Sağ üstteki *üç nokta (⋮)* menüsüne dokunun → *"Uygulamayı yükle"* veya *"Ana ekrana ekle"* seçeneğine basın.

✈️ *İnternetsiz Kullanım & Güncelleme:*
İlk açılışta 15 kitaplık Külliyat, Lügat ve Meal cihaza otomatik kaydedilir; sonrasında internet olmasa da çalışır. Yeni özellikler eklendiğinde ana sayfanın altındaki *"Sürümü Yenile"* düğmesine dokunmanız yeterlidir.

🤲 *Dua:*
_${APP_DUA_TEXT}_

🔗 *Uygulama Bağlantısı:*
${APP_SHARE_URL}`;

function wrapCanvasParagraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateAndSharePromoPoster(): Promise<string> {
  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 1620;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'Görsel oluşturulamadı';

  // Sepya Zemin
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#fdf6e4');
  grad.addColorStop(1, '#f3e1bc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Dış ve İç Tezhip Çerçevesi
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  ctx.strokeStyle = 'rgba(146, 64, 14, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(58, 58, width - 116, height - 116);

  // Köşe Süsleri
  const corners = [
    [58, 58],
    [width - 58, 58],
    [58, height - 58],
    [width - 58, height - 58],
  ];
  ctx.fillStyle = '#b45309';
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Üst Başlık
  ctx.textAlign = 'center';
  ctx.fillStyle = '#92400e';
  ctx.font = '700 24px "Literata", Georgia, serif';
  ctx.fillText('DİYANET NÜSHASI ESASLI • REKLAMSIZ & İNTERNETSİZ', width / 2, 122);

  ctx.fillStyle = '#291c0e';
  ctx.font = '700 46px "Literata", Georgia, serif';
  ctx.fillText('RİSALE-İ NUR KÜLLİYATI', width / 2, 180);

  ctx.fillStyle = '#78350f';
  ctx.font = '600 26px "Literata", Georgia, serif';
  ctx.fillText('Okuma • Elmalılı Meali • Osmanlıca Lügat • Çapraz İzah', width / 2, 224);

  // Ayırıcı Çizgi
  ctx.strokeStyle = 'rgba(146, 64, 14, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(140, 254);
  ctx.lineTo(width - 140, 254);
  ctx.stroke();

  // Özellikler Bölümü
  ctx.textAlign = 'left';
  const leftX = 96;
  const contentWidth = width - 192;
  let y = 305;

  ctx.fillStyle = '#92400e';
  ctx.font = '700 27px "Literata", Georgia, serif';
  ctx.fillText('ÖNE ÇIKAN ÖZELLİKLER', leftX, y);
  y += 42;

  const features = [
    [
      '1. Elmalılı Hamdi Yazır Meali:',
      'Sure ve ayet numarası yazmayan veya parçalı geçen Arapça ayetlere dokununca sure/ayet numarasını bulur, geçen kısmı vurgular ve mealini açar.',
    ],
    [
      '2. Akıllı Osmanlıca Lügat & Terkip Çözücü:',
      'Kelimeye veya tamlamaya basılı tutunca Türkçe çekim eklerini soyarak kök ve terkip anlamını anında gösterir.',
    ],
    [
      '3. Çapraz İzah (Mütalaa) & Hızlı Okuma:',
      'Seçilen kavramın Külliyat’taki diğer yerlerini açar, okunan satıra tek tıkla geri döndürür; odak noktalı hızlı okuma sunar.',
    ],
    [
      '4. %100 İnternetsiz Çalışma & Hatim Takibi:',
      'İlk açılışta 15 kitap, Lügat ve Meal cihaza otomatik kaydedilir. Kalınan bahsi ve günlük okuma dakikasını hafızada tutar.',
    ],
  ];

  for (const [title, desc] of features) {
    ctx.fillStyle = '#291c0e';
    ctx.font = '700 24px "Literata", Georgia, serif';
    ctx.fillText(title, leftX, y);
    y += 32;

    ctx.fillStyle = '#433422';
    ctx.font = '400 22px "Literata", Georgia, serif';
    const descLines = wrapCanvasParagraph(ctx, desc, contentWidth - 16);
    for (const line of descLines) {
      ctx.fillText(line, leftX + 16, y);
      y += 31;
    }
    y += 14;
  }

  // Kurulum Kutusu
  y += 8;
  ctx.fillStyle = 'rgba(180, 83, 9, 0.08)';
  ctx.fillRect(leftX, y, contentWidth, 235);
  ctx.strokeStyle = 'rgba(146, 64, 14, 0.3)';
  ctx.strokeRect(leftX, y, contentWidth, 235);

  y += 42;
  ctx.fillStyle = '#92400e';
  ctx.font = '700 25px "Literata", Georgia, serif';
  ctx.fillText('TELEFONA KURULUM & GÜNCELLEME REHBERİ', leftX + 24, y);

  y += 38;
  ctx.fillStyle = '#291c0e';
  ctx.font = '600 21px "Literata", Georgia, serif';
  ctx.fillText(
    '• iPhone / iPad (Safari): Alttaki Paylaş (↑) düğmesi → "Ana Ekrana Ekle"',
    leftX + 24,
    y
  );

  y += 36;
  ctx.fillText(
    '• Android (Chrome): Sağ üstteki üç nokta (⋮) → "Uygulamayı yükle / Ana ekrana ekle"',
    leftX + 24,
    y
  );

  y += 36;
  ctx.fillText(
    '• Güncelleme: Ana sayfanın altındaki "Sürümü Yenile" düğmesine dokunmanız yeterlidir.',
    leftX + 24,
    y
  );

  // Dua Bölümü
  y += 82;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#78350f';
  ctx.font = 'italic 500 22px "Literata", Georgia, serif';
  const duaLines = wrapCanvasParagraph(ctx, `“${APP_DUA_TEXT}”`, contentWidth - 40);
  for (const line of duaLines) {
    ctx.fillText(line, width / 2, y);
    y += 33;
  }

  // Alt Bağlantı Çubuğu
  const footerY = height - 92;
  ctx.strokeStyle = 'rgba(146, 64, 14, 0.35)';
  ctx.beginPath();
  ctx.moveTo(width / 2 - 160, footerY - 36);
  ctx.lineTo(width / 2 + 160, footerY - 36);
  ctx.stroke();

  ctx.fillStyle = '#92400e';
  ctx.font = '700 24px monospace';
  ctx.fillText(APP_SHARE_URL, width / 2, footerY);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );
  if (!blob) return 'Hata';

  const file = new File([blob], 'risale-i-nur-tanitim-rehberi.png', {
    type: 'image/png',
  });

  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: 'Risale-i Nur Külliyatı — Kullanım & Kurulum Rehberi',
        text: APP_PROMO_SHARE_TEXT,
      });
      return 'Tanıtım afişi ve mesajı paylaşıldı';
    } catch {
      // Kullanıcı paylaşımı kapattıysa indirmeye geç
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'risale-i-nur-tanitim-rehberi.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return 'Tanıtım afişi görsel olarak indirildi';
}

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallAppClick?: () => void;
  isAppInstalled?: boolean;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onInstallAppClick,
  isAppInstalled,
}) => {
  const [step, setStep] = useState(0);
  const [copiedText, setCopiedText] = useState(false);
  const [posterStatus, setPosterStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStep((s) => Math.min(3, s + 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const steps = [
    { id: 0, label: '1. Farkı Nedir?', icon: Sparkles },
    { id: 1, label: '2. Kurulum', icon: Smartphone },
    { id: 2, label: '3. İnternetsiz', icon: WifiOff },
    { id: 3, label: '4. Dua & Paylaş', icon: HeartHandshake },
  ];

  const handleShareRichText = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Risale-i Nur Külliyatı — Okuma, Lügat, Meal & Çapraz İzah',
          text: APP_PROMO_SHARE_TEXT,
        });
        return;
      } catch {
        // Kopyalamaya düş
      }
    }
    try {
      await navigator.clipboard.writeText(APP_PROMO_SHARE_TEXT);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2800);
    } catch {
      // ignore
    }
  };

  const handleDownloadPoster = async () => {
    const msg = await generateAndSharePromoPoster();
    setPosterStatus(msg);
    setTimeout(() => setPosterStatus(null), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-70 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#fbf0d9] dark:bg-stone-900 text-[#3e2e1c] dark:text-stone-100 border border-amber-800/30 dark:border-amber-500/25 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık */}
        <div className="px-5 pt-4 pb-3 border-b border-amber-900/15 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="./icon-192.png"
              alt="Risale-i Nur"
              className="w-9 h-9 rounded-xl border border-amber-700/30 object-cover bg-black shrink-0"
            />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-400 font-bold">
                Tanıtım & Kullanım Kılavuzu
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold">
                Risale-i Nur Okuma & Mütalaa Rehberi
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Kapat (Esc)"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sekme Çubuğu (4 Adım) */}
        <div className="px-4 py-2.5 bg-amber-900/5 dark:bg-stone-950/60 border-b border-amber-900/10 dark:border-stone-800 grid grid-cols-4 gap-1.5">
          {steps.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1.5 rounded-xl text-[11px] sm:text-xs font-serif font-semibold transition-all ${
                  active
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'hover:bg-amber-700/10 text-stone-700 dark:text-stone-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* İçerik Gövdesi */}
        <div className="flex-1 overflow-y-auto px-5 py-5 font-serif space-y-4 text-sm sm:text-base leading-relaxed">
          {/* ADIM 1: DİĞERLERİNDEN FARKI NEDİR? */}
          {step === 0 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <p className="text-xs sm:text-sm opacity-85">
                Diyanet İşleri Başkanlığı nüshası esas alınarak hazırlanan bu program, okuma huzurunu bozmadan derinlikli mütalaa yapabilmeniz için şu özgün araçları bir arada sunar:
              </p>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#fbf4e2] dark:bg-stone-800/90 border border-amber-900/15 dark:border-stone-700 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-600/20 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="font-bold text-amber-900 dark:text-amber-300">
                      Elmalılı Hamdi Yazır Meali (Parça & Çoklu Ayet Tespiti)
                    </div>
                    <p className="opacity-90">
                      Risale metninde sure ve ayet numarası yazmayan, birkaç farklı sureden yan yana geçen veya sadece 2-3 kelimesi iktibas edilen Arapça ayetlere dokunduğunuzda; hangi sure ve ayet olduğunu bulur, geçen parçayı tam ayet içinde renkli vurgular ve Elmalılı mealini açar.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#fbf4e2] dark:bg-stone-800/90 border border-amber-900/15 dark:border-stone-700 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-600/20 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="font-bold text-amber-900 dark:text-amber-300">
                      Akıllı Osmanlıca Lügat & Terkip Çözücü
                    </div>
                    <p className="opacity-90">
                      Anlamını bilmediğiniz bir kelimeye veya tamlamaya basılı tuttuğunuzda (veya seçip <strong>Lügat</strong> düğmesine bastığınızda) Türkçe çekim eklerini soyarak kelimenin kök ve terkip anlamını anında gösterir.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#fbf4e2] dark:bg-stone-800/90 border border-amber-900/15 dark:border-stone-700 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-600/20 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                    <GitFork className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="font-bold text-amber-900 dark:text-amber-300">
                      Çapraz İzah (Mütalaa) & Tek Tıkla Geri Dönüş
                    </div>
                    <p className="opacity-90">
                      Bir kavramı veya cümleyi seçip <strong>Çapraz İzah</strong> dediğinizde Külliyat’taki diğer geçtiği yerleri listeler; ilgili risaleye gidip okuduktan sonra üstteki çubukla asıl okuduğunuz satıra kaybolmadan geri dönersiniz.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#fbf4e2] dark:bg-stone-800/90 border border-amber-900/15 dark:border-stone-700 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-600/20 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="font-bold text-amber-900 dark:text-amber-300">
                      Odak Noktalı Hızlı Okuma (RSVP) & Hatim Takibi
                    </div>
                    <p className="opacity-90">
                      İstediğiniz cümleden itibaren hız ayarlı odak okumasını başlatabilir, <strong>Hâşiye</strong> düğmelerine dokunarak dipnotları açabilir, günlük okuma sürenizi ve kaldığınız bahsi otomatik takip edebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADIM 2: ANDROID & IPHONE KURULUM */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-xs sm:text-sm opacity-90">
                Uygulama mağazasına, reklama veya üyeliğe ihtiyaç duymadan programı telefonunuzun ve tabletinizin ana ekranına gerçek uygulama olarak ekleyebilirsiniz:
              </p>

              <div className="p-4 rounded-2xl bg-[#fbf4e2] dark:bg-stone-800/90 border border-amber-900/15 dark:border-stone-700 space-y-2">
                <div className="font-bold text-amber-900 dark:text-amber-300 text-sm sm:text-base flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>iPhone / iPad (Safari Tarayıcısı)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm">
                  <li>
                    Safari’de sayfayı açtıktan sonra ekranın alt ortasındaki <strong>Paylaş</strong> (yukarı oklu kare) düğmesine dokunun.
                  </li>
                  <li>
                    Açılan menüde biraz aşağı kaydırıp <strong>“Ana Ekrana Ekle”</strong> seçeneğine basın.
                  </li>
                  <li>
                    Sağ üstteki <strong>“Ekle”</strong> düğmesine dokunun. Program ana ekranınıza yerleşecektir.
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-[#fbf4e2] dark:bg-stone-800/90 border border-amber-900/15 dark:border-stone-700 space-y-2">
                <div className="font-bold text-amber-900 dark:text-amber-300 text-sm sm:text-base flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Android Telefon & Tablet (Chrome Tarayıcısı)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm">
                  <li>
                    Ana sayfadaki <strong>“Telefona Uygulama Olarak Ekle”</strong> düğmesine basın veya Chrome’un sağ üst köşesindeki <strong>üç nokta (⋮)</strong> menüsüne dokunun.
                  </li>
                  <li>
                    <strong>“Uygulamayı yükle”</strong> veya <strong>“Ana ekrana ekle”</strong> seçeneğine dokunun.
                  </li>
                  <li>
                    Onay verdiğinizde uygulama telefonunuza tam ekran olarak kurulacaktır.
                  </li>
                </ol>
              </div>

              {!isAppInstalled && onInstallAppClick && (
                <button
                  onClick={onInstallAppClick}
                  className="w-full py-3 px-4 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Şimdi Telefona Uygulama Olarak Ekle</span>
                </button>
              )}
            </div>
          )}

          {/* ADIM 3: İNTERNETSİZ KULLANIM & GÜNCELLEMELER */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-[#fbf4e2] dark:bg-stone-800/90 border border-amber-900/15 dark:border-stone-700 space-y-2">
                <div className="font-bold text-amber-900 dark:text-amber-300 text-sm sm:text-base flex items-center gap-2">
                  <WifiOff className="w-4 h-4" />
                  <span>İnternetsiz (Çevrimdışı) Kullanılabilir mi?</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong>Evet, %100 internetsiz çalışır.</strong> Programı ilk kez açtığınızda 15 kitaplık Külliyat metni, tam metin arama dizini, Osmanlıca Lügat ve Elmalılı Hamdi Yazır Meali arka planda otomatik olarak cihazınızın hafızasına kaydedilir.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed opacity-85">
                  Ana sayfadaki <em>“Külliyat internetsiz kullanım için cihaza kaydediliyor”</em> çubuğu %100 olup kapandıktan sonra uçakta, yolculukta veya internetin hiç çekmediği yerlerde tüm kitapları, lügatı ve mealleri açabilirsiniz.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#fbf4e2] dark:bg-stone-800/90 border border-amber-900/15 dark:border-stone-700 space-y-2">
                <div className="font-bold text-amber-900 dark:text-amber-300 text-sm sm:text-base flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Güncellemeler İçin Ne Yapmak Gerekir?</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Programa yeni bir özellik eklendiğinde silip yeniden kurmanıza gerek yoktur:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
                  <li>
                    İnternete bağlıyken uygulamayı açtığınızda yeni sürüm varsa ekranın en üstünde otomatik olarak <strong>“Yeni sürüm hazır — Güncelle”</strong> bildirimi çıkar.
                  </li>
                  <li>
                    Ayrıca dilediğiniz zaman ana sayfanın en altındaki <strong>“Sürümü Yenile”</strong> düğmesine bir kez dokunarak en güncel sürümü anında alabilirsiniz. Okuma ve hatim kaydınız silinmez.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ADIM 4: HÂTİME, DUA & PAYLAŞIM */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Tezhip Çerçeveli Dua Kartı */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#fdf6e4] to-[#f4e3c1] dark:from-stone-800 dark:to-stone-900 border-2 border-amber-700/40 dark:border-amber-500/30 shadow-inner text-center space-y-3">
                <div className="text-amber-800 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">
                  — Hâtime & Dua —
                </div>
                <p className="text-sm sm:text-base italic leading-relaxed text-[#2c1e10] dark:text-amber-100">
                  “{APP_DUA_TEXT}”
                </p>
                <div className="text-amber-800/60 dark:text-amber-400/50 text-xs select-none tracking-widest">
                  • • •
                </div>
              </div>

              {/* Paylaşım Araçları */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-bold uppercase tracking-wider opacity-75 text-center">
                  Programı Tanıtım Metni veya Görsel Afiş İle Paylaşın
                </div>

                <button
                  onClick={handleShareRichText}
                  className="w-full py-3 px-4 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Tanıtım Metni, Dua ve Link Kopyalandı ✓</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>WhatsApp / Mesaj Olarak Paylaş (Tanıtım + Dua + Link)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadPoster}
                  className="w-full py-3 px-4 rounded-2xl border border-amber-700/40 dark:border-amber-500/40 bg-[#fbf4e2] dark:bg-stone-800 hover:bg-amber-500/15 text-amber-950 dark:text-amber-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <ImageDown className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>
                    {posterStatus || 'Tanıtım & Kurulum Afişini Görsel Olarak İndir / Paylaş'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Alt Gezinme Çubuğu */}
        <div className="px-5 py-3.5 border-t border-amber-900/15 dark:border-stone-800 bg-amber-900/5 dark:bg-stone-950/50 flex items-center justify-between gap-2">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-amber-900/20 dark:border-stone-700 text-xs font-serif font-semibold transition-all ${
              step === 0
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Önceki</span>
          </button>

          {/* Nokta Göstergeleri */}
          <div className="flex items-center gap-1.5">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                aria-label={`Adım ${s.id + 1}`}
                className={`h-2 rounded-full transition-all ${
                  step === s.id
                    ? 'w-6 bg-amber-700 dark:bg-amber-400'
                    : 'w-2 bg-amber-900/25 dark:bg-stone-700'
                }`}
              />
            ))}
          </div>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-serif font-semibold shadow-xs transition-colors"
            >
              <span>Sonraki</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-serif font-semibold shadow-xs transition-colors"
            >
              <span>Okumaya Başla</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
