import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  BellRing,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CheckSquare2,
  CircleGauge,
  ClipboardCheck,
  Compass,
  FileChartColumn,
  GraduationCap,
  Headphones,
  HeartHandshake,
  Library,
  MessagesSquare,
  Palette,
  PanelsTopLeft,
  RadioTower,
  Route,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tickets,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import type { WorkspaceRole } from "@respongo/design-tokens";

export type V2Role = "learner" | "admin" | "instructor" | "manager" | "platform";

export type V2NavigationItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
};

export const roleMeta: Record<V2Role, { label: string; workspace: WorkspaceRole; eyebrow: string }> = {
  learner: { label: "Öğrenen", workspace: "learner", eyebrow: "Öğrenme alanı" },
  admin: { label: "Akademi yöneticisi", workspace: "tenant_admin", eyebrow: "Akademi operasyonu" },
  instructor: { label: "Eğitmen", workspace: "instructor", eyebrow: "Eğitmen çalışma alanı" },
  manager: { label: "Ekip yöneticisi", workspace: "line_manager", eyebrow: "Ekip gelişimi" },
  platform: { label: "Super admin", workspace: "platform_admin", eyebrow: "Platform kontrol merkezi" },
};

export const roleNavigation: Record<V2Role, V2NavigationItem[]> = {
  learner: [
    { id: "dashboard", label: "Senin için", description: "Bugünün öğrenme planı", icon: PanelsTopLeft },
    { id: "learning", label: "Öğrenmem", description: "Atanan, devam eden ve tamamlanan", icon: BookOpen, badge: "4" },
    { id: "catalog", label: "Keşfet", description: "Katalog ve öneriler", icon: Compass },
    { id: "journey", label: "Yolculuğum", description: "Programlar ve gelişim yolları", icon: Route },
    { id: "calendar", label: "Takvim", description: "Canlı oturumlar", icon: CalendarDays },
    { id: "community", label: "Topluluk", description: "Akış, gruplar ve sohbet", icon: MessagesSquare },
    { id: "achievements", label: "Başarılarım", description: "Sertifika, rozet ve XP", icon: Award },
    { id: "resources", label: "Kaynaklar", description: "Rehberler ve şablonlar", icon: Library },
    { id: "support", label: "Destek", description: "Bilgi bankası ve talepler", icon: Headphones },
  ],
  admin: [
    { id: "dashboard", label: "Genel bakış", description: "Bugünün öncelikleri", icon: CircleGauge },
    { id: "users", label: "İnsanlar", description: "Kullanıcı, ekip ve roller", icon: UsersRound },
    { id: "learning", label: "Öğrenme", description: "Eğitim, program ve yollar", icon: GraduationCap },
    { id: "assignments", label: "Atama ve uyum", description: "Zorunluluk ve hedef kitle", icon: ClipboardCheck, badge: "7" },
    { id: "content", label: "İçerik stüdyosu", description: "GoAuthoring, kaynak ve ihtiyaç", icon: WandSparkles },
    { id: "engagement", label: "Etkileşim", description: "Topluluk, bildirim ve formlar", icon: BellRing },
    { id: "reports", label: "Analiz", description: "Raporlar ve veri görünümü", icon: BarChart3 },
    { id: "branding", label: "Marka ve portal", description: "Tema, giriş ve şablonlar", icon: Palette },
    { id: "operations", label: "Yönetim", description: "Entegrasyon ve sistem sağlığı", icon: Settings2 },
    { id: "support", label: "Destek", description: "Kurum talepleri", icon: Tickets, badge: "3" },
  ],
  instructor: [
    { id: "dashboard", label: "Çalışma alanım", description: "Bugünün eğitim işleri", icon: PanelsTopLeft },
    { id: "courses", label: "Eğitimlerim", description: "İçerik ve güncellemeler", icon: BookOpen },
    { id: "sessions", label: "Oturumlar", description: "Canlı sınıflar ve yoklama", icon: CalendarDays },
    { id: "assessments", label: "Değerlendirme", description: "Teslim, rubrik ve geri bildirim", icon: CheckSquare2, badge: "12" },
    { id: "questions", label: "Sorular", description: "Yanıt bekleyen öğrenenler", icon: MessagesSquare, badge: "5" },
    { id: "cohorts", label: "Sınıflar", description: "İlerleme ve katılım", icon: UsersRound },
    { id: "resources", label: "Kaynaklar", description: "Eğitmen materyalleri", icon: Library },
    { id: "support", label: "Destek", description: "Yardım ve talepler", icon: Headphones },
  ],
  manager: [
    { id: "dashboard", label: "Ekip özeti", description: "Riskler ve gelişim", icon: CircleGauge },
    { id: "team", label: "Ekibim", description: "Kişiler ve öğrenme durumu", icon: UsersRound },
    { id: "compliance", label: "Uyumluluk", description: "Zorunlular ve gecikenler", icon: ShieldCheck, badge: "3" },
    { id: "approvals", label: "Onaylar", description: "Belge ve eğitim talepleri", icon: ClipboardCheck, badge: "4" },
    { id: "skills", label: "Yetkinlik", description: "Açıklar ve gelişim planı", icon: Sparkles },
    { id: "reports", label: "Ekip raporları", description: "İlerleme ve karşılaştırma", icon: FileChartColumn },
    { id: "support", label: "Destek", description: "Yönetici yardım merkezi", icon: Headphones },
  ],
  platform: [
    { id: "dashboard", label: "Operasyon", description: "Platform sağlığı", icon: CircleGauge },
    { id: "portals", label: "Portallar", description: "Müşteri ve demo portalları", icon: Building2, badge: "24" },
    { id: "provisioning", label: "Portal fabrikası", description: "Sektör bazlı kurulum", icon: WandSparkles },
    { id: "sector-packs", label: "Sektör paketleri", description: "Şablon ve varlıklar", icon: Boxes },
    { id: "products", label: "Ürün ve lisans", description: "Paket, kota ve deneme", icon: BriefcaseBusiness },
    { id: "support", label: "Destek merkezi", description: "Kurumlar arası SLA", icon: HeartHandshake, badge: "9" },
    { id: "operations", label: "Sistem işleri", description: "Kuyruk ve entegrasyon", icon: RadioTower },
    { id: "security", label: "Güvenlik", description: "Audit ve olaylar", icon: ShieldCheck },
    { id: "releases", label: "Sürümler", description: "Feature flag ve yayın", icon: ChartNoAxesCombined },
  ],
};

export function isV2Role(value: string): value is V2Role {
  return value === "learner" || value === "admin" || value === "instructor" || value === "manager" || value === "platform";
}

export function defaultModule(role: V2Role) {
  return roleNavigation[role][0].id;
}

