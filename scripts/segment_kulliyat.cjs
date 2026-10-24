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
const HEADING_REGEX = /^(?:(?:Birinci|İkinci|Üçüncü|Dördüncü|Beşinci|Altıncı|Yedinci|Sekizinci|Dokuzuncu|Onuncu|On Birinci|On İkinci|On Üçüncü|On Dördüncü|On Beşinci|On Altıncı|On Yedinci|On Sekizinci|On Dokuzuncu|Yirminci|Yirmi Birinci|Yirmi İkinci|Yirmi Üçüncü|Yirmi Dördüncü|Yirmi Beşinci|Yirmi Altıncı|Yirmi Yedinci|Yirmi Sekizinci|Yirmi Dokuzuncu|Otuzuncu|Otuz Birinci|Otuz İkinci|Otuz Üçüncü)\s+(?:Söz|Mektup|Lem'a|Lem’a|Şuâ|Şua|Mesele|Nükte|İşaret|Hakikat|Makam|Mebhas|Fasıl|Nokta|Remiz|Suret|Lâtife|Deva|Rica|Zeyl|Mukaddime|Mukaddeme|Hatve|Basamak|Pencere|Kısım|Bab|Bâb|Hüccet-i İmaniye|Nota|Şube|Meziyet|Sebep|Desise|Hâtime|Hatime)|El-Hâsıl|Hâtime|Hatime|Mukaddeme|Mukaddime|Tenbih|İhtar|Zeyl|Tetimme|Münâcat)(?![a-zA-ZğüşıöçĞÜŞİÖÇâîûāīūÂÎÛĀĪŪ’'])/i;

function cleanChapterTitle(bookId, chId, rawTitle) {
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

function isTrueSubHeading(trimmed) {
  if (!trimmed || trimmed.length > 55) return false;
  // Cümle sonu veya açıklama noktalama işaretleri varsa müstakil alt başlık değildir
  if (/[:.?!,;“”"]/.test(trimmed)) return false;
  return HEADING_REGEX.test(trimmed);
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
        // '***' ayracını metin içinde koru ki hiçbir satır kaybolmasın ve tekrar çalıştırıldığında 100% kayıpsız olsun
        currentPassageLines.push('***');
      } else if (isTrueSubHeading(trimmed)) {
        flushPassage();
        currentSubHeading = trimmed;
        // Başlık satırını metinden SİLME; metnin ilk satırı olarak yerinde bırak!
        currentPassageLines.push(trimmed);
      } else {
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

    newChapters.push({
      id: chMeta.id,
      title: chapterTitle,
      passageCount: passages.length,
      snippet: firstCleanText.substring(0, 160).trim(),
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
