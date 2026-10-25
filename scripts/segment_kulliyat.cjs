const fs = require('fs');
const path = require('path');

const targetPublic = path.join(__dirname, '..', 'public', 'kulliyat');

const BOOK_PRIORITY = {
  'sozler': 1,
  'mektubat': 2,
  'lem-alar': 3,
  'sualar': 4,
  'mesnevi-i-nuriye': 5,
  'i-saratu-l-i-caz': 6,
  'muhakemat': 7,
  'barla-lahikasi': 8,
  'kastamonu-lahikasi': 9,
  'emirdag-lahikasi-1': 10,
  'emirdag-lahikasi-2': 11,
  'sikke-i-tasdik-i-gaybi': 12,
  'asa-yi-musa': 13,
  'tarihce-i-hayat': 14,
  'kucuk-kitaplar': 15,
};

const BOOK_TITLES = {
  'sozler': 'Sözler',
  'mektubat': 'Mektubat',
  'lem-alar': "Lem'alar",
  'sualar': 'Şuâlar',
  'mesnevi-i-nuriye': 'Mesnevî-i Nuriye',
  'i-saratu-l-i-caz': "İşaratü'l-İ'caz",
  'muhakemat': 'Muhakemat',
  'barla-lahikasi': 'Barla Lâhikası',
  'kastamonu-lahikasi': 'Kastamonu Lâhikası',
  'emirdag-lahikasi-1': 'Emirdağ Lâhikası 1',
  'emirdag-lahikasi-2': 'Emirdağ Lâhikası 2',
  'sikke-i-tasdik-i-gaybi': 'Sikke-i Tasdik-i Gaybî',
  'asa-yi-musa': 'Asâ-yı Musa',
  'tarihce-i-hayat': 'Tarihçe-i Hayat',
  'kucuk-kitaplar': 'Küçük Kitaplar',
};

// Yalnızca gerçek müstakil alt başlıkları yakalar; iki nokta (:), nokta (.), soru işareti (?) içeren cümleleri veya "Üçüncüsü" gibi ek almış kelimeleri başlık saymaz.
const HEADING_REGEX = /^(?:(?:birinci|ikinci|üçüncü|dördüncü|beşinci|altıncı|yedinci|sekizinci|dokuzuncu|onuncu|on birinci|on ikinci|on üçüncü|on dördüncü|on beşinci|on altıncı|on yedinci|on sekizinci|on dokuzuncu|yirminci|yirmi birinci|yirmi ikinci|yirmi üçüncü|yirmi dördüncü|yirmi beşinci|yirmi altıncı|yirmi yedinci|yirmi sekizinci|yirmi dokuzuncu|otuzuncu|otuz birinci|otuz ikinci|otuz üçüncü)\s+(?:söz|mektup|lem'a|lem’a|şuâ|şua|mesele|nükte|işaret|hakikat|makam|mebhas|fasıl|nokta|remiz|suret|lâtife|latife|deva|rica|zeyl|mukaddime|mukaddeme|hatve|basamak|pencere|kısım|bab|bâb|hüccet-i imaniye|nota|şube|meziyet|sebep|desise|şule|mevkıf|maksat|parça|risale|vecize|kelime|hâtime|hatime)|el-hâsıl|elhasıl|hâtime|hatime|mukaddeme|mukaddime|tenbih|ihtar|zeyl|tetimme|münâcat|tenevvür|tefekkür)(?![a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ’'])/i;

const COMPOUND_HEADING_REGEX = /(?:birinci|ikinci|üçüncü|dördüncü|beşinci|altıncı|yedinci|sekizinci|dokuzuncu|onuncu|küçük|mühim)\s+(?:makamı?|zeyli?|parçası|mebhası|nüktesi|kısmı|meselesi|hâtimesi|hatimesi|şulesi|mevkıfı|risalesi)|müdafaasıdır$|lâyihasıdır$|zeyldir$|hülâsası$/i;

