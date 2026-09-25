import { Award, BarChart3, BookOpen, Building2, CalendarDays, CircleGauge, ClipboardCheck, Compass, Headphones, Library, MessagesSquare, Palette, Route, Settings2, ShieldCheck, Sparkles, UsersRound, WandSparkles, type LucideIcon } from "lucide-react-native";

export type MobileRole = "learner" | "admin" | "instructor" | "manager" | "platform";
export type MobileNavItem = { id: string; label: string; icon: LucideIcon; badge?: string };
export const roleLabels: Record<MobileRole, string> = {
  learner: "Öğrenen", admin: "Akademi yöneticisi", instructor: "Eğitmen", manager: "Ekip yöneticisi", platform: "Super admin",
};
export const navigation: Record<MobileRole, MobileNavItem[]> = {
  learner: [
    { id: "dashboard", label: "Senin için", icon: CircleGauge }, { id: "learning", label: "Öğrenmem", icon: BookOpen, badge: "4" },
    { id: "catalog", label: "Keşfet", icon: Compass }, { id: "journey", label: "Yolculuk", icon: Route },
    { id: "profile", label: "Profil", icon: UsersRound }, { id: "calendar", label: "Takvim", icon: CalendarDays },
    { id: "community", label: "Topluluk", icon: MessagesSquare }, { id: "achievements", label: "Başarılar", icon: Award },
    { id: "resources", label: "Kaynaklar", icon: Library },
  ],
  admin: [
    { id: "dashboard", label: "Genel bakış", icon: CircleGauge }, { id: "users", label: "İnsanlar", icon: UsersRound },
    { id: "learning", label: "Öğrenme", icon: BookOpen }, { id: "assignments", label: "Atama", icon: ClipboardCheck, badge: "7" },
    { id: "content", label: "İçerik", icon: WandSparkles }, { id: "reports", label: "Analiz", icon: BarChart3 },
    { id: "branding", label: "Marka", icon: Palette }, { id: "operations", label: "Yönetim", icon: Settings2 },
  ],
  instructor: [
    { id: "dashboard", label: "Çalışma alanı", icon: CircleGauge }, { id: "courses", label: "Eğitimler", icon: BookOpen },
    { id: "sessions", label: "Oturumlar", icon: CalendarDays }, { id: "assessments", label: "Değerlendirme", icon: ClipboardCheck, badge: "12" },
    { id: "questions", label: "Sorular", icon: MessagesSquare },
  ],
  manager: [
    { id: "dashboard", label: "Ekip özeti", icon: CircleGauge }, { id: "team", label: "Ekibim", icon: UsersRound },
    { id: "compliance", label: "Uyumluluk", icon: ShieldCheck, badge: "3" }, { id: "approvals", label: "Onaylar", icon: ClipboardCheck },
    { id: "skills", label: "Yetkinlik", icon: Sparkles },
  ],
  platform: [
    { id: "dashboard", label: "Operasyon", icon: CircleGauge }, { id: "portals", label: "Portallar", icon: Building2 },
    { id: "provisioning", label: "Portal fabrikası", icon: WandSparkles }, { id: "support", label: "Destek", icon: Headphones, badge: "9" },
    { id: "security", label: "Güvenlik", icon: ShieldCheck },
  ],
};
export function isMobileRole(value: string): value is MobileRole {
  return value === "learner" || value === "admin" || value === "instructor" || value === "manager" || value === "platform";
}