import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, Award, BookOpen, CalendarDays, CircleAlert, Clock3, ShieldCheck, Sparkles, TrendingUp } from "lucide-react-native";
import { type MobileRole } from "@/data/navigation";
import { colors, typography } from "@/theme";

const content = {
  learner: { eyebrow: "GÜNÜN ÖĞRENME PLANI", title: "Kaldığın yerden devam et, Selin.", copy: "Bugün 18 dakikada zorunlu KVKK yolculuğunda bir adım daha ilerleyebilirsin.", cta: "Eğitime devam et", metric: ["4", "aktif atama"], second: ["1.240", "toplam XP"] },
  admin: { eyebrow: "25 EYLÜL · PERŞEMBE", title: "Bugünün akademi işlerini netleştirdik.", copy: "7 geciken atama, 3 onay ve yayın bekleyen 2 içerik müdahale gerektiriyor.", cta: "İş kuyruğunu aç", metric: ["%94", "uyumluluk"], second: ["864", "aktif kullanıcı"] },
  instructor: { eyebrow: "EĞİTMEN ÇALIŞMA ALANI", title: "Bugün iki canlı oturumun var.", copy: "12 değerlendirme ve 5 öğrenen sorusu geri bildirimini bekliyor.", cta: "Oturumları aç", metric: ["2", "canlı oturum"], second: ["12", "değerlendirme"] },
  manager: { eyebrow: "EKİP GELİŞİMİ", title: "Üç ekip üyesi risk alanında.", copy: "Zorunlu eğitim tarihleri yaklaşan kişileri ve gelişim açıklarını tek görünümde izle.", cta: "Ekip risklerini aç", metric: ["%91", "ekip uyumu"], second: ["4", "onay bekliyor"] },
  platform: { eyebrow: "PLATFORM OPERASYONU", title: "Portal filosu sağlıklı çalışıyor.", copy: "24 aktif portal, 3 demo dönüşümü ve SLA içinde 9 destek talebi bulunuyor.", cta: "Portal filosunu aç", metric: ["24", "aktif portal"], second: ["%99,97", "servis sağlığı"] },
} satisfies Record<MobileRole, { eyebrow: string; title: string; copy: string; cta: string; metric: string[]; second: string[] }>;

