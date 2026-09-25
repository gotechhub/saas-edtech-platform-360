import { AppState, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const storage = {
  getItem: (itemKey: string) => SecureStore.getItemAsync(itemKey),
  setItem: (itemKey: string, value: string) => SecureStore.setItemAsync(itemKey, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  removeItem: (itemKey: string) => SecureStore.deleteItemAsync(itemKey),
};
export const supabase = url && key ? createClient(url, key, {
  auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, flowType: "pkce" },
}) : null;
if (Platform.OS !== "web" && supabase) {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}