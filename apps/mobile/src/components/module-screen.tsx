import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Filter, Search, SlidersHorizontal } from "lucide-react-native";
import { navigation, type MobileRole } from "@/data/navigation";
import { colors, typography } from "@/theme";

const sample = [
  { title: "KVKK ve Veri Güvenliği", meta: "Zorunlu · 18 dk", progress: 68, status: "Devam ediyor" },
  { title: "Avukatlar için Yapay Zekâ", meta: "Masterclass · 42 dk", progress: 32, status: "Devam ediyor" },
  { title: "Meslek Etiği 2026", meta: "Zorunlu · 25 dk", progress: 0, status: "Başlamadı" },
  { title: "Etkili Müzakere Teknikleri", meta: "Kişisel gelişim · 55 dk", progress: 100, status: "Tamamlandı" },
];
export function ModuleScreen({ role, moduleId }: { role: MobileRole; moduleId: string }) {
  const nav = navigation[role].find((item) => item.id === moduleId);
  return (
    <View>
      <Text style={styles.eyebrow}>OGUZ LAW ACADEMY</Text>
      <Text style={styles.title}>{nav?.label ?? "Çalışma alanı"}</Text>
      <Text style={styles.copy}>Görevleri, içerikleri ve ilerlemeyi tek ekrandan yönetin.</Text>
      <View style={styles.tools}>
        <Pressable style={styles.search}><Search size={18} color={colors.muted} /><Text style={styles.searchText}>Ara</Text></Pressable>
        <Pressable style={styles.toolButton}><Filter size={18} color={colors.navy} /></Pressable>
        <Pressable style={styles.toolButton}><SlidersHorizontal size={18} color={colors.navy} /></Pressable>
      </View>
      <View style={styles.filters}><Text style={styles.filterActive}>Tümü</Text><Text style={styles.filter}>Atanan</Text><Text style={styles.filter}>Devam eden</Text><Text style={styles.filter}>Tamamlanan</Text></View>
      <View style={styles.summary}>
        <View><Text style={styles.summaryValue}>12</Text><Text style={styles.summaryLabel}>toplam kayıt</Text></View>
        <View><Text style={styles.summaryValue}>4</Text><Text style={styles.summaryLabel}>aksiyon bekliyor</Text></View>
        <View><Text style={styles.summaryValue}>%76</Text><Text style={styles.summaryLabel}>tamamlama</Text></View>
      </View>
      <View style={styles.list}>
        {sample.map((item) => (
          <Pressable key={item.title} style={styles.card}>
            <View style={styles.cover}><BookOpen size={24} color={colors.gold} /></View>
            <View style={styles.cardBody}>
              <Text style={styles.meta}>{item.meta}</Text><Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.progress}><View style={[styles.progressFill, { width: `${item.progress}%` }]} /></View>
              <View style={styles.cardFooter}>
                <View style={styles.statusRow}>{item.progress === 100 ? <CheckCircle2 size={12} color={colors.success} /> : <Clock3 size={12} color={colors.muted} />}<Text style={styles.status}>{item.status}</Text></View>
                <Text style={styles.percent}>%{item.progress}</Text>
              </View>
            </View>
            <ArrowRight size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  eyebrow: { ...typography.eyebrow, color: colors.gold, marginBottom: 9 },
  title: { ...typography.display, color: colors.ink }, copy: { ...typography.body, color: colors.muted, marginTop: 9 },
  tools: { flexDirection: "row", gap: 8, marginTop: 24 },
  search: { flex: 1, height: 47, borderRadius: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  searchText: { color: colors.muted, fontSize: 13 },
  toolButton: { width: 47, height: 47, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filters: { flexDirection: "row", gap: 8, marginTop: 14, paddingBottom: 4 },
  filter: { color: colors.muted, backgroundColor: colors.surface, borderRadius: 99, overflow: "hidden", paddingHorizontal: 11, paddingVertical: 7, fontSize: 10, fontWeight: "700" },
  filterActive: { color: "#FFFFFF", backgroundColor: colors.navy, borderRadius: 99, overflow: "hidden", paddingHorizontal: 11, paddingVertical: 7, fontSize: 10, fontWeight: "800" },
  summary: { flexDirection: "row", justifyContent: "space-between", marginTop: 18, borderRadius: 20, padding: 17, backgroundColor: colors.navy },
  summaryValue: { color: "#FFFFFF", fontFamily: "Georgia", fontSize: 20 }, summaryLabel: { color: "#B9C6D4", fontSize: 9, marginTop: 2 },
  list: { gap: 10, marginTop: 18 },
  card: { minHeight: 112, borderRadius: 20, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cover: { width: 60, height: 78, borderRadius: 14, backgroundColor: "#EEE8DC", alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1 }, meta: { color: colors.gold, fontSize: 8, letterSpacing: .7, fontWeight: "900" },
  cardTitle: { color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: "800", marginTop: 4 },
  progress: { height: 5, borderRadius: 5, backgroundColor: "#E7E8E5", marginTop: 10, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5, backgroundColor: colors.gold },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 }, status: { color: colors.muted, fontSize: 9 },
  percent: { color: colors.ink, fontSize: 9, fontWeight: "900" },
});