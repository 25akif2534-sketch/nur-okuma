import { GoogleGenAI } from '@google/genai';

export function getApiKey(): string {
  return localStorage.getItem('nur_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setApiKey(key: string): void {
  localStorage.setItem('nur_gemini_key', key.trim());
}

function getAiClient(): GoogleGenAI {
  const key = getApiKey();
  if (!key) {
    throw new Error('Mütalaa yapabilmek için lütfen geçerli bir Gemini API anahtarı giriniz.');
  }
  return new GoogleGenAI({ apiKey: key });
}

// En yüksek muhakeme ve tahlil için Pro model
const PRO_MODEL = 'gemini-1.5-pro';

export interface SirriTemsilResult {
  durbun: string;
  cihetulVahdet: string;
  merdiven: string[];
  pencere: string;
}

export interface CouncilOpinion {
  erkan: string;
  unvan: string;
  rol: string;
  gorus: string;
}

export interface CouncilResult {
  baslik: string;
  erkanlar: CouncilOpinion[];
  hulasa: string;
}

export interface CrossExegesisResult {
  anahtarKavramlar: string[];
  izah: string;
}

/**
 * 1. Görselden (Fotoğraftan) Metin Çıkarma (OCR)
 */
export async function extractTextFromImage(base64Image: string, mimeType: string): Promise<string> {
  const ai = getAiClient();

  const prompt = `Bu fiziki bir kitaptan veya sayfadan çekilmiş fotoğraftır.
Lütfen yalnızca görselde yer alan Risale-i Nur metnini birebir ve imlasına sadık kalarak yazıya aktar.
Başına veya sonuna hiçbir selamlama, takdim veya açıklama ekleme. Sadece saf metni ver.`;

  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      }
    });

    return response.text?.trim() || '';
  } catch (error: any) {
    console.error('OCR Hatası:', error);
    throw new Error('Görseldeki metin okunamadı. Lütfen ışığı ve netliği kontrol ediniz.');
  }
}

/**
 * 2. Sırr-ı Temsil Dörtlü Tahkik Motoru
 */
export async function analyzeSirriTemsil(
  passageTitle: string,
  passageText: string
): Promise<SirriTemsilResult> {
  const ai = getAiClient();

  const systemInstruction = `
Sen Risale-i Nur Külliyatı'nın mantık, belâgat ve tefekkür metodolojisine tam vâkıf bir tahkik asistanısın.
KATI KURALLAR:
1. ASLA ezberinden uydurma hadise, var olmayan Risale cümlesi veya hayali atıf üretme (Sıfır Halüsinasyon).
2. YALNIZCA sana verilen metnin içindeki temsil, akıl yürütme ve neticeyi analiz et.
3. Doğrudan ilmi ve imani nükteyi ortaya koy.
`;

  const prompt = `
AŞAĞIDAKİ RİSALE-İ NUR PASAJINI "SIRR-I TEMSİL" METODOLOJİSİYLE DÖRT MERHALEDE TAHKİK ET:

BAŞLIK: ${passageTitle}
PASAJ METNİ:
"""
${passageText}
"""

Lütfen cevabını AYNEN aşağıdaki JSON formatında ver (başka hiçbir metin ekleme):
{
  "durbun": "Pasajdaki temsil, alegori veya teşbihin akla uzak hangi derin hakikati fehme yaklaştırdığının izahı (Dürbün vazifesi).",
  "cihetulVahdet": "Bu bahsin Külliyat'ın ana omurgası ve Esmâ-i Hüsnâ mizanıyla olan rabıtası (Cihetü'l-Vahdet vazifesi).",
  "merdiven": [
    "Mantık basamağı 1 (İspat zincirinin ilk adımı)",
    "Mantık basamağı 2 (Orta basamak)",
    "Mantık basamağı 3 (Zirve ispat)"
  ],
  "pencere": "Şüphe ve vehimleri kökünden söken, kalbe şuhuda yakın bir iman kesinliği veren netice (Pencere vazifesi)."
}
`;

  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    return JSON.parse(jsonText) as SirriTemsilResult;
  } catch (error: any) {
    console.error('Sirri Temsil analiz hatası:', error);
    throw new Error(error?.message || 'Mütalaa oluşturulurken bir hata oluştu.');
  }
}

