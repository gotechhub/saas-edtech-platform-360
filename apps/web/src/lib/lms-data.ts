export type LearningResource = {
  id: string;
  title: string;
  type: "Rehber" | "Şablon" | "Video" | "Kontrol listesi" | "Bağlantı";
  topic: string;
  readTime: string;
  icon: "file" | "video" | "check" | "link";
};

export const learningResources: LearningResource[] = [
  {
    id: "r1",
    title: "Vaka analizi çalışma şablonu",
    type: "Şablon",
    topic: "Mesleki gelişim",
    readTime: "DOCX · 48 KB",
    icon: "file",
  },
  {
    id: "r2",
    title: "Müvekkil görüşmesi hazırlık listesi",
    type: "Kontrol listesi",
    topic: "İletişim",
    readTime: "5 dk",
    icon: "check",
  },
  {
    id: "r3",
    title: "Güvenli dosya paylaşımı hızlı rehberi",
    type: "Rehber",
    topic: "Uyumluluk",
    readTime: "7 dk",
    icon: "file",
  },
  {
    id: "r4",
    title: "Hukuki yazım: önce ve sonra örnekleri",
    type: "Video",
    topic: "Masterclass",
    readTime: "12 dk",
    icon: "video",
  },
  {
    id: "r5",
    title: "KVKK olay bildirim akış kartı",
    type: "Kontrol listesi",
    topic: "Uyumluluk",
    readTime: "PDF · 1.2 MB",
    icon: "check",
  },
  {
    id: "r6",
    title: "Haftalık öğrenme günlüğü",
    type: "Şablon",
    topic: "Kişisel gelişim",
    readTime: "DOCX · 32 KB",
    icon: "file",
  },
];

export type AcademyUser = {
  id: string;
  name: string;
  initials: string;
  role: string;
  team: string;
  status: "Aktif" | "Davet edildi" | "Pasif";
  completion: number;
  lastSeen: string;
};

export const academyUsers: AcademyUser[] = [
  {
    id: "u1",
    name: "Deniz Aras",
    initials: "DA",
    role: "Avukat",
    team: "Uyuşmazlık Çözümü",
    status: "Aktif",
    completion: 72,
    lastSeen: "8 dk önce",
  },
  {
    id: "u2",
    name: "Ece Yalın",
    initials: "EY",
    role: "Kıdemli Avukat",
    team: "Şirketler Hukuku",
    status: "Aktif",
    completion: 91,
    lastSeen: "Bugün 09:14",
  },
  {
    id: "u3",
    name: "Mert Kaya",
    initials: "MK",
    role: "Stajyer Avukat",
    team: "Uyuşmazlık Çözümü",
    status: "Aktif",
    completion: 48,
    lastSeen: "Dün",
  },
  {
    id: "u4",
    name: "Selin Gür",
    initials: "SG",
    role: "Avukat",
    team: "KVKK ve Teknoloji",
    status: "Aktif",
    completion: 66,
    lastSeen: "Dün",
  },
  {
    id: "u5",
    name: "Bora Işık",
    initials: "BI",
    role: "Danışman",
    team: "Vergi",
    status: "Davet edildi",
    completion: 0,
    lastSeen: "Davet bekliyor",
  },
  {
    id: "u6",
    name: "İpek Akın",
    initials: "İA",
    role: "Partner",
    team: "Şirketler Hukuku",
    status: "Aktif",
    completion: 84,
    lastSeen: "2 gün önce",
  },
];

export const academyPrograms = [
  {
    id: "p1",
    title: "Yeni Avukat Onboarding",
    audience: "Yeni başlayanlar",
    courses: 5,
    learners: 8,
    completion: 64,
    status: "Yayında",
  },
  {
    id: "p2",
    title: "2026 Zorunlu Uyum Programı",
    audience: "Tüm çalışanlar",
    courses: 4,
    learners: 42,
    completion: 81,
    status: "Yayında",
  },
  {
    id: "p3",
    title: "Avukatlık Masterclass",
    audience: "Avukatlar",
    courses: 8,
    learners: 24,
    completion: 38,
    status: "Yayında",
  },
  {
    id: "p4",
    title: "Yönetici Gelişim Yolculuğu",
    audience: "Ekip yöneticileri",
    courses: 6,
    learners: 7,
    completion: 12,
    status: "Taslak",
  },
];

export const complianceRows = [
  {
    title: "Dijital çalışma ve bilgi güvenliği",
    assigned: 42,
    complete: 39,
    overdue: 1,
    due: "24 Eyl",
  },
  {
    title: "Hukuk büroları için KVKK farkındalığı",
    assigned: 42,
    complete: 34,
    overdue: 3,
    due: "28 Eyl",
  },
  {
    title: "Meslek etiği ve menfaat çatışması",
    assigned: 42,
    complete: 28,
    overdue: 0,
    due: "02 Eki",
  },
];
