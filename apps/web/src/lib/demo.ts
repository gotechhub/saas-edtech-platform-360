export type Role = "learner" | "admin" | "instructor" | "manager" | "platform";
export const roles: Record<Role, string> = {
  learner: "Öğrenen",
  admin: "Akademi yöneticisi",
  instructor: "Eğitmen",
  manager: "Ekip yöneticisi",
  platform: "Super admin",
};
export type Course = {
  id: string;
  title: string;
  category: string;
  duration: number;
  lessons: string[];
  color: string;
  level: string;
  required: boolean;
  description: string;
  question: string;
  choices: string[];
  answer: number;
  format: "Video" | "SCORM" | "Canlı sınıf" | "Okuma";
  skill: string;
  dueDate?: string;
  certificate?: boolean;
};
export const courses: Course[] = [
  {
    id: "legal-onboarding",
    title: "Hukuk pratiğine güçlü bir başlangıç",
    category: "Mesleki gelişim",
    duration: 35,
    lessons: [
      "Akademiyle tanışın",
      "Öğrenme hedefinizi belirleyin",
      "Vaka üzerinden düşünme",
    ],
    color: "sage",
    level: "Başlangıç",
    required: true,
    description:
      "Öğrenme hedeflerini somut adımlara dönüştüren bir başlangıç yolculuğu. Bu içerik ürün denemesi için hazırlanmıştır; hukuki eğitim veya görüş değildir.",
    question: "Öğrenme hedefini izlenebilir kılan yaklaşım hangisidir?",
    choices: [
      "Yalnızca eğitim sayısını artırmak",
      "Somut hedef, uygulama ve geri bildirim belirlemek",
      "Tüm içerikleri aynı gün bitirmek",
    ],
    answer: 1,
    format: "SCORM",
    skill: "Mesleki temel",
    dueDate: "30 Eyl 2026",
    certificate: true,
  },
  {
    id: "case-analysis",
    title: "Vaka analizi: doğru soruları sormak",
    category: "Masterclass",
    duration: 50,
    lessons: [
      "Vakanın çerçevesi",
      "Bilgi ve varsayımı ayırmak",
      "Analiz kontrol listesi",
    ],
    color: "sand",
    level: "Orta seviye",
    required: false,
    description:
      "Örnek olaylarda bilgiyi sınıflandırma ve değerlendirme alışkanlığı. Senaryo tamamen sentetiktir.",
    question: "Bir vaka analizinde önce ne yapılmalıdır?",
    choices: [
      "Doğrulanmış bilgiyle varsayımı ayırmak",
      "Eksik bilgiyi kesin kabul etmek",
      "İlk görüşü değiştirmemek",
    ],
    answer: 0,
    format: "Video",
    skill: "Analitik düşünme",
    certificate: true,
  },
  {
    id: "communication",
    title: "Müvekkil iletişiminde açıklık",
    category: "İletişim",
    duration: 25,
    lessons: ["Aktif dinleme", "Açık anlatım", "Geri bildirim döngüsü"],
    color: "rose",
    level: "Tüm seviyeler",
    required: false,
    description:
      "Dinleme, açık anlatım ve anlaşılırlığı kontrol etme üzerine örnek öğrenme içeriği.",
    question: "Anlaşılırlığı nasıl kontrol edebilirsiniz?",
    choices: [
      "Daha fazla teknik terim kullanarak",
      "Soruları sona bırakarak",
      "Karşı tarafın anladığını kendi sözleriyle özetlemesini isteyerek",
    ],
    answer: 2,
    format: "Video",
    skill: "Müvekkil deneyimi",
  },
  {
    id: "information-security",
    title: "Dijital çalışma ve bilgi güvenliği",
    category: "Uyumluluk",
    duration: 30,
    lessons: [
      "Veri farkındalığı",
      "Güvenli paylaşım",
      "Şüpheli olay bildirimi",
    ],
    color: "blue",
    level: "Başlangıç",
    required: true,
    description:
      "Örnek farkındalık içeriği. Kurum politikasının veya mevzuata uygun zorunlu eğitimin yerine geçmez.",
    question: "Beklenmeyen bir dosya bağlantısında ilk adım nedir?",
    choices: [
      "Hemen açmak",
      "Göndereni güvenilir bir kanaldan doğrulamak",
      "Tüm ekibe iletmek",
    ],
    answer: 1,
    format: "SCORM",
    skill: "Bilgi güvenliği",
    dueDate: "24 Eyl 2026",
    certificate: true,
  },
  {
    id: "kvkk-law-firms",
    title: "Hukuk büroları için KVKK farkındalığı",
    category: "Uyumluluk",
    duration: 40,
    lessons: [
      "Kişisel veri haritası",
      "Hukuki dosyalarda erişim",
      "İhlal bildirimi",
    ],
    color: "plum",
    level: "Tüm seviyeler",
    required: true,
    description:
      "Hukuk bürosundaki veri yaşam döngüsünü örnek senaryolarla ele alan farkındalık eğitimi.",
    question: "Bir kişisel veri ihlali şüphesinde ilk kurumsal adım nedir?",
    choices: [
      "Kayıtları silmek",
      "Tanımlı olay bildirim sürecini başlatmak",
      "Beklemek",
    ],
    answer: 1,
    format: "SCORM",
    skill: "Veri mahremiyeti",
    dueDate: "28 Eyl 2026",
    certificate: true,
  },
  {
    id: "legal-writing",
    title: "Etkili hukuki yazım ve argüman tasarımı",
    category: "Masterclass",
    duration: 65,
    lessons: ["Okur ve amaç", "Argüman mimarisi", "Sadeleştirme atölyesi"],
    color: "ink",
    level: "İleri seviye",
    required: false,
    description:
      "Karmaşık hukuki düşünceyi açık, tutarlı ve ikna edici bir metne dönüştürme atölyesi.",
    question: "Güçlü bir hukuki metnin ilk tasarım kararı hangisidir?",
    choices: [
      "Yazı tipini seçmek",
      "Okur ve amacı netleştirmek",
      "Metni uzatmak",
    ],
    answer: 1,
    format: "Canlı sınıf",
    skill: "Hukuki yazım",
    certificate: true,
  },
  {
    id: "negotiation",
    title: "Müzakere stratejileri: çıkar ve seçenek",
    category: "Mesleki gelişim",
    duration: 45,
    lessons: ["Pozisyon ve çıkar", "Seçenek üretme", "Müzakere hazırlık planı"],
    color: "amber",
    level: "Orta seviye",
    required: false,
    description:
      "Müzakereye hazırlığı ve seçenek üretimini yapılandıran uygulamalı öğrenme deneyimi.",
    question: "Seçenek üretmeden önce neyi ayırmak gerekir?",
    choices: [
      "Pozisyon ile çıkarı",
      "Toplantı ile e-postayı",
      "Süre ile mekanı",
    ],
    answer: 0,
    format: "Video",
    skill: "Müzakere",
  },
  {
    id: "ethics-conflict",
    title: "Meslek etiği ve menfaat çatışması",
    category: "Uyumluluk",
    duration: 30,
    lessons: ["Etik karar çerçevesi", "Çatışma kontrolü", "Kayıt ve danışma"],
    color: "ocean",
    level: "Tüm seviyeler",
    required: true,
    description:
      "Etik ikilemleri ve menfaat çatışması risklerini örnek olaylarla değerlendiren farkındalık içeriği.",
    question: "Potansiyel bir çatışmada en güvenli başlangıç nedir?",
    choices: [
      "Durumu kayıt altına alıp tanımlı kanaldan danışmak",
      "Yok saymak",
      "Sosyal medyada sormak",
    ],
    answer: 0,
    format: "Okuma",
    skill: "Meslek etiği",
    dueDate: "02 Eki 2026",
    certificate: true,
  },
];
export type Progress = Record<string, { lesson: number; completed: boolean }>;
export type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: "Açık" | "Üst desteğe aktarıldı" | "Çözüldü";
};
export type DemoState = {
  version: 1;
  progress: Progress;
  saved: string[];
  tickets: Ticket[];
  goal: number;
};
export const initialState: DemoState = {
  version: 1,
  progress: {},
  saved: [],
  tickets: [],
  goal: 3,
};
export const lessonText = [
  "Bu kısa bölümde konunun çerçevesini tanıyın. Başlamadan önce ne öğrenmek istediğinizi tek cümleyle düşünün. Akademide her küçük adım, yolculuğunuzdaki bir sonraki bölümün temelini oluşturur.",
  "Öğrendiğiniz yaklaşımı bir örnek üzerinden değerlendirin. Elinizdeki bilgi nedir, hangi noktalar varsayımdır ve hangi sorular hâlâ yanıt bekliyor? Bu ayrım öğrenme hedefinizi somutlaştırır.",
  "Kısa bir kontrol yapın: ana fikri kendi sözlerinizle açıklayabiliyor musunuz? Bir uygulama adımı belirleyin ve ilerlemenizi geri bildirimle gözden geçirin. Sıradaki örnek soru bu öğrenme akışını denemenizi sağlar.",
];
export function parseDemo(value: string | null): DemoState {
  try {
    const s = JSON.parse(value || "null");
    if (s?.version !== 1) return structuredClone(initialState);
    const progress: Progress = {};
    for (const c of courses) {
      const p = s.progress?.[c.id];
      if (
        p &&
        Number.isInteger(p.lesson) &&
        p.lesson >= 0 &&
        p.lesson <= c.lessons.length &&
        typeof p.completed === "boolean"
      )
        progress[c.id] = p;
    }
    return {
      version: 1,
      progress,
      saved: Array.isArray(s.saved)
        ? s.saved.filter((x: unknown) => courses.some((c) => c.id === x))
        : [],
      tickets: Array.isArray(s.tickets)
        ? s.tickets
            .filter(
              (t: Ticket) =>
                typeof t.id === "string" &&
                typeof t.subject === "string" &&
                typeof t.message === "string" &&
                ["Açık", "Üst desteğe aktarıldı", "Çözüldü"].includes(t.status),
            )
            .slice(0, 50)
        : [],
      goal: [1, 3, 5].includes(s.goal) ? s.goal : 3,
    };
  } catch {
    return structuredClone(initialState);
  }
}
