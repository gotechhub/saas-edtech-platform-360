import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./server";
import { readSupabasePublicConfig } from "./config";

export async function createSupabaseRequestClient(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return { supabase: await createSupabaseServerClient(), accessToken: undefined };
  }

  const config = readSupabasePublicConfig();
  if (!config) return { supabase: null, accessToken: undefined };

  return {
    supabase: createClient(config.url, config.publishableKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    }),
    accessToken,
  };
}