export function RoleDashboard({ role }: { role: MobileRole }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  const item = content[role];
  const target = role === "learner" ? "learning" : role === "platform" ? "portals" : role === "instructor" ? "sessions" : role === "manager" ? "team" : "assignments";
  return (
    <View>
      <View style={[styles.hero, wide && styles.heroWide]}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>{item.eyebrow}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.copy}>{item.copy}</Text>
          <Pressable style={styles.primary} onPress={() => router.push({ pathname: "/[role]/[module]", params: { role, module: target } })}>
            <Text style={styles.primaryText}>{item.cta}</Text><ArrowRight size={18} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.progressVisual}>
          <View style={styles.progressRing}><Text style={styles.progressValue}>{role === "learner" ? "%68" : "%94"}</Text><Text style={styles.progressLabel}>İLERLEME</Text></View>
          <Text style={styles.progressNote}>{role === "learner" ? "2 bölüm kaldı" : "hedefe yakın"}</Text>
        </View>
      </View>
      <View style={styles.metrics}>
        <Metric icon={ShieldCheck} value={item.metric[0]} label={item.metric[1]} tone="success" />
        <Metric icon={Sparkles} value={item.second[0]} label={item.second[1]} tone="navy" />
      </View>
      <SectionTitle title={role === "learner" ? "Sıradaki adımın" : "Öncelikli işler"} action="Tümünü gör" />
      <View style={styles.taskCard}>
        <View style={styles.taskIcon}>{role === "learner" ? <BookOpen size={22} color={colors.gold} /> : <CircleAlert size={22} color={colors.warning} />}</View>
        <View style={styles.taskContent}>
          <Text style={styles.taskTag}>{role === "learner" ? "ZORUNLU · 18 DK" : "BUGÜN · ÖNCELİKLİ"}</Text>
          <Text style={styles.taskTitle}>{role === "learner" ? "KVKK ve Veri Güvenliği" : "Geciken zorunlu eğitimleri incele"}</Text>
          <Text style={styles.taskCopy}>{role === "learner" ? "Müvekkil verilerinde güvenli çalışma pratikleri" : "7 kullanıcı için son tarih ve hatırlatma işlemi gerekiyor."}</Text>
          <View style={styles.line}><View style={[styles.lineFill, { width: role === "learner" ? "68%" : "42%" }]} /></View>
        </View>
        <ArrowRight size={19} color={colors.muted} />
      </View>
      <SectionTitle title={role === "learner" ? "Bu hafta" : "Canlı durum"} action="Detay" />
      <View style={[styles.timeline, wide && styles.timelineWide]}>
        <TimelineItem icon={CalendarDays} title="Canlı oturum" copy="Avukatlar için Yapay Zekâ · Cuma 14.00" />
        <TimelineItem icon={TrendingUp} title="İlerleme" copy="Haftalık hedefin %72 tamamlandı" />
        <TimelineItem icon={Award} title="Yaklaşan başarı" copy="Etik Uzmanı rozeti için 120 XP kaldı" />
      </View>
      <SectionTitle title={role === "learner" ? "Topluluktan" : "Operasyon özeti"} action="Akışı aç" />
      <View style={styles.community}>
        <View style={styles.avatars}><Avatar text="SK" /><Avatar text="EA" /><Avatar text="BD" /></View>
        <Text style={styles.communityTitle}>Meslektaşların bu hafta 48 yeni kaynak paylaştı.</Text>
        <Text style={styles.communityCopy}>Güncel içtihat özetleri, kontrol listeleri ve kısa videoları keşfet.</Text>
      </View>
    </View>
  );
}
function Metric({ icon: Icon, value, label, tone }: { icon: typeof ShieldCheck; value: string; label: string; tone: "success" | "navy" }) {
  return <View style={styles.metric}><View style={[styles.metricIcon, tone === "success" ? styles.metricSuccess : styles.metricNavy]}><Icon size={19} color={tone === "success" ? colors.success : colors.navy} /></View><View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View></View>;
}
function SectionTitle({ title, action }: { title: string; action: string }) {
  return <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionAction}>{action}</Text></View>;
}
function TimelineItem({ icon: Icon, title, copy }: { icon: typeof Clock3; title: string; copy: string }) {
  return <View style={styles.timelineItem}><View style={styles.timelineIcon}><Icon size={19} color={colors.navy} /></View><View style={{ flex: 1 }}><Text style={styles.timelineTitle}>{title}</Text><Text style={styles.timelineCopy}>{copy}</Text></View><ArrowRight size={17} color={colors.muted} /></View>;
}
function Avatar({ text }: { text: string }) {
  return <View style={styles.avatar}><Text style={styles.avatarText}>{text}</Text></View>;
}
const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy, borderRadius: 28, padding: 24, overflow: "hidden" },
  heroWide: { flexDirection: "row", minHeight: 300, alignItems: "center", padding: 36 },
  heroCopy: { flex: 1 }, eyebrow: { ...typography.eyebrow, color: "#D9BD80", marginBottom: 12 },
  title: { ...typography.display, color: "#FFFFFF", maxWidth: 520 },
  copy: { ...typography.body, color: "#D7E0EA", marginTop: 13, maxWidth: 520 },
  primary: { alignSelf: "flex-start", flexDirection: "row", gap: 9, alignItems: "center", backgroundColor: colors.gold, borderRadius: 14, paddingHorizontal: 17, height: 48, marginTop: 22 },
  primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },
  progressVisual: { alignItems: "center", marginTop: 28, minWidth: 170 },
  progressRing: { width: 128, height: 128, borderRadius: 64, borderWidth: 10, borderColor: "#D9BD80", alignItems: "center", justifyContent: "center", backgroundColor: "#193A65" },
  progressValue: { color: "#FFFFFF", fontFamily: "Georgia", fontSize: 30 },
  progressLabel: { color: "#AEBED0", fontSize: 8, letterSpacing: 1.4, fontWeight: "900" },
  progressNote: { color: "#D7E0EA", fontSize: 11, marginTop: 10 },
  metrics: { flexDirection: "row", gap: 10, marginTop: 12 },
  metric: { flex: 1, minHeight: 96, borderRadius: 20, padding: 15, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  metricIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  metricSuccess: { backgroundColor: colors.successSoft }, metricNavy: { backgroundColor: colors.navySoft },
  metricValue: { color: colors.ink, fontFamily: "Georgia", fontSize: 21 },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 28, marginBottom: 12 },
  sectionTitle: { ...typography.heading, color: colors.ink }, sectionAction: { color: colors.gold, fontWeight: "800", fontSize: 12 },
  taskCard: { borderRadius: 22, padding: 17, flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  taskIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.warningSoft, alignItems: "center", justifyContent: "center" },
  taskContent: { flex: 1 }, taskTag: { color: colors.gold, fontSize: 9, letterSpacing: .8, fontWeight: "900" },
  taskTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginTop: 4 },
  taskCopy: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  line: { height: 5, borderRadius: 5, backgroundColor: "#E8E8E4", marginTop: 10, overflow: "hidden" },
  lineFill: { height: "100%", backgroundColor: colors.gold, borderRadius: 5 },
  timeline: { gap: 9 }, timelineWide: { flexDirection: "row" },
  timelineItem: { flex: 1, minHeight: 84, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  timelineIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.navySoft, alignItems: "center", justifyContent: "center" },
  timelineTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" }, timelineCopy: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  community: { borderRadius: 22, padding: 20, backgroundColor: "#E9E2D4" },
  avatars: { flexDirection: "row", marginBottom: 13 },
  avatar: { width: 35, height: 35, borderRadius: 18, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", marginRight: -7, borderWidth: 2, borderColor: "#E9E2D4" },
  avatarText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  communityTitle: { color: colors.ink, fontFamily: "Georgia", fontSize: 18, lineHeight: 23 },
  communityCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 6 },
});