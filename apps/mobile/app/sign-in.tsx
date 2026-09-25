import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { useSession } from "@/state/session";
import { colors, typography } from "@/theme";

export default function SignIn() {
  const router = useRouter();
  const { signIn, configured } = useSession();
  const [email, setEmail] = useState("admin@respongo.com");
  const [password, setPassword] = useState("123456");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true); setError("");
    const result = await signIn(email.trim(), password);
    setBusy(false);
    if (result.ok) router.replace("/admin/dashboard");
    else setError(result.message);
  }
  return (
    <View style={styles.page}>
      <View style={styles.mark}><ShieldCheck color="#FFFFFF" size={28} /></View>
      <Text style={styles.eyebrow}>OGUZ LAW ACADEMY</Text>
      <Text style={styles.title}>Öğrenme alanına hoş geldiniz.</Text>
      <Text style={styles.copy}>Atamalarınız, canlı oturumlarınız ve gelişim yolculuğunuz tek bir yerde.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>E-posta</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} accessibilityLabel="E-posta" />
        <Text style={styles.label}>Şifre</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} accessibilityLabel="Şifre" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={submit} disabled={busy || !configured} style={({ pressed }) => [styles.button, pressed && styles.pressed, (!configured || busy) && styles.disabled]}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Giriş yap</Text>}
        </Pressable>
        {!configured ? <Text style={styles.note}>Demo arayüzü açık. Canlı giriş için mobil ortam değişkenlerini tanımlayın.</Text> : null}
      </View>
      <Text style={styles.legal}>Giriş yaparak KVKK aydınlatma metnini ve portal kullanım koşullarını kabul etmiş olursunuz.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 24, paddingTop: 80, backgroundColor: colors.canvas },
  mark: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", marginBottom: 28 },
  eyebrow: { ...typography.eyebrow, color: colors.gold, marginBottom: 10 },
  title: { ...typography.display, color: colors.ink, maxWidth: 340 },
  copy: { ...typography.body, color: colors.muted, marginTop: 14, maxWidth: 350 },
  card: { marginTop: 34, borderRadius: 24, padding: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  label: { ...typography.label, color: colors.ink, marginBottom: 7, marginTop: 8 },
  input: { height: 52, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 14, paddingHorizontal: 15, color: colors.ink, backgroundColor: "#FFFFFF" },
  button: { height: 52, borderRadius: 14, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", marginTop: 20 },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  pressed: { opacity: .86, transform: [{ scale: .99 }] }, disabled: { opacity: .5 },
  error: { color: colors.danger, marginTop: 12, fontSize: 13 },
  note: { color: colors.muted, textAlign: "center", fontSize: 12, marginTop: 14, lineHeight: 18 },
  legal: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 20 },
});