function isTrueSubHeading(trimmed, rightAfterStars = false) {
  if (!trimmed || trimmed.length > 68) return false;
  // Cümle sonu veya açıklama noktalama işaretleri ya da Arapça harf varsa müstakil alt başlık değildir
  if (/[:.?!,;“”"\u0600-\u06FF]/.test(trimmed)) return false;
  if (/^[[(]/.test(trimmed)) return false;

  const trLower = trimmed.toLocaleLowerCase('tr-TR');
  if (HEADING_REGEX.test(trLower)) return true;
  if (COMPOUND_HEADING_REGEX.test(trLower)) return true;

  // '***' ayracından hemen sonra gelen kısa ve noktalamasız satır (örn. "Lemaat", "Sebep sırf zahirîdir", "Hüve Nüktesi")
  if (rightAfterStars && trimmed.length >= 4 && trimmed.length <= 55) {
    return true;
  }
  return false;
}

const LAHIKA_CHAPTER_TITLES = {
  'barla-lahikasi': {
    'ch-1': 'Takdim',
    'ch-2': "Yedinci Risale (Yirmi Sekizinci Mektup'tan)",
    'ch-3': 's.21-39 • Mukaddime (Hulûsi ve Sabri Efendi)',
    'ch-4': "s.40-58 • Yirmi Yedinci Mektup'un Zeyli",
    'ch-5': "s.59-80 • Hulûsi Bey'in Uzun Fıkrası",
    'ch-6': "s.80-102 • Sabri Efendi'nin Fıkrası",
    'ch-7': "s.103-121 • Murad Efendi'nin Fıkrası",
    'ch-8': 's.121-146 • Hediye İadesi Hakkında Mektup',
    'ch-9': "s.146-159 • Hâfız Halid'in Fıkrası",
    'ch-10': "s.160-180 • Hâfız Mustafa'nın Fıkrası",
    'ch-11': "s.181-201 • Hâfız Ali'nin Fıkrası (Hikmetü'l-İstiaze)",
    'ch-12': "s.202-221 • Hulûsi Bey'in Fıkrası",
    'ch-13': "s.221-240 • Ahmed Hüsrev'in Fıkrası",
    'ch-14': "s.241-261 • Hâfız Ali'nin Fıkrası (Mirkatü's-Sünne)",
    'ch-15': "s.262-280 • Üçüncü Mektup'un Baş Kısmı",
    'ch-16': "s.280-299 • Hüsrev'e Hitaben Mektup",
    'ch-17': 's.300-321 • Üç Asılsız Vehme Cevap',
    'ch-18': "s.321-340 • Yirmi Dokuzuncu Mektup'a Dair",
    'ch-19': "s.340-362 • Re'fet Bey'e Mektup",
    'ch-20': 's.363-392 • Muhtelif Lâhika Mektupları',
  },
  'kastamonu-lahikasi': {
    'ch-1': 'Takdim',
    'ch-2': 's.10-30 • Hizmet-i Kur’âniye ve İhlas Mektupları',
    'ch-3': 's.30-51 • Manevî Bir İhtar ve İki İnce Mesele',
    'ch-4': 's.52-69 • Nur ve Gül Fabrikalarının Vaziyeti',
    'ch-5': 's.70-91 • Şuhur-u Selâse ve Hizmet Tebriği',
    'ch-6': 's.91-109 • Risale-i Nur Dairesinin Sebatı',
    'ch-7': 's.110-129 • İki Hatıradan İki İhtar',
    'ch-8': 's.130-149 • İhtiyat ve Hizmet-i Nuriye Mektupları',
    'ch-9': "s.150-166 • Lemaat'tan (Fâtiha'daki Üç Yol)",
    'ch-10': 's.167-189 • İ’caz-ı Kur’ân ve Hizmet Mektupları',
    'ch-11': "s.190-210 • Karadağ'ın Bir Meyvesi",
    'ch-12': 's.211-230 • İşârât-ı Kur’âniye ve Teselli Mektupları',
    'ch-13': "s.231-255 • Merhum Mehmed Zühdü ve Risale-i Nur'un Takdiri",
  },
  'emirdag-lahikasi-1': {
    'ch-1': 'Takdim',
    'ch-2': "s.10-31 • Emirdağ'daki Kardeşlere ve Evhamlara Cevap",
    'ch-3': 's.31-50 • Yağmur Duası ve Musibetler Hakkında Sual-Cevap',
    'ch-4': 's.50-69 • Ankara Ehl-i Vukuf Raporuna Dair',
    'ch-5': 's.70-90 • İki Ehemmiyetli Mesele ve Hizmet İhtarları',
    'ch-6': 's.90-110 • İki Şıklı Bir Sualin Cevabı',
    'ch-7': "s.110-130 • Asâ-yı Musa Hizmeti ve Tebrik",
    'ch-8': "s.131-150 • Re'fet Bey'e ve Nur Talebelerine Mektuplar",
    'ch-9': 's.150-170 • Kastamonu ve Isparta Kahramanlarına Mektuplar',
    'ch-10': 's.170-190 • Leyle-i Berat ve Ramazan-ı Şerif Tebriği',
    'ch-11': "s.190-211 • Risale-i Nur'u Yazmanın العالم ve Uhrevî Faydaları".replace('العالم', 'Dünyevî'),
    'ch-12': "s.212-230 • Süleyman Rüşdü ve Nur'un Fütuhatı",
    'ch-13': 's.230-251 • Emirdağ Yağmuru ve Hizmet Mektupları',
    'ch-14': 's.251-270 • Müsadere Edilen Kitapların İadesi ve Bayram Tebriği',
    'ch-15': "s.271-288 • Re'fet Bey'e ve Hizmetin İstikametine Dair",
  },
  'emirdag-lahikasi-2': {
    'ch-1': 'Takdim',
    'ch-2': 's.6-26 • Bayram Tebriği ve Her Bir Talebenin Birer Said Olması',
    'ch-3': 's.27-50 • Sözler Mecmuası ve Tashih Hizmeti',
    'ch-4': 's.51-70 • “Risale-i Nur İmha Edilmez!” Dilekçesi',
    'ch-5': 's.70-90 • Dindar Milletvekillerine ve Âlem-i İslâm’a Hitap',
    'ch-6': 's.91-109 • Er-Rahmân Sûresi Tefsirinin Hülâsası',
    'ch-7': "s.110-128 • Eski Said'in Matbu Eserlerinden Bir Fıkra",
    'ch-8': 's.129-148 • Ehl-i Vukuf Raporuna İtiraz ve Hakikat-i Hal',
    'ch-9': 's.149-170 • Yeni Hurufla Yazılan Bir Mektuba Cevap',
    'ch-10': 's.171-189 • Bağdat “Eddifa” Gazetesinin Makalesi',
    'ch-11': 's.190-210 • Leyle-i Kadir İhtarı ve Hizmet Mektupları',
    'ch-12': 's.210-229 • Hizmet-i İmaniye Tebriği ve İhtarlar',
    'ch-13': 's.230-247 • Cumhuriyet Gazetesinin İftiralarına Cevap',
  },
};

function cleanChapterTitle(bookId, chId, rawTitle) {
  if (LAHIKA_CHAPTER_TITLES[bookId] && LAHIKA_CHAPTER_TITLES[bookId][chId]) {
    return LAHIKA_CHAPTER_TITLES[bookId][chId];
  }
  let t = rawTitle
    .normalize('NFC')
    .replace(/i\u0307/g, 'i')
    .replace(/I\u0307/g, 'İ')
    .replace(/^.+?-\d+-/, '')
    .trim();

  if (bookId === 'emirdag-lahikasi-2' && chId === 'ch-1' && t === 'Emirdağ Lâhikası - I') {
    t = 'Emirdağ Lâhikası - II - Takdim';
  }
  if (t === 'Ön söz') {
    t = 'Ön Söz';
  }
  if (bookId === 'kucuk-kitaplar') {
    const map = {
      'Divan-i Harb-i Örfî': 'Divan-ı Harb-i Örfî',
      'Hanimlar Rehberi': 'Hanımlar Rehberi',
    };
    if (map[t]) t = map[t];
  }
  return t;
}

const indexPath = path.join(targetPublic, 'books-index.json');
const existingIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

// Kitapları doğru Külliyat sırasına diz
existingIndex.sort((a, b) => (BOOK_PRIORITY[a.id] || 99) - (BOOK_PRIORITY[b.id] || 99));

let totalPassagesAcrossKulliyat = 0;
const newBooksIndex = [];
const searchIndex = [];

for (const book of existingIndex) {
  const bookId = book.id;
  const bookTitle = BOOK_TITLES[bookId] || book.title;
  const bookDir = path.join(targetPublic, bookId);
  const newChapters = [];

  for (const chMeta of book.chapters) {
    const chPath = path.join(bookDir, `${chMeta.id}.json`);
    const chData = JSON.parse(fs.readFileSync(chPath, 'utf-8'));

    const chapterTitle = cleanChapterTitle(bookId, chMeta.id, chData.title || chMeta.title);

    // Tam metni al (rawContent varsa oradan, yoksa mevcut pasajların birleşiminden)
    const fullText = typeof chData.rawContent === 'string' && chData.rawContent.length > 0
      ? chData.rawContent
      : (chData.passages || []).map((p) => p.text).join('\n');

    const lines = fullText.split(/\r?\n/);
    const passages = [];
    let currentSubHeading = '';
    let currentPassageLines = [];
    let subIndex = 1;
    let justSawStars = false;

    const flushPassage = () => {
      const hasRealContent = currentPassageLines.some(
        (l) => l.trim().length > 0 && l.trim() !== '***'
      );
      if (!hasRealContent) return;

      const joined = currentPassageLines.join('\n').trim();
      if (joined.length > 0) {
        const fullTitle = currentSubHeading
          ? `${bookTitle} • ${chapterTitle} — ${currentSubHeading}`
          : `${bookTitle} • ${chapterTitle}`;
        const shortTitle = currentSubHeading || chapterTitle;

        const psgObj = {
          id: 'p-' + subIndex,
          title: fullTitle,
          shortTitle: shortTitle,
          text: joined,
        };
        passages.push(psgObj);

        if (
          bookId !== 'kucuk-kitaplar' &&
          !/fihrist|içindekiler/i.test(chapterTitle)
        ) {
          searchIndex.push({
            bookId,
            bookTitle,
            chapterId: chMeta.id,
            chapterTitle,
            passageId: psgObj.id,
            title: psgObj.title,
            text: psgObj.text,
          });
        }

        subIndex++;
        currentPassageLines = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '***') {
        flushPassage();
        currentSubHeading = '';
        justSawStars = true;
        // '***' ayracını metin içinde koru ki hiçbir satır kaybolmasın ve tekrar çalıştırıldığında 100% kayıpsız olsun
        currentPassageLines.push('***');
      } else if (trimmed.length > 0 && isTrueSubHeading(trimmed, justSawStars)) {
        const hasOtherContent = currentPassageLines.some(
          (l) => l.trim().length > 0 && l.trim() !== '***'
        );
        if (hasOtherContent) {
          flushPassage();
        }
        currentSubHeading = trimmed;
        justSawStars = false;
        // Başlık satırını metinden SİLME; metnin ilk satırı olarak yerinde bırak!
        currentPassageLines.push(trimmed);
      } else {
        if (trimmed.length > 0) {
          justSawStars = false;
        }
        currentPassageLines.push(line);
      }
    }

    flushPassage();

    totalPassagesAcrossKulliyat += passages.length;

    // Çift metin tekrarını önlemek için rawContent alanını kaydetmiyoruz (metin passages içinde %100 kayıpsız duruyor)
    fs.writeFileSync(
      chPath,
      JSON.stringify({
        id: chMeta.id,
        bookId: bookId,
        bookTitle: bookTitle,
        title: chapterTitle,
        passages: passages,
      }),
      'utf-8'
    );

    const firstCleanText = (passages[0]?.text || '')
      .replace(/^\*\*\*\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();

    const subHeadings = [];
    const seenSubTitles = new Set();
    for (const p of passages) {
      if (
        p.shortTitle &&
        p.shortTitle !== chapterTitle &&
        p.shortTitle.toLocaleLowerCase('tr-TR') !== chapterTitle.toLocaleLowerCase('tr-TR') &&
        !seenSubTitles.has(p.shortTitle)
      ) {
        seenSubTitles.add(p.shortTitle);
        subHeadings.push({ id: p.id, title: p.shortTitle });
      }
    }

    newChapters.push({
      id: chMeta.id,
      title: chapterTitle,
      passageCount: passages.length,
      snippet: firstCleanText.substring(0, 160).trim(),
      subHeadings: subHeadings.length > 0 ? subHeadings : undefined,
    });
  }

  newBooksIndex.push({
    id: bookId,
    title: bookTitle,
    chapterCount: newChapters.length,
    chapters: newChapters,
  });
}

fs.writeFileSync(indexPath, JSON.stringify(newBooksIndex, null, 2), 'utf-8');
fs.writeFileSync(
  path.join(targetPublic, 'search-index.json'),
  JSON.stringify(searchIndex),
  'utf-8'
);

console.log('Kulliyat veri temizligi ve bolumleme tamamlandi!');
console.log('Toplam Kitap:', newBooksIndex.length);
console.log('Toplam Bolum (Pasaj):', totalPassagesAcrossKulliyat);
console.log('Arama Dizini Kayit Sayisi:', searchIndex.length);
