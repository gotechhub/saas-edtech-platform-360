import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabasePublicConfig } from "./config";

export async function createSupabaseServerClient() {
  const config = readSupabasePublicConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookieOptions: { name: "respongo-auth", sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => { try { for (const { name, value, options } of items) store.set(name, value, options); } catch { /* Server Components are read-only; proxy refreshes cookies. */ } },
    },
  });
}