/**
 * 3. Dört Yönlü İlmi İstişare Heyeti (İsimler sadeleştirildi)
 * 1. Lügat ve Belâgat Tahlili
 * 2. Istılah ve Esmâ Mizanı
 * 3. Külliyat Rabıtası
 * 4. Mantık ve Burhan Tahkiki
 */
export async function consultCouncil(
  passageTitle: string,
  passageText: string,
  userQuestion?: string
): Promise<CouncilResult> {
  const ai = getAiClient();

  const systemInstruction = `
Sen Risale-i Nur müzakere heyetisin. Verilen pasajı dört farklı ilmi ihtisas zaviyesinden müzakere edeceksin.
HİÇBİR ERKAN UYDURMA YAPMAZ. Tamamen pasajdaki kelimelere, ifadelere ve mantık örgüsüne sadık kalır.
`;

  const prompt = `
PASAJ: ${passageTitle}
METİN:
"""
${passageText}
"""
${userQuestion ? `MÜZAKERE EDİLECEK ÖZEL SUAL: "${userQuestion}"` : ''}

Dört ilmi ihtisas zaviyesi bu pasajı müzakere etsin:
1. Lügat & Sarf Kürsüsü: Pasajdaki kritik kelimelerin kök manası ve belâgat nüktesi.
2. Istılah & Esmâ Kürsüsü: Pasajın dayandığı Esmâ-i İlâhiye tecellisi ve ana mefhum.
3. Külliyat Rabıtası Kürsüsü: Pasajın Külliyat'taki genel hizmet ve iman dersiyle irtibatı.
4. Mantık & Burhan Kürsüsü: Muhtemel vehimleri, vesveseleri ve mantık itirazlarını susturan burhan.

Cevabı kesinlikle bu JSON şablonunda döndür:
{
  "baslik": "${passageTitle}",
  "erkanlar": [
    {
      "erkan": "Lügat & Sarf Tahlili",
      "unvan": "Kelime Kökü ve Belâgat",
      "rol": "Dil & İmla",
      "gorus": "..."
    },
    {
      "erkan": "Istılah & Esmâ Mizanı",
      "unvan": "Kavram ve Esmâ Boyutu",
      "rol": "Esmâî Mizan",
      "gorus": "..."
    },
    {
      "erkan": "Külliyat Rabıtası",
      "unvan": "Külliyat ve Hizmet Münasebeti",
      "rol": "Bütünlük",
      "gorus": "..."
    },
    {
      "erkan": "Mantık & Burhan Tahkiki",
      "unvan": "İspat Zinciri ve Vehim İptali",
      "rol": "Mantık Mizanı",
      "gorus": "..."
    }
  ],
  "hulasa": "İttifak edilen nihai netice ve ders."
}
`;

  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    return JSON.parse(jsonText) as CouncilResult;
  } catch (error: any) {
    console.error('Müzakere hatası:', error);
    throw new Error(error?.message || 'Müzakere tahlili alınamadı.');
  }
}

/**
 * 4. Çapraz İzah Motoru (İkiz Bahisler Arası Köprü)
 */
export async function explainCrossReferences(
  mainTitle: string,
  mainText: string,
  matchedTitle: string,
  matchedText: string
): Promise<CrossExegesisResult> {
  const ai = getAiClient();

  const prompt = `
AŞAĞIDA RİSALE-İ NUR KÜLLİYATI'NDAN İKİ GERÇEK PASAJ YER ALMAKTADIR.
1. ASIL PASAJ: [${mainTitle}]
"""${mainText}"""

2. İKİZ PASAJ (ÇAPRAZ ATIF): [${matchedTitle}]
"""${matchedText}"""

GÖREV:
Bu iki pasajın birbirini nasıl tefsir ettiğini, hangi ortak Esmâ veya hakikat etrafında birleştiğini ve bu iki bahsin birlikte mütalaasının zihne nasıl bir ufuk açtığını 3-4 cümlede öz ve ilmi şekilde açıkla. Asla metin dışı uydurma yapma.

Format (JSON):
{
  "anahtarKavramlar": ["kavram 1", "kavram 2", "kavram 3"],
  "izah": "..."
}
`;

  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    return JSON.parse(jsonText) as CrossExegesisResult;
  } catch (error: any) {
    console.error('Çapraz izah hatası:', error);
    throw new Error(error?.message || 'Çapraz izah oluşturulamadı.');
  }
}
