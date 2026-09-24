"use client";
import { createBrowserClient } from "@supabase/ssr";
import { readSupabasePublicConfig } from "./config";

export function createSupabaseBrowserClient() {
  const config = readSupabasePublicConfig();
  if (!config) throw new Error("SUPABASE_NOT_CONFIGURED");
  return createBrowserClient(config.url, config.publishableKey, { cookieOptions: { name: "respongo-auth", sameSite: "lax", secure: location.protocol === "https:" } });
}
