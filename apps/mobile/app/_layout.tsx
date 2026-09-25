import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SessionProvider } from "@/state/session";

export default function RootLayout() {
  return (
    <SessionProvider>
      <View style={{ flex: 1, backgroundColor: "#F4F1EB" }}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      </View>
    </SessionProvider>
  );
}