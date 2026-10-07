const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.env.USERPROFILE, 'Downloads', 'Risale-Diyanet-Acilmis', 'Risale-i-Nur-Diyanet-master');
const targetPublic = path.join(process.cwd(), 'public', 'kulliyat');

// Orijinal Risale taksimat başlıkları
const HEADING_REGEX = /^(Birinci|İkinci|Üçüncü|Dördüncü|Beşinci|Altıncı|Yedinci|Sekizinci|Dokuzuncu|Onuncu|On Birinci|On İkinci|On Üçüncü|On Dördüncü|On Beşinci|El-Hâsıl|Hâtime|Mukaddeme|Mukaddime|Fasıl|Makam|Mebhas|Nükte|Mesele|Hakikat|Suret|Remiz|Letaif|İşaret|Deva|Şua|Nokta|Zeyl|Tenbih|İhtar|Sual|Elcevap|Hatime)\b/i;

const books = fs.readdirSync(srcDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'img' && d.name !== '.git');

let totalPassagesAcrossKulliyat = 0;
const indexData = [];

for (const b of books) {
  const bookSrc = path.join(srcDir, b.name);
  const safeBookId = b.name.toLowerCase()
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const bookDest = path.join(targetPublic, safeBookId);
  fs.mkdirSync(bookDest, { recursive: true });

  const files = fs.readdirSync(bookSrc).filter(f => f.endsWith('.txt'));
  const chapters = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const fullPath = path.join(bookSrc, f);
    const rawContent = fs.readFileSync(fullPath, 'utf-8');
    const chapterTitle = f.replace('.txt', '').replace(/^[^-]+-\d+-/, '').trim();
    const chapterId = 'ch-' + (i + 1);

    const lines = rawContent.split(/\r?\n/);
    const passages = [];
    let currentPassageTitle = 'Giriş / Mukaddeme';
    let currentPassageLines = [];
    let subIndex = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      const isHeader = (trimmed.length > 0 && trimmed.length < 70 && HEADING_REGEX.test(trimmed)) || trimmed === '***';

      if (isHeader) {
        if (currentPassageLines.join('').trim().length > 0) {
          passages.push({
            id: 'p-' + subIndex,
            title: b.name + ' • ' + chapterTitle + ' — ' + currentPassageTitle,
            shortTitle: currentPassageTitle,
            text: currentPassageLines.join('\n').trim()
          });
          subIndex++;
          currentPassageLines = [];
        }
        if (trimmed !== '***') {
          currentPassageTitle = trimmed;
        } else {
          currentPassageTitle = 'Fasıl ' + subIndex;
        }
      } else {
        currentPassageLines.push(line);
      }
    }

    if (currentPassageLines.join('').trim().length > 0) {
      passages.push({
        id: 'p-' + subIndex,
        title: b.name + ' • ' + chapterTitle + ' — ' + currentPassageTitle,
        shortTitle: currentPassageTitle,
        text: currentPassageLines.join('\n').trim()
      });
    }

    totalPassagesAcrossKulliyat += passages.length;

    fs.writeFileSync(path.join(bookDest, chapterId + '.json'), JSON.stringify({
      id: chapterId,
      bookId: safeBookId,
      bookTitle: b.name,
      title: chapterTitle,
      rawContent: rawContent,
      passages: passages
    }, null, 2), 'utf-8');

    chapters.push({
      id: chapterId,
      title: chapterTitle,
      passageCount: passages.length,
      snippet: passages[0]?.text?.substring(0, 160).replace(/\s+/g, ' ').trim() || ''
    });
  }

  indexData.push({
    id: safeBookId,
    title: b.name,
    chapterCount: chapters.length,
    chapters: chapters
  });
}

fs.writeFileSync(path.join(targetPublic, 'books-index.json'), JSON.stringify(indexData, null, 2), 'utf-8');
console.log('Kulliyat bolumleme basariyla tamamlandi!');
console.log('Toplam Kitap:', indexData.length);
console.log('Toplam Orijinal Pasaj:', totalPassagesAcrossKulliyat);
