import { useMemo, useState, type PropsWithChildren } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Bell, ChevronDown, Menu, Search, X } from "lucide-react-native";
import { navigation, roleLabels, type MobileRole } from "@/data/navigation";
import { colors, typography } from "@/theme";

export function MobileShell({ role, moduleId, children }: PropsWithChildren<{ role: MobileRole; moduleId: string }>) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = navigation[role];
  const primary = useMemo(() => items.slice(0, 5), [items]);
  const tablet = width >= 768;
  function go(nextRole: MobileRole, nextModule = "dashboard") {
    setMenuOpen(false);
    router.replace({ pathname: "/[role]/[module]", params: { role: nextRole, module: nextModule } });
  }
  return (
    <View style={styles.root}>
      <View style={[styles.topbar, tablet && styles.topbarTablet]}>
        <Pressable onPress={() => setMenuOpen((value) => !value)} style={styles.iconButton} accessibilityLabel="Menüyü aç">
          {menuOpen ? <X size={21} color={colors.ink} /> : <Menu size={21} color={colors.ink} />}
        </Pressable>
        <View style={styles.brand}>
          <View style={styles.logoMark}><Text style={styles.logoGlyph}>L</Text></View>
          <View><Text style={styles.brandName}>Oguz Law</Text><Text style={styles.brandSub}>ACADEMY</Text></View>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.iconButton} accessibilityLabel="Ara"><Search size={20} color={colors.ink} /></Pressable>
          <Pressable style={styles.iconButton} accessibilityLabel="Bildirimler"><Bell size={20} color={colors.ink} /><View style={styles.dot} /></Pressable>
        </View>
      </View>

      {menuOpen ? (
        <View style={[styles.drawer, tablet && styles.drawerTablet]}>
          <Text style={styles.drawerEyebrow}>ROL ÖNİZLEMESİ</Text>
          {(Object.keys(roleLabels) as MobileRole[]).map((key) => (
            <Pressable key={key} onPress={() => go(key)} style={[styles.roleRow, key === role && styles.roleRowActive]}>
              <Text style={[styles.roleText, key === role && styles.roleTextActive]}>{roleLabels[key]}</Text>
              {key === role ? <Text style={styles.preview}>AKTİF</Text> : null}
            </Pressable>
          ))}
          <View style={styles.drawerDivider} />
          {items.map((item) => (
            <Pressable key={item.id} onPress={() => go(role, item.id)} style={styles.drawerNav}>
              <item.icon size={19} color={item.id === moduleId ? colors.gold : colors.muted} />
              <Text style={[styles.drawerNavText, item.id === moduleId && styles.drawerNavActive]}>{item.label}</Text>
              {item.badge ? <Text style={styles.badge}>{item.badge}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      <ScrollView style={styles.content} contentContainerStyle={[styles.contentInner, tablet && styles.contentTablet]} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.rolePill} onPress={() => setMenuOpen(true)}>
          <Text style={styles.rolePillText}>{roleLabels[role]}</Text><ChevronDown size={14} color={colors.navy} />
        </Pressable>
        {children}
      </ScrollView>

      <View style={styles.bottomNav}>
        {primary.map((item) => {
          const active = item.id === moduleId;
          return (
            <Pressable key={item.id} onPress={() => go(role, item.id)} style={styles.navItem} accessibilityState={{ selected: active }}>
              <View><item.icon size={21} color={active ? colors.navy : colors.muted} strokeWidth={active ? 2.5 : 2} />{item.badge ? <Text style={styles.navBadge}>{item.badge}</Text> : null}</View>
              <Text numberOfLines={1} style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  topbar: { height: 70, paddingTop: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: "rgba(255,254,252,.98)", zIndex: 20 },
  topbarTablet: { paddingHorizontal: 28 },
  brand: { flex: 1, flexDirection: "row", alignItems: "center", gap: 9, marginLeft: 5 },
  logoMark: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  logoGlyph: { color: "#FFFFFF", fontFamily: "Georgia", fontSize: 19, fontWeight: "700" },
  brandName: { color: colors.navy, fontFamily: "Georgia", fontSize: 16, lineHeight: 18 },
  brandSub: { color: colors.gold, fontSize: 7, letterSpacing: 1.5, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 3 },
  iconButton: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", right: 8, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1, borderColor: "#FFFFFF" },
  content: { flex: 1 },
  contentInner: { padding: 18, paddingBottom: 110 },
  contentTablet: { paddingHorizontal: 34, maxWidth: 1100, alignSelf: "center", width: "100%" },
  rolePill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.navySoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 14 },
  rolePillText: { color: colors.navy, fontWeight: "800", fontSize: 11 },
  drawer: { position: "absolute", zIndex: 15, top: 70, left: 0, right: 0, maxHeight: "77%", padding: 18, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, shadowColor: "#102A4F", shadowOpacity: .16, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  drawerTablet: { right: undefined, width: 360, borderRightWidth: 1, borderRightColor: colors.border },
  drawerEyebrow: { ...typography.eyebrow, color: colors.muted, marginBottom: 9 },
  roleRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 13, paddingVertical: 11, borderRadius: 12 },
  roleRowActive: { backgroundColor: colors.navySoft },
  roleText: { color: colors.ink, fontWeight: "700" },
  roleTextActive: { color: colors.navy },
  preview: { fontSize: 9, fontWeight: "900", color: colors.gold },
  drawerDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  drawerNav: { minHeight: 45, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 11 },
  drawerNavText: { flex: 1, color: colors.muted, fontSize: 14, fontWeight: "600" },
  drawerNavActive: { color: colors.ink, fontWeight: "800" },
  badge: { minWidth: 22, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10, overflow: "hidden", backgroundColor: colors.warningSoft, color: colors.warning, textAlign: "center", fontSize: 10, fontWeight: "900" },
  bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 82, paddingBottom: 14, flexDirection: "row", backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  navLabel: { color: colors.muted, fontSize: 9, fontWeight: "700", maxWidth: 68 },
  navLabelActive: { color: colors.navy, fontWeight: "900" },
  navBadge: { position: "absolute", right: -10, top: -7, minWidth: 17, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 9, overflow: "hidden", backgroundColor: colors.danger, color: "#FFFFFF", textAlign: "center", fontSize: 8, fontWeight: "900" },
});