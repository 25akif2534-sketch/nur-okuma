# Risale-i Nur — Okuma & Mütalaa Platformu
## Google Cloud & Yerel Kurulum Rehberi

Bu paket, Risale-i Nur Külliyatı'nın tamamını (15 kitap, 3.075 pasaj, 13.8 MB tam metin arama dizini), hızlı okuma (RSVP) motorunu ve Gemini 2.5 Flash destekli Sırr-ı Temsil tahlil sistemini içerir.

---

### Seçenek 1: Google Cloud Run ile 1 Tıkla Yayınlama (Tavsiye Edilen)
En stabil ve maliyetsiz yöntemdir (Google Cloud ücretsiz kotası aylık 2 milyon isteğe kadar ücretsizdir).

1. Google Cloud Shell'i açın veya bilgisayarınızda `gcloud` CLI ile oturum açın:
   ```bash
   gcloud auth login
   gcloud config set project <PROJE_ID_NIZ>
   ```
2. Bu klasörün içindeyken tek komutla yayına alın:
   ```bash
   gcloud run deploy nur-okuma --source . --region europe-west1 --allow-unauthenticated
   ```
3. Komut bittiğinde size doğrudan `https://nur-okuma-xxxx.a.run.app` şeklinde kalıcı ve hızlı bir web linki verecektir.

---

### Seçenek 2: Google App Engine ile Yayınlama
1. Klasör içindeyken şu komutu çalıştırın:
   ```bash
   npm run build
   gcloud app deploy app.yaml
   ```

---

### Seçenek 3: Kendi Bilgisayarınızda veya Herhangi Bir Sunucuda Çalıştırma
1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
2. Geliştirici sunucusunu başlatın:
   ```bash
   npm run dev
   ```
3. Tarayıcınızda açın:
   `http://localhost:5173/`

---

### Paketteki Önemli Dosyalar:
- `public/kulliyat/`: 15 kitabın tamamı, bölümlenmiş orijinal pasajlar ve `search-index.json`.
- `src/services/aiService.ts`: Gemini 2.5 Flash entegrasyonu (Dahili API anahtarı içine gömülüdür, kullanıcıdan istemez).
- `src/components/MutalaaDrawer.tsx`: Sırr-ı Temsil, Müzakere Kürsüsü ve Çapraz İzah pencereleri.
- `src/components/SpeedReaderModal.tsx`: Arapça/Osmanlıca ve noktalama uyumlu ORP odaklı hızlı okuma motoru.
- `src/components/SearchModal.tsx`: Canlı arama ve kitaptan fotoğrafla arama (OCR).
